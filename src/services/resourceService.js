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
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    const normalizedValue = typeof value === "string" ? value.trim() : value;
    if (normalizedValue === "") return;

    searchParams.set(key, String(normalizedValue));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function fetchPublicResources(params = {}) {
  const query = buildQuery({
    keyword: params.keyword,
    categoryId: params.categoryId,
    place: params.place,
    tag: params.tag,
    page: params.page ?? 0,
    size: params.size ?? 10,
    sortBy: params.sortBy ?? "updatedTime",
    sortDir: params.sortDir ?? "desc",
  });

  return request(`/api/public/resources${query}`);
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

export async function fetchContributorResourceById(resourceId, token, fallbackResource = null) {
  try {
    return await request(`/api/resources/${resourceId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    if (fallbackResource) {
      return fallbackResource;
    }

    const list = await fetchMyResources(token);
    return (Array.isArray(list) ? list : []).find((item) => String(item.resourceId) === String(resourceId)) || null;
  }
}

export async function createDraft(payload, token) {
  return request("/api/resources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateDraft(resourceId, payload, token) {
  return request(`/api/resources/${resourceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteDraft(resourceId, token) {
  return request(`/api/resources/${resourceId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function submitResourceForReview(resourceId, token) {
  return request(`/api/resources/${resourceId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
}

export async function resubmitResource(resourceId, token) {
  return request(`/api/resources/${resourceId}/resubmit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
}

export async function fetchCategories() {
  return request("/api/admin/categories");
}

export async function fetchTags() {
  return request("/api/admin/tags");
}
