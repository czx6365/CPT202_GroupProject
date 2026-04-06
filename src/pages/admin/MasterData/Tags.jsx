import React from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import AdminWorkspace from "../AdminWorkspace";
import "./MasterData.css";

const tags = [
  {
    name: "Oral History",
    categoryHint: "Intangible Heritage",
    usage: "19 resources",
    updatedAt: "2026-04-06 09:10",
    status: "Active",
    description: "Used for interviews, lived memory records, spoken testimony, and community narratives.",
  },
  {
    name: "Festival Culture",
    categoryHint: "Intangible Heritage",
    usage: "14 resources",
    updatedAt: "2026-04-05 15:25",
    status: "Active",
    description: "Supports seasonal celebrations, ritual performance, procession, and ceremonial context.",
  },
  {
    name: "Architectural Detail",
    categoryHint: "Built Heritage",
    usage: "11 resources",
    updatedAt: "2026-04-04 19:55",
    status: "Active",
    description: "Highlights facade details, motifs, construction traces, and visible material features.",
  },
];

function Tags() {
  return (
    <AdminWorkspace
      eyebrow="Master Data"
      title="Tag Management"
      description="Curate the platform's tag vocabulary so public discovery and internal moderation can reference consistent descriptive language. This static page already reflects the future tag maintenance workflow."
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
            placeholder="Search tag name or use case"
            value=""
            onChange={() => {}}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="tag-status">
              Status
            </label>
            <select id="tag-status" className="input-group__field" defaultValue="active">
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="master-toolbar__actions">
            <Button variant="primary">Apply Filters</Button>
            <Button variant="secondary">Reset</Button>
          </div>
        </div>

        <div className="master-toolbar__summary">
          <div className="master-summary-card">
            <span className="master-summary-card__label">Tags</span>
            <strong className="master-summary-card__value">28</strong>
            <p className="master-summary-card__hint">Platform tags supporting search and moderation vocabulary.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">In Use</span>
            <strong className="master-summary-card__value">24</strong>
            <p className="master-summary-card__hint">Tags currently referenced by published or pending resources.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">Suggested Merge</span>
            <strong className="master-summary-card__value">3</strong>
            <p className="master-summary-card__hint">Potential duplicates that may need normalization.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">Vocabulary Health</span>
            <strong className="master-summary-card__value">Stable</strong>
            <p className="master-summary-card__hint">Current tagging coverage is broad and reusable across modules.</p>
          </div>
        </div>
      </div>

      <div className="master-layout">
        <div className="master-list">
          {tags.map((tag) => (
            <article key={tag.name} className="master-record">
              <div className="master-record__content">
                <div className="master-record__meta">
                  <span className="master-chip--status">{tag.status}</span>
                  <span className="master-chip">{tag.categoryHint}</span>
                </div>

                <h2 className="master-record__title">{tag.name}</h2>
                <p className="master-record__subtitle">Controlled vocabulary entry for discovery and moderation.</p>
                <p className="master-record__description">{tag.description}</p>
              </div>

              <div className="master-record__facts">
                <div className="master-record__fact">
                  <span>Usage</span>
                  <strong>{tag.usage}</strong>
                </div>
                <div className="master-record__fact">
                  <span>Updated</span>
                  <strong>{tag.updatedAt}</strong>
                </div>
                <div className="master-record__fact">
                  <span>Normalization</span>
                  <strong>Ready for merge checks</strong>
                </div>

                <div className="master-record__actions">
                  <Button variant="primary">Edit</Button>
                  <Button variant="secondary">Review Usage</Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="master-detail">
          <section className="master-panel">
            <h3 className="master-panel__title">Create Tag</h3>
            <p className="master-panel__description">
              Add descriptive tags that help contributors classify submissions and help visitors
              discover related materials more precisely.
            </p>

            <div className="master-form">
              <Input
                id="create-tag-name"
                label="Tag Name"
                placeholder="e.g. Community Ritual"
                value=""
                onChange={() => {}}
              />

              <div className="input-group">
                <label className="input-group__label" htmlFor="create-tag-description">
                  Usage Note
                </label>
                <textarea
                  id="create-tag-description"
                  className="master-textarea"
                  placeholder="Explain when contributors should apply this tag."
                  defaultValue=""
                />
              </div>

              <div className="master-panel__actions">
                <Button variant="primary">Create Tag</Button>
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
                <h4>Avoid Duplication</h4>
                <p>Similar tags should be reviewed before creation to keep discovery results consistent.</p>
              </div>

              <div className="master-checklist__item">
                <h4>Contributor Guidance</h4>
                <p>Each tag should remain clear enough that contributors can apply it without ambiguity.</p>
              </div>

              <div className="master-checklist__item">
                <h4>Search Relevance</h4>
                <p>Tags should improve browsing quality rather than multiply near-identical wording.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}

export default Tags;
