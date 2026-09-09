const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminLogin = (username, password) =>
  request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const getAdminTests = () => request('/admin/tests');

export const createAdminTest = (testData) =>
  request('/admin/tests', {
    method: 'POST',
    body: JSON.stringify(testData),
  });

export const getAdminStudents = () => request('/admin/students');

// ─── Student ──────────────────────────────────────────────────────────────────

export const studentLogin = (testId, name, rollNo) =>
  request('/student/login', {
    method: 'POST',
    body: JSON.stringify({ testId, name, rollNo }),
  });

export const getTestQuestions = (testId) =>
  request(`/student/test/${testId}`);

export const submitTest = ({ testId, name, rollNo, answers, language, totalTime }) =>
  request('/student/submit', {
    method: 'POST',
    body: JSON.stringify({ testId, name, rollNo, answers, language, totalTime }),
  });

const JUDGE0_LANGUAGE_MAP = {
  python: 71,
  javascript: 63,
  cpp: 54,
  java: 62,
};

export const executeCode = async ({ sourceCode, language = 'python', stdin = '' }) => {
  try {
    // Try backend endpoint first
    return await request('/student/run-code', {
      method: 'POST',
      body: JSON.stringify({ sourceCode, language, stdin }),
    });
  } catch (backendError) {
    console.warn('Backend run-code unavailable, attempting direct sandbox execution...', backendError);
    // Direct Judge0 fallback if backend is offline/unreachable
    const languageId = JUDGE0_LANGUAGE_MAP[language.toLowerCase()] || 71;
    const response = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin || '',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Execution error: ${errText}`);
    }

    const result = await response.json();
    return {
      success: true,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      message: result.message || '',
      status: result.status?.description || 'Executed',
      statusId: result.status?.id,
      time: result.time,
      memory: result.memory,
    };
  }
};


// ─── Real-time SSE ────────────────────────────────────────────────────────────

/**
 * Opens an SSE connection to the admin stream.
 * @param {function} onUpdate  Called with the parsed event payload on each 'update' event.
 * @param {function} onConnect Called once when the connection is established.
 * @returns {function}         Call this to close the connection (use in useEffect cleanup).
 */
export const subscribeToStream = (onUpdate, onConnect) => {
  const url = `${API_URL}/admin/stream`;
  const source = new EventSource(url);

  source.addEventListener('connected', () => {
    if (onConnect) onConnect();
  });

  source.addEventListener('update', (e) => {
    try {
      const payload = JSON.parse(e.data);
      onUpdate(payload);
    } catch (err) {
      console.warn('SSE parse error:', err);
    }
  });

  source.onerror = (err) => {
    // Browser auto-reconnects on error; just log it
    console.warn('SSE connection error — will auto-retry:', err);
  };

  // Return cleanup fn
  return () => source.close();
};

import { io } from 'socket.io-client';

export const initSocket = () => {
  // Extract base URL (remove /api)
  const baseUrl = API_URL.replace(/\/api$/, '');
  return io(baseUrl, {
    withCredentials: true,
  });
};

