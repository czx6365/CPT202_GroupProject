const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

export async function fetchPendingReviews(token) {
  return request("/api/admin/resources/pending", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchPendingUsers(token) {
  return request("/api/admin/contributors/pending", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchCategories() {
  return request("/api/admin/categories");
}

export async function fetchTags() {
  return request("/api/admin/tags");
}
