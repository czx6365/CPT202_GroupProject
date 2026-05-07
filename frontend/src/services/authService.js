const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: mergedHeaders,
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
      verificationCode: payload.verificationCode,
    }),
  });
}

export async function sendVerificationCode(email) {
  return request("/api/auth/send-verification-code", {
    method: "POST",
    body: JSON.stringify({
      email,
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

export async function updateProfile(userId, payload, token) {
  return request(`/api/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userName: payload.userName,
      email: payload.email,
      currentPassword: payload.currentPassword,
      password: payload.password,
    }),
  });
}

export async function applyContributor(userId, application, token) {
  return request(`/api/users/${userId}/contributor-application`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      application,
    }),
  });
}
