import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HeroSection from "../../../components/homepage/HeroSection";
import CategorySection from "../../../components/homepage/CategorySection";
import FeaturedSection from "../../../components/homepage/FeaturedSection";
import { useAuth } from "../../../context/AuthContext";
import { fetchMyResources } from "../../../services/resourceService";
import { getMockContributorResources } from "../mockContributorData";
import { summarizeContributorResources } from "../resourceStatus";
import "../../Homepage.css";
import "./Dashboard.css";

function Dashboard() {
  const { token, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const sections = document.querySelectorAll(".reveal-section");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadResources = async () => {
      if (!token) {
        setResources(getMockContributorResources());
        return;
      }

      try {
        const result = await fetchMyResources(token);
        setResources(Array.isArray(result) ? result : []);
      } catch (error) {
        setResources([]);
        setErrorMessage(error.message || "Unable to load your live contributor workspace right now.");
      }
    };

    loadResources();
  }, [token]);

  const summary = useMemo(() => summarizeContributorResources(resources), [resources]);
  const contributorApproved = Boolean(user?.contributorApproved);

  const overviewCards = [
    {
      label: "Drafts",
      value: summary.DRAFT,
      hint: "Continue writing and save incomplete material.",
      to: "/contributor/drafts",
    },
    {
      label: "Pending Review",
      value: summary.PENDING_REVIEW,
      hint: "Resources waiting for moderator decision.",
      to: "/contributor/submissions",
    },
    {
      label: "Approved",
      value: summary.APPROVED,
      hint: "Published contributions now visible in discovery.",
      to: "/contributor/submissions",
    },
    {
      label: "Rejected",
      value: summary.REJECTED,
      hint: "Feedback available for revision and resubmission.",
      to: "/contributor/submissions",
    },
  ];

  return (
    <div className="contributor-homepage homepage">
      <HeroSection />
      <CategorySection />
      <FeaturedSection />

      <section className="homepage-section reveal-section">
        <div className="contributor-overview">
          <div className="contributor-overview__heading">
            <div>
              <span className="section-heading__eyebrow">Contributor Workflow</span>
              <h2 className="section-heading__title">Your contribution status at a glance</h2>
              <p className="section-heading__text">
                Move smoothly from draft creation to review and publication while keeping your contributor workspace in view.
              </p>
            </div>

            <div className="contributor-overview__status">
              <span
                className={`contributor-overview__status-chip contributor-overview__status-chip--${
                  contributorApproved ? "approved" : "pending"
                }`}
              >
                {contributorApproved ? "Contributor Approved" : "Approval Pending"}
              </span>
              <p className="contributor-overview__status-text">
                {contributorApproved
                  ? "You can create drafts and submit complete records for review."
                  : "You can prepare resources now, but final submission remains locked until approval."}
              </p>
            </div>
          </div>

          <div className="contributor-overview__grid">
            {overviewCards.map((card) => (
              <Link key={card.label} to={card.to} className="contributor-overview__card">
                <span className="contributor-overview__card-label">{card.label}</span>
                <strong className="contributor-overview__card-value">{card.value}</strong>
                <p className="contributor-overview__card-text">{card.hint}</p>
              </Link>
            ))}
          </div>

          <div className="contributor-overview__actions">
            <Link to="/contributor/createdraft" className="contributor-overview__action">
              Create Draft
            </Link>
            <Link to="/contributor/drafts" className="contributor-overview__action contributor-overview__action--secondary">
              View Drafts
            </Link>
            <Link
              to="/contributor/submissions"
              className="contributor-overview__action contributor-overview__action--secondary"
            >
              My Submission
            </Link>
          </div>

          {errorMessage && <p className="contributor-overview__error">{errorMessage}</p>}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
