const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(options.headers || {}),
    },
    ...options,
  });
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function fetchVisibleAnnouncements(token) {
  return request("/api/announcements", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchPublicAnnouncements() {
  return request("/api/public/announcements");
}
