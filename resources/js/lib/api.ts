import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Let axios set Content-Type automatically for FormData (multipart/form-data with boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Simple in-memory GET cache (avoids re-fetching on back navigation) ──
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30_000; // 30 seconds

// ── In-flight deduplication: same URL concurrent calls share one request ──
const inFlight = new Map<string, Promise<any>>();

export const cachedGet = (url: string, ttl = CACHE_TTL) => {
  const entry = cache.get(url);
  if (entry && Date.now() - entry.ts < ttl) {
    return Promise.resolve({ data: entry.data });
  }
  const pending = inFlight.get(url);
  if (pending) return pending;
  const req = api.get(url).then(res => {
    cache.set(url, { data: res.data, ts: Date.now() });
    inFlight.delete(url);
    return res;
  }).catch(err => {
    inFlight.delete(url);
    throw err;
  });
  inFlight.set(url, req);
  return req;
};

export const clearCache = (pattern?: string) => {
  if (!pattern) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
};

/**
 * Download a PDF from the API. Uses raw fetch to avoid axios blob corruption.
 * Throws an Error with `.serverMessage` set when the API returned a JSON error.
 */
export const downloadPdf = async (apiPath: string, filename: string) => {
  const baseURL = import.meta.env.VITE_API_URL || '/api/v1';
  const token = localStorage.getItem('token');
  const url = `${baseURL}${apiPath.startsWith('/') ? apiPath : '/' + apiPath}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf, application/json',
      },
    });
  } catch (netErr: any) {
    throw new Error('Network error: ' + (netErr?.message || 'unreachable'));
  }

  if (res.status === 401) {
    // Stale token — let axios interceptor behavior kick in
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    // Try to read JSON body for the real reason
    let serverMessage = `HTTP ${res.status}`;
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const body = await res.json();
        if (body?.message) serverMessage = body.message;
      } else {
        const text = await res.text();
        if (text && text.length < 500) serverMessage = text;
      }
    } catch { /* ignore parse errors */ }
    const err: any = new Error(serverMessage);
    err.serverMessage = serverMessage;
    err.status = res.status;
    throw err;
  }

  // Guard against HTML/JSON slipping through with a 200 (shouldn't happen, but safety)
  const ctype = res.headers.get('content-type') || '';
  if (ctype.includes('application/json') || ctype.includes('text/html')) {
    let bodyMsg = '';
    try { bodyMsg = await res.text(); } catch { /* ignore */ }
    throw new Error('Server returned non-PDF content: ' + bodyMsg.slice(0, 200));
  }

  const arrayBuffer = await res.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

  if (blob.size < 500) {
    throw new Error('File too small — server may have returned an error');
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Defer cleanup so the browser has time to start the download in all browsers
  setTimeout(() => {
    try { a.remove(); } catch { /* ignore */ }
    try { window.URL.revokeObjectURL(blobUrl); } catch { /* ignore */ }
  }, 2000);
};

export default api;
