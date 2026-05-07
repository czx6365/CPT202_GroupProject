import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HeroSection from "../../../components/homepage/HeroSection";
import CategorySection from "../../../components/homepage/CategorySection";
import FeaturedSection from "../../../components/homepage/FeaturedSection";
import { useAuth } from "../../../context/AuthContext";
import { fetchVisibleAnnouncements } from "../../../services/announcementService";
import { fetchMyResources } from "../../../services/resourceService";
import { summarizeContributorResources } from "../resourceStatus";
import "../../Homepage.css";
import "./Dashboard.css";

function Dashboard() {
  const { token, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [announcementError, setAnnouncementError] = useState("");

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
        setResources([]);
        return;
      }

      try {
        const result = await fetchMyResources(token);
        setResources(Array.isArray(result) ? result : []);
      } catch (error) {
        setResources([]);
        if (error.status === 401) {
          setErrorMessage("Your session has expired. Please log in again to load your contributor workspace.");
        } else {
          setErrorMessage(error.message || "Unable to load your contributor workspace right now.");
        }
      }
    };

    loadResources();
  }, [token]);

  useEffect(() => {
    const loadAnnouncements = async () => {
      if (!token) {
        setAnnouncements([]);
        return;
      }

      try {
        const result = await fetchVisibleAnnouncements(token);
        setAnnouncements(Array.isArray(result) ? result : []);
        setAnnouncementError("");
      } catch (error) {
        setAnnouncements([]);
        setAnnouncementError(error.message || "Unable to load platform announcements.");
      }
    };

    loadAnnouncements();
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

      <section className="homepage-section">
        <div className="contributor-announcements">
          <div className="contributor-announcements__heading">
            <span className="section-heading__eyebrow">Platform Notices</span>
            <h2 className="section-heading__title">Announcements for your account</h2>
            <p className="section-heading__text">
              Published notices from administrators appear here when they are targeted to all users or contributors.
            </p>
          </div>

          {announcements.length > 0 ? (
            <div className="contributor-announcements__list">
              {announcements.map((announcement) => (
                <article key={announcement.announcementId} className="contributor-announcement-card">
                  <span className="contributor-announcement-card__audience">
                    {formatAnnouncementAudience(announcement.audience)}
                  </span>
                  <h3>{announcement.title}</h3>
                  <p>{announcement.content}</p>
                  <time>{formatAnnouncementDate(announcement.updatedAt)}</time>
                </article>
              ))}
            </div>
          ) : (
            <p className="contributor-announcements__empty">No published announcements are available for your account right now.</p>
          )}

          {announcementError && <p className="contributor-overview__error">{announcementError}</p>}
        </div>
      </section>

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

function formatAnnouncementAudience(value) {
  if (value === "ALL_USERS") return "All Users";
  if (value === "CONTRIBUTORS") return "Contributors";
  if (value === "PUBLIC") return "Public";
  return value || "Notice";
}

function formatAnnouncementDate(value) {
  if (!value) return "Recently updated";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently updated" : date.toLocaleString();
}

export default Dashboard;
