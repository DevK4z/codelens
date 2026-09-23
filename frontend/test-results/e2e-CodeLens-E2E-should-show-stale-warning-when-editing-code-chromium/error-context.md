# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> CodeLens E2E >> should show stale warning when editing code
- Location: tests\e2e.spec.ts:35:3

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
  - text: Chưa kết nối backend
  - button "Thử kết nối lại"
  - combobox "Chọn bài mẫu":
    - option "-- Chọn bài mẫu (Tùy chọn) --" [disabled]
    - option "Tự viết code (Trống) - Viết thuật toán và dữ liệu đầu..."
    - option "Tính tổng mảng - Tính tổng các phần tử trong mả..."
    - option "Tìm kiếm nhị phân - Tìm phần tử trong mảng đã sắp ..." [selected]
    - option "Sắp xếp nổi bọt - Sắp xếp mảng bằng thuật toán B..."
    - option "Giai thừa đệ quy - Tính n! bằng đệ quy..."
  - button "Chế độ sáng"
- code:
  - textbox "Editor content"
- text: Stdin
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
- alert
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('CodeLens E2E', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Navigate to the app (assuming it's running on localhost:5173)
  6  |     await page.goto('http://localhost:5173/');
  7  |   });
  8  | 
  9  |   test('should load the editor and run code', async ({ page }) => {
  10 |     // Check header
  11 |     await expect(page.locator('h1')).toContainText('CodeLens');
  12 |     
  13 |     // Select the Factorial sample
  14 |     await page.getByRole('combobox').selectOption('factorial');
  15 |     
  16 |     // Wait for the code to be loaded
  17 |     await expect(page.locator('.monaco-editor')).toBeVisible();
  18 | 
  19 |     // Click the Run button
  20 |     await page.getByRole('button', { name: 'Chạy' }).click();
  21 | 
  22 |     // The Run button should show 'Đang chạy...'
  23 |     await expect(page.getByRole('button', { name: 'Đang chạy...' })).toBeVisible();
  24 | 
  25 |     // Wait for the result to come back
  26 |     await expect(page.getByRole('button', { name: 'Chạy' })).toBeVisible({ timeout: 10000 });
  27 | 
  28 |     // Ensure the visualization panel is updated
  29 |     await expect(page.getByText('Trực quan hóa')).toBeVisible();
  30 |     
  31 |     // Check if step controls appear
  32 |     await expect(page.getByTitle('Bước tiếp theo')).toBeVisible();
  33 |   });
  34 | 
  35 |   test('should show stale warning when editing code', async ({ page }) => {
  36 |     // Select the Binary Search sample
  37 |     await page.getByRole('combobox').selectOption('binary-search');
  38 |     
  39 |     // Wait for demo trace to load
> 40 |     await expect(page.getByText('Demo Mode')).toBeVisible();
     |                                               ^ Error: expect(locator).toBeVisible() failed
  41 | 
  42 |     // Edit the Stdin input
  43 |     const stdinInput = page.locator('textarea[placeholder*="Nhập stdin"]');
  44 |     await stdinInput.fill('7 1 3 5 7 9 11 13 99');
  45 | 
  46 |     // Warning should appear
  47 |     await expect(page.getByText('Mã nguồn đã bị thay đổi')).toBeVisible();
  48 |   });
  49 | });
  50 | 
```