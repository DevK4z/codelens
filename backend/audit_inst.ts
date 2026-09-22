import { tokenize } from './src/engine/lexer';
import { parse } from './src/engine/parser';
import { instrument } from './src/engine/instrumenter';

const code = `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int arr[10];
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    int target;
    cin >> target;
    int left = 0, right = n - 1;
    int result = -1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            result = mid;
            break;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    cout << result << endl;
    return 0;
}`;

const tokens = tokenize(code);
const ast = parse(tokens);
const inst = instrument(ast, code);

// Print just the while loop section of instrumented code
const lines = inst.split('\n');
for (let i = 0; i < lines.length; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

