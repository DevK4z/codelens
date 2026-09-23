import { test, expect } from '@playwright/test';

test.describe('CodeLens E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the health check API to simulate backend availability
    await page.route('**/api/health', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' })
      });
    });

    // Mock the execute API to return a dummy trace
    await page.route('**/api/execute', async route => {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 500));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          trace: [{ step: 0, line: 1, event: "init", variables: {}, changed: [], callStack: [{func: 'main', line: 1}] }],
          stdout: "Mocked output",
          stepCount: 1,
          executionTimeMs: 10
        })
      });
    });

    await page.goto('http://localhost:5173/');
  });

  test('should load the editor and run code', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('CodeLens');
    await page.getByRole('combobox').selectOption('factorial');
    await expect(page.locator('.monaco-editor')).toBeVisible();

    await page.getByRole('button', { name: 'Chạy' }).click();
    await expect(page.getByRole('button', { name: 'Đang chạy...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chạy' })).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Trực quan hóa')).toBeVisible();
    await expect(page.getByTitle('Bước tiếp theo')).toBeVisible();
  });

  test('should show stale warning when editing code', async ({ page }) => {
    await page.getByRole('combobox').selectOption('binary-search');
    
    // Wait for demo trace to load
    await expect(page.getByText('Demo Mode')).toBeVisible();

    const stdinInput = page.locator('textarea[placeholder*="Nhập stdin"]');
    await stdinInput.fill('7 1 3 5 7 9 11 13 99');

    await expect(page.getByText('Code hoặc input đã thay đổi')).toBeVisible();
  });
});
