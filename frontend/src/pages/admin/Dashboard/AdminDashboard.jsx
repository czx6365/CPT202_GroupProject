import React from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import AdminWorkspace from "../AdminWorkspace";
import "./AdminDashboard.css";

const adminModules = [
  {
    title: "Review Queue",
    subtitle: "Screen pending cultural submissions",
    description:
      "Open the moderation pipeline, inspect incoming resources, and guide submissions toward approval or revision.",
    meta: "Resources",
    to: "/admin/review",
    accent: "review",
    preview: ["Pending Review", "Metadata Check", "Approve / Reject"],
  },
  {
    title: "Contributor Promotion",
    subtitle: "Manage contributor access",
    description:
      "Review contributor requests and control who can enter the submission workflow on behalf of the platform.",
    meta: "People",
    to: "/admin/users",
    accent: "promotion",
    preview: ["Applicant Detail", "Role Upgrade", "Approval Notes"],
  },
  {
    title: "Master Data",
    subtitle: "Curate categories and tags",
    description:
      "Maintain the classification language that keeps public discovery, moderation, and future analytics organized.",
    meta: "Taxonomy",
    to: "/admin/master-data/categories",
    accent: "master-data",
    preview: ["Categories", "Tags", "Consistency Rules"],
  },
  {
    title: "Archive Management",
    subtitle: "Control archive and restore flows",
    description:
      "Manage archive decisions, restoration workflows, and resource lifecycle control from one operations center.",
    meta: "Archive",
    to: "/admin/archive",
    accent: "audit",
    preview: ["Archive", "Restore", "Lifecycle Control"],
  },
  {
    title: "Audit Logs",
    subtitle: "Track administrator actions",
    description:
      "Review cross-module administrator activity including review decisions, contributor approvals, archive events, and taxonomy changes.",
    meta: "Audit",
    to: "/admin/audit",
    accent: "audit",
    preview: ["Time", "Operator", "Action Status"],
  },
  {
    title: "Announcements",
    subtitle: "Manage platform notices",
    description:
      "Prepare system announcements with draft, published, and archived states so communication workflows are ready for later public wiring.",
    meta: "Notice",
    to: "/admin/announcements",
    accent: "announcement",
    preview: ["Draft", "Published", "Archived"],
  },
];

function AdminDashboard() {
  return (
    <AdminWorkspace
      eyebrow="Administrator"
      title="Administrator Dashboard"
      description="Use the control center below to move directly into moderation, contributor promotion, taxonomy management, archive management, audit review, and announcement control."
      actions={[
        { label: "Open Review Queue", to: "/admin/review", variant: "primary" },
        { label: "Open Promotion Desk", to: "/admin/users", variant: "secondary" },
      ]}
    >
      <div className="admin-grid">
        <div className="admin-grid__full">
          <div className="admin-dashboard__summary">
            <div className="admin-dashboard__summary-copy">
              <span className="admin-dashboard__summary-label">Control Center</span>
              <h2 className="admin-dashboard__summary-title">Moderate, organize, and govern the platform from one place.</h2>
              <p className="admin-dashboard__summary-text">
                The administrator dashboard should feel like the first screen after a successful admin
                login: focused, visual, and ready to branch into each management flow without exposing
                visitor-only navigation.
              </p>
            </div>

            <div className="admin-dashboard__snapshot">
              <div className="admin-dashboard__snapshot-card admin-dashboard__snapshot-card--review">
                <span className="admin-dashboard__snapshot-pill">Queue</span>
                <strong>12 Pending</strong>
                <span>Ready for moderation</span>
              </div>
              <div className="admin-dashboard__snapshot-card admin-dashboard__snapshot-card--promotion">
                <span className="admin-dashboard__snapshot-pill">Promotion</span>
                <strong>4 Requests</strong>
                <span>Awaiting contributor approval</span>
              </div>
              <div className="admin-dashboard__snapshot-card admin-dashboard__snapshot-card--audit">
                <span className="admin-dashboard__snapshot-pill">Archive</span>
                <strong>Lifecycle Desk</strong>
                <span>Archive, restore, and trace resource actions</span>
              </div>
              <div className="admin-dashboard__snapshot-card admin-dashboard__snapshot-card--audit">
                <span className="admin-dashboard__snapshot-pill">Audit</span>
                <strong>Live Trace</strong>
                <span>See review, archive, promotion, and taxonomy history</span>
              </div>
            </div>
          </div>

          <div className="admin-card-grid admin-card-grid--dashboard">
            {adminModules.map((module) => (
              <article key={module.to} className={`admin-module-card admin-module-card--${module.accent}`}>
                <div className="admin-module-card__visual" aria-hidden="true">
                  <div className="admin-module-card__visual-frame">
                    {module.preview.map((item) => (
                      <span key={item} className="admin-module-card__visual-chip">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="admin-module-card__content">
                  <span className="admin-feature-card__meta">{module.meta}</span>
                  <h3 className="admin-module-card__title">{module.title}</h3>
                  <p className="admin-module-card__subtitle">{module.subtitle}</p>
                  <p className="admin-module-card__description">{module.description}</p>

                  <Link to={module.to} className="admin-feature-card__link">
                    <Button variant={module.accent === "review" ? "primary" : "secondary"}>
                      Enter Section
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </AdminWorkspace>
  );
}

export default AdminDashboard;
