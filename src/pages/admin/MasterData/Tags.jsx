import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import { useAuth } from "../../../context/AuthContext";
import {
  createTag,
  deleteTag,
  fetchTags,
  updateTag,
} from "../../../services/adminService";
import AdminWorkspace from "../AdminWorkspace";
import "./MasterData.css";

function Tags() {
  const { token, isAuthenticated, user } = useAuth();
  const [tags, setTags] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagName, setTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const isAdmin = user?.role === "ADMIN_REVIEWER";
  const showAuthError = !isAuthenticated || !token;
  const showRoleError = isAuthenticated && Boolean(token) && !isAdmin;

  const loadTags = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await fetchTags();
      setTags(Array.isArray(result) ? result : []);
    } catch (error) {
      setTags([]);
      setErrorMessage(error.message || "Unable to load tags.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const filteredTags = useMemo(() => {
    const normalizedKeyword = appliedKeyword.trim().toLowerCase();
    return tags.filter((tag) => {
      const matchesKeyword = !normalizedKeyword || tag.name?.toLowerCase().includes(normalizedKeyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "in-use" && tag.inUse) ||
        (statusFilter === "available" && !tag.inUse);
      return matchesKeyword && matchesStatus;
    });
  }, [appliedKeyword, statusFilter, tags]);

  const summary = useMemo(
    () => ({
      total: tags.length,
      inUse: tags.filter((tag) => tag.inUse).length,
      available: tags.filter((tag) => !tag.inUse).length,
      linkedResources: tags.reduce((sum, tag) => sum + (tag.usageCount || 0), 0),
    }),
    [tags]
  );

  const resetForm = () => {
    setTagName("");
    setEditingTagId(null);
  };

  const handleSubmit = async () => {
    if (!tagName.trim()) {
      setErrorMessage("Tag name is required.");
      return;
    }
    if (showAuthError || showRoleError) {
      setErrorMessage("Please log in with an administrator account to manage tags.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      if (editingTagId) {
        await updateTag(editingTagId, { name: tagName.trim() }, token);
        setStatusMessage("Tag updated successfully.");
      } else {
        await createTag({ name: tagName.trim() }, token);
        setStatusMessage("Tag created successfully.");
      }
      resetForm();
      await loadTags();
    } catch (error) {
      setErrorMessage(error.message || "Unable to save this tag.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tag) => {
    if (showAuthError || showRoleError) {
      setErrorMessage("Please log in with an administrator account to manage tags.");
      return;
    }

    setStatusMessage("");
    setErrorMessage("");
    try {
      await deleteTag(tag.tagId, token);
      if (editingTagId === tag.tagId) {
        resetForm();
      }
      setStatusMessage(`Tag "${tag.name}" deleted successfully.`);
      await loadTags();
    } catch (error) {
      setErrorMessage(error.message || "Unable to delete this tag.");
    }
  };

  const effectiveErrorMessage = showAuthError
    ? "Please log in with an administrator account to manage tags."
    : showRoleError
    ? "Your account does not have administrator access to manage tags."
    : errorMessage;

  return (
    <AdminWorkspace
      eyebrow="Master Data"
      title="Tag Management"
      description="Manage the live tag vocabulary that contributors use as optional keywords and that resource review and discovery rely on for search relevance."
      actions={[
        { label: "Back to Dashboard", to: "/admin", variant: "secondary" },
        { label: "Open Categories", to: "/admin/master-data/categories", variant: "primary" },
      ]}
    >
      <div className="master-toolbar">
        <div className="master-toolbar__filters admin-panel">
          <Input
            id="tag-keyword"
            label="Keyword"
            placeholder="Search tag name"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
          />
          <div className="input-group">
            <label className="input-group__label" htmlFor="tag-status">
              Usage Status
            </label>
            <select
              id="tag-status"
              className="input-group__field"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Tags</option>
              <option value="in-use">In Use</option>
              <option value="available">Unused</option>
            </select>
          </div>
          <div className="master-toolbar__actions">
            <Button variant="primary" onClick={() => setAppliedKeyword(keywordInput)}>Apply Filters</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setKeywordInput("");
                setAppliedKeyword("");
                setStatusFilter("all");
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="master-toolbar__summary">
          <div className="master-summary-card">
            <span className="master-summary-card__label">Tags</span>
            <strong className="master-summary-card__value">{summary.total}</strong>
            <p className="master-summary-card__hint">Live descriptive tags available for contributor metadata.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">In Use</span>
            <strong className="master-summary-card__value">{summary.inUse}</strong>
            <p className="master-summary-card__hint">Tags currently linked to one or more resources.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">Unused</span>
            <strong className="master-summary-card__value">{summary.available}</strong>
            <p className="master-summary-card__hint">Tags that can be deleted safely without breaking resources.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">Linked Resources</span>
            <strong className="master-summary-card__value">{summary.linkedResources}</strong>
            <p className="master-summary-card__hint">Total resource references across the current tag vocabulary.</p>
          </div>
        </div>
      </div>

      {statusMessage && <p className="master-feedback-message master-feedback-message--success">{statusMessage}</p>}
      {effectiveErrorMessage && <p className="master-feedback-message master-feedback-message--error">{effectiveErrorMessage}</p>}
      {isLoading && <p className="master-feedback-message">Loading tags...</p>}

      <div className="master-layout">
        <div className="master-list">
          {!isLoading && filteredTags.length === 0 && (
            <div className="master-empty-state">
              <h3>No tags matched the current filters.</h3>
              <p>Create a tag or adjust the filters to continue.</p>
            </div>
          )}

          {!isLoading &&
            filteredTags.map((tag) => (
              <article key={tag.tagId} className="master-record">
                <div className="master-record__content">
                  <div className="master-record__meta">
                    <span className="master-chip--status">{tag.inUse ? "In Use" : "Available"}</span>
                    <span className="master-chip">{tag.usageCount} resources</span>
                  </div>
                  <h2 className="master-record__title">{tag.name}</h2>
                  <p className="master-record__subtitle">Controlled vocabulary entry for contributor metadata and search.</p>
                  <p className="master-record__description">
                    {tag.inUse
                      ? "This tag is already linked to resources and should be changed carefully."
                      : "This tag is not yet used by any resource and can be safely reorganized."}
                  </p>
                </div>

                <div className="master-record__facts">
                  <div className="master-record__fact">
                    <span>Usage</span>
                    <strong>{tag.usageCount} resources</strong>
                  </div>
                  <div className="master-record__fact">
                    <span>Delete Safety</span>
                    <strong>{tag.inUse ? "Protected while in use" : "Safe to remove"}</strong>
                  </div>
                  <div className="master-record__fact">
                    <span>Tag ID</span>
                    <strong>{tag.tagId}</strong>
                  </div>
                  <div className="master-record__actions">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEditingTagId(tag.tagId);
                        setTagName(tag.name || "");
                        setStatusMessage("");
                        setErrorMessage("");
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" disabled={tag.inUse} onClick={() => handleDelete(tag)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
        </div>

        <div className="master-detail">
          <section className="master-panel">
            <h3 className="master-panel__title">{editingTagId ? "Edit Tag" : "Create Tag"}</h3>
            <p className="master-panel__description">
              Tags are optional for contributors, but they improve review clarity and public search quality across approved resources.
            </p>
            <div className="master-form">
              <Input
                id="create-tag-name"
                label="Tag Name"
                placeholder="e.g. Community Ritual"
                value={tagName}
                onChange={(event) => setTagName(event.target.value)}
              />
              <div className="master-panel__actions">
                <Button variant="primary" onClick={handleSubmit} disabled={isSaving || showAuthError || showRoleError}>
                  {isSaving ? "Saving..." : editingTagId ? "Save Tag" : "Create Tag"}
                </Button>
                {editingTagId && (
                  <Button variant="secondary" onClick={resetForm} disabled={isSaving}>
                    Cancel Edit
                  </Button>
                )}
                <Link to="/admin/master-data/categories" className="admin-workspace__action-link">
                  <Button variant="secondary">Manage Categories</Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="master-panel">
            <h3 className="master-panel__title">Vocabulary Checks</h3>
            <div className="master-checklist">
              <div className="master-checklist__item">
                <h4>Contributor Suggestions</h4>
                <p>Saved tags immediately appear as suggested keywords in contributor create draft and resubmit forms.</p>
              </div>
              <div className="master-checklist__item">
                <h4>Delete Protection</h4>
                <p>Tags already linked to resources are protected from deletion until those references are removed.</p>
              </div>
              <div className="master-checklist__item">
                <h4>Search Relevance</h4>
                <p>Tags help keep review, discovery, and future analytics aligned around one controlled vocabulary.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}

export default Tags;
