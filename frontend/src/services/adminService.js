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

export async function fetchPendingReviews(params = {}, token) {
  const query = buildQuery({
    keyword: params.keyword,
    categoryId: params.categoryId,
    status: params.status,
    page: params.page ?? 0,
    size: params.size ?? 100,
    sortBy: params.sortBy ?? "updatedTime",
    sortDir: params.sortDir ?? "desc",
  });

  return request(`/api/admin/resources/pending${query}`, {
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

export async function approveContributor(userId, token) {
  return request(`/api/admin/contributors/${userId}/approve`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function rejectContributor(userId, reason, token) {
  return request(`/api/admin/contributors/${userId}/reject`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      reason,
    }),
  });
}

export async function fetchReviewDetail(resourceId, token) {
  return request(`/api/resources/${resourceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function submitReviewDecision(resourceId, payload, token) {
  return request(`/api/resources/${resourceId}/review`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchPublishedResources(params = {}, token) {
  const query = buildQuery({
    keyword: params.keyword,
    categoryId: params.categoryId,
    place: params.place,
    tag: params.tag,
    page: params.page ?? 0,
    size: params.size ?? 100,
    sortBy: params.sortBy ?? "updatedTime",
    sortDir: params.sortDir ?? "desc",
  });

  return request(`/api/admin/resources/published${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function archiveResource(resourceId, token) {
  return request(`/api/admin/resources/${resourceId}/archive`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchArchivedResources(params = {}, token) {
  const query = buildQuery({
    keyword: params.keyword,
    categoryId: params.categoryId,
    place: params.place,
    tag: params.tag,
    page: params.page ?? 0,
    size: params.size ?? 100,
    sortBy: params.sortBy ?? "updatedTime",
    sortDir: params.sortDir ?? "desc",
  });

  return request(`/api/admin/resources/archived${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function restoreResource(resourceId, token) {
  return request(`/api/admin/resources/${resourceId}/restore`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchAuditLogs(params = {}, token) {
  const query = buildQuery({
    keyword: params.keyword,
    module: params.module,
    status: params.status,
  });

  return request(`/api/admin/audit-logs${query}`, {
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

export async function createCategory(payload, token) {
  return request("/api/admin/categories", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(categoryId, payload, token) {
  return request(`/api/admin/categories/${categoryId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(categoryId, token) {
  return request(`/api/admin/categories/${categoryId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createTag(payload, token) {
  return request("/api/admin/tags", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateTag(tagId, payload, token) {
  return request(`/api/admin/tags/${tagId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteTag(tagId, token) {
  return request(`/api/admin/tags/${tagId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchAnnouncements(params = {}, token) {
  const query = buildQuery({
    keyword: params.keyword,
    audience: params.audience,
    status: params.status,
  });

  return request(`/api/admin/announcements${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createAnnouncement(payload, token) {
  return request("/api/admin/announcements", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateAnnouncement(announcementId, payload, token) {
  return request(`/api/admin/announcements/${announcementId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateAnnouncementStatus(announcementId, status, token) {
  return request(`/api/admin/announcements/${announcementId}/status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
}
