import React from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import AdminWorkspace from "../AdminWorkspace";
import "./MasterData.css";

const categories = [
  {
    name: "Historic Infrastructure",
    description:
      "For bridges, roads, water systems, and built civic structures that shape community memory and movement.",
    usage: "24 resources",
    updatedAt: "2026-04-06 10:20",
    status: "Active",
  },
  {
    name: "Intangible Heritage",
    description:
      "For rituals, oral traditions, performance, festival practices, and non-material cultural expressions.",
    usage: "31 resources",
    updatedAt: "2026-04-05 16:45",
    status: "Active",
  },
  {
    name: "Built Heritage",
    description:
      "For vernacular architecture, preserved residences, neighborhood structures, and physical spatial heritage.",
    usage: "18 resources",
    updatedAt: "2026-04-04 14:10",
    status: "Active",
  },
];

function Categories() {
  return (
    <AdminWorkspace
      eyebrow="Master Data"
      title="Category Management"
      description="Steward the platform's category system so submission, review, and discovery all share a consistent classification language. This static layout already mirrors the future create, edit, and controlled-delete workflow."
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
            value=""
            onChange={() => {}}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="category-status">
              Status
            </label>
            <select id="category-status" className="input-group__field" defaultValue="active">
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
            <span className="master-summary-card__label">Categories</span>
            <strong className="master-summary-card__value">12</strong>
            <p className="master-summary-card__hint">Structured categories currently available for resource filing.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">In Use</span>
            <strong className="master-summary-card__value">11</strong>
            <p className="master-summary-card__hint">Categories already referenced by at least one resource.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">Protected</span>
            <strong className="master-summary-card__value">8</strong>
            <p className="master-summary-card__hint">Categories that should trigger delete protection.</p>
          </div>
          <div className="master-summary-card">
            <span className="master-summary-card__label">Recent Update</span>
            <strong className="master-summary-card__value">Today</strong>
            <p className="master-summary-card__hint">Latest taxonomy change prepared for admin review.</p>
          </div>
        </div>
      </div>

      <div className="master-layout">
        <div className="master-list">
          {categories.map((category) => (
            <article key={category.name} className="master-record">
              <div className="master-record__content">
                <div className="master-record__meta">
                  <span className="master-chip--status">{category.status}</span>
                  <span className="master-chip">{category.usage}</span>
                </div>

                <h2 className="master-record__title">{category.name}</h2>
                <p className="master-record__subtitle">Classification bucket for heritage resources.</p>
                <p className="master-record__description">{category.description}</p>
              </div>

              <div className="master-record__facts">
                <div className="master-record__fact">
                  <span>Usage</span>
                  <strong>{category.usage}</strong>
                </div>
                <div className="master-record__fact">
                  <span>Updated</span>
                  <strong>{category.updatedAt}</strong>
                </div>
                <div className="master-record__fact">
                  <span>Delete Safety</span>
                  <strong>Protected if in use</strong>
                </div>

                <div className="master-record__actions">
                  <Button variant="primary">Edit</Button>
                  <Button variant="secondary">View Usage</Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="master-detail">
          <section className="master-panel">
            <h3 className="master-panel__title">Create Category</h3>
            <p className="master-panel__description">
              This form reserves the future create workflow for taxonomy expansion, such as adding a
              new heritage classification like traditional markets or folk craft districts.
            </p>

            <div className="master-form">
              <Input
                id="create-category-name"
                label="Category Name"
                placeholder="e.g. Ancient Architecture"
                value=""
                onChange={() => {}}
              />

              <div className="input-group">
                <label className="input-group__label" htmlFor="create-category-description">
                  Description
                </label>
                <textarea
                  id="create-category-description"
                  className="master-textarea"
                  placeholder="Describe what type of heritage resources belong in this category."
                  defaultValue=""
                />
              </div>

              <div className="master-panel__actions">
                <Button variant="primary">Create Category</Button>
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
                <h4>Delete Protection</h4>
                <p>Categories already linked to resources should warn the administrator before removal.</p>
              </div>

              <div className="master-checklist__item">
                <h4>Naming Consistency</h4>
                <p>Category titles should stay broad enough for reuse but precise enough for discovery quality.</p>
              </div>

              <div className="master-checklist__item">
                <h4>Platform Readability</h4>
                <p>Descriptions should help contributors choose the right classification before submission.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}

export default Categories;
