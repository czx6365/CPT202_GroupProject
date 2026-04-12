import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import { useAuth } from "../../../context/AuthContext";
import { fetchMyResources } from "../../../services/resourceService";
import ContributorWorkspace from "../ContributorWorkspace";
import { getMockContributorResources } from "../mockContributorData";
import "./Profile.css";

function Profile() {
  const { token, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadResources = async () => {
      if (!token) {
        setResources(getMockContributorResources());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchMyResources(token);
        setResources(Array.isArray(result) ? result : []);
      } catch (error) {
        setResources([]);
        setErrorMessage(error.message || "Unable to load your live contributor activity right now.");
      } finally {
        setIsLoading(false);
      }
    };

    loadResources();
  }, [token]);

  const summary = useMemo(() => {
    const counts = {
      total: resources.length,
      drafts: 0,
      submissions: 0,
      approved: 0,
    };

    resources.forEach((resource) => {
      if (resource.status === "DRAFT") {
        counts.drafts += 1;
        return;
      }

      counts.submissions += 1;

      if (resource.status === "APPROVED") {
        counts.approved += 1;
      }
    });

    return counts;
  }, [resources]);

  return (
    <ContributorWorkspace
      eyebrow="Contributor Profile"
      title="My Contributor Profile"
      description="Review your contributor identity, approval status, and contribution activity from a dedicated profile page within the contributor workspace."
      actions={[
        { label: "Contributor Home", to: "/contributor", variant: "secondary" },
        { label: "Create Draft", to: "/contributor/createdraft", variant: "primary" },
      ]}
    >
      <div className="contributor-profile">
        <section className="contributor-profile__header">
          <div className="contributor-profile__identity">
            <span className="contributor-profile__avatar">
              {user?.userName?.slice(0, 1)?.toUpperCase() || "C"}
            </span>
            <div>
              <p className="contributor-profile__eyebrow">Account Identity</p>
              <h2 className="contributor-profile__name">{user?.userName || "Contributor"}</h2>
              <p className="contributor-profile__meta">
                {user?.email || "Email not available"} {" · "}
                {user?.contributorApproved ? "Approved Contributor" : "Contributor Approval Pending"}
              </p>
            </div>
          </div>

          <div className="contributor-profile__status-panel">
            <span
              className={`contributor-profile__status-chip contributor-profile__status-chip--${
                user?.contributorApproved ? "approved" : "pending"
              }`}
            >
              {user?.contributorApproved ? "Approved to Submit" : "Approval Pending"}
            </span>
            <p className="contributor-profile__status-text">
              {user?.contributorApproved
                ? "Your account can create drafts and move eligible resources into the review workflow."
                : "You can continue preparing materials, but final submission remains unavailable until approval is granted."}
            </p>
          </div>
        </section>

        <section className="contributor-profile__summary">
          <article className="contributor-profile__summary-card">
            <span className="contributor-profile__summary-label">All Resources</span>
            <strong className="contributor-profile__summary-value">{summary.total}</strong>
          </article>
          <article className="contributor-profile__summary-card">
            <span className="contributor-profile__summary-label">Drafts</span>
            <strong className="contributor-profile__summary-value">{summary.drafts}</strong>
          </article>
          <article className="contributor-profile__summary-card">
            <span className="contributor-profile__summary-label">Submitted</span>
            <strong className="contributor-profile__summary-value">{summary.submissions}</strong>
          </article>
          <article className="contributor-profile__summary-card">
            <span className="contributor-profile__summary-label">Approved</span>
            <strong className="contributor-profile__summary-value">{summary.approved}</strong>
          </article>
        </section>

        <div className="contributor-profile__layout">
          <section className="contributor-profile__panel">
            <h3 className="contributor-profile__panel-title">Account Overview</h3>

            <div className="contributor-profile__facts">
              <div className="contributor-profile__fact">
                <span>Role</span>
                <strong>Contributor</strong>
              </div>
              <div className="contributor-profile__fact">
                <span>Approval</span>
                <strong>{user?.contributorApproved ? "Approved" : "Pending"}</strong>
              </div>
              <div className="contributor-profile__fact">
                <span>Email</span>
                <strong>{user?.email || "Not available"}</strong>
              </div>
            </div>
          </section>

          <section className="contributor-profile__panel">
            <h3 className="contributor-profile__panel-title">Quick Navigation</h3>
            <div className="contributor-profile__actions">
              <Link className="contributor-profile__action-link" to="/contributor/createdraft">
                <Button variant="primary">Create Draft</Button>
              </Link>
              <Link className="contributor-profile__action-link" to="/contributor/drafts">
                <Button variant="secondary">View Drafts</Button>
              </Link>
              <Link className="contributor-profile__action-link" to="/contributor/submissions">
                <Button variant="secondary">My Submission</Button>
              </Link>
            </div>
          </section>
        </div>

        {isLoading && <p className="contributor-profile__state">Loading profile activity...</p>}
        {errorMessage && <p className="contributor-profile__error">{errorMessage}</p>}
      </div>
    </ContributorWorkspace>
  );
}

export default Profile;
