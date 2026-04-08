import React from "react";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import AdminWorkspace from "../AdminWorkspace";
import "./AuditLogs.css";

const auditEntries = [
  {
    time: "2026-04-06 11:24",
    operator: "Admin Nancy",
    action: "Approved contributor request",
    detail: "Promoted Lin Qiao from Registered Viewer to Contributor.",
    status: "Success",
  },
  {
    time: "2026-04-06 10:42",
    operator: "Admin Nancy",
    action: "Created category",
    detail: "Added category: Historic Infrastructure.",
    status: "Success",
  },
  {
    time: "2026-04-06 09:58",
    operator: "Admin Nancy",
    action: "Rejected resource review",
    detail: "Returned Temple Fair Soundscape Archive with revision note.",
    status: "Needs Follow-up",
  },
  {
    time: "2026-04-05 18:16",
    operator: "Admin Review Team",
    action: "Updated tag vocabulary",
    detail: "Merged overlapping tag guidance for Oral History metadata.",
    status: "Success",
  },
];

function Archive() {
  return (
    <AdminWorkspace
      eyebrow="Audit"
      title="Audit Logs"
      description="Review administrative actions across moderation, contributor approvals, and taxonomy management. This static workspace mirrors the future audit log view with filters, table records, and an event detail panel."
      actions={[{ label: "Back to Dashboard", to: "/admin", variant: "secondary" }]}
    >
      <div className="audit-toolbar">
        <div className="audit-toolbar__filters admin-panel">
          <Input
            id="audit-keyword"
            label="Keyword"
            placeholder="Search operator or action"
            value=""
            onChange={() => {}}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="audit-status">
              Status
            </label>
            <select id="audit-status" className="input-group__field" defaultValue="all">
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="follow-up">Needs Follow-up</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-group__label" htmlFor="audit-scope">
              Scope
            </label>
            <select id="audit-scope" className="input-group__field" defaultValue="all">
              <option value="all">All Actions</option>
              <option value="review">Review</option>
              <option value="promotion">Promotion</option>
              <option value="master-data">Master Data</option>
            </select>
          </div>

          <div className="audit-toolbar__actions">
            <Button variant="primary">Apply Filters</Button>
            <Button variant="secondary">Export</Button>
          </div>
        </div>

        <div className="audit-toolbar__summary">
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Events Today</span>
            <strong className="audit-summary-card__value">18</strong>
            <p className="audit-summary-card__hint">Administrative actions recorded in the current day.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Moderation</span>
            <strong className="audit-summary-card__value">9</strong>
            <p className="audit-summary-card__hint">Review-related actions logged across resource moderation.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Promotion</span>
            <strong className="audit-summary-card__value">4</strong>
            <p className="audit-summary-card__hint">Role and contributor approval events currently tracked.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Flagged</span>
            <strong className="audit-summary-card__value">1</strong>
            <p className="audit-summary-card__hint">Actions that still need follow-up or reviewer attention.</p>
          </div>
        </div>
      </div>

      <div className="audit-layout">
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.map((entry) => (
                <tr key={`${entry.time}-${entry.action}`}>
                  <td>{entry.time}</td>
                  <td>
                    <span className="audit-chip">{entry.operator}</span>
                  </td>
                  <td>
                    <div className="audit-table__action">
                      <strong>{entry.action}</strong>
                      <span>{entry.detail}</span>
                    </div>
                  </td>
                  <td>
                    <span className="audit-chip--status">{entry.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="audit-panel">
          <section className="audit-panel__card">
            <h3 className="audit-panel__title">Selected Event</h3>
            <p className="audit-panel__description">
              Use this panel to inspect the context of the currently selected log item. Later, this
              can surface detailed payloads or policy notes when backend audit support is ready.
            </p>

            <div className="audit-detail-grid">
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Action</span>
                <p className="audit-detail-item__value">Approved contributor request</p>
              </div>
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Operator</span>
                <p className="audit-detail-item__value">Admin Nancy</p>
              </div>
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Timestamp</span>
                <p className="audit-detail-item__value">2026-04-06 11:24</p>
              </div>
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Status</span>
                <p className="audit-detail-item__value">Success</p>
              </div>
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Scope</span>
                <p className="audit-detail-item__value">User Promotion</p>
              </div>
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Target</span>
                <p className="audit-detail-item__value">Lin Qiao</p>
              </div>
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Summary</span>
                <p className="audit-detail-item__text">
                  Contributor access was granted after reviewing applicant motivation, content plan,
                  and platform fit.
                </p>
              </div>
            </div>
          </section>

          <section className="audit-panel__card">
            <h3 className="audit-panel__title">Audit Review Notes</h3>
            <div className="audit-checklist">
              <div className="audit-checklist__item">
                <h4>Traceability</h4>
                <p>Each administrative action should record who acted, when it happened, and what changed.</p>
              </div>

              <div className="audit-checklist__item">
                <h4>Scope Coverage</h4>
                <p>Moderation, promotion, and master data changes should all surface in a single reviewable feed.</p>
              </div>

              <div className="audit-checklist__item">
                <h4>Operational Follow-up</h4>
                <p>Flagged entries should make it obvious when an admin needs to return and resolve a pending issue.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}

export default Archive;
