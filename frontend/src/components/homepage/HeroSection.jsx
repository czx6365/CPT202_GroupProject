import React from "react";
import Button from "../Button/Button";

function HeroSection() {
  const scrollToCategories = () => {
    const nextSection = document.getElementById("categories-section");
    nextSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="hero-section">
      <div className="hero-section__media">
        <video
          className="hero-section__video"
          autoPlay
          muted
          loop
          playsInline
          // Home page update: remove initial poster image so users see the flower animation directly.
          preload="auto"
        >
          <source
            src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
            type="video/mp4"
          />
        </video>
        <div className="hero-section__overlay" />
      </div>

      <div className="hero-section__content">
        <span className="hero-section__eyebrow">Digital Archive of Living Memory</span>
        <h1 className="hero-section__title">Explore Living Heritage</h1>
        <p className="hero-section__subtitle">Discover cultural stories from around the world</p>
        <Button className="hero-section__button" onClick={scrollToCategories}>
          Start Exploring
        </Button>
      </div>

      <button type="button" className="hero-section__scroll" onClick={scrollToCategories} aria-label="Scroll down">
        <span className="hero-section__scroll-line" />
        <span className="hero-section__scroll-text">Scroll</span>
      </button>
    </section>
  );
}

export default HeroSection;
