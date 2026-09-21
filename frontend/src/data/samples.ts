import { VariableRoleMap } from '../engine/types';

export interface Sample {
  id: string;
  name: string;
  description: string;
  code: string;
  stdin: string;
  suggestedRoles: VariableRoleMap;
}

export const SAMPLES: Sample[] = [
  {
    id: 'array-sum',
    name: 'Tính tổng mảng',
    description: 'Tính tổng các phần tử trong mảng bằng vòng lặp',
    code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int arr[10];\n    for (int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }\n    int sum = 0;\n    for (int i = 0; i < n; i++) {\n        sum = sum + arr[i];\n    }\n    cout << sum << endl;\n    return 0;\n}`,
    stdin: '5\n1 2 3 4 5',
    suggestedRoles: { arr: 'array', i: 'counter', sum: 'result' }
  },
  {
    id: 'binary-search',
    name: 'Tìm kiếm nhị phân',
    description: 'Tìm phần tử trong mảng đã sắp xếp',
    code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int arr[10];\n    for (int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }\n    int target;\n    cin >> target;\n    int left = 0, right = n - 1;\n    int result = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] == target) {\n            result = mid;\n            break;\n        } else if (arr[mid] < target) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    cout << result << endl;\n    return 0;\n}`,
    stdin: '7\n1 3 5 7 9 11 13\n7',
    suggestedRoles: { arr: 'array', left: 'left-pointer', right: 'right-pointer', mid: 'mid-pointer', target: 'target', result: 'result' }
  },
  {
    id: 'bubble-sort',
    name: 'Sắp xếp nổi bọt',
    description: 'Sắp xếp mảng bằng thuật toán Bubble Sort',
    code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int arr[10];\n    for (int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }\n    for (int i = 0; i < n - 1; i++) {\n        for (int j = 0; j < n - 1 - i; j++) {\n            if (arr[j] > arr[j + 1]) {\n                int temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n            }\n        }\n    }\n    for (int i = 0; i < n; i++) {\n        cout << arr[i] << " ";\n    }\n    cout << endl;\n    return 0;\n}`,
    stdin: '5\n5 3 1 4 2',
    suggestedRoles: { arr: 'array', i: 'counter', j: 'counter' }
  },
  {
    id: 'factorial',
    name: 'Giai thừa đệ quy',
    description: 'Tính n! bằng đệ quy',
    code: `#include <iostream>\nusing namespace std;\n\nint factorial(int n) {\n    if (n <= 1) {\n        return 1;\n    }\n    return n * factorial(n - 1);\n}\n\nint main() {\n    int n;\n    cin >> n;\n    int result = factorial(n);\n    cout << result << endl;\n    return 0;\n}`,
    stdin: '5',
    suggestedRoles: { n: 'counter', result: 'result' }
  }
];

