import React from "react";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import AdminWorkspace from "../AdminWorkspace";
import "./AuditLogs.css";

const auditEntries = [
  {
    time: "2026-04-09 14:10",
    operator: "Admin Nancy",
    module: "Archive",
    action: "Archived resource",
    target: "Lantern Festival Route Archive",
    detail: "Moved a published resource into restricted archive after a rights complaint.",
    status: "Success",
  },
  {
    time: "2026-04-09 13:42",
    operator: "Admin Nancy",
    module: "Master Data",
    action: "Updated category",
    target: "Historic Infrastructure",
    detail: "Refined category description for contributor-side classification clarity.",
    status: "Success",
  },
  {
    time: "2026-04-09 12:56",
    operator: "Admin Nancy",
    module: "Promotion",
    action: "Approved contributor",
    target: "Lin Qiao",
    detail: "Granted contributor access after reviewing profile motivation and content plan.",
    status: "Success",
  },
  {
    time: "2026-04-09 12:18",
    operator: "Admin Nancy",
    module: "Review",
    action: "Rejected resource",
    target: "Temple Fair Soundscape Archive",
    detail: "Returned submission with revision comments for metadata clarification.",
    status: "Needs Follow-up",
  },
  {
    time: "2026-04-09 11:36",
    operator: "Admin Review Team",
    module: "Restore",
    action: "Restored resource",
    target: "Harbor Bell Oral Memory Clips",
    detail: "Returned archived content to the publishing queue after rights verification.",
    status: "Logged",
  },
  {
    time: "2026-04-09 10:42",
    operator: "Admin Nancy",
    module: "Master Data",
    action: "Created tag",
    target: "Oral History",
    detail: "Added a reusable tag for community memory submissions.",
    status: "Success",
  },
];

const selectedEntry = auditEntries[0];

function AuditLogs() {
  return (
    <AdminWorkspace
      eyebrow="Audit"
      title="Audit Logs"
      description="Review administrator activity across archive actions, contributor approvals, resource moderation, and taxonomy updates from one traceable operations log."
      actions={[{ label: "Back to Dashboard", to: "/admin", variant: "secondary" }]}
    >
      <div className="audit-toolbar">
        <div className="audit-toolbar__filters admin-panel">
          <Input
            id="audit-keyword"
            label="Keyword"
            placeholder="Search target, operator, or action"
            value=""
            onChange={() => {}}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="audit-module">
              Module
            </label>
            <select id="audit-module" className="input-group__field" defaultValue="all">
              <option value="all">All Modules</option>
              <option value="archive">Archive</option>
              <option value="restore">Restore</option>
              <option value="review">Review</option>
              <option value="promotion">Promotion</option>
              <option value="master-data">Master Data</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-group__label" htmlFor="audit-status">
              Status
            </label>
            <select id="audit-status" className="input-group__field" defaultValue="all">
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="logged">Logged</option>
              <option value="follow-up">Needs Follow-up</option>
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
            <p className="audit-summary-card__hint">Administrative actions captured across the current day.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Archive Flow</span>
            <strong className="audit-summary-card__value">6</strong>
            <p className="audit-summary-card__hint">Archive and restore events recorded in the lifecycle workflow.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Review Actions</span>
            <strong className="audit-summary-card__value">5</strong>
            <p className="audit-summary-card__hint">Approvals and rejections logged from the moderation queue.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Taxonomy Updates</span>
            <strong className="audit-summary-card__value">3</strong>
            <p className="audit-summary-card__hint">Category and tag changes tracked for later accountability review.</p>
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
                <th>Module</th>
                <th>Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.map((entry) => (
                <tr key={`${entry.time}-${entry.action}-${entry.target}`}>
                  <td>{entry.time}</td>
                  <td>
                    <span className="audit-chip">{entry.operator}</span>
                  </td>
                  <td>{entry.module}</td>
                  <td>
                    <div className="audit-table__action">
                      <strong>{entry.action}</strong>
                      <span>{entry.target}</span>
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
              This panel summarizes the currently highlighted action and shows the kind of operational context the backend audit service can later persist in detail.
            </p>

            <div className="audit-detail-grid">
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Module</span>
                <p className="audit-detail-item__value">{selectedEntry.module}</p>
              </div>
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Operator</span>
                <p className="audit-detail-item__value">{selectedEntry.operator}</p>
              </div>
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Action</span>
                <p className="audit-detail-item__value">{selectedEntry.action}</p>
              </div>
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Target</span>
                <p className="audit-detail-item__value">{selectedEntry.target}</p>
              </div>
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Timestamp</span>
                <p className="audit-detail-item__value">{selectedEntry.time}</p>
              </div>
              <div className="audit-detail-item">
                <span className="audit-detail-item__label">Status</span>
                <p className="audit-detail-item__value">{selectedEntry.status}</p>
              </div>
              <div className="audit-detail-item audit-detail-item--wide">
                <span className="audit-detail-item__label">Detail</span>
                <p className="audit-detail-item__text">{selectedEntry.detail}</p>
              </div>
            </div>
          </section>

          <section className="audit-panel__card">
            <h3 className="audit-panel__title">Coverage Notes</h3>
            <div className="audit-checklist">
              <div className="audit-checklist__item">
                <h4>Cross-Module Visibility</h4>
                <p>Audit logs should capture archive, restore, review, promotion, and master data actions in one place.</p>
              </div>

              <div className="audit-checklist__item">
                <h4>Traceable Operator History</h4>
                <p>Every event should preserve who performed it, when it happened, and which target record was affected.</p>
              </div>

              <div className="audit-checklist__item">
                <h4>Compliance Readiness</h4>
                <p>Follow-up statuses help the team identify actions that need another review pass or contributor response.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}

export default AuditLogs;
