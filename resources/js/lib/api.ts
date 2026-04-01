import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
    if (err.response?.status === 401) {
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

export const cachedGet = (url: string, ttl = CACHE_TTL) => {
  const key = url;
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < ttl) {
    return Promise.resolve({ data: entry.data });
  }
  return api.get(url).then(res => {
    cache.set(key, { data: res.data, ts: Date.now() });
    return res;
  });
};

export const clearCache = (pattern?: string) => {
  if (!pattern) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
};

/**
 * Download a PDF from the API. Uses raw fetch to avoid axios blob corruption.
 */
export const downloadPdf = async (apiPath: string, filename: string) => {
  const baseURL = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('token');
  const url = `${baseURL}${apiPath.startsWith('/') ? apiPath : '/' + apiPath}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/pdf',
    },
  });

  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status}`);
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
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
};

export default api;
