import React, { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import { useAuth } from "../context/AuthContext";
import "./AppShell.css";

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isContributorRoute = location.pathname.startsWith("/contributor");
  const isApprovedContributor =
    (role === "CONTRIBUTOR" || role === "contributor") && Boolean(user?.contributorApproved);
  const isAdminUser = role === "ADMIN_REVIEWER" || role === "admin";

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isAdminRoute && !isAuthenticated) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [isAdminRoute, isAuthenticated, location.pathname, navigate]);

  const navLinks = useMemo(() => {
    const guestLinks = [
      { label: "Home", key: "/" },
      { label: "Explore", key: "/discovery" },
      { label: "Login", key: "/login" },
      { label: "Register", key: "/register" },
    ];

    const viewerLinks = [
      { label: "Home", key: "/" },
      { label: "Explore", key: "/discovery" },
      { label: "Profile", key: "/profile" },
    ];

    if (isAdminRoute) {
      return [
        { label: "Overview", key: "/admin" },
        { label: "Review", key: "/admin/review" },
        { label: "Promotion", key: "/admin/users" },
        { label: "Master Data", key: "/admin/master-data/categories" },
        { label: "Audit", key: "/admin/audit" },
      ];
    }

    if (isApprovedContributor || isContributorRoute) {
      return [
        { label: "Home", key: "/contributor" },
        { label: "Explore", key: "/contributor/explore" },
        { label: "Profile", key: "/contributor/profile" },
        { label: "Create Draft", key: "/contributor/createdraft" },
        { label: "View Drafts", key: "/contributor/drafts" },
        { label: "My Submission", key: "/contributor/submissions" },
      ];
    }

    if (!isAuthenticated) {
      return guestLinks;
    }

    if (isAdminUser) {
      return [
        { label: "Home", key: "/" },
        { label: "Explore", key: "/discovery" },
        { label: "Profile", key: "/profile" },
        { label: "Admin", key: "/admin" },
        { label: "Review", key: "/admin/review" },
        { label: "Users", key: "/admin/users" },
        { label: "Categories", key: "/admin/master-data/categories" },
        { label: "Audit", key: "/admin/audit" },
      ];
    }

    return viewerLinks;
  }, [isAdminRoute, isApprovedContributor, isAuthenticated, isAdminUser, isContributorRoute]);

  const avatarLabel = user?.userName?.slice(0, 1)?.toUpperCase() || "H";
  const isHome = location.pathname === "/" || location.pathname === "/contributor";
  const headerClassName = `app-shell__header ${isHome && !isScrolled ? "app-shell__header--floating" : "app-shell__header--solid"} ${isAdminRoute ? "app-shell__header--admin" : ""}`;

  const handleLogout = () => {
    const shouldReturnToLogin = isAdminRoute || isAuthenticated;
    logout();
    navigate(shouldReturnToLogin ? "/login" : "/", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className={headerClassName}>
        <div className="app-shell__nav-wrap">
          <Navbar
            links={navLinks}
            onNavigate={(path) => navigate(path)}
            user={normalizeNavbarUser(role, user?.contributorApproved)}
          />

          <div className="app-shell__account">
            {isAuthenticated ? (
              <>
                <Link
                  to={getProfilePath(location.pathname, isAdminRoute, role, user?.contributorApproved)}
                  className={`app-shell__profile-chip ${isAdminRoute ? "app-shell__profile-chip--admin" : ""}`}
                >
                  <span className="app-shell__avatar">{avatarLabel}</span>
                  <span className="app-shell__profile-text">
                    {user?.userName || (isAdminRoute ? "Admin Profile" : "Profile")}
                  </span>
                  <span className="app-shell__role-text">{formatRoleLabel(role, user?.contributorApproved)}</span>
                </Link>
                <button type="button" className="app-shell__logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : isAdminRoute ? (
              <div className="app-shell__profile-chip app-shell__profile-chip--admin-preview">
                <span className="app-shell__avatar">A</span>
                <span className="app-shell__profile-text">Admin Preview</span>
              </div>
            ) : isApprovedContributor || isContributorRoute ? (
              <div className="app-shell__profile-chip app-shell__profile-chip--contributor-preview">
                <span className="app-shell__avatar">C</span>
                <span className="app-shell__profile-text">Contributor</span>
              </div>
            ) : (
              <div className="app-shell__guest-label">Guest Access</div>
            )}
          </div>
        </div>
      </header>

      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}

function normalizeNavbarUser(role, contributorApproved) {
  if ((role === "CONTRIBUTOR" || role === "contributor") && contributorApproved) {
    return { role: "contributor" };
  }

  return null;
}

function formatRoleLabel(role, contributorApproved) {
  if (role === "ADMIN_REVIEWER" || role === "admin") return "Administrator";
  if (role === "CONTRIBUTOR" || role === "contributor") {
    return contributorApproved ? "Contributor" : "Pending Contributor";
  }
  return "Registered Viewer";
}

function getProfilePath(pathname, isAdminRoute, role, contributorApproved) {
  if (isAdminRoute) return "/profile";

  if (pathname.startsWith("/contributor")) {
    return "/contributor/profile";
  }

  if ((role === "CONTRIBUTOR" || role === "contributor") && contributorApproved) {
    return "/contributor/profile";
  }

  return "/profile";
}

export default AppShell;
