import React, { useState } from "react";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import AdminWorkspace from "../AdminWorkspace";
import "./AuditLogs.css";

const publishedResources = [
  {
    id: "pub-241",
    title: "Lantern Festival Route Archive",
    category: "Intangible Heritage",
    contributor: "Lin Qiao",
    publishedAt: "2026-04-08 15:40",
    status: "Published",
    risk: "High Risk",
    issue: "Rights ownership dispute reported by a local organizer.",
    place: "Old Canal Street",
    visibility: "Public discovery",
  },
  {
    id: "pub-255",
    title: "Old Town Market Vendor Portraits",
    category: "Community Memory",
    contributor: "Wang Zhen",
    publishedAt: "2026-04-08 10:15",
    status: "Published",
    risk: "Policy Check",
    issue: "Submitted captions may reveal personal data that needs review.",
    place: "South Market Quarter",
    visibility: "Public discovery",
  },
  {
    id: "pub-267",
    title: "Riverside Warehouse Blueprint Notes",
    category: "Built Heritage",
    contributor: "He Yutong",
    publishedAt: "2026-04-07 19:05",
    status: "Published",
    risk: "Stable",
    issue: "No current violation, retained here as a ready control example.",
    place: "Warehouse Dock Belt",
    visibility: "Public discovery",
  },
];

const archivedResources = [
  {
    id: "arc-118",
    title: "Harbor Bell Oral Memory Clips",
    archivedAt: "2026-04-09 09:30",
    previousState: "Emergency Removed",
    archiveReason: "Rights verification pending from local audio organizer.",
    storage: "Restricted archive",
  },
  {
    id: "arc-122",
    title: "Canal Stone Marker Photo Set",
    archivedAt: "2026-04-08 16:05",
    previousState: "Archived",
    archiveReason: "Temporarily hidden while metadata corrections are reviewed.",
    storage: "Archive vault",
  },
];

function Archive() {
  const [activeView, setActiveView] = useState("operations");
  const [selectedResourceId, setSelectedResourceId] = useState(publishedResources[0].id);
  const [reason, setReason] = useState(
    "Reported rights conflict requires immediate removal from public discovery while the submission is re-verified."
  );
  const [selectedArchiveId, setSelectedArchiveId] = useState(archivedResources[0].id);
  const [restoreNote, setRestoreNote] = useState(
    "Metadata and rights check completed. Resource can safely return to public discovery."
  );
  const [resourceState, setResourceState] = useState(
    publishedResources.reduce((accumulator, resource) => {
      accumulator[resource.id] = {
        status: resource.status,
        visibility: resource.visibility,
        lastAction: "Monitoring",
      };
      return accumulator;
    }, {})
  );
  const [archiveState, setArchiveState] = useState(
    archivedResources.reduce((accumulator, resource) => {
      accumulator[resource.id] = {
        status: "Archived",
        visibility: resource.storage,
        lastAction: "Stored",
      };
      return accumulator;
    }, {})
  );

  const selectedResource = publishedResources.find((resource) => resource.id === selectedResourceId);
  const selectedArchivedResource = archivedResources.find((resource) => resource.id === selectedArchiveId);

  const selectedState = selectedResource ? resourceState[selectedResource.id] : null;
  const selectedArchiveState = selectedArchivedResource ? archiveState[selectedArchivedResource.id] : null;

  const handleEmergencyRemove = () => {
    if (!selectedResource) {
      return;
    }

    setResourceState((current) => ({
      ...current,
      [selectedResource.id]: {
        status: "Emergency Removed",
        visibility: "Restricted access",
        lastAction: "Emergency unpublish",
      },
    }));
  };

  const handleArchive = () => {
    if (!selectedResource) {
      return;
    }

    setResourceState((current) => ({
      ...current,
      [selectedResource.id]: {
        status: "Archived",
        visibility: "Archive vault",
        lastAction: "Archive resource",
      },
    }));
  };

  const handleRestore = () => {
    if (!selectedArchivedResource) {
      return;
    }

    setArchiveState((current) => ({
      ...current,
      [selectedArchivedResource.id]: {
        status: "Restore Approved",
        visibility: "Queued for public discovery",
        lastAction: "Restore resource",
      },
    }));
  };

  return (
    <AdminWorkspace
      eyebrow="Resource Control"
      title="Archive Management Center"
      description="Manage resource archiving and restoration from a single moderator-facing workspace."
      actions={[{ label: "Back to Dashboard", to: "/admin", variant: "secondary" }]}
    >
      <div className="operations-switcher">
        <button
          type="button"
          className={`operations-switcher__tab ${activeView === "operations" ? "operations-switcher__tab--active" : ""}`}
          onClick={() => setActiveView("operations")}
        >
          Overview
        </button>
        <button
          type="button"
          className={`operations-switcher__tab ${activeView === "unpublishing" ? "operations-switcher__tab--active" : ""}`}
          onClick={() => setActiveView("unpublishing")}
        >
          Archive
        </button>
        <button
          type="button"
          className={`operations-switcher__tab ${activeView === "restoration" ? "operations-switcher__tab--active" : ""}`}
          onClick={() => setActiveView("restoration")}
        >
          Restore
        </button>
      </div>

      <div className="audit-toolbar">
        <div className="audit-toolbar__filters admin-panel">
          <Input
            id="resource-keyword"
            label="Keyword"
            placeholder="Search title, contributor, action, or place"
            value=""
            onChange={() => {}}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="resource-risk">
              Risk Level
            </label>
            <select id="resource-risk" className="input-group__field" defaultValue="all">
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="policy">Policy Check</option>
              <option value="stable">Stable</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-group__label" htmlFor="resource-state">
              Resource State
            </label>
            <select id="resource-state" className="input-group__field" defaultValue="published">
              <option value="published">Published</option>
              <option value="removed">Emergency Removed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="audit-toolbar__actions">
            <Button variant="primary">Apply Filters</Button>
            <Button variant="secondary">Export Queue</Button>
          </div>
        </div>

        <div className="audit-toolbar__summary">
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Live Alerts</span>
            <strong className="audit-summary-card__value">2</strong>
            <p className="audit-summary-card__hint">Published resources currently flagged for immediate administrative review.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Removed Today</span>
            <strong className="audit-summary-card__value">1</strong>
            <p className="audit-summary-card__hint">Emergency removals prepared to disappear from public discovery immediately.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Archive Ready</span>
            <strong className="audit-summary-card__value">3</strong>
            <p className="audit-summary-card__hint">Published resources that can move into long-term restricted storage after review.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Audit Sync</span>
            <strong className="audit-summary-card__value">Live</strong>
            <p className="audit-summary-card__hint">Administrative actions in this workspace are reflected in the log panel below.</p>
          </div>
        </div>
      </div>

      {activeView === "operations" && (
        <div className="operations-overview">
          <article className="operations-overview__card">
            <span className="resource-control-panel__eyebrow">Archive Workflow</span>
            <h2>Move published content into archive quickly when policy, rights, or safety issues appear.</h2>
            <p>
              Move from live monitoring into an archive workflow with reason capture, status updates,
              and a linked audit trace.
            </p>
            <div className="operations-overview__actions">
              <Button variant="danger" onClick={() => setActiveView("unpublishing")}>
                Open Archive Desk
              </Button>
            </div>
          </article>

          <article className="operations-overview__card">
            <span className="resource-control-panel__eyebrow">Archive Recovery</span>
            <h2>Review archived resources and restore approved material back toward public visibility.</h2>
            <p>
              This flow complements archive controls and makes the resource lifecycle feel complete for administrators.
            </p>
            <div className="operations-overview__actions">
              <Button variant="primary" onClick={() => setActiveView("restoration")}>
                Open Restoration Desk
              </Button>
            </div>
          </article>

        </div>
      )}

      {activeView === "unpublishing" && (
        <div className="resource-control-layout">
          <div className="resource-control-list">
            {publishedResources.map((resource) => {
              const state = resourceState[resource.id];
              const isActive = resource.id === selectedResourceId;

              return (
                <article
                  key={resource.id}
                  className={`resource-control-card ${isActive ? "resource-control-card--active" : ""}`}
                >
                  <button
                    type="button"
                    className="resource-control-card__trigger"
                    onClick={() => setSelectedResourceId(resource.id)}
                  >
                    <div className="resource-control-card__meta">
                      <span className="audit-chip--status">{state.status}</span>
                      <span className="audit-chip">{resource.risk}</span>
                      <span className="audit-chip">{resource.category}</span>
                    </div>

                    <h2 className="resource-control-card__title">{resource.title}</h2>
                    <p className="resource-control-card__issue">{resource.issue}</p>

                    <div className="resource-control-card__facts">
                      <div>
                        <span>Contributor</span>
                        <strong>{resource.contributor}</strong>
                      </div>
                      <div>
                        <span>Published</span>
                        <strong>{resource.publishedAt}</strong>
                      </div>
                      <div>
                        <span>Visibility</span>
                        <strong>{state.visibility}</strong>
                      </div>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>

          {selectedResource && selectedState && (
            <div className="audit-panel">
              <section className="audit-panel__card audit-panel__card--priority">
                <div className="resource-control-panel__header">
                  <div>
                    <span className="resource-control-panel__eyebrow">Archive Candidate</span>
                    <h3 className="audit-panel__title">{selectedResource.title}</h3>
                  </div>
                  <span className="resource-control-panel__badge">{selectedState.status}</span>
                </div>

                <p className="audit-panel__description">
                  This control panel is shaped for archive actions: review the current exposure,
                  document the reason, and move public content into restricted access without leaving the page.
                </p>

                <div className="audit-detail-grid">
                  <div className="audit-detail-item">
                    <span className="audit-detail-item__label">Contributor</span>
                    <p className="audit-detail-item__value">{selectedResource.contributor}</p>
                  </div>
                  <div className="audit-detail-item">
                    <span className="audit-detail-item__label">Published At</span>
                    <p className="audit-detail-item__value">{selectedResource.publishedAt}</p>
                  </div>
                  <div className="audit-detail-item">
                    <span className="audit-detail-item__label">Place</span>
                    <p className="audit-detail-item__value">{selectedResource.place}</p>
                  </div>
                  <div className="audit-detail-item">
                    <span className="audit-detail-item__label">Current Visibility</span>
                    <p className="audit-detail-item__value">{selectedState.visibility}</p>
                  </div>
                  <div className="audit-detail-item audit-detail-item--wide">
                    <span className="audit-detail-item__label">Flagged Issue</span>
                    <p className="audit-detail-item__text">{selectedResource.issue}</p>
                  </div>
                </div>

                <div className="resource-control-panel__field">
                  <label className="input-group__label" htmlFor="unpublish-reason">
                    Archive Reason
                  </label>
                  <textarea
                    id="unpublish-reason"
                    className="resource-control-textarea"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Document the moderation rationale for urgent removal."
                  />
                </div>

                <div className="resource-control-panel__actions">
                  <Button variant="danger" onClick={handleEmergencyRemove}>
                    Emergency Archive
                  </Button>
                  <Button variant="secondary" onClick={handleArchive}>
                    Standard Archive
                  </Button>
                  <Button variant="primary">Notify Contributor</Button>
                </div>
              </section>

              <section className="audit-panel__card">
                <h3 className="audit-panel__title">Moderator Checklist</h3>
                <div className="audit-checklist">
                  <div className="audit-checklist__item">
                    <h4>Immediate Archive Control</h4>
                    <p>Use emergency archive when published content must disappear from public browsing before a full review finishes.</p>
                  </div>

                  <div className="audit-checklist__item">
                    <h4>Reason Capture</h4>
                    <p>Record enough context for the contributor and future administrators to understand why the action happened.</p>
                  </div>

                  <div className="audit-checklist__item">
                    <h4>Audit Continuity</h4>
                    <p>Each archive decision should generate a matching administrative log entry for later traceability.</p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {activeView === "restoration" && (
        <div className="resource-control-layout">
          <div className="resource-control-list">
            {archivedResources.map((resource) => {
              const state = archiveState[resource.id];
              const isActive = resource.id === selectedArchiveId;

              return (
                <article
                  key={resource.id}
                  className={`resource-control-card ${isActive ? "resource-control-card--active" : ""}`}
                >
                  <button
                    type="button"
                    className="resource-control-card__trigger"
                    onClick={() => setSelectedArchiveId(resource.id)}
                  >
                    <div className="resource-control-card__meta">
                      <span className="audit-chip--status">{state.status}</span>
                      <span className="audit-chip">{resource.previousState}</span>
                    </div>

                    <h2 className="resource-control-card__title">{resource.title}</h2>
                    <p className="resource-control-card__issue">{resource.archiveReason}</p>

                    <div className="resource-control-card__facts">
                      <div>
                        <span>Archived At</span>
                        <strong>{resource.archivedAt}</strong>
                      </div>
                      <div>
                        <span>Previous State</span>
                        <strong>{resource.previousState}</strong>
                      </div>
                      <div>
                        <span>Storage</span>
                        <strong>{state.visibility}</strong>
                      </div>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>

          {selectedArchivedResource && selectedArchiveState && (
            <div className="audit-panel">
              <section className="audit-panel__card audit-panel__card--priority">
                <div className="resource-control-panel__header">
                  <div>
                    <span className="resource-control-panel__eyebrow">Archived Resource</span>
                    <h3 className="audit-panel__title">{selectedArchivedResource.title}</h3>
                  </div>
                  <span className="resource-control-panel__badge">{selectedArchiveState.status}</span>
                </div>

                <p className="audit-panel__description">
                  Restore completes the archive lifecycle. Review the archived context, record the return note,
                  and mark the resource as ready for public visibility again.
                </p>

                <div className="audit-detail-grid">
                  <div className="audit-detail-item">
                    <span className="audit-detail-item__label">Archived At</span>
                    <p className="audit-detail-item__value">{selectedArchivedResource.archivedAt}</p>
                  </div>
                  <div className="audit-detail-item">
                    <span className="audit-detail-item__label">Previous State</span>
                    <p className="audit-detail-item__value">{selectedArchivedResource.previousState}</p>
                  </div>
                  <div className="audit-detail-item">
                    <span className="audit-detail-item__label">Current Storage</span>
                    <p className="audit-detail-item__value">{selectedArchiveState.visibility}</p>
                  </div>
                  <div className="audit-detail-item audit-detail-item--wide">
                    <span className="audit-detail-item__label">Archive Reason</span>
                    <p className="audit-detail-item__text">{selectedArchivedResource.archiveReason}</p>
                  </div>
                </div>

                <div className="resource-control-panel__field">
                  <label className="input-group__label" htmlFor="restore-note">
                    Restoration Note
                  </label>
                  <textarea
                    id="restore-note"
                    className="resource-control-textarea"
                    value={restoreNote}
                    onChange={(event) => setRestoreNote(event.target.value)}
                    placeholder="Explain why this archived resource can safely return."
                  />
                </div>

                <div className="resource-control-panel__actions">
                  <Button variant="primary" onClick={handleRestore}>
                    Restore Resource
                  </Button>
                  <Button variant="secondary">Request Metadata Check</Button>
                </div>
              </section>

              <section className="audit-panel__card">
                <h3 className="audit-panel__title">Restoration Checklist</h3>
                <div className="audit-checklist">
                  <div className="audit-checklist__item">
                    <h4>Cause Resolved</h4>
                    <p>Confirm the original archive or takedown issue has been addressed before restoring visibility.</p>
                  </div>

                  <div className="audit-checklist__item">
                    <h4>Metadata Ready</h4>
                    <p>Restored resources should return with clear metadata and no unresolved compliance notes.</p>
                  </div>

                  <div className="audit-checklist__item">
                    <h4>Return Path Logged</h4>
                    <p>Restoration actions should be logged so the platform can explain when and why access was reopened.</p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

    </AdminWorkspace>
  );
}

export default Archive;
