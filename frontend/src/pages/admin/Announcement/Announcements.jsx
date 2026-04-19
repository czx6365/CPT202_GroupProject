import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import { useAuth } from "../../../context/AuthContext";
import {
  createAnnouncement,
  fetchAnnouncements,
  updateAnnouncement,
  updateAnnouncementStatus,
} from "../../../services/adminService";
import AdminWorkspace from "../AdminWorkspace";
import "./Announcements.css";

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatStatus(value) {
  if (!value) return "Unknown";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const EMPTY_FORM = {
  title: "",
  audience: "ALL_USERS",
  content: "",
};

function Announcements() {
  const { token, isAuthenticated, user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isAdmin = user?.role === "ADMIN_REVIEWER";
  const showAuthError = !isAuthenticated || !token;
  const showRoleError = isAuthenticated && Boolean(token) && !isAdmin;

  const loadAnnouncements = async () => {
    if (!token) {
      setAnnouncements([]);
      setSelectedAnnouncementId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await fetchAnnouncements(
        {
          keyword: appliedKeyword,
          status: statusFilter || undefined,
          audience: audienceFilter || undefined,
        },
        token
      );
      const items = Array.isArray(result) ? result : [];
      setAnnouncements(items);
      setSelectedAnnouncementId((previous) => (
        items.some((item) => item.announcementId === previous) ? previous : (items[0]?.announcementId || null)
      ));
    } catch (error) {
      setAnnouncements([]);
      setSelectedAnnouncementId(null);
      setErrorMessage(error.message || "Unable to load announcements.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showAuthError || showRoleError) {
      setAnnouncements([]);
      setSelectedAnnouncementId(null);
      setIsLoading(false);
      return;
    }

    loadAnnouncements();
  }, [token, appliedKeyword, statusFilter, audienceFilter, showAuthError, showRoleError]);

  const selectedAnnouncement = useMemo(
    () => announcements.find((item) => item.announcementId === selectedAnnouncementId) || null,
    [announcements, selectedAnnouncementId]
  );

  useEffect(() => {
    if (selectedAnnouncement && !isCreatingNew) {
      setFormState({
        title: selectedAnnouncement.title || "",
        audience: selectedAnnouncement.audience || "ALL_USERS",
        content: selectedAnnouncement.content || "",
      });
    }
  }, [selectedAnnouncement, isCreatingNew]);

  const summary = useMemo(() => ({
    published: announcements.filter((item) => item.status === "PUBLISHED").length,
    drafts: announcements.filter((item) => item.status === "DRAFT").length,
    archived: announcements.filter((item) => item.status === "ARCHIVED").length,
  }), [announcements]);

  const effectiveErrorMessage = showAuthError
    ? "Please log in with an administrator account to manage system announcements."
    : showRoleError
    ? "Your account does not have administrator access to manage announcements."
    : errorMessage;

  const applyFilters = () => {
    setAppliedKeyword(keywordInput);
    setSuccessMessage("");
  };

  const resetFilters = () => {
    setKeywordInput("");
    setAppliedKeyword("");
    setStatusFilter("");
    setAudienceFilter("");
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSelectAnnouncement = (announcementId) => {
    setSelectedAnnouncementId(announcementId);
    setIsCreatingNew(false);
    setSuccessMessage("");
  };

  const handleCreateMode = () => {
    setIsCreatingNew(true);
    setSelectedAnnouncementId(null);
    setFormState(EMPTY_FORM);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSave = async (nextStatus = null) => {
    if (!token) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let savedAnnouncement;

      if (isCreatingNew || !selectedAnnouncement) {
        savedAnnouncement = await createAnnouncement(formState, token);
        if (nextStatus && nextStatus !== savedAnnouncement.status) {
          savedAnnouncement = await updateAnnouncementStatus(savedAnnouncement.announcementId, nextStatus, token);
        }
        setSuccessMessage(nextStatus === "PUBLISHED"
          ? "Created and published announcement."
          : "Saved announcement draft.");
      } else {
        savedAnnouncement = await updateAnnouncement(selectedAnnouncement.announcementId, formState, token);
        if (nextStatus && nextStatus !== savedAnnouncement.status) {
          savedAnnouncement = await updateAnnouncementStatus(savedAnnouncement.announcementId, nextStatus, token);
        }
        setSuccessMessage(nextStatus === "PUBLISHED"
          ? "Updated and published announcement."
          : "Updated announcement.");
      }

      await loadAnnouncements();
      setSelectedAnnouncementId(savedAnnouncement.announcementId);
      setIsCreatingNew(false);
    } catch (error) {
      setErrorMessage(error.message || "Unable to save announcement.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!selectedAnnouncement || !token) return;

    setIsUpdatingStatus(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updated = await updateAnnouncementStatus(selectedAnnouncement.announcementId, nextStatus, token);
      setSuccessMessage(`Announcement marked as ${formatStatus(updated.status)}.`);
      await loadAnnouncements();
      setSelectedAnnouncementId(updated.announcementId);
    } catch (error) {
      setErrorMessage(error.message || "Unable to update announcement status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <AdminWorkspace
      eyebrow="Announcements"
      title="System Announcements"
      description="Prepare, publish, and retire platform-wide notices from one administrator workspace."
      actions={[{ label: "Back to Dashboard", to: "/admin", variant: "secondary" }]}
    >
      <div className="announcement-toolbar">
        <div className="announcement-toolbar__filters admin-panel">
          <Input
            id="announcement-keyword"
            label="Keyword"
            placeholder="Search title or message content"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            disabled={showAuthError || showRoleError}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="announcement-status">
              Status
            </label>
            <select
              id="announcement-status"
              className="input-group__field"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              disabled={showAuthError || showRoleError}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-group__label" htmlFor="announcement-audience">
              Audience
            </label>
            <select
              id="announcement-audience"
              className="input-group__field"
              value={audienceFilter}
              onChange={(event) => setAudienceFilter(event.target.value)}
              disabled={showAuthError || showRoleError}
            >
              <option value="">All Audiences</option>
              <option value="PUBLIC">Public</option>
              <option value="CONTRIBUTORS">Contributors</option>
              <option value="ALL_USERS">All Users</option>
            </select>
          </div>

          <div className="announcement-toolbar__actions">
            <Button variant="primary" onClick={applyFilters} disabled={showAuthError || showRoleError}>Apply Filters</Button>
            <Button variant="secondary" onClick={resetFilters} disabled={showAuthError || showRoleError}>Reset</Button>
          </div>
        </div>

        <div className="announcement-toolbar__summary">
          <div className="announcement-summary-card">
            <span className="announcement-summary-card__label">Published</span>
            <strong className="announcement-summary-card__value">{summary.published}</strong>
            <p className="announcement-summary-card__hint">Active notices currently prepared for platform display.</p>
          </div>
          <div className="announcement-summary-card">
            <span className="announcement-summary-card__label">Drafts</span>
            <strong className="announcement-summary-card__value">{summary.drafts}</strong>
            <p className="announcement-summary-card__hint">Messages still waiting for editorial review or release timing.</p>
          </div>
          <div className="announcement-summary-card">
            <span className="announcement-summary-card__label">Archived</span>
            <strong className="announcement-summary-card__value">{summary.archived}</strong>
            <p className="announcement-summary-card__hint">Past notices retained in the management history for reference.</p>
          </div>
        </div>
      </div>

      {effectiveErrorMessage && <p className="review-feedback-message review-feedback-message--error">{effectiveErrorMessage}</p>}
      {successMessage && <p className="review-feedback-message review-feedback-message--success">{successMessage}</p>}
      {isLoading && <p className="review-feedback-message">Loading announcements...</p>}

      <div className="announcement-layout">
        <div className="announcement-list">
          <article className="announcement-card announcement-card--new">
            <div className="announcement-card__actions">
              <Button variant="primary" onClick={handleCreateMode} disabled={showAuthError || showRoleError}>
                Create New Notice
              </Button>
            </div>
          </article>

          {!isLoading && !effectiveErrorMessage && announcements.length === 0 && (
            <article className="announcement-card">
              <p className="announcement-card__summary">No announcements matched the current filters.</p>
            </article>
          )}

          {!isLoading && !effectiveErrorMessage && announcements.map((item) => (
            <article
              key={item.announcementId}
              className={`announcement-card ${selectedAnnouncement?.announcementId === item.announcementId && !isCreatingNew ? "announcement-card--active" : ""}`}
            >
              <div className="announcement-card__meta">
                <span className="announcement-chip--status">{formatStatus(item.status)}</span>
                <span className="announcement-chip">{formatStatus(item.audience)}</span>
              </div>

              <h2 className="announcement-card__title">{item.title}</h2>
              <p className="announcement-card__summary">{item.content}</p>

              <div className="announcement-card__facts">
                <div>
                  <span>Updated</span>
                  <strong>{formatDateTime(item.updatedAt)}</strong>
                </div>
                <div>
                  <span>Created By</span>
                  <strong>{item.createdByName || "-"}</strong>
                </div>
              </div>

              <div className="announcement-card__actions">
                <Button variant="primary" onClick={() => handleSelectAnnouncement(item.announcementId)}>
                  Open Notice
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="announcement-side">
          <section className="announcement-panel">
            <h3 className="announcement-panel__title">{isCreatingNew ? "Create Announcement" : "Edit Announcement"}</h3>
            <p className="announcement-panel__description">
              Draft a new system notice for platform maintenance, policy updates, or public communication.
            </p>

            <div className="announcement-form">
              <Input
                id="announcement-title"
                label="Title"
                placeholder="e.g. Scheduled maintenance notice"
                value={formState.title}
                onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
              />

              <div className="input-group">
                <label className="input-group__label" htmlFor="announcement-target">
                  Audience
                </label>
                <select
                  id="announcement-target"
                  className="input-group__field"
                  value={formState.audience}
                  onChange={(event) => setFormState((current) => ({ ...current, audience: event.target.value }))}
                >
                  <option value="ALL_USERS">All Users</option>
                  <option value="PUBLIC">Public</option>
                  <option value="CONTRIBUTORS">Contributors</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-group__label" htmlFor="announcement-body">
                  Message
                </label>
                <textarea
                  id="announcement-body"
                  className="announcement-textarea"
                  placeholder="Write the announcement body that will later be shown in the public experience."
                  value={formState.content}
                  onChange={(event) => setFormState((current) => ({ ...current, content: event.target.value }))}
                />
              </div>

              <div className="announcement-form__actions">
                <Button variant="primary" onClick={() => handleSave("DRAFT")} disabled={isSaving || showAuthError || showRoleError}>
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                <Button variant="secondary" onClick={() => handleSave("PUBLISHED")} disabled={isSaving || showAuthError || showRoleError}>
                  {isSaving ? "Saving..." : "Publish Notice"}
                </Button>
              </div>
            </div>
          </section>

          <section className="announcement-panel">
            <h3 className="announcement-panel__title">Selected Notice</h3>
            <p className="announcement-panel__description">
              Review the currently selected announcement and change its publication state when needed.
            </p>

            {selectedAnnouncement ? (
              <div className="announcement-preview">
                <span className="announcement-chip--status">{formatStatus(selectedAnnouncement.status)}</span>
                <h4>{selectedAnnouncement.title}</h4>
                <p>{selectedAnnouncement.content}</p>

                <div className="announcement-preview__facts">
                  <div>
                    <span>Audience</span>
                    <strong>{formatStatus(selectedAnnouncement.audience)}</strong>
                  </div>
                  <div>
                    <span>Updated</span>
                    <strong>{formatDateTime(selectedAnnouncement.updatedAt)}</strong>
                  </div>
                </div>

                <div className="announcement-form__actions">
                  <Button
                    variant="secondary"
                    onClick={() => handleStatusChange("ARCHIVED")}
                    disabled={isUpdatingStatus || showAuthError || showRoleError}
                  >
                    {isUpdatingStatus ? "Updating..." : "Archive Notice"}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleStatusChange("PUBLISHED")}
                    disabled={isUpdatingStatus || showAuthError || showRoleError}
                  >
                    {isUpdatingStatus ? "Updating..." : "Republish"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="announcement-preview">
                <p>Select an announcement card to review its current state.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}

export default Announcements;
