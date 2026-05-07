import React, { useEffect, useState } from "react";
import HeroSection from "../../../components/homepage/HeroSection";
import CategorySection from "../../../components/homepage/CategorySection";
import FeaturedSection from "../../../components/homepage/FeaturedSection";
import CTASection from "../../../components/homepage/CTASection";
import { useAuth } from "../../../context/AuthContext";
import { fetchPublicAnnouncements, fetchVisibleAnnouncements } from "../../../services/announcementService";
import "../../Homepage.css";

function Homepage() {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState([]);

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
    const loadAnnouncements = async () => {
      try {
        let result;

        if (token) {
          try {
            result = await fetchVisibleAnnouncements(token);
          } catch {
            result = await fetchPublicAnnouncements();
          }
        } else {
          result = await fetchPublicAnnouncements();
        }

        setAnnouncements(Array.isArray(result) ? result : []);
      } catch {
        setAnnouncements([]);
      }
    };

    loadAnnouncements();
  }, [token]);

  return (
    <div className="homepage">
      <HeroSection />
      {announcements.length > 0 && (
        <section className="homepage-section">
          <div className="homepage-announcements">
            <div className="section-heading">
              <span className="section-heading__eyebrow">Platform Notices</span>
              <h2 className="section-heading__title">Latest announcements</h2>
              <p className="section-heading__text">
                Published platform notices appear here based on the audience selected by administrators.
              </p>
            </div>

            <div className="homepage-announcements__list">
              {announcements.map((announcement) => (
                <article key={announcement.announcementId} className="homepage-announcement-card">
                  <span className="homepage-announcement-card__audience">
                    {formatAnnouncementAudience(announcement.audience)}
                  </span>
                  <h3>{announcement.title}</h3>
                  <p>{announcement.content}</p>
                  <time>{formatAnnouncementDate(announcement.updatedAt)}</time>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
      <CategorySection />
      <FeaturedSection />
      <CTASection />
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

export default Homepage;
