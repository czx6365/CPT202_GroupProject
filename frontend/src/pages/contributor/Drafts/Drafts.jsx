import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import { useAuth } from "../../../context/AuthContext";
import { deleteDraft, fetchMyResources, submitResourceForReview } from "../../../services/resourceService";
import {
  deleteMockContributorDraft,
  getMockContributorResources,
  submitMockContributorResource,
} from "../mockContributorData";
import { formatContributorStatus, getDraftReadiness } from "../resourceStatus";
import {
  applyContributorNotice,
  applyStoredContributorNotice,
  consumeContributorNotice,
} from "../actionNotice";
import ContributorWorkspace from "../ContributorWorkspace";
import "./Drafts.css";

function Drafts() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [draftToDelete, setDraftToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const notice = consumeContributorNotice();
    applyStoredContributorNotice(notice, setStatusMessage, setErrorMessage);
  }, []);

  useEffect(() => {
    const loadDrafts = async () => {
      if (!token) {
        setResources(getMockContributorResources().filter((item) => item.status === "DRAFT"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchMyResources(token);
        const allResources = Array.isArray(result) ? result : [];
        setResources(allResources.filter((item) => item.status === "DRAFT"));
      } catch (error) {
        setResources([]);
        setErrorMessage(error.message || "Unable to load your live drafts right now.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDrafts();
  }, [token]);

  const contributorApproved = Boolean(user?.contributorApproved);

  const readinessSummary = useMemo(() => {
    return {
      total: resources.length,
      ready: resources.filter((item) => getDraftReadiness(item).isReady).length,
    };
  }, [resources]);

  const handleSubmit = async () => {
    if (!selectedDraft) {
      applyContributorNotice(
        "error",
        "Choose a draft before submitting it for review.",
        setStatusMessage,
        setErrorMessage
      );
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      if (token) {
        await submitResourceForReview(selectedDraft.resourceId, token);
      } else {
        const submitted = submitMockContributorResource(selectedDraft.resourceId);
        if (!submitted) {
          throw new Error("Unable to submit this draft.");
        }
      }
      setResources((previous) => previous.filter((item) => item.resourceId !== selectedDraft.resourceId));
      applyContributorNotice(
        "success",
        `"${selectedDraft.title}" was submitted for review.`,
        setStatusMessage,
        setErrorMessage
      );
      setSelectedDraft(null);
    } catch (error) {
      applyContributorNotice(
        "error",
        error.message || "Unable to submit this draft.",
        setStatusMessage,
        setErrorMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!draftToDelete) {
      applyContributorNotice(
        "error",
        "Choose a draft before trying to delete it.",
        setStatusMessage,
        setErrorMessage
      );
      return;
    }

    setIsDeleting(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      if (token) {
        await deleteDraft(draftToDelete.resourceId, token);
      } else {
        const deleted = deleteMockContributorDraft(draftToDelete.resourceId);
        if (!deleted) {
          throw new Error("Unable to delete this draft.");
        }
      }

      setResources((previous) => previous.filter((item) => item.resourceId !== draftToDelete.resourceId));
      applyContributorNotice(
        "success",
        `Draft "${draftToDelete.title}" was deleted.`,
        setStatusMessage,
        setErrorMessage
      );
      setDraftToDelete(null);
    } catch (error) {
      applyContributorNotice(
        "error",
        error.message || "Unable to delete this draft.",
        setStatusMessage,
        setErrorMessage
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ContributorWorkspace
      eyebrow="Draft Workspace"
      title="View Drafts"
      description="Review unfinished resource records, refine their metadata, and send completed drafts into the curation workflow."
      actions={[
        { label: "Contributor Home", to: "/contributor", variant: "secondary" },
        { label: "Create Draft", to: "/contributor/createdraft", variant: "primary" },
      ]}
    >
      <div className="drafts-page">
        <section className="drafts-page__summary">
          <article className="drafts-summary-card">
            <span className="drafts-summary-card__label">Drafts</span>
            <strong className="drafts-summary-card__value">{readinessSummary.total}</strong>
          </article>
          <article className="drafts-summary-card">
            <span className="drafts-summary-card__label">Ready to Submit</span>
            <strong className="drafts-summary-card__value">{readinessSummary.ready}</strong>
          </article>
          <article className="drafts-summary-card">
            <span className="drafts-summary-card__label">Submission Access</span>
            <strong className="drafts-summary-card__value">
              {contributorApproved ? "Approved" : "Pending"}
            </strong>
          </article>
        </section>

        {statusMessage && <p className="drafts-page__message">{statusMessage}</p>}
        {errorMessage && <p className="drafts-page__error">{errorMessage}</p>}
        {isLoading && <p className="drafts-page__state">Loading drafts...</p>}

        {!isLoading && resources.length === 0 && (
          <div className="drafts-empty-state">
            <h3>No draft resources</h3>
            <p>Create a draft to begin preparing a heritage submission.</p>
            <Button onClick={() => navigate("/contributor/createdraft")}>Create Draft</Button>
          </div>
        )}

        <section className="drafts-list">
          {!isLoading &&
            resources.map((resource) => (
              <article key={resource.resourceId} className="draft-card">
                <div className="draft-card__content">
                  <div className="draft-card__meta">
                    <span className="draft-chip draft-chip--status">{formatContributorStatus(resource.status)}</span>
                    {resource.categoryName && <span className="draft-chip">{resource.categoryName}</span>}
                    {resource.placeName && <span className="draft-chip">{resource.placeName}</span>}
                  </div>

                  <h2 className="draft-card__title">{resource.title}</h2>
                  <p className="draft-card__subtitle">{resource.topic || "Topic not completed yet."}</p>
                  <p className="draft-card__description">
                    {resource.description || "Add a clear description, place context, and rights declaration before submitting this resource for review."}
                  </p>
                </div>

                <div className="draft-card__aside">
                  <div className="draft-card__fact">
                    <span>Updated</span>
                    <strong>{formatDate(resource.updatedAt)}</strong>
                  </div>
                  <div className="draft-card__fact">
                    <span>Readiness</span>
                    <strong>{getDraftReadiness(resource).label}</strong>
                  </div>
                  <div className="draft-card__fact">
                    <span>Tags</span>
                    <strong>{resource.tags?.length ? resource.tags.join(", ") : "No tags yet"}</strong>
                  </div>
                  <div className="draft-card__actions">
                    <Button
                      variant="primary"
                      onClick={() =>
                        navigate(`/contributor/createdraft/${resource.resourceId}`, {
                          state: { mode: "edit", resource },
                        })
                      }
                    >
                      Edit Draft
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={!contributorApproved}
                      onClick={() => setSelectedDraft(resource)}
                    >
                      Submit for Review
                    </Button>
                    <Button variant="danger" onClick={() => setDraftToDelete(resource)}>
                      Delete Draft
                    </Button>
                  </div>
                </div>
              </article>
            ))}
        </section>
      </div>

      <Modal
        isOpen={Boolean(selectedDraft)}
        title="Submit Draft for Review"
        onClose={() => setSelectedDraft(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedDraft(null)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={isSubmitting || !contributorApproved} onClick={handleSubmit}>
              {isSubmitting ? "Submitting..." : "Confirm Submission"}
            </Button>
          </>
        }
      >
        <p className="drafts-modal__text">
          {selectedDraft ? `Submit "${selectedDraft.title}" to the review queue?` : ""}
        </p>
      </Modal>

      <Modal
        isOpen={Boolean(draftToDelete)}
        title="Delete Draft"
        onClose={() => setDraftToDelete(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraftToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={isDeleting} onClick={handleDeleteDraft}>
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </>
        }
      >
        <p className="drafts-modal__text">
          {draftToDelete
            ? `Delete "${draftToDelete.title}" from your drafts? This action cannot be undone.`
            : ""}
        </p>
      </Modal>
    </ContributorWorkspace>
  );
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default Drafts;
