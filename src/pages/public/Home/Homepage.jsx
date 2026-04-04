import React, { useEffect } from "react";
import HeroSection from "../../../components/homepage/HeroSection";
import CategorySection from "../../../components/homepage/CategorySection";
import FeaturedSection from "../../../components/homepage/FeaturedSection";
import CTASection from "../../../components/homepage/CTASection";
import "../../Homepage.css";

function Homepage() {
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

  return (
    <div className="homepage">
      <HeroSection />
      <CategorySection />
      <FeaturedSection />
      <CTASection />
    </div>
  );
}

export default Homepage;
