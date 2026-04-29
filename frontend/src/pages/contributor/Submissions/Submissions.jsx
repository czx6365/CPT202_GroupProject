import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import { useAuth } from "../../../context/AuthContext";
import { fetchMyResources } from "../../../services/resourceService";
import { getMockContributorResources } from "../mockContributorData";
import { formatContributorStatus, getContributorStatusHint, getContributorStatusTone } from "../resourceStatus";
import { applyStoredContributorNotice, consumeContributorNotice } from "../actionNotice";
import ContributorWorkspace from "../ContributorWorkspace";
import "./Submissions.css";

function Submissions() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    const notice = consumeContributorNotice();
    applyStoredContributorNotice(notice, setStatusMessage, setErrorMessage);
  }, []);

  useEffect(() => {
    const loadResources = async () => {
      if (!token) {
        setResources(getMockContributorResources().filter((item) => item.status !== "DRAFT"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchMyResources(token);
        const allResources = Array.isArray(result) ? result : [];
        setResources(allResources.filter((item) => item.status !== "DRAFT"));
      } catch (error) {
        setResources([]);
        setErrorMessage(error.message || "Unable to load your submissions right now.");
      } finally {
        setIsLoading(false);
      }
    };

    loadResources();
  }, [token]);

  useEffect(() => {
    if (!id || resources.length === 0) return;

    const matched = resources.find((item) => String(item.resourceId) === String(id));
    if (matched) {
      setSelectedResource(matched);
    }
  }, [id, resources]);

  const submissionSummary = useMemo(() => {
    return {
      total: resources.length,
      pending: resources.filter((item) => item.status === "PENDING_REVIEW").length,
      rejected: resources.filter((item) => item.status === "REJECTED").length,
      approved: resources.filter((item) => item.status === "APPROVED").length,
    };
  }, [resources]);

  return (
    <ContributorWorkspace
      eyebrow="Submission Archive"
      title="My Submission"
      description="Track every resource that has already entered or completed the review cycle, including revisions, approvals, and archived records."
      actions={[
        { label: "Contributor Home", to: "/contributor", variant: "secondary" },
        { label: "Create Draft", to: "/contributor/createdraft", variant: "primary" },
      ]}
    >
      <div className="submissions-page">
        <section className="submissions-page__summary">
          <article className="submissions-summary-card">
            <span className="submissions-summary-card__label">Submitted</span>
            <strong className="submissions-summary-card__value">{submissionSummary.total}</strong>
          </article>
          <article className="submissions-summary-card">
            <span className="submissions-summary-card__label">Pending</span>
            <strong className="submissions-summary-card__value">{submissionSummary.pending}</strong>
          </article>
          <article className="submissions-summary-card">
            <span className="submissions-summary-card__label">Rejected</span>
            <strong className="submissions-summary-card__value">{submissionSummary.rejected}</strong>
          </article>
          <article className="submissions-summary-card">
            <span className="submissions-summary-card__label">Approved</span>
            <strong className="submissions-summary-card__value">{submissionSummary.approved}</strong>
          </article>
        </section>

        {statusMessage && <p className="submissions-page__message">{statusMessage}</p>}
        {errorMessage && <p className="submissions-page__error">{errorMessage}</p>}
        {isLoading && <p className="submissions-page__state">Loading submissions...</p>}

        {!isLoading && resources.length === 0 && (
          <div className="submissions-empty-state">
            <h3>No submissions yet</h3>
            <p>Your submitted, approved, rejected, and archived resources will appear here.</p>
          </div>
        )}

        <section className="submissions-list">
          {!isLoading &&
            resources.map((resource) => (
              <article key={resource.resourceId} className="submission-card">
                <div className="submission-card__content">
                  <div className="submission-card__meta">
                    <span className={`submission-chip submission-chip--${getContributorStatusTone(resource.status)}`}>
                      {formatContributorStatus(resource.status)}
                    </span>
                    {resource.categoryName && <span className="submission-chip">{resource.categoryName}</span>}
                    {resource.placeName && <span className="submission-chip">{resource.placeName}</span>}
                  </div>

                  <h2 className="submission-card__title">{resource.title}</h2>
                  <p className="submission-card__subtitle">{resource.topic || "Topic not available."}</p>
                  <p className="submission-card__description">{getContributorStatusHint(resource.status)}</p>
                </div>

                <div className="submission-card__aside">
                  <div className="submission-card__fact">
                    <span>Updated</span>
                    <strong>{formatDate(resource.updatedAt)}</strong>
                  </div>
                  <div className="submission-card__fact">
                    <span>Reviewer Feedback</span>
                    <strong>{resource.reviewerFeedback ? "Available" : "Not returned"}</strong>
                  </div>
                  <div className="submission-card__actions">
                    {resource.status === "REJECTED" && (
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/contributor/resubmit/${resource.resourceId}`, { state: { resource } })}
                      >
                        Revise
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/contributor/submissions/${resource.resourceId}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </article>
            ))}
        </section>
      </div>

      <Modal
        isOpen={Boolean(selectedResource)}
        title="Submission Details"
        onClose={() => {
          setSelectedResource(null);
          navigate("/contributor/submissions");
        }}
        footer={
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedResource(null);
              navigate("/contributor/submissions");
            }}
          >
            Close
          </Button>
        }
      >
        {selectedResource && (
          <div className="submissions-modal">
            <div className="submissions-modal__grid">
              <DetailItem label="Title" value={selectedResource.title} />
              <DetailItem label="Status" value={formatContributorStatus(selectedResource.status)} />
              <DetailItem label="Topic" value={selectedResource.topic || "Not available"} />
              <DetailItem label="Updated" value={formatDate(selectedResource.updatedAt)} />
            </div>
            <DetailItem
              label="Reviewer Feedback"
              value={
                selectedResource.reviewerFeedback ||
                "No reviewer feedback has been provided for this resource."
              }
              full
            />
          </div>
        )}
      </Modal>
    </ContributorWorkspace>
  );
}

function DetailItem({ label, value, full = false }) {
  return (
    <div className={`submissions-detail-item ${full ? "submissions-detail-item--full" : ""}`}>
      <span className="submissions-detail-item__label">{label}</span>
      <p className="submissions-detail-item__value">{value}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default Submissions;
