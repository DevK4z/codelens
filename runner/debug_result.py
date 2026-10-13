"""Separate debugger trace/control data from arbitrary program stdout/stderr."""
import json
import sys
from pathlib import Path

def text(path):
    return Path(path).read_bytes()[:1024 * 1024].decode('utf-8', errors='replace') if Path(path).exists() else ''
trace = []
for line in text('debug.trace').splitlines():
    try:
        trace.append(json.loads(line))
    except ValueError:
        pass
result = json.loads(text('debug.result') or '{}')
overflow = any(Path(p).exists() and Path(p).stat().st_size > 1024 * 1024 for p in ('debug.trace', 'program.stdout', 'program.stderr'))
timed_out = sys.argv[1] == '124'
error = result.get('runtimeError')
stderr = text('program.stderr')
if overflow:
    stderr += '\nDebugger output exceeded 1MiB limit.'
    result['exitCode'] = 1
if error:
    stderr += ('\n' if stderr else '') + error
elif not result and not timed_out:
    stderr += '\nDebugger did not return a result. Rebuild the codelens-sandbox image and check ptrace support.\n' + text('gdb.log')[-2000:]
json.dump({'codelensDebugger': 1, 'trace': trace, 'stdout': text('program.stdout'),
           'stderr': stderr, 'exitCode': result.get('exitCode', 1),
           'timeLimitExceeded': timed_out, 'stepLimitExceeded': result.get('stepLimitExceeded', False)}, sys.stdout)
