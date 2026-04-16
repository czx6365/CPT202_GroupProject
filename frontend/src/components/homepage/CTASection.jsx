import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../Button/Button";

function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="homepage-section reveal-section">
      <div className="cta-panel">
        <div className="cta-panel__content">
          <span className="section-heading__eyebrow">Join the Archive</span>
          <h2 className="section-heading__title">Become a Contributor</h2>
          <p className="section-heading__text">
            Help preserve local knowledge, visual records, oral histories, and living traditions for future generations.
          </p>
        </div>

        <div className="cta-panel__actions">
          <Button className="cta-panel__button" onClick={() => navigate("/login")}>
            Submit Your Heritage
          </Button>
          <p className="cta-panel__hint">Please login first</p>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
