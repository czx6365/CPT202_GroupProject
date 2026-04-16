import React from "react";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import AdminWorkspace from "../AdminWorkspace";
import "./Announcements.css";

const announcementItems = [
  {
    id: "ann-101",
    title: "Platform maintenance window",
    audience: "All users",
    status: "Published",
    updatedAt: "2026-04-10 09:20",
    summary: "Scheduled maintenance for search indexing and media access on Saturday evening.",
  },
  {
    id: "ann-104",
    title: "Contributor metadata policy update",
    audience: "Contributors",
    status: "Draft",
    updatedAt: "2026-04-09 18:45",
    summary: "Updated guidance on copyright notes, place naming, and mandatory description fields.",
  },
  {
    id: "ann-098",
    title: "Volunteer archive campaign notice",
    audience: "Public",
    status: "Archived",
    updatedAt: "2026-04-08 14:10",
    summary: "Completed campaign announcement kept for internal reference and announcement history.",
  },
];

const selectedAnnouncement = announcementItems[0];

function Announcements() {
  return (
    <AdminWorkspace
      eyebrow="Announcements"
      title="System Announcements"
      description="Prepare, publish, and retire platform-wide notices from one administrator workspace. This management view is designed for future backend wiring while already presenting a complete announcement workflow."
      actions={[{ label: "Back to Dashboard", to: "/admin", variant: "secondary" }]}
    >
      <div className="announcement-toolbar">
        <div className="announcement-toolbar__filters admin-panel">
          <Input
            id="announcement-keyword"
            label="Keyword"
            placeholder="Search title or message summary"
            value=""
            onChange={() => {}}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="announcement-status">
              Status
            </label>
            <select id="announcement-status" className="input-group__field" defaultValue="all">
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-group__label" htmlFor="announcement-audience">
              Audience
            </label>
            <select id="announcement-audience" className="input-group__field" defaultValue="all">
              <option value="all">All Audiences</option>
              <option value="public">Public</option>
              <option value="contributors">Contributors</option>
              <option value="all-users">All users</option>
            </select>
          </div>

          <div className="announcement-toolbar__actions">
            <Button variant="primary">Apply Filters</Button>
            <Button variant="secondary">Reset</Button>
          </div>
        </div>

        <div className="announcement-toolbar__summary">
          <div className="announcement-summary-card">
            <span className="announcement-summary-card__label">Published</span>
            <strong className="announcement-summary-card__value">2</strong>
            <p className="announcement-summary-card__hint">Active notices currently prepared for platform display.</p>
          </div>
          <div className="announcement-summary-card">
            <span className="announcement-summary-card__label">Drafts</span>
            <strong className="announcement-summary-card__value">3</strong>
            <p className="announcement-summary-card__hint">Messages still waiting for editorial review or release timing.</p>
          </div>
          <div className="announcement-summary-card">
            <span className="announcement-summary-card__label">Archived</span>
            <strong className="announcement-summary-card__value">6</strong>
            <p className="announcement-summary-card__hint">Past notices retained in the management history for reference.</p>
          </div>
        </div>
      </div>

      <div className="announcement-layout">
        <div className="announcement-list">
          {announcementItems.map((item, index) => (
            <article
              key={item.id}
              className={`announcement-card ${index === 0 ? "announcement-card--active" : ""}`}
            >
              <div className="announcement-card__meta">
                <span className="announcement-chip--status">{item.status}</span>
                <span className="announcement-chip">{item.audience}</span>
              </div>

              <h2 className="announcement-card__title">{item.title}</h2>
              <p className="announcement-card__summary">{item.summary}</p>

              <div className="announcement-card__facts">
                <div>
                  <span>Updated</span>
                  <strong>{item.updatedAt}</strong>
                </div>
                <div>
                  <span>Audience</span>
                  <strong>{item.audience}</strong>
                </div>
              </div>

              <div className="announcement-card__actions">
                <Button variant="primary">Open Notice</Button>
                <Button variant="secondary">Duplicate</Button>
              </div>
            </article>
          ))}
        </div>

        <div className="announcement-side">
          <section className="announcement-panel">
            <h3 className="announcement-panel__title">Create Announcement</h3>
            <p className="announcement-panel__description">
              Draft a new system notice for platform maintenance, policy updates, or public communication.
            </p>

            <div className="announcement-form">
              <Input
                id="announcement-title"
                label="Title"
                placeholder="e.g. Scheduled maintenance notice"
                value=""
                onChange={() => {}}
              />

              <div className="input-group">
                <label className="input-group__label" htmlFor="announcement-target">
                  Audience
                </label>
                <select id="announcement-target" className="input-group__field" defaultValue="all-users">
                  <option value="all-users">All users</option>
                  <option value="public">Public</option>
                  <option value="contributors">Contributors</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-group__label" htmlFor="announcement-body">
                  Message
                </label>
                <textarea
                  id="announcement-body"
                  className="announcement-textarea"
                  placeholder="Write the announcement body that will later be shown in the public experience."
                  defaultValue=""
                />
              </div>

              <div className="announcement-form__actions">
                <Button variant="primary">Save Draft</Button>
                <Button variant="secondary">Publish Notice</Button>
              </div>
            </div>
          </section>

          <section className="announcement-panel">
            <h3 className="announcement-panel__title">Selected Notice</h3>
            <p className="announcement-panel__description">
              This preview area mirrors how the currently selected announcement can be reviewed before backend publishing is wired in.
            </p>

            <div className="announcement-preview">
              <span className="announcement-chip--status">{selectedAnnouncement.status}</span>
              <h4>{selectedAnnouncement.title}</h4>
              <p>{selectedAnnouncement.summary}</p>

              <div className="announcement-preview__facts">
                <div>
                  <span>Audience</span>
                  <strong>{selectedAnnouncement.audience}</strong>
                </div>
                <div>
                  <span>Updated</span>
                  <strong>{selectedAnnouncement.updatedAt}</strong>
                </div>
              </div>

              <div className="announcement-form__actions">
                <Button variant="secondary">Archive Notice</Button>
                <Button variant="primary">Republish</Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}

export default Announcements;
