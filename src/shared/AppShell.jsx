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

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = useMemo(() => {
    const baseLinks = [
      { label: "Home", key: "/" },
      { label: "Explore", key: "/discovery" },
    ];

    if (!isAuthenticated) {
      return [...baseLinks, { label: "Login", key: "/login" }, { label: "Register", key: "/register" }];
    }

    if (role === "ADMIN_REVIEWER" || role === "admin") {
      return [...baseLinks, { label: "Review", key: "/admin/review" }, { label: "Users", key: "/admin/users" }];
    }

    if (role === "CONTRIBUTOR" || role === "contributor") {
      return [...baseLinks, { label: "Dashboard", key: "/dashboard" }, { label: "Submit", key: "/submit" }];
    }

    return [...baseLinks, { label: "Profile", key: "/profile" }];
  }, [isAuthenticated, role]);

  const avatarLabel = user?.userName?.slice(0, 1)?.toUpperCase() || "H";
  const isHome = location.pathname === "/";
  const headerClassName = `app-shell__header ${isHome && !isScrolled ? "app-shell__header--floating" : "app-shell__header--solid"}`;

  return (
    <div className="app-shell">
      <header className={headerClassName}>
        <div className="app-shell__nav-wrap">
          <Navbar links={navLinks} onNavigate={(path) => navigate(path)} user={normalizeNavbarUser(role)} />

          <div className="app-shell__account">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="app-shell__profile-chip">
                  <span className="app-shell__avatar">{avatarLabel}</span>
                  <span className="app-shell__profile-text">{user?.userName || "Profile"}</span>
                </Link>
                <button type="button" className="app-shell__logout" onClick={logout}>
                  Logout
                </button>
              </>
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

function normalizeNavbarUser(role) {
  if (role === "CONTRIBUTOR" || role === "contributor") {
    return { role: "contributor" };
  }

  return null;
}

export default AppShell;
