"""Run inside GDB. Observe inferior memory; never evaluate user expressions/functions."""
import gdb
import glob
import json
import math
import os
import re
import sys

MAX_ITEMS = 100
MAX_DEPTH = 4
MAX_NODES = 64
MAX_NODE_BYTES = 4096
LIBRARY_TYPES = ('std::', '__gnu', '__cxx', '_IO_', '__')
pointers = []
node_cache = {}
previous_heap = {}
# The program is always one file compiled as `g++ code.cpp`. Match it by that recorded name, not
# by absolute path: a binary reused from the cache was compiled in another run's directory.
SOURCE = 'code.cpp'
# GCC's hidden locals for range-based for loops: not in the learner's source, and garbage once out of scope.
HIDDEN = re.compile(r'__for_(?:range|begin|end)\d*$')
trace = []
previous = {}
exit_code = None
signal = None
payload = json.load(open('payload.json'))
limit = max(1, min(2000, int(payload.get('maxSteps', 1000))))

def with_printer(v, depth):
    """Container contents through libstdc++'s printers, or None to read the raw fields instead.
    A printer that fails on some value must not lose the whole trace."""
    try:
        printer = gdb.default_visualizer(v)
        if not printer:
            return None
        hint = printer.display_hint() if hasattr(printer, 'display_hint') else None
        if hint == 'string':
            return str(printer.to_string())[:4096]
        if not hasattr(printer, 'children'):
            return None
        children = []
        for key, child in printer.children():
            children.append((str(key), encode(child, depth + 1)))
            if len(children) >= 2 * MAX_ITEMS:
                break
        # Map printers yield key, value, key, value...; sequences name their items [0], [1]...
        if hint == 'map':
            return {str(k[1]): val[1] for k, val in zip(children[0::2], children[1::2])}
        if hint == 'array' or (children and all(re.fullmatch(r'\[\d+\]', k) for k, _ in children)):
            return [val for _, val in children[:MAX_ITEMS]]
        return dict(children[:MAX_ITEMS])
    except Exception:
        return None

def encode(v, depth=0):
    if depth > MAX_DEPTH:
        return '<depth limit>'
    try:
        t = v.type.strip_typedefs()
        if v.is_optimized_out:
            return '<optimized out>'
        if t.code == gdb.TYPE_CODE_REF:
            return encode(v.referenced_value(), depth + 1)
        if t.code == gdb.TYPE_CODE_BOOL:
            return bool(v)
        if t.code in (gdb.TYPE_CODE_INT, gdb.TYPE_CODE_ENUM):
            n = int(v)
            if str(t) in ('char', 'signed char', 'unsigned char'):
                return chr(n) if 0 <= n < 256 else str(n)
            return n if abs(n) <= 9007199254740991 else str(n)
        if t.code == gdb.TYPE_CODE_FLT:
            n = float(v)
            return n if math.isfinite(n) else None
        if t.code == gdb.TYPE_CODE_PTR:
            # Never call into the inferior; pointers to the program's own structs are followed by
            # follow_pointers, which only reads memory.
            target = t.target().strip_typedefs()
            if target.code == gdb.TYPE_CODE_STRUCT and not str(target.unqualified()).startswith(LIBRARY_TYPES):
                pointers.append(v)
            return str(v)
        if t.code == gdb.TYPE_CODE_ARRAY:
            lo, hi = t.range()
            count = min(hi - lo + 1, MAX_ITEMS)
            return [encode(v[lo + i], depth + 1) for i in range(max(0, count))]
        # Only the outermost type: map<string, int> also has basic_string in its name.
        name = str(t.unqualified())
        if name.startswith(('std::__cxx11::basic_string<', 'std::basic_string<')):
            return v['_M_dataplus']['_M_p'].string(length=min(int(v['_M_string_length']), 4096))
        if name.startswith('std::vector<') and 'bool' not in str(t.template_argument(0)):
            start = v['_M_impl']['_M_start']
            end = v['_M_impl']['_M_finish']
            size = max(0, min(int(end - start), MAX_ITEMS))
            return [encode((start + i).dereference(), depth + 1) for i in range(size)]
        printed = with_printer(v, depth)
        if printed is not None:
            return printed
        if t.code in (gdb.TYPE_CODE_STRUCT, gdb.TYPE_CODE_UNION):
            fields = {}
            for f in t.fields()[:MAX_ITEMS]:
                if f.name and not f.is_base_class:
                    fields[f.name] = encode(v[f.name], depth + 1)
            return fields or str(v)[:4096]
        return str(v)[:4096]
    except (gdb.error, RuntimeError, ValueError, OverflowError, TypeError):
        return '<unavailable>'

def user_location(frame):
    # GCC attributes generated iostream initialization to code.cpp too. These
    # frames are compiler scaffolding, not source statements written by the user.
    name = frame.name() or ''
    if name.startswith(('_GLOBAL__sub_I_', '__static_initialization_and_destruction_0')):
        return None
    sal = frame.find_sal()
    return sal if sal.symtab and sal.symtab.filename == SOURCE and sal.line > 0 else None

def snapshot(frame, line):
    variables = {}
    block = frame.block()
    while block:
        for sym in block:
            if not sym.name or sym.name in variables or not (sym.is_variable or sym.is_argument) or HIDDEN.match(sym.name):
                continue
            try:
                # Locals whose declaration has not executed should not show random storage.
                if sym.is_variable and not block.is_global and not block.is_static and sym.line >= line:
                    variables[sym.name] = None
                else:
                    variables[sym.name] = encode(frame.read_var(sym))
            except (gdb.error, RuntimeError):
                variables[sym.name] = '<unavailable>'
            if len(variables) >= 200:
                return variables
        block = block.superblock
    return variables

def note_frame_pointers(frame, line):
    # Locals of the calling frames keep their structures visible while a callee runs, e.g. the
    # whole tree during a recursive insert. Only pointers matter here, so skip everything else.
    block = frame.block()
    while block and not block.is_global and not block.is_static:
        for sym in block:
            if not sym.name or not sym.is_variable or sym.line >= line or HIDDEN.match(sym.name):
                continue
            t = sym.type.strip_typedefs()
            elements = t.target().strip_typedefs() if t.code == gdb.TYPE_CODE_ARRAY else None
            own_struct = t.code == gdb.TYPE_CODE_STRUCT and not str(t.unqualified()).startswith(LIBRARY_TYPES)
            if t.code == gdb.TYPE_CODE_PTR or own_struct or (elements is not None and elements.code == gdb.TYPE_CODE_PTR):
                try:
                    encode(frame.read_var(sym))
                except (gdb.error, RuntimeError):
                    pass
        block = block.superblock

def read_node(pointer, address):
    target = pointer.type.strip_typedefs().target()
    size = target.sizeof
    # A misaligned or tiny address can only be an uninitialised pointer.
    if address < 4096 or not 0 < size <= MAX_NODE_BYTES or address % max(target.alignof, 1):
        return None
    data = bytes(gdb.selected_inferior().read_memory(address, size))
    key = (address, str(target))
    known = node_cache.get(key)
    if known and known[0] == data:
        pointers.extend(known[2])
        return known[1]
    start = len(pointers)
    fields = encode(pointer.dereference())
    if not isinstance(fields, dict):
        return None
    node = {'type': str(target.unqualified()), 'fields': fields}
    # Identical bytes prove identical contents only when nothing is stored behind a further pointer.
    if all(v is None or isinstance(v, (bool, int, float)) or (isinstance(v, str) and v.startswith('0x')) for v in fields.values()):
        node_cache[key] = (data, node, pointers[start:])
    return node

def follow_pointers():
    """Everything reachable from this step's pointers, by address. Reading memory cannot run or
    disturb the program; the limits keep a corrupt or cyclic structure from stalling the trace."""
    heap = {}
    seen = set()
    index = 0
    while index < len(pointers) and len(heap) < MAX_NODES:
        pointer = pointers[index]
        index += 1
        try:
            address = int(pointer)
            if address in seen:
                continue
            seen.add(address)
            node = read_node(pointer, address)
        except (gdb.error, RuntimeError, ValueError, OverflowError, TypeError):
            continue
        if node:
            heap[hex(address)] = node
    return heap

def frame_parameters(frame):
    # Read each frame's own arguments. Never borrow the newest frame's locals
    # or call functions in the inferior to format them.
    params = {}
    try:
        block = frame.block()
        while block and not block.is_global and not block.is_static:
            for sym in block:
                if sym.is_argument and sym.name and sym.name not in params:
                    try:
                        params[sym.name] = encode(frame.read_var(sym))
                    except (gdb.error, RuntimeError):
                        params[sym.name] = '<unavailable>'
                    if len(params) >= 16:
                        return params
            block = block.superblock
    except (gdb.error, RuntimeError):
        pass
    return params

def emit(frame, sal):
    global previous, previous_heap
    pointers.clear()
    variables = snapshot(frame, sal.line)
    stack = []
    f = frame
    while f and len(stack) < 64:
        loc = user_location(f)
        if loc:
            stack.append({'func': f.name() or '<anonymous>', 'line': loc.line,
                          'params': frame_parameters(f)})
            if f != frame:
                note_frame_pointers(f, loc.line)
        f = f.older()
    stack.reverse()
    heap = follow_pointers()
    try:
        out = open('program.stdout', 'rb').read(1024 * 1024).decode('utf-8', errors='replace')
    except OSError:
        out = ''
    event = {'step': len(trace), 'line': sal.line, 'event': 'line',
             'callStack': stack, 'variables': variables,
             'changed': [k for k in variables if k not in previous or variables[k] != previous[k]],
             'stdout': out, 'detail': 'GCC/GDB: trạng thái trước khi thực thi dòng này.'}
    # Recorded only when it changes: long runs over a tree would otherwise repeat it at every step.
    if heap != previous_heap:
        event['heap'] = heap
        previous_heap = heap
    trace.append(event)
    previous = variables
    with open('debug.trace', 'a') as stream:
        stream.write(json.dumps(event, ensure_ascii=True) + '\n')

def exited(event):
    global exit_code
    exit_code = getattr(event, 'exit_code', 1)

def stopped(event):
    global signal
    if isinstance(event, gdb.SignalEvent):
        signal = event.stop_signal

def register_std_printers():
    # libstdc++'s printers normally auto-load with libstdc++.so's symbols, which are not loaded
    # (see below). They only read the program's own debug info, so register them directly.
    for path in glob.glob('/usr/share/gcc-*/python'):
        sys.path.insert(0, path)
        try:
            from libstdcxx.v6.printers import register_libstdcxx_printers
            register_libstdcxx_printers(None)
            return
        except Exception:
            sys.path.remove(path)

gdb.events.exited.connect(exited)
gdb.events.stop.connect(stopped)
try:
    # Every breakpoint and variable read is in code.cpp, so the symbols of libc and libstdc++ are
    # never needed. Loading them made GDB re-set every line breakpoint on each library load,
    # which was most of the tracing time on a small CPU share (3.3s of 3.8s at 0.1 CPU).
    for command in ('set pagination off', 'set confirm off', 'set print elements 100',
                    'set disable-randomization off', 'set auto-load local-gdbinit off',
                    'set auto-load safe-path /usr/share/gdb:/usr/lib', 'set startup-with-shell on',
                    'set auto-solib-add off'):
        gdb.execute(command, to_string=True)
    register_std_printers()
    gdb.execute('file code', to_string=True)
    # Use debug line information instead of asking GDB to resolve every blank,
    # comment and declaration line to the next executable line. This avoids
    # thousands of redundant breakpoints for a short program with many comments.
    main = gdb.lookup_global_symbol('main')
    if main is None or main.symtab is None:
        raise gdb.GdbError('Cannot locate main debug information')
    executable_lines = sorted({entry.line for entry in main.symtab.linetable() if entry.line > 0})
    for line in executable_lines:
        try:
            bp = gdb.Breakpoint('code.cpp:%d' % line, internal=True)
            bp.silent = True
        except gdb.error:
            pass
    gdb.execute('run < input.txt > program.stdout 2> program.stderr', to_string=True)
    while exit_code is None and not signal:
        frame = gdb.newest_frame()
        sal = user_location(frame)
        if sal:
            emit(frame, sal)
            if len(trace) >= limit:
                break
        gdb.execute('continue', to_string=True)
    if exit_code is not None and trace:
        # Process is gone: retain no invented final variables. Capture flushed output.
        terminal = {'step': len(trace), 'line': trace[-1]['line'], 'event': 'stdout',
                    'callStack': [], 'variables': {}, 'changed': [],
                    'stdout': open('program.stdout', 'rb').read(1024 * 1024).decode('utf-8', errors='replace')}
        with open('debug.trace', 'a') as stream:
            stream.write(json.dumps(terminal) + '\n')
    limited = exit_code is None and not signal and len(trace) >= limit
    result = {'exitCode': exit_code if exit_code is not None else 1,
              'stepLimitExceeded': limited, 'runtimeError': ('Program stopped with ' + signal) if signal else None}
except (gdb.error, RuntimeError) as error:
    result = {'exitCode': 1, 'runtimeError': 'GDB tracing failed: ' + str(error)}
with open('debug.result', 'w') as stream:
    json.dump(result, stream)
try:
    if exit_code is None:
        gdb.execute('kill', to_string=True)
except gdb.error:
    pass

# Assemble the final JSON here, with the Python already running inside GDB: starting a separate
# interpreter for debug_result.py costs about half a second on a small CPU share. run.sh still
# runs debug_result.py itself whenever GDB did not finish normally (timeout, crash).
try:
    import contextlib
    import io
    import runpy
    sys.argv = ['debug_result.py', '0']
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        runpy.run_path('/usr/local/lib/codelens/debug_result.py', run_name='__main__')
    with open('debug.out', 'w') as stream:
        stream.write(output.getvalue())
except Exception:
    pass
