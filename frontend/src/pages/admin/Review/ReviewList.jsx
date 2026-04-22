import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import { useAuth } from "../../../context/AuthContext";
import { fetchCategories, fetchPendingReviews } from "../../../services/adminService";
import AdminWorkspace from "../AdminWorkspace";
import "./Review.css";

const DEFAULT_STATUS = "PENDING_REVIEW";

function ReviewList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(location.state?.message || "");

  const isAdmin = user?.role === "ADMIN_REVIEWER";
  const showAuthError = !isAuthenticated || !token;
  const showRoleError = isAuthenticated && Boolean(token) && !isAdmin;

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await fetchCategories();
        setCategories(Array.isArray(result) ? result : []);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadReviewQueue = async () => {
      if (!token) {
        setResources([]);
        setErrorMessage("Please log in with an administrator account to review resource submissions.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchPendingReviews(
          {
            keyword: appliedKeyword,
            categoryId: categoryFilter || undefined,
            status: statusFilter || undefined,
            size: 100,
          },
          token
        );
        setResources(Array.isArray(result?.content) ? result.content : []);
      } catch (error) {
        setResources([]);
        setErrorMessage(error.message || "Unable to load the review queue.");
      } finally {
        setIsLoading(false);
      }
    };

    loadReviewQueue();
  }, [appliedKeyword, categoryFilter, statusFilter, token]);

  const effectiveErrorMessage = showAuthError
    ? "Please log in with an administrator account to review resource submissions."
    : showRoleError
    ? "Your account does not have administrator access to review resource submissions."
    : errorMessage;

  const reviewSummary = useMemo(() => {
    const uniqueContributors = new Set(resources.map((item) => item.contributorId).filter(Boolean)).size;
    const oldestPendingHours = resources.reduce((maxHours, item) => {
      const reference = item.createdAt || item.updatedAt;
      if (!reference) return maxHours;
      const diffMs = Date.now() - new Date(reference).getTime();
      if (Number.isNaN(diffMs)) return maxHours;
      return Math.max(maxHours, Math.floor(diffMs / (1000 * 60 * 60)));
    }, 0);

    return {
      queueSize: resources.length,
      contributorCount: uniqueContributors,
      oldestPending: oldestPendingHours,
      readyToday: resources.filter((item) => item.categoryName && item.placeName && item.title).length,
    };
  }, [resources]);

  const applyFilters = () => {
    setAppliedKeyword(keywordInput);
    setSuccessMessage("");
  };

  const resetFilters = () => {
    setKeywordInput("");
    setAppliedKeyword("");
    setStatusFilter(DEFAULT_STATUS);
    setCategoryFilter("");
    setSuccessMessage("");
  };

  return (
    <AdminWorkspace
      eyebrow="Review Workflow"
      title="Review Queue"
      description="Review incoming heritage submissions before publication. Pending resources now come from the live moderation API and flow directly into the decision workspace."
      actions={[{ label: "Back to Dashboard", to: "/admin", variant: "secondary" }]}
    >
      <div className="review-toolbar">
        <div className="review-toolbar__filters admin-panel">
          <Input
            id="review-keyword"
            label="Keyword"
            placeholder="Search title, description, or place"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            disabled={showAuthError || showRoleError}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="review-status">
              Status
            </label>
            <select
              id="review-status"
              className="input-group__field"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              disabled={showAuthError || showRoleError}
            >
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="REJECTED">Rejected</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-group__label" htmlFor="review-category">
              Category
            </label>
            <select
              id="review-category"
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

          <div className="review-toolbar__actions">
            <Button variant="primary" onClick={applyFilters} disabled={showAuthError || showRoleError}>Apply Filters</Button>
            <Button variant="secondary" onClick={resetFilters} disabled={showAuthError || showRoleError}>Reset</Button>
          </div>
        </div>

        <div className="review-toolbar__summary">
          <div className="review-summary-card">
            <span className="review-summary-card__label">Queue Size</span>
            <strong className="review-summary-card__value">{reviewSummary.queueSize}</strong>
            <p className="review-summary-card__hint">Resources currently returned by the live moderation query.</p>
          </div>
          <div className="review-summary-card">
            <span className="review-summary-card__label">Contributors</span>
            <strong className="review-summary-card__value">{reviewSummary.contributorCount}</strong>
            <p className="review-summary-card__hint">Distinct contributors represented in the current queue.</p>
          </div>
          <div className="review-summary-card">
            <span className="review-summary-card__label">Oldest Pending</span>
            <strong className="review-summary-card__value">{reviewSummary.oldestPending}h</strong>
            <p className="review-summary-card__hint">Elapsed time since the oldest returned submission was created.</p>
          </div>
          <div className="review-summary-card">
            <span className="review-summary-card__label">Ready Today</span>
            <strong className="review-summary-card__value">{reviewSummary.readyToday}</strong>
            <p className="review-summary-card__hint">Items with the core metadata fields needed for a live decision.</p>
          </div>
        </div>
      </div>

      {effectiveErrorMessage && <p className="review-feedback-message review-feedback-message--error">{effectiveErrorMessage}</p>}
      {successMessage && <p className="review-feedback-message review-feedback-message--success">{successMessage}</p>}
      {isLoading && <p className="review-feedback-message">Loading review queue...</p>}

      {!isLoading && !effectiveErrorMessage && resources.length === 0 && (
        <p className="review-feedback-message">No resource submissions matched the current moderation filters.</p>
      )}

      <div className="review-list">
        {!isLoading && !effectiveErrorMessage && resources.map((item) => (
          <article key={item.resourceId} className="review-list-card">
            <div className="review-list-card__content">
              <div className="review-list-card__meta">
                <span className="review-chip--status">{formatStatus(item.status)}</span>
                {item.categoryName && <span className="review-chip">{item.categoryName}</span>}
                {item.placeName && <span className="review-chip">{item.placeName}</span>}
              </div>

              <h2 className="review-list-card__title">{item.title}</h2>
              <p className="review-list-card__topic">{item.topic || "Topic not available."}</p>
              <p className="review-list-card__description">
                {item.description || "Detailed submission description will appear in the review workspace."}
              </p>
            </div>

            <div className="review-list-card__details">
              <div className="review-list-card__detail-row">
                <span>Contributor</span>
                <strong>{item.contributorName || "Unknown contributor"}</strong>
              </div>
              <div className="review-list-card__detail-row">
                <span>Submitted</span>
                <strong>{formatDate(item.createdAt || item.updatedAt)}</strong>
              </div>
              <div className="review-list-card__detail-row">
                <span>Place</span>
                <strong>{item.placeName || "Not provided"}</strong>
              </div>
              <div className="review-list-card__detail-row">
                <span>Review Readiness</span>
                <strong>{getReadinessLabel(item)}</strong>
              </div>

              <div className="review-list-card__footer">
                <Link to={`/admin/review/${item.resourceId}`} className="review-list-card__link">
                  <Button variant="primary">View Details</Button>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminWorkspace>
  );
}

function formatStatus(status) {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function getReadinessLabel(resource) {
  return resource.categoryName && resource.placeName && resource.title ? "Metadata Complete" : "Needs Metadata";
}

export default ReviewList;
