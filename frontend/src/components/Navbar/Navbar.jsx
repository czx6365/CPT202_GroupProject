import React from "react";
import "./Navbar.css";

function Navbar({ user, onNavigate, links }) {
  const defaultLinks = [
    { label: "Home", key: "home" },
    { label: "Explore", key: "explore" },
    { label: "Profile", key: "profile" },
  ];

  const resolvedLinks = Array.isArray(links) && links.length > 0 ? [...links] : [...defaultLinks];

  const hasContributorDraftsLink = resolvedLinks.some(
    (link) => link.key === "drafts" || link.key === "/contributor/drafts"
  );

  if (user?.role === "contributor" && !hasContributorDraftsLink) {
    resolvedLinks.push({ label: "Drafts", key: "/contributor/drafts" });
  }

  return (
    <nav className="navbar" aria-label="Primary navigation">
      <div className="navbar__brand">HeritageHub</div>

      <div className="navbar__links">
        {resolvedLinks.map((link) => (
          <button
            key={link.key}
            type="button"
            className="navbar__link"
            onClick={() => onNavigate?.(link.key)}
          >
            {link.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
