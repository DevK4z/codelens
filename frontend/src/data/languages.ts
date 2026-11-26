// Ngôn ngữ được dùng khi làm bài thi. Phần mô phỏng từng bước (GDB) vẫn chỉ hỗ trợ C++; bài thi chỉ cần
// biên dịch và chạy nên chấm được mọi ngôn ngữ backend hỗ trợ (backend/src/runner/languages.ts).

export type ExamLanguage = 'cpp' | 'c' | 'python' | 'java' | 'javascript';

export interface LanguageInfo {
  id: ExamLanguage;
  label: string;
  /** Mã ngôn ngữ của Monaco để tô màu. */
  monaco: string;
  /** Lưu ý ngắn hiện cạnh ô chọn ngôn ngữ. */
  hint?: string;
  starter: string;
}

export const DEFAULT_LANGUAGE: ExamLanguage = 'cpp';

export const LANGUAGES: LanguageInfo[] = [
  {
    id: 'cpp', label: 'C++ 17', monaco: 'cpp',
    starter: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // Viết lời giải ở đây

    return 0;
}`,
  },
  {
    id: 'c', label: 'C 17', monaco: 'c',
    starter: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    // Viết lời giải ở đây

    return 0;
}`,
  },
  {
    id: 'python', label: 'Python 3', monaco: 'python',
    hint: 'Đọc nhanh bằng sys.stdin; đệ quy sâu cần sys.setrecursionlimit.',
    starter: `import sys


def main():
    data = sys.stdin.read().split()
    # Viết lời giải ở đây


main()
`,
  },
  {
    id: 'java', label: 'Java 17', monaco: 'java',
    hint: 'Lớp chứa main phải tên là Main.',
    starter: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StreamTokenizer in = new StreamTokenizer(br);
        // Viết lời giải ở đây (in.nextToken(); int x = (int) in.nval;)

    }
}
`,
  },
  {
    id: 'javascript', label: 'JavaScript (Node.js)', monaco: 'javascript',
    hint: 'Số lớn hơn 2^53 cần BigInt.',
    starter: `const data = require('fs').readFileSync(0, 'utf8').split(/\\s+/).filter(Boolean);
let pos = 0;
const next = () => data[pos++];

// Viết lời giải ở đây
`,
  },
];

export function isExamLanguage(v: unknown): v is ExamLanguage {
  return LANGUAGES.some(l => l.id === v);
}

export function languageInfo(id: ExamLanguage | undefined): LanguageInfo {
  return LANGUAGES.find(l => l.id === id) ?? LANGUAGES[0];
}

export function starterFor(id: ExamLanguage | undefined): string {
  return languageInfo(id).starter;
}

/** Code vẫn là khung mẫu của một ngôn ngữ nào đó (tức là chưa làm bài). */
export function isStarterCode(code: string): boolean {
  const trimmed = code.trim();
  return LANGUAGES.some(l => l.starter.trim() === trimmed);
}
