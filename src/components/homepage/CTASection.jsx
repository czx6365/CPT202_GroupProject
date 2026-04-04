import React from "react";
import Button from "../Button/Button";

function CTASection() {
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

        <Button className="cta-panel__button">Submit Your Heritage</Button>
      </div>
    </section>
  );
}

export default CTASection;
