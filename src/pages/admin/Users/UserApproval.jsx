import React from "react";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import AdminWorkspace from "../AdminWorkspace";
import "./UserApproval.css";

const pendingApplicants = [
  {
    id: "usr-301",
    name: "Lin Qiao",
    email: "lin.qiao@heritagehub.org",
    currentRole: "Registered Viewer",
    requestedAt: "2026-04-06 09:15",
    focus: "Oral traditions and neighborhood interviews",
    contributionPlan:
      "Plans to document intergenerational festival stories, interview long-term residents, and submit audio-supported community narratives.",
    status: "Awaiting Approval",
    readiness: "Application Complete",
  },
  {
    id: "usr-305",
    name: "Wang Zhen",
    email: "wang.zhen@heritagehub.org",
    currentRole: "Registered Viewer",
    requestedAt: "2026-04-05 18:40",
    focus: "Built heritage photography",
    contributionPlan:
      "Intends to contribute documented photo surveys of historic lane houses with descriptive metadata and preservation notes.",
    status: "Awaiting Approval",
    readiness: "Needs Final Review",
  },
  {
    id: "usr-309",
    name: "He Yutong",
    email: "he.yutong@heritagehub.org",
    currentRole: "Registered Viewer",
    requestedAt: "2026-04-05 11:05",
    focus: "Market culture and food memory",
    contributionPlan:
      "Would like to archive interviews and photographs related to long-running food stalls, seasonal rituals, and informal local knowledge.",
    status: "Awaiting Approval",
    readiness: "Application Complete",
  },
];

const selectedApplicant = {
  name: "Lin Qiao",
  email: "lin.qiao@heritagehub.org",
  currentRole: "Registered Viewer",
  requestedRole: "Contributor",
  requestedAt: "2026-04-06 09:15",
  location: "Suzhou Industrial District",
  experience: "Community oral history volunteer for 2 years",
  contributionPlan:
    "I want to contribute interview-based records about local celebrations, elder memories, and small neighborhood landmarks that are often missing from formal archives.",
  motivation:
    "My goal is to help younger residents understand why these stories matter and to preserve context before community memory becomes fragmented.",
  interests: ["Oral History", "Festivals", "Community Identity", "Audio Documentation"],
};

function UserApproval() {
  return (
    <AdminWorkspace
      eyebrow="Contributor Access"
      title="User Approval"
      description="Review contributor promotion requests from registered users and decide who can enter the submission workflow. This static workspace already mirrors the future approval flow with filters, applicant cards, and a decision panel."
      actions={[{ label: "Back to Dashboard", to: "/admin", variant: "secondary" }]}
    >
      <div className="approval-toolbar">
        <div className="approval-toolbar__filters admin-panel">
          <Input
            id="approval-keyword"
            label="Keyword"
            placeholder="Search applicant name or email"
            value=""
            onChange={() => {}}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="approval-status">
              Status
            </label>
            <select id="approval-status" className="input-group__field" defaultValue="pending">
              <option value="pending">Awaiting Approval</option>
              <option value="approved">Approved</option>
              <option value="hold">Needs Review</option>
            </select>
          </div>

          <div className="approval-toolbar__actions">
            <Button variant="primary">Apply Filters</Button>
            <Button variant="secondary">Reset</Button>
          </div>
        </div>

        <div className="approval-toolbar__summary">
          <div className="approval-summary-card">
            <span className="approval-summary-card__label">Pending</span>
            <strong className="approval-summary-card__value">7</strong>
            <p className="approval-summary-card__hint">Applications waiting for administrator decision.</p>
          </div>
          <div className="approval-summary-card">
            <span className="approval-summary-card__label">Ready</span>
            <strong className="approval-summary-card__value">4</strong>
            <p className="approval-summary-card__hint">Applications with enough information for approval now.</p>
          </div>
          <div className="approval-summary-card">
            <span className="approval-summary-card__label">Review Hold</span>
            <strong className="approval-summary-card__value">2</strong>
            <p className="approval-summary-card__hint">Applications needing a secondary policy check.</p>
          </div>
          <div className="approval-summary-card">
            <span className="approval-summary-card__label">This Week</span>
            <strong className="approval-summary-card__value">11</strong>
            <p className="approval-summary-card__hint">New contributor requests received this week.</p>
          </div>
        </div>
      </div>

      <div className="approval-layout">
        <div className="approval-list">
          {pendingApplicants.map((applicant, index) => (
            <article
              key={applicant.id}
              className={`approval-card ${index === 0 ? "approval-card--active" : ""}`}
            >
              <div className="approval-card__content">
                <div className="approval-card__meta">
                  <span className="approval-chip--status">{applicant.status}</span>
                  <span className="approval-chip">{applicant.currentRole}</span>
                  <span className="approval-chip">{applicant.readiness}</span>
                </div>

                <h2 className="approval-card__title">{applicant.name}</h2>
                <p className="approval-card__subtitle">{applicant.email}</p>
                <p className="approval-card__description">{applicant.contributionPlan}</p>
              </div>

              <div className="approval-card__facts">
                <div className="approval-card__fact">
                  <span>Requested</span>
                  <strong>{applicant.requestedAt}</strong>
                </div>
                <div className="approval-card__fact">
                  <span>Focus</span>
                  <strong>{applicant.focus}</strong>
                </div>
                <div className="approval-card__fact">
                  <span>Promotion Path</span>
                  <strong>Viewer → Contributor</strong>
                </div>

                <div className="approval-card__footer">
                  <Button variant="primary">Open Applicant</Button>
                  <Button variant="secondary" className="approval-card__secondary">
                    Quick Approve
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="approval-detail">
          <section className="approval-panel">
            <div className="approval-profile">
              <span className="approval-profile__avatar">L</span>

              <div>
                <h3 className="approval-profile__name">{selectedApplicant.name}</h3>
                <p className="approval-profile__role">
                  {selectedApplicant.currentRole} requesting promotion to {selectedApplicant.requestedRole}
                </p>
              </div>
            </div>

            <div className="approval-data-grid">
              <div className="approval-data-item">
                <span className="approval-data-item__label">Email</span>
                <p className="approval-data-item__value">{selectedApplicant.email}</p>
              </div>

              <div className="approval-data-item">
                <span className="approval-data-item__label">Requested At</span>
                <p className="approval-data-item__value">{selectedApplicant.requestedAt}</p>
              </div>

              <div className="approval-data-item">
                <span className="approval-data-item__label">Location</span>
                <p className="approval-data-item__value">{selectedApplicant.location}</p>
              </div>

              <div className="approval-data-item">
                <span className="approval-data-item__label">Experience</span>
                <p className="approval-data-item__value">{selectedApplicant.experience}</p>
              </div>

              <div className="approval-data-item approval-data-item--full">
                <span className="approval-data-item__label">Contribution Plan</span>
                <p className="approval-data-item__text">{selectedApplicant.contributionPlan}</p>
              </div>

              <div className="approval-data-item approval-data-item--full">
                <span className="approval-data-item__label">Motivation</span>
                <p className="approval-data-item__text">{selectedApplicant.motivation}</p>
              </div>

              <div className="approval-data-item approval-data-item--full">
                <span className="approval-data-item__label">Content Interests</span>
                <div className="approval-interest-list">
                  {selectedApplicant.interests.map((interest) => (
                    <span key={interest} className="approval-chip">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="approval-panel">
            <h3 className="approval-panel__title">Decision Panel</h3>
            <p className="approval-panel__description">
              This panel is reserved for the final administrator decision. Later, the approve action
              will trigger the real promotion API and refresh the pending list.
            </p>

            <div className="approval-panel__section">
              <span className="approval-panel__section-label">Approval Note</span>
              <textarea
                className="approval-note"
                placeholder="Record internal notes about approval readiness, applicant fit, or policy concerns."
                defaultValue="Applicant shows a clear cultural contribution plan and enough background context to join the contributor workflow."
              />
            </div>

            <div className="approval-panel__actions">
              <Button variant="primary">Approve Contributor</Button>
              <Button variant="secondary">Request Clarification</Button>
            </div>

            <p className="approval-panel__note">
              Future behavior: approval should update the applicant role path, while clarification can
              be used for internal moderation follow-up.
            </p>
          </section>

          <section className="approval-panel">
            <h3 className="approval-panel__title">Review Checklist</h3>
            <div className="approval-checklist">
              <div className="approval-checklist__item">
                <h4>Identity Context</h4>
                <p>Applicant profile is complete enough for admin-side review and role transition.</p>
              </div>

              <div className="approval-checklist__item">
                <h4>Contribution Clarity</h4>
                <p>The submission plan clearly explains what heritage material the user intends to contribute.</p>
              </div>

              <div className="approval-checklist__item">
                <h4>Platform Fit</h4>
                <p>The proposed content aligns with community heritage sharing rather than general social posting.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}

export default UserApproval;
