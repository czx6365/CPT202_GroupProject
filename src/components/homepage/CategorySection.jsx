import React from "react";
import Card from "../Card/Card";

const categories = [
  {
    title: "Architecture",
    eyebrow: "Built Memory",
    image:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Intangible Heritage",
    eyebrow: "Oral Traditions",
    image:
      "https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Art & Crafts",
    eyebrow: "Material Culture",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Festivals",
    eyebrow: "Shared Rituals",
    image:
      "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=1200&q=80",
  },
];

function CategorySection() {
  return (
    <section id="categories-section" className="homepage-section reveal-section">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Curated Pathways</span>
        <h2 className="section-heading__title">Browse Heritage by Theme</h2>
        <p className="section-heading__text">
          Move through architecture, ritual, craft, and celebration with a visual catalog designed to feel like an
          exhibition.
        </p>
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <Card
            key={category.title}
            variant="overlay"
            className="category-card"
            title={category.title}
            eyebrow={category.eyebrow}
            image={category.image}
            imageAlt={category.title}
          />
        ))}
      </div>
    </section>
  );
}

export default CategorySection;
