import React from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import AdminWorkspace from "../AdminWorkspace";
import "./Review.css";

const reviewItems = [
  {
    id: "res-1042",
    title: "Stone Bridge Oral History Collection",
    topic: "Community memory of river crossings and local transport traditions.",
    category: "Historic Infrastructure",
    contributor: "Liu Mei",
    submittedAt: "2026-04-05 18:20",
    status: "Pending Review",
    place: "Suzhou Creek District",
    description:
      "A curated submission containing interviews, route sketches, and descriptive context about the neighborhood's historic bridge culture and public memory.",
  },
  {
    id: "res-1046",
    title: "Temple Fair Soundscape Archive",
    topic: "Festival performance audio with local ritual context.",
    category: "Intangible Heritage",
    contributor: "Zhang Rui",
    submittedAt: "2026-04-05 14:05",
    status: "Pending Review",
    place: "Old Town Market Quarter",
    description:
      "Audio clips, field notes, and descriptive metadata documenting ceremonial percussion, crowd rhythm, and recurring oral cues from a traditional temple fair.",
  },
  {
    id: "res-1051",
    title: "Lane House Craft Motif Survey",
    topic: "Decorative patterns and household symbols found in preserved lane residences.",
    category: "Built Heritage",
    contributor: "Chen Yifan",
    submittedAt: "2026-04-04 21:40",
    status: "Pending Review",
    place: "Heritage Lane Block",
    description:
      "A structured overview of doorframe motifs, hand-painted symbols, and resident annotations prepared for publication review.",
  },
];

function ReviewList() {
  return (
    <AdminWorkspace
      eyebrow="Review Workflow"
      title="Review Queue"
      description="Review incoming heritage submissions before publication. This static queue is already shaped like the future live moderation workflow, with filters, review cards, and direct entry into the detail workspace."
      actions={[{ label: "Back to Dashboard", to: "/admin", variant: "secondary" }]}
    >
      <div className="review-toolbar">
        <div className="review-toolbar__filters admin-panel">
          <Input
            id="review-keyword"
            label="Keyword"
            placeholder="Search title, description, or place"
            value=""
            onChange={() => {}}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="review-status">
              Status
            </label>
            <select id="review-status" className="input-group__field" defaultValue="pending">
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-group__label" htmlFor="review-category">
              Category
            </label>
            <select id="review-category" className="input-group__field" defaultValue="all">
              <option value="all">All Categories</option>
              <option value="built">Built Heritage</option>
              <option value="intangible">Intangible Heritage</option>
              <option value="infrastructure">Historic Infrastructure</option>
            </select>
          </div>

          <div className="review-toolbar__actions">
            <Button variant="primary">Apply Filters</Button>
            <Button variant="secondary">Reset</Button>
          </div>
        </div>

        <div className="review-toolbar__summary">
          <div className="review-summary-card">
            <span className="review-summary-card__label">Queue Size</span>
            <strong className="review-summary-card__value">12</strong>
            <p className="review-summary-card__hint">Submissions currently awaiting administrator action.</p>
          </div>
          <div className="review-summary-card">
            <span className="review-summary-card__label">High Priority</span>
            <strong className="review-summary-card__value">3</strong>
            <p className="review-summary-card__hint">Items flagged for fast turnaround in the current cycle.</p>
          </div>
          <div className="review-summary-card">
            <span className="review-summary-card__label">Oldest Pending</span>
            <strong className="review-summary-card__value">42h</strong>
            <p className="review-summary-card__hint">Longest waiting submission currently still in queue.</p>
          </div>
          <div className="review-summary-card">
            <span className="review-summary-card__label">Ready Today</span>
            <strong className="review-summary-card__value">5</strong>
            <p className="review-summary-card__hint">Submissions curated well enough for immediate decision review.</p>
          </div>
        </div>
      </div>

      <div className="review-list">
        {reviewItems.map((item) => (
          <article key={item.id} className="review-list-card">
            <div className="review-list-card__content">
              <div className="review-list-card__meta">
                <span className="review-chip--status">{item.status}</span>
                <span className="review-chip">{item.category}</span>
                <span className="review-chip">{item.place}</span>
              </div>

              <h2 className="review-list-card__title">{item.title}</h2>
              <p className="review-list-card__topic">{item.topic}</p>
              <p className="review-list-card__description">{item.description}</p>
            </div>

            <div className="review-list-card__details">
              <div className="review-list-card__detail-row">
                <span>Contributor</span>
                <strong>{item.contributor}</strong>
              </div>
              <div className="review-list-card__detail-row">
                <span>Submitted</span>
                <strong>{item.submittedAt}</strong>
              </div>
              <div className="review-list-card__detail-row">
                <span>Place</span>
                <strong>{item.place}</strong>
              </div>
              <div className="review-list-card__detail-row">
                <span>Review Readiness</span>
                <strong>Metadata Complete</strong>
              </div>

              <div className="review-list-card__footer">
                <Link to={`/admin/review/${item.id}`} className="review-list-card__link">
                  <Button variant="primary">View Details</Button>
                </Link>
                <Button variant="secondary">Assign Reviewer</Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminWorkspace>
  );
}

export default ReviewList;
