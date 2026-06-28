const BASE = '/api';

function getToken() {
  return localStorage.getItem('auth_token');
}

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || res.statusText), { status: res.status, data });
  return data;
}

export const api = {
  async getAuthStatus() {
    const res = await fetch(`${BASE}/auth/status`);
    return handleResponse(res);
  },

  async getEvents() {
    const res = await fetch(`${BASE}/events`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async approveEvent(id) {
    const res = await fetch(`${BASE}/events/${id}/approve`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async rejectEvent(id) {
    const res = await fetch(`${BASE}/events/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  async updateEvent(id, fields) {
    const res = await fetch(`${BASE}/events/${id}`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(fields),
    });
    return handleResponse(res);
  },

  async captureText(text) {
    const res = await fetch(`${BASE}/capture/text`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ text }),
    });
    return handleResponse(res);
  },

  async captureImage(file) {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${BASE}/capture/image`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    return handleResponse(res);
  },

  async captureAudio(duration) {
    const res = await fetch(`${BASE}/capture/audio`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ duration }),
    });
    return handleResponse(res);
  },
};
