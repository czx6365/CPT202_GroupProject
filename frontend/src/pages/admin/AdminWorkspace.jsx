import React from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button/Button";
import "./AdminWorkspace.css";

function AdminWorkspace({
  eyebrow = "Administrator",
  title,
  description,
  actions = [],
  children,
}) {
  return (
    <section className="admin-workspace">
      <div className="admin-workspace__hero">
        <span className="admin-workspace__eyebrow">{eyebrow}</span>
        <h1 className="admin-workspace__title">{title}</h1>
        <p className="admin-workspace__description">{description}</p>

        {actions.length > 0 && (
          <div className="admin-workspace__actions">
            {actions.map((action) => (
              <Link key={action.to} to={action.to} className="admin-workspace__action-link">
                <Button variant={action.variant || "secondary"}>{action.label}</Button>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="admin-workspace__content">{children}</div>
    </section>
  );
}

export default AdminWorkspace;
