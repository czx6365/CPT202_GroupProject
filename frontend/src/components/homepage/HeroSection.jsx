import React from "react";
import Button from "../Button/Button";
import inkMountainHero from "../../assets/homepage/ink-mountain-hero.png";
import homepageVideo from "../../assets/homepage/wechat-homepage-background.mp4";

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
          src={homepageVideo}
          poster={inkMountainHero}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
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
