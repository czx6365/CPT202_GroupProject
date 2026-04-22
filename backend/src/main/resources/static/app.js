const state = {
    currentUser: loadUser(),
    token: loadToken(),
    categories: [],
    tags: [],
    publicResources: [],
    publicPage: 0,
    publicTotalPages: 0,
    publicTotalElements: 0,
    myResources: [],
    pendingResources: [],
    pendingPage: 0,
    pendingTotalPages: 0,
    pendingTotalElements: 0,
    pendingContributors: []
};

const els = {
    toast: document.getElementById("toast"),
    sessionText: document.getElementById("sessionText"),
    logoutBtn: document.getElementById("logoutBtn"),
    publicList: document.getElementById("publicList"),
    mineList: document.getElementById("mineList"),
    pendingResourceList: document.getElementById("pendingResourceList"),
    pendingContributorList: document.getElementById("pendingContributorList"),
    publicCategory: document.getElementById("publicCategory"),
    publicTag: document.getElementById("publicTag"),
    resourceCategory: document.getElementById("resourceCategory"),
    adminPendingCategory: document.getElementById("adminPendingCategory"),
    adminPendingTag: document.getElementById("adminPendingTag"),
    publicPrevBtn: document.getElementById("publicPrevBtn"),
    publicNextBtn: document.getElementById("publicNextBtn"),
    publicPageInfo: document.getElementById("publicPageInfo"),
    pendingPrevBtn: document.getElementById("pendingPrevBtn"),
    pendingNextBtn: document.getElementById("pendingNextBtn"),
    pendingPageInfo: document.getElementById("pendingPageInfo")
};

init();

async function init() {
    bindEvents();
    renderSession();
    await refreshMasterData();
    await refreshPublicResources();
    await refreshRolePanels();
}

function bindEvents() {
    document.getElementById("loginForm").addEventListener("submit", onLogin);
    document.getElementById("registerForm").addEventListener("submit", onRegister);
    document.getElementById("resourceForm").addEventListener("submit", onCreateResource);
    document.getElementById("categoryForm").addEventListener("submit", onCreateCategory);
    document.getElementById("tagForm").addEventListener("submit", onCreateTag);

    document.getElementById("publicSearchBtn").addEventListener("click", () => {
        state.publicPage = 0;
        refreshPublicResources();
    });
    document.getElementById("reloadMineBtn").addEventListener("click", refreshMine);
    document.getElementById("reloadAdminBtn").addEventListener("click", refreshAdminQueues);
    document.getElementById("pendingSearchBtn").addEventListener("click", () => {
        state.pendingPage = 0;
        refreshAdminQueues();
    });

    els.publicPrevBtn.addEventListener("click", () => {
        if (state.publicPage <= 0) return;
        state.publicPage -= 1;
        refreshPublicResources();
    });
    els.publicNextBtn.addEventListener("click", () => {
        if (state.publicPage + 1 >= state.publicTotalPages) return;
        state.publicPage += 1;
        refreshPublicResources();
    });
    els.pendingPrevBtn.addEventListener("click", () => {
        if (state.pendingPage <= 0) return;
        state.pendingPage -= 1;
        refreshAdminQueues();
    });
    els.pendingNextBtn.addEventListener("click", () => {
        if (state.pendingPage + 1 >= state.pendingTotalPages) return;
        state.pendingPage += 1;
        refreshAdminQueues();
    });

    els.logoutBtn.addEventListener("click", onLogout);
}

async function onLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
        userName: form.userName.value.trim(),
        password: form.password.value
    };

    try {
        const auth = await apiPost("/api/auth/login", payload);
        state.currentUser = auth.user;
        state.token = auth.token;
        localStorage.setItem("currentUser", JSON.stringify(auth.user));
        localStorage.setItem("authToken", auth.token);
        renderSession();
        await refreshRolePanels();
        showToast(`Welcome, ${auth.user.userName}`);
    } catch (error) {
        showToast(error.message, true);
    }
}

async function onRegister(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
        userName: form.userName.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value,
        role: form.role.value
    };

    try {
        const user = await apiPost("/api/auth/register", payload);
        showToast(`Registered: ${user.userName}. Please login.`);
        form.reset();
    } catch (error) {
        showToast(error.message, true);
    }
}

function onLogout() {
    state.currentUser = null;
    state.token = null;
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    renderSession();
    refreshRolePanels();
    showToast("Logged out");
}

async function onCreateResource(event) {
    event.preventDefault();
    if (!isContributor()) {
        showToast("Only contributor can create resources", true);
        return;
    }

    const form = event.currentTarget;
    const submitter = event.submitter;
    const action = submitter?.value || "draft";
    const payload = {
        title: form.title.value.trim(),
        topic: form.topic.value.trim(),
        placeName: form.placeName.value.trim(),
        description: form.description.value.trim(),
        categoryId: Number(form.categoryId.value),
        tags: splitTags(form.tags.value),
        fileUrl: form.fileUrl.value.trim() || null,
        externalLink: form.externalLink.value.trim() || null,
        copyrightDeclaration: form.copyrightDeclaration.value.trim()
    };

    try {
        const created = await apiPost("/api/resources", payload);
        if (action === "submit") {
            await apiPost(`/api/resources/${created.resourceId}/submit`, {});
            showToast(`Resource #${created.resourceId} submitted`);
        } else {
            showToast(`Draft #${created.resourceId} created`);
        }
        form.reset();
        await refreshMine();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function onCreateCategory(event) {
    event.preventDefault();
    if (!isAdmin()) {
        showToast("Only admin can create categories", true);
        return;
    }
    const form = event.currentTarget;
    const payload = {
        name: form.name.value.trim(),
        description: form.description.value.trim()
    };
    try {
        await apiPost("/api/admin/categories", payload);
        form.reset();
        await refreshMasterData();
        showToast("Category created");
    } catch (error) {
        showToast(error.message, true);
    }
}

async function onCreateTag(event) {
    event.preventDefault();
    if (!isAdmin()) {
        showToast("Only admin can create tags", true);
        return;
    }
    const form = event.currentTarget;
    const payload = {name: form.name.value.trim()};
    try {
        await apiPost("/api/admin/tags", payload);
        form.reset();
        await refreshMasterData();
        showToast("Tag created");
    } catch (error) {
        showToast(error.message, true);
    }
}

async function refreshMasterData() {
    try {
        state.categories = await apiGet("/api/admin/categories");
        state.tags = await apiGet("/api/admin/tags");
    } catch (error) {
        showToast(`Master data load failed: ${error.message}`, true);
    }

    fillSelect(els.publicCategory, state.categories, "categoryId", "name", true);
    fillSelect(els.resourceCategory, state.categories, "categoryId", "name", false);
    fillSelect(els.publicTag, state.tags, "name", "name", true);
    fillSelect(els.adminPendingCategory, state.categories, "categoryId", "name", true);
    fillSelect(els.adminPendingTag, state.tags, "name", "name", true);
}

async function refreshPublicResources() {
    const form = document.getElementById("publicFilterForm");
    const params = new URLSearchParams();
    if (form.keyword.value.trim()) params.set("keyword", form.keyword.value.trim());
    if (form.categoryId.value) params.set("categoryId", form.categoryId.value);
    if (form.place.value.trim()) params.set("place", form.place.value.trim());
    if (form.tag.value) params.set("tag", form.tag.value);

    params.set("page", String(state.publicPage));
    params.set("size", form.size.value || "10");
    params.set("sortBy", form.sortBy.value || "updatedTime");
    params.set("sortDir", form.sortDir.value || "desc");

    try {
        const result = normalizePageResult(await apiGet(`/api/public/resources?${params.toString()}`), state.publicPage);
        state.publicResources = result.content;
        state.publicPage = result.page;
        state.publicTotalPages = result.totalPages;
        state.publicTotalElements = result.totalElements;

        if (state.publicTotalPages > 0 && state.publicPage >= state.publicTotalPages) {
            state.publicPage = state.publicTotalPages - 1;
            await refreshPublicResources();
            return;
        }

        renderPublicResources();
        renderPublicPager();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function refreshMine() {
    if (!isContributor()) return;
    try {
        state.myResources = await apiGet("/api/resources/mine");
        renderMineResources();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function refreshAdminQueues() {
    if (!isAdmin()) {
        state.pendingContributors = [];
        state.pendingResources = [];
        state.pendingPage = 0;
        state.pendingTotalPages = 0;
        state.pendingTotalElements = 0;
        renderPendingContributors();
        renderPendingResources();
        renderPendingPager();
        return;
    }

    try {
        state.pendingContributors = await apiGet("/api/admin/contributors/pending");

        const form = document.getElementById("pendingFilterForm");
        const params = new URLSearchParams();
        if (form.keyword.value.trim()) params.set("keyword", form.keyword.value.trim());
        if (form.categoryId.value) params.set("categoryId", form.categoryId.value);
        if (form.place.value.trim()) params.set("place", form.place.value.trim());
        if (form.tag.value) params.set("tag", form.tag.value);
        if (form.status.value) params.set("status", form.status.value);
        params.set("page", String(state.pendingPage));
        params.set("size", form.size.value || "10");
        params.set("sortBy", form.sortBy.value || "updatedTime");
        params.set("sortDir", form.sortDir.value || "desc");

        const result = normalizePageResult(
            await apiGet(`/api/admin/resources/pending?${params.toString()}`),
            state.pendingPage
        );
        state.pendingResources = result.content;
        state.pendingPage = result.page;
        state.pendingTotalPages = result.totalPages;
        state.pendingTotalElements = result.totalElements;

        if (state.pendingTotalPages > 0 && state.pendingPage >= state.pendingTotalPages) {
            state.pendingPage = state.pendingTotalPages - 1;
            await refreshAdminQueues();
            return;
        }

        renderPendingContributors();
        renderPendingResources();
        renderPendingPager();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function refreshRolePanels() {
    document.querySelectorAll(".contributor-only").forEach((el) => {
        el.classList.toggle("hidden", !isContributor());
    });
    document.querySelectorAll(".admin-only").forEach((el) => {
        el.classList.toggle("hidden", !isAdmin());
    });
    await refreshMine();
    await refreshAdminQueues();
}

function renderSession() {
    if (!state.currentUser) {
        els.sessionText.innerHTML = "Not logged in";
        return;
    }
    els.sessionText.innerHTML = `<b>${state.currentUser.userName}</b> | ${state.currentUser.role} | id=${state.currentUser.userId}`;
}

function renderPublicResources() {
    if (!state.publicResources.length) {
        els.publicList.innerHTML = `<div class="card">No approved resources found.</div>`;
        return;
    }

    els.publicList.innerHTML = state.publicResources.map((resource) => `
        <article class="card">
            <h3 class="card-title">${escapeHtml(resource.title)}</h3>
            <div class="meta">
                <span class="chip status-${resource.status}">${resource.status}</span>
                <span class="chip">${escapeHtml(resource.categoryName)}</span>
                <span class="chip">${escapeHtml(resource.placeName)}</span>
                <span class="chip">by ${escapeHtml(resource.contributorName)}</span>
            </div>
            <p>${escapeHtml(resource.topic)}</p>
            <div class="row">
                <button class="btn ghost" onclick="window.UI.viewResource(${resource.resourceId})">Details</button>
                <button class="btn ghost" onclick="window.UI.viewComments(${resource.resourceId})">Comments</button>
            </div>
            <div id="publicDetail-${resource.resourceId}" class="stack"></div>
            <div id="commentBox-${resource.resourceId}" class="stack"></div>
        </article>
    `).join("");
}

function renderPublicPager() {
    const pageNumber = state.publicTotalPages === 0 ? 0 : state.publicPage + 1;
    els.publicPageInfo.textContent = `Page ${pageNumber} / ${state.publicTotalPages} · ${state.publicTotalElements} items`;
    els.publicPrevBtn.disabled = state.publicPage <= 0;
    els.publicNextBtn.disabled = state.publicTotalPages === 0 || state.publicPage + 1 >= state.publicTotalPages;
}

function renderMineResources() {
    if (!state.myResources.length) {
        els.mineList.innerHTML = `<div class="card">No resources yet.</div>`;
        return;
    }
    els.mineList.innerHTML = state.myResources.map((resource) => `
        <article class="card">
            <h3 class="card-title">${escapeHtml(resource.title)}</h3>
            <div class="meta">
                <span class="chip status-${resource.status}">${resource.status}</span>
                <span class="chip">${escapeHtml(resource.categoryName)}</span>
                ${resource.tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
            </div>
            <div class="row">
                ${renderContributorActionBtn(resource)}
            </div>
        </article>
    `).join("");
}

function renderContributorActionBtn(resource) {
    if (resource.status === "DRAFT") {
        return `<button class="btn secondary" onclick="window.UI.submitResource(${resource.resourceId})">Submit For Review</button>`;
    }
    if (resource.status === "REJECTED") {
        return `<button class="btn secondary" onclick="window.UI.resubmitResource(${resource.resourceId})">Resubmit</button>`;
    }
    return `<span class="chip">No action</span>`;
}

function renderPendingContributors() {
    if (!state.pendingContributors.length) {
        els.pendingContributorList.innerHTML = `<div class="card">No pending contributors.</div>`;
        return;
    }
    els.pendingContributorList.innerHTML = state.pendingContributors.map((user) => `
        <article class="card">
            <b>${escapeHtml(user.userName)}</b> (${escapeHtml(user.email)})
            <div class="row">
                <button class="btn" onclick="window.UI.approveContributor(${user.userId})">Approve</button>
            </div>
        </article>
    `).join("");
}

function renderPendingResources() {
    if (!state.pendingResources.length) {
        els.pendingResourceList.innerHTML = `<div class="card">No pending resources.</div>`;
        return;
    }
    els.pendingResourceList.innerHTML = state.pendingResources.map((resource) => `
        <article class="card">
            <h3 class="card-title">${escapeHtml(resource.title)}</h3>
            <div class="meta">
                <span class="chip status-${resource.status}">${resource.status}</span>
                <span class="chip">${escapeHtml(resource.topic)}</span>
                <span class="chip">${escapeHtml(resource.placeName)}</span>
                <span class="chip">${escapeHtml(resource.categoryName)}</span>
            </div>
            <textarea id="reviewFeedback-${resource.resourceId}" rows="2" placeholder="Feedback"></textarea>
            <div class="row">
                <button class="btn" onclick="window.UI.reviewResource(${resource.resourceId}, 'APPROVE')">Approve</button>
                <button class="btn secondary" onclick="window.UI.reviewResource(${resource.resourceId}, 'REJECT')">Reject</button>
            </div>
        </article>
    `).join("");
}

function renderPendingPager() {
    const pageNumber = state.pendingTotalPages === 0 ? 0 : state.pendingPage + 1;
    els.pendingPageInfo.textContent = `Page ${pageNumber} / ${state.pendingTotalPages} · ${state.pendingTotalElements} items`;
    els.pendingPrevBtn.disabled = state.pendingPage <= 0;
    els.pendingNextBtn.disabled = state.pendingTotalPages === 0 || state.pendingPage + 1 >= state.pendingTotalPages;
}

window.UI = {
    async submitResource(resourceId) {
        try {
            await apiPost(`/api/resources/${resourceId}/submit`, {});
            await refreshMine();
            showToast("Submitted for review");
        } catch (error) {
            showToast(error.message, true);
        }
    },

    async resubmitResource(resourceId) {
        try {
            await apiPost(`/api/resources/${resourceId}/resubmit`, {});
            await refreshMine();
            showToast("Resubmitted");
        } catch (error) {
            showToast(error.message, true);
        }
    },

    async approveContributor(userId) {
        try {
            await apiPut(`/api/admin/contributors/${userId}/approve`, {});
            await refreshAdminQueues();
            showToast("Contributor approved");
        } catch (error) {
            showToast(error.message, true);
        }
    },

    async reviewResource(resourceId, decision) {
        try {
            const feedbackEl = document.getElementById(`reviewFeedback-${resourceId}`);
            await apiPost(`/api/resources/${resourceId}/review`, {
                decision,
                feedback: feedbackEl.value
            });
            await refreshAdminQueues();
            showToast(`Resource ${decision.toLowerCase()}d`);
        } catch (error) {
            showToast(error.message, true);
        }
    },

    async viewResource(resourceId) {
        try {
            const detail = await apiGet(`/api/public/resources/${resourceId}`);
            const el = document.getElementById(`publicDetail-${resourceId}`);
            el.innerHTML = `
                <div class="card">
                    <p><b>Description:</b> ${escapeHtml(detail.description || "")}</p>
                    <p><b>Copyright:</b> ${escapeHtml(detail.copyrightDeclaration || "")}</p>
                    <p><b>File:</b> ${detail.fileUrl ? `<a href="${escapeHtml(detail.fileUrl)}" target="_blank">Open</a>` : "N/A"}</p>
                    <p><b>Link:</b> ${detail.externalLink ? `<a href="${escapeHtml(detail.externalLink)}" target="_blank">Open</a>` : "N/A"}</p>
                </div>`;
        } catch (error) {
            showToast(error.message, true);
        }
    },

    async viewComments(resourceId) {
        try {
            const comments = await apiGet(`/api/public/resources/${resourceId}/comments`);
            const box = document.getElementById(`commentBox-${resourceId}`);
            const list = comments.length
                ? comments.map((comment) => `<div class="chip">${escapeHtml(comment.userName)}: ${escapeHtml(comment.content)}</div>`).join("")
                : `<div class="chip">No comments yet</div>`;
            const form = state.currentUser
                ? `<div class="row"><input id="commentInput-${resourceId}" placeholder="Add a comment"><button class="btn ghost" onclick="window.UI.addComment(${resourceId})">Post</button></div>`
                : `<small>Login to comment.</small>`;
            box.innerHTML = `<div class="card">${list}${form}</div>`;
        } catch (error) {
            showToast(error.message, true);
        }
    },

    async addComment(resourceId) {
        if (!state.currentUser) {
            showToast("Login first", true);
            return;
        }
        const input = document.getElementById(`commentInput-${resourceId}`);
        const content = input.value.trim();
        if (!content) {
            showToast("Comment cannot be empty", true);
            return;
        }
        try {
            await apiPost(`/api/public/resources/${resourceId}/comments`, {content});
            input.value = "";
            await window.UI.viewComments(resourceId);
            showToast("Comment posted");
        } catch (error) {
            showToast(error.message, true);
        }
    }
};

async function apiGet(path) {
    return request(path, {method: "GET"});
}

async function apiPost(path, body) {
    return request(path, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    });
}

async function apiPut(path, body) {
    return request(path, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    });
}

async function request(path, options) {
    const headers = {...(options.headers || {})};
    if (state.token) {
        headers.Authorization = `Bearer ${state.token}`;
    }
    const response = await fetch(path, {...options, headers});
    const text = await response.text();
    let data = {};
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = {message: text};
        }
    }
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            state.currentUser = null;
            state.token = null;
            localStorage.removeItem("currentUser");
            localStorage.removeItem("authToken");
            renderSession();
            refreshRolePanels();
        }
        throw new Error(data.message || `HTTP ${response.status}`);
    }
    return data;
}

function fillSelect(selectEl, list, valueKey, labelKey, includeAny) {
    if (!selectEl) return;
    const defaultOption = includeAny ? `<option value="">Any</option>` : `<option value="">Select</option>`;
    selectEl.innerHTML = defaultOption + list
        .map((item) => `<option value="${item[valueKey]}">${escapeHtml(item[labelKey])}</option>`)
        .join("");
}

function normalizePageResult(raw, fallbackPage) {
    if (Array.isArray(raw)) {
        return {
            content: raw,
            page: fallbackPage,
            size: raw.length,
            totalElements: raw.length,
            totalPages: raw.length > 0 ? 1 : 0
        };
    }

    return {
        content: Array.isArray(raw?.content) ? raw.content : [],
        page: Number.isInteger(raw?.page) ? raw.page : fallbackPage,
        size: Number.isInteger(raw?.size) ? raw.size : 10,
        totalElements: Number.isFinite(raw?.totalElements) ? raw.totalElements : 0,
        totalPages: Number.isInteger(raw?.totalPages) ? raw.totalPages : 0
    };
}

function splitTags(raw) {
    if (!raw.trim()) return [];
    return [...new Set(raw.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

function isAdmin() {
    return state.currentUser?.role === "ADMIN_REVIEWER";
}

function isContributor() {
    return state.currentUser?.role === "CONTRIBUTOR";
}

function showToast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.style.background = isError ? "#7f1f17" : "#1f2a1f";
    els.toast.classList.remove("hidden");
    setTimeout(() => els.toast.classList.add("hidden"), 2800);
}

function loadUser() {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
function loadToken() {
    return localStorage.getItem("authToken");
}
function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
