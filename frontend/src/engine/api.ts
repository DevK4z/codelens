import { ExecuteResponse } from './types';

// Use environment variable if provided, otherwise default to relative path (for prod proxy) or localhost
const API_BASE = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api');

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
    const res = await fetch(`${API_BASE}/health`, { 
      // Add timeout to prevent hanging forever
      signal: AbortSignal.timeout(3000) 
    });
    return res.ok;
  } catch { return false; }
}

