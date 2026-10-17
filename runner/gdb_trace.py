"""Run inside GDB. Observe inferior memory; never evaluate user expressions/functions."""
import gdb
import json
import math
import os

MAX_ITEMS = 100
MAX_DEPTH = 4
SOURCE = os.path.realpath('code.cpp')
trace = []
previous = {}
exit_code = None
signal = None
payload = json.load(open('payload.json'))
limit = max(1, min(2000, int(payload.get('maxSteps', 1000))))

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
            # No arbitrary pointer dereference or inferior calls.
            return str(v)
        if t.code == gdb.TYPE_CODE_ARRAY:
            lo, hi = t.range()
            count = min(hi - lo + 1, MAX_ITEMS)
            return [encode(v[lo + i], depth + 1) for i in range(max(0, count))]
        name = str(t)
        if 'basic_string<' in name:
            return v['_M_dataplus']['_M_p'].string(length=min(int(v['_M_string_length']), 4096))
        if name.startswith('std::vector<') and 'bool' not in str(t.template_argument(0)):
            start = v['_M_impl']['_M_start']
            end = v['_M_impl']['_M_finish']
            size = max(0, min(int(end - start), MAX_ITEMS))
            return [encode((start + i).dereference(), depth + 1) for i in range(size)]
        printer = gdb.default_visualizer(v)
        if printer:
            hint = printer.display_hint() if hasattr(printer, 'display_hint') else None
            if hint == 'string':
                text = printer.to_string()
                return str(text)[:4096]
            if hasattr(printer, 'children'):
                children = []
                for key, child in printer.children():
                    children.append((str(key), encode(child, depth + 1)))
                    if len(children) >= MAX_ITEMS:
                        break
                if hint == 'array':
                    return [val for _, val in children]
                return dict(children)
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
    return sal if sal.symtab and os.path.realpath(sal.symtab.fullname()) == SOURCE and sal.line > 0 else None

def snapshot(frame, line):
    variables = {}
    block = frame.block()
    while block:
        for sym in block:
            if not sym.name or sym.name in variables or not (sym.is_variable or sym.is_argument):
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
    global previous
    variables = snapshot(frame, sal.line)
    stack = []
    f = frame
    while f and len(stack) < 64:
        loc = user_location(f)
        if loc:
            stack.append({'func': f.name() or '<anonymous>', 'line': loc.line,
                          'params': frame_parameters(f)})
        f = f.older()
    stack.reverse()
    try:
        out = open('program.stdout', 'rb').read(1024 * 1024).decode('utf-8', errors='replace')
    except OSError:
        out = ''
    event = {'step': len(trace), 'line': sal.line, 'event': 'line',
             'callStack': stack, 'variables': variables,
             'changed': [k for k in variables if k not in previous or variables[k] != previous[k]],
             'stdout': out, 'detail': 'GCC/GDB: trạng thái trước khi thực thi dòng này.'}
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

gdb.events.exited.connect(exited)
gdb.events.stop.connect(stopped)
try:
    for command in ('set pagination off', 'set confirm off', 'set print elements 100',
                    'set disable-randomization off', 'set auto-load local-gdbinit off',
                    'set auto-load safe-path /usr/share/gdb:/usr/lib', 'set startup-with-shell on'):
        gdb.execute(command, to_string=True)
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
