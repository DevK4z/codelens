"""Compile all reference programs and check sample/edge output using GNU++17."""
import concurrent.futures
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'frontend/src/data/exerciseSolutions.ts').read_text()
samples = json.loads(source.split(' = ', 1)[1].rstrip().removesuffix(';'))
# Independent expected answers, including different input and convention-sensitive cases.
EDGE_CASES = {
    'L2-01': [('9 9', '9')],
    'L2-02': [('0', '1'), ('20', '2432902008176640000')],
    'L2-03': [('0', '1')],
    'L2-12': [('3\n-1 1 2', 'YES'), ('3\n1 2 4', 'NO')],
    'L3.1-01': [('0', '1'), ('10', '42')],
    'L3.1-02': [('0', '1'), ('10', '42')],
    'L3.1-03': [('100', '354224848179261915075\n354224848179261915075')],
    'L3.1-05': [('6 20\n10 5 8 4 12 8\n12 14 10 12 6 15', '41\n6 4 2')],
    'L3.1-08': [('3\n1 2 3\n3 2 1', '1')],
    'L3.1-10': [('1919\n9191', '919'), ('111\n222', 'NONE')],
    'L3.2-08': [('2 7\n2 3', 'NO')],
    'L5-05': [('0 2', '0'), ('255 16', 'FF')],
    'L5-07': [('2 3 4 + 5 6 - - *', '16')],
    'L5-08': [('A^B^C', 'ABC^^'), ('A-B-C', 'AB-C-')],
    'L6-04': [('', '-13')],
    'L9-02': [('0\n7', '-1')],
    'L9-04': [('0', '-1')],
    'L9-11': [('MCDXLIV', '1444')],
}

def normalized(text):
    return ' '.join(text.split())

def check(item):
    key, sample = item
    with tempfile.TemporaryDirectory(prefix='codelens-sample-') as folder:
        cpp, binary = Path(folder) / 'main.cpp', Path(folder) / 'main'
        cpp.write_text(sample['code'])
        compiled = subprocess.run(['g++', '-std=gnu++17', '-O0', str(cpp), '-o', str(binary)], capture_output=True, text=True, timeout=30)
        assert compiled.returncode == 0, f'{key}: {compiled.stderr}'
        cases = [(sample['stdin'], sample['output'])] + EDGE_CASES.get(key, [])
        for stdin, expected in cases:
            result = subprocess.run([str(binary)], input=stdin, capture_output=True, text=True, timeout=5)
            assert result.returncode == 0, f'{key}: {result.stderr}'
            assert normalized(result.stdout) == normalized(expected), f'{key}: {result.stdout!r} != {expected!r}'
        # Sorting must also handle duplicates, negatives, already sorted and singleton input.
        if key.startswith('L7-') or key in ['L5-04','L8-02','L8-03','L8-04','L8-05','L8-07','L8-08','L8-09','L8-10']:
            for values in [[3,-1,3,0], [1,2,3], [7]]:
                result = subprocess.run([str(binary)], input=f'{len(values)}\n'+ ' '.join(map(str,values)), capture_output=True, text=True, timeout=5)
                assert result.returncode == 0, key
                assert list(map(int,result.stdout.strip().splitlines()[-1].split())) == sorted(values), key
    return key

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    checked = list(pool.map(check, samples.items()))
print(f'{len(checked)} C++ references compiled; sample outputs and edge cases passed.')
