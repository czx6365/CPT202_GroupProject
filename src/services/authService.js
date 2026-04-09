const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
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
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

export async function login(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      userName: credentials.userName,
      password: credentials.password,
    }),
  });
}

export async function register(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      userName: payload.userName,
      password: payload.password,
      email: payload.email,
      role: payload.role,
    }),
  });
}

export async function logout(token) {
  return request("/api/auth/logout", {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
}

export async function getProfile(userId, token) {
  return request(`/api/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
