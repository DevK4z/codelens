import fs from 'node:fs';

const url = process.env.VITE_API_BASE_URL;

async function checkBackend() {
  if (!url) {
    console.error("Lỗi: VITE_API_BASE_URL chưa được cấu hình.");
    process.exit(1);
  }

  try {
    // 1. Kiểm tra CORS preflight cho POST /execute
    const optionsRes = await fetch(`${url}/execute`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://devk4z.github.io',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    if (!optionsRes.ok) {
      console.warn(`Cảnh báo: Preflight OPTIONS request thất bại (HTTP ${optionsRes.status}). Kiểm tra CORS.`);
    }

    const allowOrigin = optionsRes.headers.get('access-control-allow-origin');
    if (allowOrigin !== '*' && allowOrigin !== 'https://devk4z.github.io') {
      console.error(`Lỗi: CORS không cho phép origin https://devk4z.github.io. Hiện tại cho phép: ${allowOrigin}`);
      process.exit(1);
    }

    // 2. Kiểm tra Health
    const healthRes = await fetch(`${url}/health`);
    if (!healthRes.ok) {
      console.error(`Lỗi: /health trả về HTTP ${healthRes.status}. Backend có thể chưa sẵn sàng.`);
      process.exit(1);
    }
    
    const healthData = await healthRes.json().catch(() => null);
    if (!healthData || healthData.status !== 'ok') {
      console.error(`Lỗi: Health check data không hợp lệ:`, healthData);
      process.exit(1);
    }

    // 3. Chạy bài kiểm chứng (Test compile and run)
    const testCode = `#include <iostream>\nusing namespace std;\nint main() { int a, b; cin >> a >> b; cout << a + b << endl; return 0; }`;
    const execRes = await fetch(`${url}/execute`, {
      method: 'POST',
      headers: {
        'Origin': 'https://devk4z.github.io',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: testCode, stdin: '2 3', language: 'cpp' })
    });

    if (!execRes.ok) {
      console.error(`Lỗi: /execute trả về HTTP ${execRes.status}`);
      process.exit(1);
    }

    const execData = await execRes.json().catch(() => null);
    if (!execData || !execData.success) {
      console.error(`Lỗi: Biên dịch hoặc chạy code thất bại. Data:`, execData);
      process.exit(1);
    }

    if (String(execData.stdout).trim() !== '5') {
      console.error(`Lỗi: stdout không mong đợi. Kì vọng '5', nhận được: '${execData.stdout}'`);
      process.exit(1);
    }

    console.log("Backend check hoàn tất! CORS, Health và Execution Trace đều hợp lệ.");

  } catch (error) {
    console.error("Lỗi khi kết nối đến backend:", error.message);
    process.exit(1);
  }
}

checkBackend();
