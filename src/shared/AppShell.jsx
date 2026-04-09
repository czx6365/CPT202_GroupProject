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
    const baseLinks = [
      { label: "Home", key: "/" },
      { label: "Explore", key: "/discovery" },
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

    if (!isAuthenticated) {
      return [...baseLinks, { label: "Login", key: "/login" }, { label: "Register", key: "/register" }];
    }

    if (role === "ADMIN_REVIEWER" || role === "admin") {
      return [
        ...baseLinks,
        { label: "Admin", key: "/admin" },
        { label: "Review", key: "/admin/review" },
        { label: "Users", key: "/admin/users" },
        { label: "Categories", key: "/admin/master-data/categories" },
        { label: "Audit", key: "/admin/audit" },
      ];
    }

    const isApprovedContributor =
      (role === "CONTRIBUTOR" || role === "contributor") && Boolean(user?.contributorApproved);

    if (isApprovedContributor) {
      return [...baseLinks, { label: "Dashboard", key: "/dashboard" }, { label: "Submit", key: "/submit" }];
    }

    return [...baseLinks, { label: "Profile", key: "/profile" }];
  }, [isAdminRoute, isAuthenticated, role, user?.contributorApproved]);

  const avatarLabel = user?.userName?.slice(0, 1)?.toUpperCase() || "H";
  const isHome = location.pathname === "/";
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
                  to={isAdminRoute ? "/profile" : "/profile"}
                  className={`app-shell__profile-chip ${isAdminRoute ? "app-shell__profile-chip--admin" : ""}`}
                >
                  <span className="app-shell__avatar">{avatarLabel}</span>
                  <span className="app-shell__profile-text">
                    {user?.userName || (isAdminRoute ? "Admin Profile" : "Profile")}
                  </span>
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

export default AppShell;
