import test from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';

test('Check Backend Script Fails without VITE_API_BASE_URL', (t) => {
  try {
    execFileSync('node', ['./scripts/check-backend.mjs'], { 
      env: { ...process.env, VITE_API_BASE_URL: '' }
    });
    assert.fail("Should have failed");
  } catch (error) {
    assert.match(error.stderr.toString(), /VITE_API_BASE_URL chưa được cấu hình/);
  }
});
