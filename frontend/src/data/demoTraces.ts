import { ExecuteResponse } from '../engine/types';

export const DEMO_TRACES: Record<string, Partial<ExecuteResponse>> = {
  "array-sum": {
    "trace": [
      {
        "step": 0,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 77
        },
        "changed": [
          "n"
        ],
        "stdout": ""
      },
      {
        "step": 1,
        "line": 1,
        "event": "stdin",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5
        },
        "changed": [
          "n"
        ],
        "stdout": ""
      },
      {
        "step": 2,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            -479914928,
            427,
            0,
            0,
            -479887808,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "stdout": ""
      },
      {
        "step": 3,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            -479914928,
            427,
            0,
            0,
            -479887808,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ]
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 4,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 0,
          "n": 5,
          "arr": [
            1,
            427,
            0,
            0,
            -479887808,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 0,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 5,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 1,
          "n": 5,
          "arr": [
            1,
            2,
            0,
            0,
            -479887808,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 1,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 6,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 2,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            0,
            -479887808,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 2,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 7,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 3,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            -479887808,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 3,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 8,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 4,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 4,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 9,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ],
          "sum": 0
        },
        "changed": [
          "sum"
        ],
        "stdout": ""
      },
      {
        "step": 10,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ],
          "sum": 0
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 11,
        "line": 1,
        "event": "assign",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 0,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ],
          "sum": 1
        },
        "changed": [
          "sum"
        ],
        "stdout": ""
      },
      {
        "step": 12,
        "line": 1,
        "event": "assign",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 1,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ],
          "sum": 3
        },
        "changed": [
          "sum"
        ],
        "stdout": ""
      },
      {
        "step": 13,
        "line": 1,
        "event": "assign",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 2,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ],
          "sum": 6
        },
        "changed": [
          "sum"
        ],
        "stdout": ""
      },
      {
        "step": 14,
        "line": 1,
        "event": "assign",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 3,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ],
          "sum": 10
        },
        "changed": [
          "sum"
        ],
        "stdout": ""
      },
      {
        "step": 15,
        "line": 1,
        "event": "assign",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 4,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ],
          "sum": 15
        },
        "changed": [
          "sum"
        ],
        "stdout": ""
      },
      {
        "step": 16,
        "line": 1,
        "event": "stdout",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ],
          "sum": 15
        },
        "changed": [],
        "stdout": "15\n"
      },
      {
        "step": 17,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ],
          "sum": 15
        },
        "changed": [],
        "stdout": "15\n"
      },
      {
        "step": 18,
        "line": 1,
        "event": "return",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            427,
            -773330743,
            32763,
            -773168368,
            32758
          ],
          "sum": 15
        },
        "changed": [],
        "stdout": "15\n"
      }
    ],
    "stdout": "15\r\n",
    "stepCount": 19,
    "executionTimeMs": 262,
    "isDemo": true,
    "sandboxWarning": "Dữ liệu mô phỏng từ lần chạy C++ thật (Chế độ xem trước GitHub Pages)"
  },
  "binary-search": {
    "trace": [
      {
        "step": 0,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 1
        },
        "changed": [
          "n"
        ],
        "stdout": ""
      },
      {
        "step": 1,
        "line": 1,
        "event": "stdin",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7
        },
        "changed": [
          "n"
        ],
        "stdout": ""
      },
      {
        "step": 2,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7,
          "arr": [
            -1407839152,
            446,
            0,
            0,
            -1407812032,
            446,
            -773330743,
            32763,
            -931171568,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "stdout": ""
      },
      {
        "step": 3,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7,
          "arr": [
            -1407839152,
            446,
            0,
            0,
            -1407812032,
            446,
            -773330743,
            32763,
            -931171568,
            32758
          ]
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 4,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 0,
          "n": 7,
          "arr": [
            1,
            446,
            0,
            0,
            -1407812032,
            446,
            -773330743,
            32763,
            -931171568,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 0,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 5,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 1,
          "n": 7,
          "arr": [
            1,
            3,
            0,
            0,
            -1407812032,
            446,
            -773330743,
            32763,
            -931171568,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 1,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 6,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 2,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            0,
            -1407812032,
            446,
            -773330743,
            32763,
            -931171568,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 2,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 7,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 3,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            -1407812032,
            446,
            -773330743,
            32763,
            -931171568,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 3,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 8,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 4,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            446,
            -773330743,
            32763,
            -931171568,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 4,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 9,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 5,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            -773330743,
            32763,
            -931171568,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 5,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 10,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 6,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 6,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 11,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 32758
        },
        "changed": [
          "target"
        ],
        "stdout": ""
      },
      {
        "step": 12,
        "line": 1,
        "event": "stdin",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7
        },
        "changed": [
          "target"
        ],
        "stdout": ""
      },
      {
        "step": 13,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0
        },
        "changed": [
          "left"
        ],
        "stdout": ""
      },
      {
        "step": 14,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 6
        },
        "changed": [
          "right"
        ],
        "stdout": ""
      },
      {
        "step": 15,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 6,
          "result": -1
        },
        "changed": [
          "result"
        ],
        "stdout": ""
      },
      {
        "step": 16,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 6,
          "result": -1
        },
        "changed": [],
        "compareInfo": {
          "left": "left",
          "right": "right",
          "leftValue": 0,
          "rightValue": 6,
          "operator": "<=",
          "result": true
        },
        "stdout": ""
      },
      {
        "step": 17,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 6,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 6,
          "result": -1
        },
        "changed": [
          "mid"
        ],
        "stdout": ""
      },
      {
        "step": 18,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 6,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 6,
          "result": -1
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[mid]",
          "right": "target",
          "leftValue": 13,
          "rightValue": 7,
          "operator": "==",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 19,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 6,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 6,
          "result": -1
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[mid]",
          "right": "target",
          "leftValue": 13,
          "rightValue": 7,
          "operator": "<",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 20,
        "line": 1,
        "event": "assign",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 6,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 5,
          "result": -1
        },
        "changed": [
          "right"
        ],
        "stdout": ""
      },
      {
        "step": 21,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 5,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 5,
          "result": -1
        },
        "changed": [
          "mid"
        ],
        "stdout": ""
      },
      {
        "step": 22,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 5,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 5,
          "result": -1
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[mid]",
          "right": "target",
          "leftValue": 11,
          "rightValue": 7,
          "operator": "==",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 23,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 5,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 5,
          "result": -1
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[mid]",
          "right": "target",
          "leftValue": 11,
          "rightValue": 7,
          "operator": "<",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 24,
        "line": 1,
        "event": "assign",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 5,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 4,
          "result": -1
        },
        "changed": [
          "right"
        ],
        "stdout": ""
      },
      {
        "step": 25,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 4,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 4,
          "result": -1
        },
        "changed": [
          "mid"
        ],
        "stdout": ""
      },
      {
        "step": 26,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 4,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 4,
          "result": -1
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[mid]",
          "right": "target",
          "leftValue": 9,
          "rightValue": 7,
          "operator": "==",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 27,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 4,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 4,
          "result": -1
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[mid]",
          "right": "target",
          "leftValue": 9,
          "rightValue": 7,
          "operator": "<",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 28,
        "line": 1,
        "event": "assign",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 4,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 3,
          "result": -1
        },
        "changed": [
          "right"
        ],
        "stdout": ""
      },
      {
        "step": 29,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 3,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 3,
          "result": -1
        },
        "changed": [
          "mid"
        ],
        "stdout": ""
      },
      {
        "step": 30,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 3,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 3,
          "result": -1
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[mid]",
          "right": "target",
          "leftValue": 7,
          "rightValue": 7,
          "operator": "==",
          "result": true
        },
        "stdout": ""
      },
      {
        "step": 31,
        "line": 1,
        "event": "assign",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 3,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 3,
          "result": 3
        },
        "changed": [
          "result"
        ],
        "stdout": ""
      },
      {
        "step": 32,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "mid": 3,
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 3,
          "result": 3
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 33,
        "line": 1,
        "event": "stdout",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 3,
          "result": 3
        },
        "changed": [],
        "stdout": "3\n"
      },
      {
        "step": 34,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 3,
          "result": 3
        },
        "changed": [],
        "stdout": "3\n"
      },
      {
        "step": 35,
        "line": 1,
        "event": "return",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 7,
          "arr": [
            1,
            3,
            5,
            7,
            9,
            11,
            13,
            32763,
            -931171568,
            32758
          ],
          "target": 7,
          "left": 0,
          "right": 3,
          "result": 3
        },
        "changed": [],
        "stdout": "3\n"
      }
    ],
    "stdout": "3\r\n",
    "stepCount": 36,
    "executionTimeMs": 171,
    "isDemo": true,
    "sandboxWarning": "Dữ liệu mô phỏng từ lần chạy C++ thật (Chế độ xem trước GitHub Pages)"
  },
  "bubble-sort": {
    "trace": [
      {
        "step": 0,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 1
        },
        "changed": [
          "n"
        ],
        "stdout": ""
      },
      {
        "step": 1,
        "line": 1,
        "event": "stdin",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5
        },
        "changed": [
          "n"
        ],
        "stdout": ""
      },
      {
        "step": 2,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            1458050128,
            555,
            0,
            0,
            1458077248,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "stdout": ""
      },
      {
        "step": 3,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            1458050128,
            555,
            0,
            0,
            1458077248,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 4,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 0,
          "n": 5,
          "arr": [
            5,
            555,
            0,
            0,
            1458077248,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 0,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 5,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 1,
          "n": 5,
          "arr": [
            5,
            3,
            0,
            0,
            1458077248,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 1,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 6,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 2,
          "n": 5,
          "arr": [
            5,
            3,
            1,
            0,
            1458077248,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 2,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 7,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 3,
          "n": 5,
          "arr": [
            5,
            3,
            1,
            4,
            1458077248,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 3,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 8,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 4,
          "n": 5,
          "arr": [
            5,
            3,
            1,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 4,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 9,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            5,
            3,
            1,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 10,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 0,
          "n": 5,
          "arr": [
            5,
            3,
            1,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 11,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "j": 0,
          "i": 0,
          "n": 5,
          "arr": [
            5,
            3,
            1,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[j]",
          "right": "arr[j + 1]",
          "leftValue": 5,
          "rightValue": 3,
          "operator": ">",
          "result": true
        },
        "stdout": ""
      },
      {
        "step": 12,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 0,
          "i": 0,
          "n": 5,
          "arr": [
            5,
            3,
            1,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "temp"
        ],
        "stdout": ""
      },
      {
        "step": 13,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 0,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            3,
            1,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 0,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 14,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 0,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            5,
            1,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 1,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 15,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "j": 1,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            5,
            1,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[j]",
          "right": "arr[j + 1]",
          "leftValue": 5,
          "rightValue": 1,
          "operator": ">",
          "result": true
        },
        "stdout": ""
      },
      {
        "step": 16,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 1,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            5,
            1,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "temp"
        ],
        "stdout": ""
      },
      {
        "step": 17,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 1,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            1,
            1,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 1,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 18,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 1,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            1,
            5,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 2,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 19,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "j": 2,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            1,
            5,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[j]",
          "right": "arr[j + 1]",
          "leftValue": 5,
          "rightValue": 4,
          "operator": ">",
          "result": true
        },
        "stdout": ""
      },
      {
        "step": 20,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 2,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            1,
            5,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "temp"
        ],
        "stdout": ""
      },
      {
        "step": 21,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 2,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            1,
            4,
            4,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 2,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 22,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 2,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            1,
            4,
            5,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 3,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 23,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "j": 3,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            1,
            4,
            5,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[j]",
          "right": "arr[j + 1]",
          "leftValue": 5,
          "rightValue": 2,
          "operator": ">",
          "result": true
        },
        "stdout": ""
      },
      {
        "step": 24,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 3,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            1,
            4,
            5,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "temp"
        ],
        "stdout": ""
      },
      {
        "step": 25,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 3,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            1,
            4,
            2,
            2,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 3,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 26,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 5,
          "j": 3,
          "i": 0,
          "n": 5,
          "arr": [
            3,
            1,
            4,
            2,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 4,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 27,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 1,
          "n": 5,
          "arr": [
            3,
            1,
            4,
            2,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 28,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "j": 0,
          "i": 1,
          "n": 5,
          "arr": [
            3,
            1,
            4,
            2,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[j]",
          "right": "arr[j + 1]",
          "leftValue": 3,
          "rightValue": 1,
          "operator": ">",
          "result": true
        },
        "stdout": ""
      },
      {
        "step": 29,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 3,
          "j": 0,
          "i": 1,
          "n": 5,
          "arr": [
            3,
            1,
            4,
            2,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "temp"
        ],
        "stdout": ""
      },
      {
        "step": 30,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 3,
          "j": 0,
          "i": 1,
          "n": 5,
          "arr": [
            1,
            1,
            4,
            2,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 0,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 31,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 3,
          "j": 0,
          "i": 1,
          "n": 5,
          "arr": [
            1,
            3,
            4,
            2,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 1,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 32,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "j": 1,
          "i": 1,
          "n": 5,
          "arr": [
            1,
            3,
            4,
            2,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[j]",
          "right": "arr[j + 1]",
          "leftValue": 3,
          "rightValue": 4,
          "operator": ">",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 33,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "j": 2,
          "i": 1,
          "n": 5,
          "arr": [
            1,
            3,
            4,
            2,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[j]",
          "right": "arr[j + 1]",
          "leftValue": 4,
          "rightValue": 2,
          "operator": ">",
          "result": true
        },
        "stdout": ""
      },
      {
        "step": 34,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 4,
          "j": 2,
          "i": 1,
          "n": 5,
          "arr": [
            1,
            3,
            4,
            2,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "temp"
        ],
        "stdout": ""
      },
      {
        "step": 35,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 4,
          "j": 2,
          "i": 1,
          "n": 5,
          "arr": [
            1,
            3,
            2,
            2,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 2,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 36,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 4,
          "j": 2,
          "i": 1,
          "n": 5,
          "arr": [
            1,
            3,
            2,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 3,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 37,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 2,
          "n": 5,
          "arr": [
            1,
            3,
            2,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 38,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "j": 0,
          "i": 2,
          "n": 5,
          "arr": [
            1,
            3,
            2,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[j]",
          "right": "arr[j + 1]",
          "leftValue": 1,
          "rightValue": 3,
          "operator": ">",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 39,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "j": 1,
          "i": 2,
          "n": 5,
          "arr": [
            1,
            3,
            2,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[j]",
          "right": "arr[j + 1]",
          "leftValue": 3,
          "rightValue": 2,
          "operator": ">",
          "result": true
        },
        "stdout": ""
      },
      {
        "step": 40,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 3,
          "j": 1,
          "i": 2,
          "n": 5,
          "arr": [
            1,
            3,
            2,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "temp"
        ],
        "stdout": ""
      },
      {
        "step": 41,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 3,
          "j": 1,
          "i": 2,
          "n": 5,
          "arr": [
            1,
            2,
            2,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 1,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 42,
        "line": 1,
        "event": "write",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "temp": 3,
          "j": 1,
          "i": 2,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [
          "arr"
        ],
        "arrayAccess": {
          "name": "arr",
          "index": 2,
          "action": "write"
        },
        "stdout": ""
      },
      {
        "step": 43,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 3,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 44,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "j": 0,
          "i": 3,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "compareInfo": {
          "left": "arr[j]",
          "right": "arr[j + 1]",
          "leftValue": 1,
          "rightValue": 2,
          "operator": ">",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 45,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 46,
        "line": 1,
        "event": "stdout",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 0,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": "1 "
      },
      {
        "step": 47,
        "line": 1,
        "event": "stdout",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 1,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": "1 2 "
      },
      {
        "step": 48,
        "line": 1,
        "event": "stdout",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 2,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": "1 2 3 "
      },
      {
        "step": 49,
        "line": 1,
        "event": "stdout",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 3,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": "1 2 3 4 "
      },
      {
        "step": 50,
        "line": 1,
        "event": "stdout",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "i": 4,
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": "1 2 3 4 5 "
      },
      {
        "step": 51,
        "line": 1,
        "event": "stdout",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": "1 2 3 4 5 \n"
      },
      {
        "step": 52,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": "1 2 3 4 5 \n"
      },
      {
        "step": 53,
        "line": 1,
        "event": "return",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "arr": [
            1,
            2,
            3,
            4,
            5,
            555,
            -773330743,
            32763,
            -45059312,
            32758
          ]
        },
        "changed": [],
        "stdout": "1 2 3 4 5 \n"
      }
    ],
    "stdout": "1 2 3 4 5 \r\n",
    "stepCount": 54,
    "executionTimeMs": 159,
    "isDemo": true,
    "sandboxWarning": "Dữ liệu mô phỏng từ lần chạy C++ thật (Chế độ xem trước GitHub Pages)"
  },
  "factorial": {
    "trace": [
      {
        "step": 0,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 719872784
        },
        "changed": [
          "n"
        ],
        "stdout": ""
      },
      {
        "step": 1,
        "line": 1,
        "event": "stdin",
        "callStack": [
          {
            "func": "main",
            "line": 1
          }
        ],
        "variables": {
          "n": 5
        },
        "changed": [
          "n"
        ],
        "stdout": ""
      },
      {
        "step": 2,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 5
        },
        "changed": [],
        "compareInfo": {
          "left": "n",
          "right": "1",
          "leftValue": 5,
          "rightValue": 1,
          "operator": "<=",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 3,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 5
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 4,
        "line": 1,
        "event": "return",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 5
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 5,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 4
        },
        "changed": [],
        "compareInfo": {
          "left": "n",
          "right": "1",
          "leftValue": 4,
          "rightValue": 1,
          "operator": "<=",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 6,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 4
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 7,
        "line": 1,
        "event": "return",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 4
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 8,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 3
        },
        "changed": [],
        "compareInfo": {
          "left": "n",
          "right": "1",
          "leftValue": 3,
          "rightValue": 1,
          "operator": "<=",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 9,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 3
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 10,
        "line": 1,
        "event": "return",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 3
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 11,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 2
        },
        "changed": [],
        "compareInfo": {
          "left": "n",
          "right": "1",
          "leftValue": 2,
          "rightValue": 1,
          "operator": "<=",
          "result": false
        },
        "stdout": ""
      },
      {
        "step": 12,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 2
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 13,
        "line": 1,
        "event": "return",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 2
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 14,
        "line": 1,
        "event": "compare",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 1
        },
        "changed": [],
        "compareInfo": {
          "left": "n",
          "right": "1",
          "leftValue": 1,
          "rightValue": 1,
          "operator": "<=",
          "result": true
        },
        "stdout": ""
      },
      {
        "step": 15,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 1
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 16,
        "line": 1,
        "event": "return",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 1
        },
        "changed": [],
        "stdout": ""
      },
      {
        "step": 17,
        "line": 1,
        "event": "vardecl",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "result": 120
        },
        "changed": [
          "result"
        ],
        "stdout": ""
      },
      {
        "step": 18,
        "line": 1,
        "event": "stdout",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "result": 120
        },
        "changed": [],
        "stdout": "120\n"
      },
      {
        "step": 19,
        "line": 1,
        "event": "line",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "result": 120
        },
        "changed": [],
        "stdout": "120\n"
      },
      {
        "step": 20,
        "line": 1,
        "event": "return",
        "callStack": [
          {
            "func": "main",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          },
          {
            "func": "factorial",
            "line": 1
          }
        ],
        "variables": {
          "n": 5,
          "result": 120
        },
        "changed": [],
        "stdout": "120\n"
      }
    ],
    "stdout": "120\r\n",
    "stepCount": 21,
    "executionTimeMs": 177,
    "isDemo": true,
    "sandboxWarning": "Dữ liệu mô phỏng từ lần chạy C++ thật (Chế độ xem trước GitHub Pages)"
  }
};

export function getFallbackDemoTrace(code: string): Partial<ExecuteResponse> | null {
  if (code.includes('factorial')) return DEMO_TRACES['factorial'];
  if (code.includes('binary') || code.includes('mid =') || code.includes('target')) return DEMO_TRACES['binary-search'];
  if (code.includes('arr[j] > arr[j + 1]') || code.includes('temp = arr[j]')) return DEMO_TRACES['bubble-sort'];
  return DEMO_TRACES['array-sum'];
}
