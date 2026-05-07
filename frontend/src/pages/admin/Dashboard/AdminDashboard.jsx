import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchArchivedResources,
  fetchAuditLogs,
  fetchPendingReviews,
  fetchPendingUsers,
} from "../../../services/adminService";
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
    accent: "archive",
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
      "Prepare system announcements with draft, published, and archived states using the live announcement endpoints.",
    meta: "Notice",
    to: "/admin/announcements",
    accent: "announcement",
    preview: ["Draft", "Published", "Archived"],
  },
];

function AdminDashboard() {
  const { token, isAuthenticated, user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    pendingReviews: 0,
    pendingPromotions: 0,
    archivedResources: 0,
    auditLogs: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const isAdmin = user?.role === "ADMIN_REVIEWER";

  useEffect(() => {
    const loadDashboardStats = async () => {
      if (!isAuthenticated || !token || !isAdmin) {
        setDashboardStats({
          pendingReviews: 0,
          pendingPromotions: 0,
          archivedResources: 0,
          auditLogs: 0,
        });
        setIsStatsLoading(false);
        return;
      }

      setIsStatsLoading(true);
      setStatsError("");

      try {
        const [reviewResult, promotionResult, archiveResult, auditResult] = await Promise.all([
          fetchPendingReviews({ status: "PENDING_REVIEW", page: 0, size: 1 }, token),
          fetchPendingUsers(token),
          fetchArchivedResources({ page: 0, size: 1 }, token),
          fetchAuditLogs({}, token),
        ]);

        setDashboardStats({
          pendingReviews: getTotalCount(reviewResult),
          pendingPromotions: Array.isArray(promotionResult) ? promotionResult.length : 0,
          archivedResources: getTotalCount(archiveResult),
          auditLogs: Array.isArray(auditResult) ? auditResult.length : 0,
        });
      } catch (error) {
        setStatsError(error.message || "Unable to load dashboard data.");
      } finally {
        setIsStatsLoading(false);
      }
    };

    loadDashboardStats();
  }, [isAdmin, isAuthenticated, token]);

  return (
    <AdminWorkspace
      eyebrow="Administrator"
      title="Administrator Dashboard"
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
            </div>

            <div className="admin-dashboard__snapshot">
              <div className="admin-dashboard__snapshot-card admin-dashboard__snapshot-card--review">
                <span className="admin-dashboard__snapshot-pill">Queue</span>
                <strong>{formatStatValue(dashboardStats.pendingReviews, isStatsLoading, statsError)} Pending</strong>
                <span>Resources awaiting review</span>
              </div>
              <div className="admin-dashboard__snapshot-card admin-dashboard__snapshot-card--promotion">
                <span className="admin-dashboard__snapshot-pill">Promotion</span>
                <strong>{formatStatValue(dashboardStats.pendingPromotions, isStatsLoading, statsError)} Requests</strong>
                <span>Contributor applications</span>
              </div>
              <div className="admin-dashboard__snapshot-card admin-dashboard__snapshot-card--audit">
                <span className="admin-dashboard__snapshot-pill">Archive</span>
                <strong>{formatStatValue(dashboardStats.archivedResources, isStatsLoading, statsError)} Archived</strong>
                <span>Resources in archive</span>
              </div>
              <div className="admin-dashboard__snapshot-card admin-dashboard__snapshot-card--audit">
                <span className="admin-dashboard__snapshot-pill">Audit</span>
                <strong>{formatStatValue(dashboardStats.auditLogs, isStatsLoading, statsError)} Records</strong>
                <span>Logged admin actions</span>
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
                    <Button className={`admin-module-card__button admin-module-card__button--${module.accent}`} variant="secondary">
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

function getTotalCount(response) {
  if (typeof response?.totalElements === "number") return response.totalElements;
  if (Array.isArray(response?.content)) return response.content.length;
  if (Array.isArray(response)) return response.length;
  return 0;
}

function formatStatValue(value, isLoading, errorMessage) {
  if (isLoading) return "...";
  if (errorMessage) return "-";
  return value;
}

export default AdminDashboard;
