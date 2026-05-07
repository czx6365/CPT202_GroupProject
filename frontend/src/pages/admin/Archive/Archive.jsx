import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import { useAuth } from "../../../context/AuthContext";
import {
  archiveResource,
  fetchArchivedResources,
  fetchCategories,
  fetchPublishedResources,
  restoreResource,
} from "../../../services/adminService";
import AdminWorkspace from "../AdminWorkspace";
import "./AuditLogs.css";

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function normaliseListResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  return [];
}

function Archive() {
  const { token, isAuthenticated, user } = useAuth();
  const [activeView, setActiveView] = useState("operations");
  const [publishedResources, setPublishedResources] = useState([]);
  const [archivedResources, setArchivedResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [archiveReason, setArchiveReason] = useState(
    "Move this published resource into the archive while policy, rights, or metadata concerns are being reviewed."
  );
  const [restoreNote, setRestoreNote] = useState(
    "The archive issue has been resolved and this resource can return to public discovery."
  );
  const [isLoadingPublished, setIsLoadingPublished] = useState(true);
  const [isLoadingArchived, setIsLoadingArchived] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isAdmin = user?.role === "ADMIN_REVIEWER";
  const showAuthError = !isAuthenticated || !token;
  const showRoleError = isAuthenticated && Boolean(token) && !isAdmin;

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  };

  const buildParams = () => ({
    keyword: appliedKeyword,
    categoryId: categoryFilter || undefined,
    page: 0,
    size: 100,
    sortBy: "updatedTime",
    sortDir: "desc",
  });

  const loadPublishedResources = async () => {
    if (!token) {
      setPublishedResources([]);
      setSelectedResourceId(null);
      setIsLoadingPublished(false);
      return;
    }

    setIsLoadingPublished(true);

    try {
      const response = await fetchPublishedResources(buildParams(), token);
      const resources = normaliseListResponse(response);
      setPublishedResources(resources);
      setSelectedResourceId((previous) => (
        resources.some((item) => item.resourceId === previous) ? previous : null
      ));
    } catch (error) {
      setPublishedResources([]);
      setSelectedResourceId(null);
      setErrorMessage(error.message || "Unable to load published resources.");
    } finally {
      setIsLoadingPublished(false);
    }
  };

  const loadArchivedResources = async () => {
    if (!token) {
      setArchivedResources([]);
      setSelectedArchiveId(null);
      setIsLoadingArchived(false);
      return;
    }

    setIsLoadingArchived(true);

    try {
      const response = await fetchArchivedResources(buildParams(), token);
      const resources = normaliseListResponse(response);
      setArchivedResources(resources);
      setSelectedArchiveId((previous) => (
        resources.some((item) => item.resourceId === previous) ? previous : null
      ));
    } catch (error) {
      setArchivedResources([]);
      setSelectedArchiveId(null);
      setErrorMessage(error.message || "Unable to load archived resources.");
    } finally {
      setIsLoadingArchived(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (showAuthError || showRoleError) {
      setPublishedResources([]);
      setArchivedResources([]);
      setSelectedResourceId(null);
      setSelectedArchiveId(null);
      setIsLoadingPublished(false);
      setIsLoadingArchived(false);
      return;
    }

    setErrorMessage("");
    loadPublishedResources();
    loadArchivedResources();
  }, [token, appliedKeyword, categoryFilter, showAuthError, showRoleError]);

  const selectedResource = useMemo(
    () => publishedResources.find((resource) => resource.resourceId === selectedResourceId) || null,
    [publishedResources, selectedResourceId]
  );

  const selectedArchivedResource = useMemo(
    () => archivedResources.find((resource) => resource.resourceId === selectedArchiveId) || null,
    [archivedResources, selectedArchiveId]
  );

  useEffect(() => {
    if (!publishedResources.length) {
      setSelectedResourceId(null);
      return;
    }

    if (selectedResourceId && !publishedResources.some((resource) => resource.resourceId === selectedResourceId)) {
      setSelectedResourceId(null);
    }
  }, [publishedResources, selectedResourceId]);

  useEffect(() => {
    if (!archivedResources.length) {
      setSelectedArchiveId(null);
      return;
    }

    if (selectedArchiveId && !archivedResources.some((resource) => resource.resourceId === selectedArchiveId)) {
      setSelectedArchiveId(null);
    }
  }, [archivedResources, selectedArchiveId]);

  const applyFilters = () => {
    setAppliedKeyword(keywordInput);
    setSuccessMessage("");
  };

  const resetFilters = () => {
    setKeywordInput("");
    setAppliedKeyword("");
    setCategoryFilter("");
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleArchive = async () => {
    if (!selectedResource || !token) return;

    setIsArchiving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await archiveResource(selectedResource.resourceId, token);
      setSuccessMessage(`Archived "${selectedResource.title}" successfully.`);
      await Promise.all([loadPublishedResources(), loadArchivedResources()]);
      setActiveView("restoration");
    } catch (error) {
      setErrorMessage(error.message || "Unable to archive this resource.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedArchivedResource || !token) return;

    setIsRestoring(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await restoreResource(selectedArchivedResource.resourceId, token);
      setSuccessMessage(`Restored "${selectedArchivedResource.title}" successfully.`);
      await Promise.all([loadPublishedResources(), loadArchivedResources()]);
      setActiveView("unpublishing");
    } catch (error) {
      setErrorMessage(error.message || "Unable to restore this resource.");
    } finally {
      setIsRestoring(false);
    }
  };

  const effectiveErrorMessage = showAuthError
    ? "Please log in with an administrator account to manage archived resources."
    : showRoleError
    ? "Your account does not have administrator access to archive or restore resources."
    : errorMessage;

  return (
    <AdminWorkspace
      eyebrow="Resource Control"
      title="Archive Management Center"
      description="Manage resource archiving and restoration from a single moderator-facing workspace."
      actions={[{ label: "Back to Dashboard", to: "/admin", variant: "secondary" }]}
    >
      <div className="operations-switcher">
        <button
          type="button"
          className={`operations-switcher__tab ${activeView === "operations" ? "operations-switcher__tab--active" : ""}`}
          onClick={() => setActiveView("operations")}
        >
          Overview
        </button>
        <button
          type="button"
          className={`operations-switcher__tab ${activeView === "unpublishing" ? "operations-switcher__tab--active" : ""}`}
          onClick={() => setActiveView("unpublishing")}
        >
          Archive
        </button>
        <button
          type="button"
          className={`operations-switcher__tab ${activeView === "restoration" ? "operations-switcher__tab--active" : ""}`}
          onClick={() => setActiveView("restoration")}
        >
          Restore
        </button>
      </div>

      <div className="audit-toolbar">
        <div className="audit-toolbar__filters admin-panel">
          <Input
            id="resource-keyword"
            label="Keyword"
            placeholder="Search title, contributor, topic, or place"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            disabled={showAuthError || showRoleError}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="resource-category">
              Category
            </label>
            <select
              id="resource-category"
              className="input-group__field"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              disabled={showAuthError || showRoleError}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-group__label" htmlFor="resource-state">
              Resource State
            </label>
            <select
              id="resource-state"
              className="input-group__field"
              value={activeView === "restoration" ? "archived" : "published"}
              onChange={(event) => {
                setActiveView(event.target.value === "archived" ? "restoration" : "unpublishing");
              }}
              disabled={showAuthError || showRoleError}
            >
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="audit-toolbar__actions">
            <Button variant="primary" onClick={applyFilters} disabled={showAuthError || showRoleError}>
              Apply Filters
            </Button>
            <Button variant="secondary" onClick={resetFilters} disabled={showAuthError || showRoleError}>
              Reset
            </Button>
          </div>
        </div>

        <div className="audit-toolbar__summary">
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Published</span>
            <strong className="audit-summary-card__value">{publishedResources.length}</strong>
            <p className="audit-summary-card__hint">Approved resources currently available for archive review and lifecycle control.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Archived</span>
            <strong className="audit-summary-card__value">{archivedResources.length}</strong>
            <p className="audit-summary-card__hint">Resources currently hidden from public discovery and available for restoration.</p>
          </div>
        </div>
      </div>

      {effectiveErrorMessage && <p className="approval-feedback approval-feedback--error">{effectiveErrorMessage}</p>}
      {successMessage && <p className="approval-feedback approval-feedback--success">{successMessage}</p>}

      {activeView === "operations" && (
        <div className="operations-overview">
          <article className="operations-overview__card">
            <span className="resource-control-panel__eyebrow">Archive Workflow</span>
            <h2>Move published content into archive quickly when policy, rights, or safety issues appear.</h2>
            <p>
              Published resources now load from the live admin API, so this workspace can move real
              records out of public discovery when they need administrative intervention.
            </p>
            <div className="operations-overview__actions">
              <Button variant="danger" onClick={() => setActiveView("unpublishing")}>
                Open Archive Desk
              </Button>
            </div>
          </article>

          <article className="operations-overview__card">
            <span className="resource-control-panel__eyebrow">Archive Recovery</span>
            <h2>Review archived resources and restore approved material back toward public visibility.</h2>
            <p>
              Restoration completes the lifecycle by pulling archived resources from backend data and
              sending approved items back into the published pool.
            </p>
            <div className="operations-overview__actions">
              <Button variant="primary" onClick={() => setActiveView("restoration")}>
                Open Restoration Desk
              </Button>
            </div>
          </article>

        </div>
      )}

      {activeView === "unpublishing" && (
        <div className="resource-control-list">
          {isLoadingPublished && <p className="approval-panel__note">Loading published resources...</p>}
          {!isLoadingPublished && !effectiveErrorMessage && publishedResources.length === 0 && (
            <p className="approval-panel__note">No published resources match the current filters.</p>
          )}

          {!isLoadingPublished && !effectiveErrorMessage && publishedResources.map((resource) => {
            const isActive = resource.resourceId === selectedResourceId;

            return (
              <article
                key={resource.resourceId}
                className={`resource-control-card resource-control-card--stacked ${isActive ? "resource-control-card--active" : ""}`}
              >
                <div className="resource-control-card__trigger">
                  <div className="resource-control-card__meta">
                    <span className="audit-chip--status">{resource.status}</span>
                    {resource.categoryName && <span className="audit-chip">{resource.categoryName}</span>}
                    {resource.topic && <span className="audit-chip">{resource.topic}</span>}
                  </div>

                  <h2 className="resource-control-card__title">{resource.title}</h2>
                  <p className="resource-control-card__issue">
                    {resource.description || "No description provided for this resource."}
                  </p>

                  <div className="resource-control-card__facts resource-control-card__facts--wide">
                    <div>
                      <span>Contributor</span>
                      <strong>{resource.contributorName || "-"}</strong>
                    </div>
                    <div>
                      <span>Updated</span>
                      <strong>{formatDateTime(resource.updatedAt)}</strong>
                    </div>
                    <div>
                      <span>Visibility</span>
                      <strong>Public discovery</strong>
                    </div>
                    <div>
                      <span>Place</span>
                      <strong>{resource.placeName || "-"}</strong>
                    </div>
                  </div>

                  <div className="resource-control-card__footer">
                    <Button
                      variant={isActive ? "secondary" : "primary"}
                      onClick={() => setSelectedResourceId(isActive ? null : resource.resourceId)}
                    >
                      {isActive ? "Hide Details" : "Open Details"}
                    </Button>
                  </div>
                </div>

                {isActive && (
                  <div className="resource-control-card__expanded">
                    <div className="resource-control-card__expanded-grid">
                      <section className="audit-panel__card audit-panel__card--priority">
                        <div className="resource-control-panel__header">
                          <div>
                            <span className="resource-control-panel__eyebrow">Archive Candidate</span>
                            <h3 className="audit-panel__title">{resource.title}</h3>
                          </div>
                          <span className="resource-control-panel__badge">{resource.status}</span>
                        </div>

                        <p className="audit-panel__description">
                          Review the resource details below, then archive it if it should no longer remain public.
                        </p>

                        <div className="audit-detail-grid">
                          <div className="audit-detail-item">
                            <span className="audit-detail-item__label">Contributor</span>
                            <p className="audit-detail-item__value">{resource.contributorName || "-"}</p>
                          </div>
                          <div className="audit-detail-item">
                            <span className="audit-detail-item__label">Last Updated</span>
                            <p className="audit-detail-item__value">{formatDateTime(resource.updatedAt)}</p>
                          </div>
                          <div className="audit-detail-item">
                            <span className="audit-detail-item__label">Category</span>
                            <p className="audit-detail-item__value">{resource.categoryName || "-"}</p>
                          </div>
                          <div className="audit-detail-item">
                            <span className="audit-detail-item__label">Place</span>
                            <p className="audit-detail-item__value">{resource.placeName || "-"}</p>
                          </div>
                          <div className="audit-detail-item audit-detail-item--wide">
                            <span className="audit-detail-item__label">Description</span>
                            <p className="audit-detail-item__text">
                              {resource.description || "No description provided for this resource."}
                            </p>
                          </div>
                          <div className="audit-detail-item audit-detail-item--wide">
                            <span className="audit-detail-item__label">Tags</span>
                            <p className="audit-detail-item__text">
                              {resource.tags?.length ? resource.tags.join(", ") : "No tags assigned."}
                            </p>
                          </div>
                        </div>

                        <div className="resource-control-panel__field">
                          <label className="input-group__label" htmlFor={`archive-reason-${resource.resourceId}`}>
                            Archive Reason
                          </label>
                          <textarea
                            id={`archive-reason-${resource.resourceId}`}
                            className="resource-control-textarea"
                            value={archiveReason}
                            onChange={(event) => setArchiveReason(event.target.value)}
                            placeholder="Document the moderation rationale for moving this published resource into archive."
                          />
                        </div>

                        <div className="resource-control-panel__actions">
                          <Button
                            variant="danger"
                            onClick={handleArchive}
                            disabled={isArchiving || showAuthError || showRoleError}
                          >
                            {isArchiving ? "Archiving..." : "Archive Resource"}
                          </Button>
                        </div>
                      </section>

                      <section className="audit-panel__card">
                        <h3 className="audit-panel__title">Moderator Checklist</h3>
                        <div className="audit-checklist">
                          <div className="audit-checklist__item">
                            <h4>Published-State Control</h4>
                            <p>Only approved resources appear in this archive queue, which keeps the workflow focused on live content.</p>
                          </div>

                          <div className="audit-checklist__item">
                            <h4>Reason Capture</h4>
                            <p>Record enough context for later audit review and contributor follow-up before archiving the item.</p>
                          </div>

                          <div className="audit-checklist__item">
                            <h4>Lifecycle Sync</h4>
                            <p>Once archived, this resource leaves the published list and moves into the restoration queue.</p>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {activeView === "restoration" && (
        <div className="resource-control-list">
          {isLoadingArchived && <p className="approval-panel__note">Loading archived resources...</p>}
          {!isLoadingArchived && !effectiveErrorMessage && archivedResources.length === 0 && (
            <p className="approval-panel__note">No archived resources match the current filters.</p>
          )}

          {!isLoadingArchived && !effectiveErrorMessage && archivedResources.map((resource) => {
            const isActive = resource.resourceId === selectedArchiveId;

            return (
              <article
                key={resource.resourceId}
                className={`resource-control-card resource-control-card--stacked ${isActive ? "resource-control-card--active" : ""}`}
              >
                <div className="resource-control-card__trigger">
                  <div className="resource-control-card__meta">
                    <span className="audit-chip--status">{resource.status}</span>
                    {resource.categoryName && <span className="audit-chip">{resource.categoryName}</span>}
                  </div>

                  <h2 className="resource-control-card__title">{resource.title}</h2>
                  <p className="resource-control-card__issue">
                    {resource.description || "No description provided for this resource."}
                  </p>

                  <div className="resource-control-card__facts resource-control-card__facts--wide">
                    <div>
                      <span>Archived Queue</span>
                      <strong>{formatDateTime(resource.updatedAt)}</strong>
                    </div>
                    <div>
                      <span>Contributor</span>
                      <strong>{resource.contributorName || "-"}</strong>
                    </div>
                    <div>
                      <span>Storage</span>
                      <strong>Archive vault</strong>
                    </div>
                    <div>
                      <span>Category</span>
                      <strong>{resource.categoryName || "-"}</strong>
                    </div>
                  </div>

                  <div className="resource-control-card__footer">
                    <Button
                      variant={isActive ? "secondary" : "primary"}
                      onClick={() => setSelectedArchiveId(isActive ? null : resource.resourceId)}
                    >
                      {isActive ? "Hide Details" : "Open Details"}
                    </Button>
                  </div>
                </div>

                {isActive && (
                  <div className="resource-control-card__expanded">
                    <div className="resource-control-card__expanded-grid">
                      <section className="audit-panel__card audit-panel__card--priority">
                        <div className="resource-control-panel__header">
                          <div>
                            <span className="resource-control-panel__eyebrow">Archived Resource</span>
                            <h3 className="audit-panel__title">{resource.title}</h3>
                          </div>
                          <span className="resource-control-panel__badge">{resource.status}</span>
                        </div>

                        <p className="audit-panel__description">
                          Review the archived item below, then restore it if it is ready to return to public discovery.
                        </p>

                        <div className="audit-detail-grid">
                          <div className="audit-detail-item">
                            <span className="audit-detail-item__label">Archived Queue</span>
                            <p className="audit-detail-item__value">{formatDateTime(resource.updatedAt)}</p>
                          </div>
                          <div className="audit-detail-item">
                            <span className="audit-detail-item__label">Category</span>
                            <p className="audit-detail-item__value">{resource.categoryName || "-"}</p>
                          </div>
                          <div className="audit-detail-item">
                            <span className="audit-detail-item__label">Contributor</span>
                            <p className="audit-detail-item__value">{resource.contributorName || "-"}</p>
                          </div>
                          <div className="audit-detail-item">
                            <span className="audit-detail-item__label">Current Storage</span>
                            <p className="audit-detail-item__value">Archive vault</p>
                          </div>
                          <div className="audit-detail-item audit-detail-item--wide">
                            <span className="audit-detail-item__label">Description</span>
                            <p className="audit-detail-item__text">
                              {resource.description || "No description provided for this resource."}
                            </p>
                          </div>
                          <div className="audit-detail-item audit-detail-item--wide">
                            <span className="audit-detail-item__label">Tags</span>
                            <p className="audit-detail-item__text">
                              {resource.tags?.length ? resource.tags.join(", ") : "No tags assigned."}
                            </p>
                          </div>
                        </div>

                        <div className="resource-control-panel__field">
                          <label className="input-group__label" htmlFor={`restore-note-${resource.resourceId}`}>
                            Restoration Note
                          </label>
                          <textarea
                            id={`restore-note-${resource.resourceId}`}
                            className="resource-control-textarea"
                            value={restoreNote}
                            onChange={(event) => setRestoreNote(event.target.value)}
                            placeholder="Explain why this archived resource can safely return."
                          />
                        </div>

                        <div className="resource-control-panel__actions">
                          <Button
                            variant="primary"
                            onClick={handleRestore}
                            disabled={isRestoring || showAuthError || showRoleError}
                          >
                            {isRestoring ? "Restoring..." : "Restore Resource"}
                          </Button>
                        </div>
                      </section>

                      <section className="audit-panel__card">
                        <h3 className="audit-panel__title">Restoration Checklist</h3>
                        <div className="audit-checklist">
                          <div className="audit-checklist__item">
                            <h4>Cause Resolved</h4>
                            <p>Restore only when the archive issue has been resolved and the resource can safely re-enter public discovery.</p>
                          </div>

                          <div className="audit-checklist__item">
                            <h4>Published Return</h4>
                            <p>Successful restore moves the resource back into the published queue for normal platform visibility.</p>
                          </div>

                          <div className="audit-checklist__item">
                            <h4>Return Path Logged</h4>
                            <p>Keep a brief restoration note so later administrative review can explain why access was reopened.</p>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

    </AdminWorkspace>
  );
}

export default Archive;
