import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/Button/Button";
import { useAuth } from "../../../context/AuthContext";
import { fetchReviewDetail, submitReviewDecision } from "../../../services/adminService";
import AdminWorkspace from "../AdminWorkspace";
import "./Review.css";

function ReviewDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token, isAuthenticated, user } = useAuth();
  const [resource, setResource] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isAdmin = user?.role === "ADMIN_REVIEWER";
  const showAuthError = !isAuthenticated || !token;
  const showRoleError = isAuthenticated && Boolean(token) && !isAdmin;

  useEffect(() => {
    const loadResource = async () => {
      if (!token) {
        setErrorMessage("Please log in with an administrator account to review this submission.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchReviewDetail(id, token);
        setResource(result);
        setFeedback(result?.reviewerFeedback || "");
      } catch (error) {
        setResource(null);
        setErrorMessage(error.message || "Unable to load this resource for review.");
      } finally {
        setIsLoading(false);
      }
    };

    loadResource();
  }, [id, token]);

  const handleDecision = async (decision) => {
    if (!resource || !token) return;
    if (decision === "REJECT" && !feedback.trim()) {
      setErrorMessage("Reviewer feedback is required when rejecting a resource.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await submitReviewDecision(
        resource.resourceId,
        {
          decision,
          feedback: feedback.trim() || null,
        },
        token
      );
      navigate("/admin/review", {
        replace: true,
        state: {
          message: `${resource.title} was ${decision === "APPROVE" ? "approved" : "rejected"} successfully.`,
        },
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to submit this review decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveErrorMessage = showAuthError
    ? "Please log in with an administrator account to review this submission."
    : showRoleError
    ? "Your account does not have administrator access to review this submission."
    : errorMessage;

  return (
    <AdminWorkspace
      eyebrow="Review Detail"
      title={`Submission Workspace: ${id}`}
      description="Inspect the full heritage submission before making a moderation decision. This workspace now reflects the live review flow for contributor resources."
      actions={[{ label: "Back to Review Queue", to: "/admin/review", variant: "secondary" }]}
    >
      <div className="admin-breadcrumbs">
        <Link to="/admin" className="admin-breadcrumbs__link">
          Admin
        </Link>
        <Link to="/admin/review" className="admin-breadcrumbs__link">
          Review Queue
        </Link>
        <span className="admin-breadcrumbs__current">{id}</span>
      </div>

      {effectiveErrorMessage && <p className="review-feedback-message review-feedback-message--error">{effectiveErrorMessage}</p>}
      {isLoading && <p className="review-feedback-message">Loading review detail...</p>}

      {!isLoading && resource && (
        <div className="review-detail-layout">
          <div className="review-detail-main">
            <section className="review-meta-card">
              <div className="review-meta-card__header">
                <div>
                  <div className="review-list-card__meta">
                    <span className="review-chip--status">{formatStatus(resource.status)}</span>
                    {resource.categoryName && <span className="review-chip">{resource.categoryName}</span>}
                    {resource.placeName && <span className="review-chip">{resource.placeName}</span>}
                  </div>
                  <h2 className="review-meta-card__title">{resource.title}</h2>
                  <p className="review-meta-card__subtitle">{resource.topic || "Topic not available."}</p>
                </div>
              </div>

              <div className="review-data-grid">
                <div className="review-data-item">
                  <span className="review-data-item__label">Contributor</span>
                  <p className="review-data-item__value">{resource.contributorName || "Unknown contributor"}</p>
                </div>

                <div className="review-data-item">
                  <span className="review-data-item__label">Submitted At</span>
                  <p className="review-data-item__value">{formatDate(resource.createdAt)}</p>
                </div>

                <div className="review-data-item">
                  <span className="review-data-item__label">Reviewed At</span>
                  <p className="review-data-item__value">{formatDate(resource.reviewedAt)}</p>
                </div>

                <div className="review-data-item">
                  <span className="review-data-item__label">Updated At</span>
                  <p className="review-data-item__value">{formatDate(resource.updatedAt)}</p>
                </div>

                <div className="review-data-item review-data-item--full">
                  <span className="review-data-item__label">Description</span>
                  <p className="review-data-item__text">{resource.description || "No description provided."}</p>
                </div>

                <div className="review-data-item review-data-item--full">
                  <span className="review-data-item__label">Tags</span>
                  <div className="review-tag-list">
                    {(resource.tags || []).length > 0 ? (
                      Array.from(resource.tags).map((tag) => (
                        <span key={tag} className="review-chip">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="review-data-item__text">No tags provided.</p>
                    )}
                  </div>
                </div>

                <div className="review-data-item review-data-item--full">
                  <span className="review-data-item__label">Copyright Declaration</span>
                  <p className="review-data-item__text">{resource.copyrightDeclaration || "No rights declaration provided."}</p>
                </div>
              </div>
            </section>

            <section className="review-meta-card">
              <h3 className="admin-panel__title">Attached Review Materials</h3>
              <div className="review-artifact-list">
                <div className="review-artifact">
                  <h4 className="review-artifact__title">File URL</h4>
                  <p className="review-artifact__text">{resource.fileUrl || "No file URL provided."}</p>
                </div>

                <div className="review-artifact">
                  <h4 className="review-artifact__title">External Reference Link</h4>
                  <p className="review-artifact__text">{resource.externalLink || "No external link provided."}</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="review-detail-side">
            <section className="review-decision-card">
              <h3 className="review-decision-card__title">Decision Controls</h3>
              <p className="review-decision-card__description">
                Approve this submission to publish it, or reject it with clear reviewer feedback so the contributor can revise and resubmit.
              </p>

              <div className="review-decision-card__section">
                <span className="review-decision-card__section-label">Reviewer Feedback</span>
                <textarea
                  className="review-feedback"
                  placeholder="Provide approval notes or explain the changes required before publication."
                  value={feedback}
                  onChange={(event) => {
                    setFeedback(event.target.value);
                    setErrorMessage("");
                  }}
                  disabled={isSubmitting || showAuthError || showRoleError}
                />
              </div>

              <div className="review-decision-card__actions">
                <Button
                  variant="primary"
                  onClick={() => handleDecision("APPROVE")}
                  disabled={isSubmitting || !resource || showAuthError || showRoleError}
                >
                  {isSubmitting ? "Submitting..." : "Approve"}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDecision("REJECT")}
                  disabled={isSubmitting || !resource || showAuthError || showRoleError}
                >
                  {isSubmitting ? "Submitting..." : "Reject"}
                </Button>
              </div>

              <p className="review-decision-card__note">
                Reject requires feedback. The saved reviewer note becomes visible to the contributor on rejected resources.
              </p>
            </section>

            <section className="review-decision-card">
              <h3 className="review-decision-card__title">Review Checklist</h3>
              <p className="review-decision-card__description">
                Use these live checks before approving a contributor submission for publication.
              </p>

              <div className="review-artifact-list">
                <div className="review-artifact">
                  <h4 className="review-artifact__title">Metadata Completeness</h4>
                  <p className="review-artifact__text">{getMetadataStatus(resource)}</p>
                </div>

                <div className="review-artifact">
                  <h4 className="review-artifact__title">Publication Readiness</h4>
                  <p className="review-artifact__text">
                    {resource.tags?.length ? "Tags and classification are present for moderation." : "Add tags or metadata guidance before approval if needed."}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}
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

function getMetadataStatus(resource) {
  if (resource.title && resource.placeName && resource.description && resource.categoryName) {
    return "Title, place, description, and category are all present.";
  }
  return "Some core metadata fields are still missing.";
}

export default ReviewDetail;
