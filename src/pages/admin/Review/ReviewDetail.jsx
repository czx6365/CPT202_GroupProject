import React from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../../components/Button/Button";
import AdminWorkspace from "../AdminWorkspace";
import "./Review.css";

const detailRecord = {
  title: "Stone Bridge Oral History Collection",
  topic: "Community memory of river crossings and local transport traditions.",
  place: "Suzhou Creek District",
  category: "Historic Infrastructure",
  submittedAt: "2026-04-05 18:20",
  contributor: "Liu Mei",
  reviewer: "Administrator Queue",
  status: "Pending Review",
  description:
    "This submission documents the oral memory surrounding a historic stone bridge through structured interviews, annotated walking routes, and descriptive notes about intergenerational mobility in the district. The material is presented as a public-facing cultural record intended for discovery and educational reuse.",
  copyright:
    "Contributor confirms original interviews were collected with participant consent and grants the platform the right to publish descriptive excerpts and metadata.",
  tags: ["Oral History", "Bridge Culture", "Transport Memory", "Community Archive"],
  fileArtifact: "bridge-oral-history-collection.zip",
  externalLink: "https://heritagehub.example/review/stone-bridge",
};

function ReviewDetail() {
  const { id } = useParams();

  return (
    <AdminWorkspace
      eyebrow="Review Detail"
      title={`Submission Workspace: ${id}`}
      description="Inspect the full heritage submission before making a moderation decision. This static structure mirrors the future live review screen, with metadata on the left and decision controls on the right."
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

      <div className="review-detail-layout">
        <div className="review-detail-main">
          <section className="review-meta-card">
            <div className="review-meta-card__header">
              <div>
                <div className="review-list-card__meta">
                  <span className="review-chip--status">{detailRecord.status}</span>
                  <span className="review-chip">{detailRecord.category}</span>
                  <span className="review-chip">{detailRecord.place}</span>
                </div>
                <h2 className="review-meta-card__title">{detailRecord.title}</h2>
                <p className="review-meta-card__subtitle">{detailRecord.topic}</p>
              </div>
            </div>

            <div className="review-data-grid">
              <div className="review-data-item">
                <span className="review-data-item__label">Contributor</span>
                <p className="review-data-item__value">{detailRecord.contributor}</p>
              </div>

              <div className="review-data-item">
                <span className="review-data-item__label">Submitted At</span>
                <p className="review-data-item__value">{detailRecord.submittedAt}</p>
              </div>

              <div className="review-data-item">
                <span className="review-data-item__label">Review Owner</span>
                <p className="review-data-item__value">{detailRecord.reviewer}</p>
              </div>

              <div className="review-data-item">
                <span className="review-data-item__label">Place</span>
                <p className="review-data-item__value">{detailRecord.place}</p>
              </div>

              <div className="review-data-item review-data-item--full">
                <span className="review-data-item__label">Description</span>
                <p className="review-data-item__text">{detailRecord.description}</p>
              </div>

              <div className="review-data-item review-data-item--full">
                <span className="review-data-item__label">Tags</span>
                <div className="review-tag-list">
                  {detailRecord.tags.map((tag) => (
                    <span key={tag} className="review-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="review-data-item review-data-item--full">
                <span className="review-data-item__label">Copyright Declaration</span>
                <p className="review-data-item__text">{detailRecord.copyright}</p>
              </div>
            </div>
          </section>

          <section className="review-meta-card">
            <h3 className="admin-panel__title">Attached Review Materials</h3>
            <div className="review-artifact-list">
              <div className="review-artifact">
                <h4 className="review-artifact__title">Submitted File Package</h4>
                <p className="review-artifact__text">
                  {detailRecord.fileArtifact} prepared for archive ingestion and metadata validation.
                </p>
              </div>

              <div className="review-artifact">
                <h4 className="review-artifact__title">External Reference Link</h4>
                <p className="review-artifact__text">{detailRecord.externalLink}</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="review-detail-side">
          <section className="review-decision-card">
            <h3 className="review-decision-card__title">Decision Controls</h3>
            <p className="review-decision-card__description">
              Use this panel to prepare the publication decision. The real workflow will later submit
              the chosen action and reviewer feedback to the backend API.
            </p>

            <div className="review-decision-card__section">
              <span className="review-decision-card__section-label">Reviewer Feedback</span>
              <textarea
                className="review-feedback"
                placeholder="Provide approval notes or explain the changes required before publication."
                defaultValue="The submission is well documented overall. If rejected, request clearer participant attribution and tighter file naming consistency."
              />
            </div>

            <div className="review-decision-card__actions">
              <Button variant="primary">Approve</Button>
              <Button variant="danger">Reject</Button>
            </div>

            <p className="review-decision-card__note">
              Future behavior: reject should require feedback, while approve should preserve the final
              reviewer note for audit visibility.
            </p>
          </section>

          <section className="review-decision-card">
            <h3 className="review-decision-card__title">Review Checklist</h3>
            <p className="review-decision-card__description">
              This support panel previews the quality checks administrators are expected to complete
              before publication approval.
            </p>

            <div className="review-artifact-list">
              <div className="review-artifact">
                <h4 className="review-artifact__title">Metadata Completeness</h4>
                <p className="review-artifact__text">Title, place, description, and category are all present.</p>
              </div>

              <div className="review-artifact">
                <h4 className="review-artifact__title">Publication Readiness</h4>
                <p className="review-artifact__text">Tags and rights declaration are ready for final moderation review.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </AdminWorkspace>
  );
}

export default ReviewDetail;
