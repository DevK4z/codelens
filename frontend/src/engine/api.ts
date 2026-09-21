import { ExecuteResponse } from './types';

const API_BASE = 'http://localhost:3001/api';

export async function executeCode(code: string, stdin: string): Promise<ExecuteResponse> {
  const res = await fetch(`${API_BASE}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, stdin, language: 'cpp' })
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch { return false; }
}

