import React from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button/Button";
import "./ContributorWorkspace.css";

function ContributorWorkspace({
  eyebrow = "Contributor",
  title,
  description,
  actions = [],
  children,
}) {
  return (
    <section className="contributor-workspace">
      <div className="contributor-workspace__hero">
        <span className="contributor-workspace__eyebrow">{eyebrow}</span>
        <h1 className="contributor-workspace__title">{title}</h1>
        <p className="contributor-workspace__description">{description}</p>

        {actions.length > 0 && (
          <div className="contributor-workspace__actions">
            {actions.map((action) => (
              <Link key={action.to} to={action.to} className="contributor-workspace__action-link">
                <Button variant={action.variant || "secondary"}>{action.label}</Button>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="contributor-workspace__content">{children}</div>
    </section>
  );
}

export default ContributorWorkspace;
