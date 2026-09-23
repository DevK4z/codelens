import { test, expect } from '@playwright/test';

test.describe('CodeLens E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (assuming it's running on localhost:5173)
    await page.goto('http://localhost:5173/');
  });

  test('should load the editor and run code', async ({ page }) => {
    // Check header
    await expect(page.locator('h1')).toContainText('CodeLens');
    
    // Select the Factorial sample
    await page.getByRole('combobox').selectOption('factorial');
    
    // Wait for the code to be loaded
    await expect(page.locator('.monaco-editor')).toBeVisible();

    // Click the Run button
    await page.getByRole('button', { name: 'Chạy' }).click();

    // The Run button should show 'Đang chạy...'
    await expect(page.getByRole('button', { name: 'Đang chạy...' })).toBeVisible();

    // Wait for the result to come back
    await expect(page.getByRole('button', { name: 'Chạy' })).toBeVisible({ timeout: 10000 });

    // Ensure the visualization panel is updated
    await expect(page.getByText('Trực quan hóa')).toBeVisible();
    
    // Check if step controls appear
    await expect(page.getByTitle('Bước tiếp theo')).toBeVisible();
  });

  test('should show stale warning when editing code', async ({ page }) => {
    // Select the Binary Search sample
    await page.getByRole('combobox').selectOption('binary-search');
    
    // Wait for demo trace to load
    await expect(page.getByText('Demo Mode')).toBeVisible();

    // Edit the Stdin input
    const stdinInput = page.locator('textarea[placeholder*="Nhập stdin"]');
    await stdinInput.fill('7 1 3 5 7 9 11 13 99');

    // Warning should appear
    await expect(page.getByText('Mã nguồn đã bị thay đổi')).toBeVisible();
  });
});
