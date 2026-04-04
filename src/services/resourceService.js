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

export async function fetchPublicResources() {
  return request("/api/public/resources");
}

export async function fetchResourceDetail(resourceId) {
  return request(`/api/public/resources/${resourceId}`);
}

export async function fetchMyResources(token) {
  return request("/api/resources/mine", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
