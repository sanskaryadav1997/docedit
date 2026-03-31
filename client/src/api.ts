const BASE = '/api';

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function request(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(), ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, name: string, password: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, name, password }) }),
  me: () => request('/auth/me'),
  getDocs: () => request('/documents'),
  createDoc: (title?: string) =>
    request('/documents', { method: 'POST', body: JSON.stringify({ title }) }),
  getDoc: (id: string) => request(`/documents/${id}`),
  updateDoc: (id: string, data: { title?: string; content?: string }) =>
    request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDoc: (id: string) => request(`/documents/${id}`, { method: 'DELETE' }),
  shareDoc: (id: string, email: string, permission: string) =>
    request(`/documents/${id}/share`, { method: 'POST', body: JSON.stringify({ email, permission }) }),
  removeShare: (docId: string, shareId: string) =>
    request(`/documents/${docId}/share/${shareId}`, { method: 'DELETE' }),
  uploadFile: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE}/documents/upload`, {
      method: 'POST', body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
};
