# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> CodeLens E2E >> should show stale warning when editing code
- Location: tests\e2e.spec.ts:47:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Demo Mode')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Demo Mode') with timeout 5000ms
  - waiting for getByText('Demo Mode')

```

```yaml
- banner:
  - heading "CodeLens" [level=1]
  - paragraph: Trực quan hóa thuật toán
  - text: Trực tuyến
  - combobox "Chọn bài mẫu":
    - option "-- Chọn bài mẫu (Tùy chọn) --" [disabled]
    - option "Tự viết code (Trống) - Viết thuật toán và dữ liệu đầu..."
    - option "Tính tổng mảng - Tính tổng các phần tử trong mả..."
    - option "Tìm kiếm nhị phân - Tìm phần tử trong mảng đã sắp ..." [selected]
    - option "Sắp xếp nổi bọt - Sắp xếp mảng bằng thuật toán B..."
    - option "Giai thừa đệ quy - Tính n! bằng đệ quy..."
  - button "Chế độ sáng"
- text: Loading... Stdin
- textbox "Nhập dữ liệu đầu vào (stdin)...": 7 1 3 5 7 9 11 13 7
- strong: Dòng 4 · Bước 1/25
- paragraph: Gọi hàm main()
- heading "Trực quan hóa" [level=2]
- text: Bản ghi bài mẫu Chưa chọn hoặc không tìm thấy biến mảng để hiển thị. Hãy đảm bảo gán vai trò "Mảng" cho biến ở bảng Biến phía dưới.
- button "Chạy"
- button "Đặt lại"
- button "Bước trước" [disabled]
- button "Phát"
- button "Bước tiếp"
- text: Bước 1 / 25
- slider "Bước thực thi": "0"
- text: "Tốc độ:"
- button "0.25x"
- button "0.5x"
- button "1x"
- button "2x"
- button "4x"
- button "Biến"
- button "Call Stack"
- button "Giải thích"
- button "Console"
- text: Không có biến nào trong phạm vi hiện tại.
```

# Test source

```ts
  1  | ﻿import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('CodeLens E2E', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Mock the health check API to simulate backend availability
  6  |     await page.route('**/api/health', route => {
  7  |       route.fulfill({
  8  |         status: 200,
  9  |         contentType: 'application/json',
  10 |         body: JSON.stringify({ status: 'ok' })
  11 |       });
  12 |     });
  13 | 
  14 |     // Mock the execute API to return a dummy trace
  15 |     await page.route('**/api/execute', async route => {
  16 |       // Simulate network delay
  17 |       await new Promise(r => setTimeout(r, 500));
  18 |       route.fulfill({
  19 |         status: 200,
  20 |         contentType: 'application/json',
  21 |         body: JSON.stringify({
  22 |           success: true,
  23 |           trace: [{ step: 0, line: 1, event: "init", variables: {}, changed: [], callStack: [{func: 'main', line: 1}] }],
  24 |           stdout: "Mocked output",
  25 |           stepCount: 1,
  26 |           executionTimeMs: 10
  27 |         })
  28 |       });
  29 |     });
  30 | 
  31 |     await page.goto('http://localhost:5173/');
  32 |   });
  33 | 
  34 |   test('should load the editor and run code', async ({ page }) => {
  35 |     await expect(page.locator('h1')).toContainText('CodeLens');
  36 |     await page.getByRole('combobox').selectOption('factorial');
  37 |     await expect(page.locator('.monaco-editor')).toBeVisible();
  38 | 
  39 |     await page.getByRole('button', { name: 'Chạy' }).click();
  40 |     await expect(page.getByRole('button', { name: 'Đang chạy...' })).toBeVisible();
  41 |     await expect(page.getByRole('button', { name: 'Chạy' })).toBeVisible({ timeout: 10000 });
  42 | 
  43 |     await expect(page.getByText('Trực quan hóa')).toBeVisible();
  44 |     await expect(page.getByTitle('Bước tiếp theo')).toBeVisible();
  45 |   });
  46 | 
  47 |   test('should show stale warning when editing code', async ({ page }) => {
  48 |     await page.getByRole('combobox').selectOption('binary-search');
  49 |     
  50 |     // Wait for demo trace to load
> 51 |     await expect(page.getByText('Demo Mode')).toBeVisible();
     |                                               ^ Error: expect(locator).toBeVisible() failed
  52 | 
  53 |     const stdinInput = page.locator('textarea[placeholder*="Nhập stdin"]');
  54 |     await stdinInput.fill('7 1 3 5 7 9 11 13 99');
  55 | 
  56 |     await expect(page.getByText('Code hoặc input đã thay đổi')).toBeVisible();
  57 |   });
  58 | });
  59 | 
```