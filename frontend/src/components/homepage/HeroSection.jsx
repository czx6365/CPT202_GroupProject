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
          poster="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1600&q=80"
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
