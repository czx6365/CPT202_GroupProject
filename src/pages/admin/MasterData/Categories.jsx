import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import { useAuth } from "../../../context/AuthContext";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../../../services/adminService";
import AdminWorkspace from "../AdminWorkspace";
import "./MasterData.css";

const DEFAULT_FORM = {
  name: "",
  description: "",
};

function Categories() {
  const { token, isAuthenticated, user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const isAdmin = user?.role === "ADMIN_REVIEWER";
  const showAuthError = !isAuthenticated || !token;
  const showRoleError = isAuthenticated && Boolean(token) && !isAdmin;

  const loadCategories = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await fetchCategories();
      setCategories(Array.isArray(result) ? result : []);
    } catch (error) {
      setCategories([]);
      setErrorMessage(error.message || "Unable to load categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const normalizedKeyword = appliedKeyword.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesKeyword =
        !normalizedKeyword ||
        category.name?.toLowerCase().includes(normalizedKeyword) ||
        category.description?.toLowerCase().includes(normalizedKeyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "in-use" && category.inUse) ||
        (statusFilter === "available" && !category.inUse);
      return matchesKeyword && matchesStatus;
    });
  }, [appliedKeyword, categories, statusFilter]);

  const summary = useMemo(
    () => ({
      total: categories.length,
      inUse: categories.filter((category) => category.inUse).length,
      available: categories.filter((category) => !category.inUse).length,
      linkedResources: categories.reduce((sum, category) => sum + (category.usageCount || 0), 0),
    }),
    [categories]
  );

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingCategoryId(null);
  };

  const handleEdit = (category) => {
    setEditingCategoryId(category.categoryId);
    setForm({
      name: category.name || "",
      description: category.description || "",
    });
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setErrorMessage("Category name is required.");
      return;
    }
    if (showAuthError || showRoleError) {
      setErrorMessage("Please log in with an administrator account to manage categories.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
      };
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload, token);
        setStatusMessage("Category updated successfully.");
      } else {
        await createCategory(payload, token);
        setStatusMessage("Category created successfully.");
      }
      resetForm();
      await loadCategories();
    } catch (error) {
      setErrorMessage(error.message || "Unable to save this category.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (showAuthError || showRoleError) {
      setErrorMessage("Please log in with an administrator account to manage categories.");
      return;
    }

    setStatusMessage("");
    setErrorMessage("");
    try {
      await deleteCategory(category.categoryId, token);
      if (editingCategoryId === category.categoryId) {
        resetForm();
      }
      setStatusMessage(`Category "${category.name}" deleted successfully.`);
      await loadCategories();
    } catch (error) {
      setErrorMessage(error.message || "Unable to delete this category.");
    }
  };

  const effectiveErrorMessage = showAuthError
    ? "Please log in with an administrator account to manage categories."
    : showRoleError
    ? "Your account does not have administrator access to manage categories."
    : errorMessage;

  return (
    <AdminWorkspace
      eyebrow="Master Data"
      title="Category Management"
      description="Manage the live category taxonomy that contributor submission, admin review, and resource discovery all share."
      actions={[
        { label: "Back to Dashboard", to: "/admin", variant: "secondary" },
        { label: "Open Tags", to: "/admin/master-data/tags", variant: "primary" },
      ]}
    >
      <div className="master-toolbar">
        <div className="master-toolbar__filters admin-panel">
          <Input
            id="category-keyword"
            label="Keyword"
            placeholder="Search category name or description"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
          />
          <div className="input-group">
            <label className="input-group__label" htmlFor="category-status">
              Usage Status
            </label>
            <select
              id="category-status"
              className="input-group__field"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Categories</option>
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
            <span className="master-summary-card__label">Categories</span>
            <strong className="master-summary-card__value">{summary.total}</strong>
            <p className="master-summary-card__hint">Live categories currently available for resource filing.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">In Use</span>
            <strong className="master-summary-card__value">{summary.inUse}</strong>
            <p className="master-summary-card__hint">Categories already linked to at least one resource.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">Unused</span>
            <strong className="master-summary-card__value">{summary.available}</strong>
            <p className="master-summary-card__hint">Categories that can be safely removed or renamed.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">Linked Resources</span>
            <strong className="master-summary-card__value">{summary.linkedResources}</strong>
            <p className="master-summary-card__hint">Total resource references across the current category list.</p>
          </div>
        </div>
      </div>

      {statusMessage && <p className="master-feedback-message master-feedback-message--success">{statusMessage}</p>}
      {effectiveErrorMessage && <p className="master-feedback-message master-feedback-message--error">{effectiveErrorMessage}</p>}
      {isLoading && <p className="master-feedback-message">Loading categories...</p>}

      <div className="master-layout">
        <div className="master-list">
          {!isLoading && filteredCategories.length === 0 && (
            <div className="master-empty-state">
              <h3>No categories matched the current filters.</h3>
              <p>Create a category or adjust the filters to continue.</p>
            </div>
          )}

          {!isLoading &&
            filteredCategories.map((category) => (
              <article key={category.categoryId} className="master-record">
                <div className="master-record__content">
                  <div className="master-record__meta">
                    <span className="master-chip--status">{category.inUse ? "In Use" : "Available"}</span>
                    <span className="master-chip">{category.usageCount} resources</span>
                  </div>
                  <h2 className="master-record__title">{category.name}</h2>
                  <p className="master-record__subtitle">Classification bucket for contributor submissions.</p>
                  <p className="master-record__description">
                    {category.description || "No category description has been provided yet."}
                  </p>
                </div>

                <div className="master-record__facts">
                  <div className="master-record__fact">
                    <span>Usage</span>
                    <strong>{category.usageCount} resources</strong>
                  </div>
                  <div className="master-record__fact">
                    <span>Delete Safety</span>
                    <strong>{category.inUse ? "Protected while in use" : "Safe to remove"}</strong>
                  </div>
                  <div className="master-record__fact">
                    <span>Category ID</span>
                    <strong>{category.categoryId}</strong>
                  </div>
                  <div className="master-record__actions">
                    <Button variant="primary" onClick={() => handleEdit(category)}>Edit</Button>
                    <Button variant="danger" disabled={category.inUse} onClick={() => handleDelete(category)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
        </div>

        <div className="master-detail">
          <section className="master-panel">
            <h3 className="master-panel__title">{editingCategoryId ? "Edit Category" : "Create Category"}</h3>
            <p className="master-panel__description">
              Manage the live category vocabulary that contributors see in the submission form and that reviewers rely on in the moderation queue.
            </p>
            <div className="master-form">
              <Input
                id="create-category-name"
                label="Category Name"
                placeholder="e.g. Ancient Architecture"
                value={form.name}
                onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
              />
              <div className="input-group">
                <label className="input-group__label" htmlFor="create-category-description">
                  Description
                </label>
                <textarea
                  id="create-category-description"
                  className="master-textarea"
                  placeholder="Describe what type of heritage resources belong in this category."
                  value={form.description}
                  onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                />
              </div>
              <div className="master-panel__actions">
                <Button variant="primary" onClick={handleSubmit} disabled={isSaving || showAuthError || showRoleError}>
                  {isSaving ? "Saving..." : editingCategoryId ? "Save Category" : "Create Category"}
                </Button>
                {editingCategoryId && (
                  <Button variant="secondary" onClick={resetForm} disabled={isSaving}>
                    Cancel Edit
                  </Button>
                )}
                <Link to="/admin/master-data/tags" className="admin-workspace__action-link">
                  <Button variant="secondary">Manage Tags</Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="master-panel">
            <h3 className="master-panel__title">Governance Notes</h3>
            <div className="master-checklist">
              <div className="master-checklist__item">
                <h4>Contributor Form Impact</h4>
                <p>Every saved category appears in contributor create draft, edit draft, and resubmit flows.</p>
              </div>
              <div className="master-checklist__item">
                <h4>Delete Protection</h4>
                <p>Categories already linked to resources are protected from deletion until those references are removed.</p>
              </div>
              <div className="master-checklist__item">
                <h4>Review Consistency</h4>
                <p>Review Queue and public discovery use the same category vocabulary, so naming changes ripple across the platform.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}

export default Categories;
