import React from "react";
import Card from "../Card/Card";

const featuredItems = [
  {
    title: "Lantern Makers of Quanzhou",
    subtitle: "Featured craft tradition",
    description:
      "Trace how paper, bamboo, and hand-painted motifs carry memory through seasonal rituals and neighborhood gatherings.",
    image:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Sacred Courtyards of Fez",
    subtitle: "Featured architecture",
    description:
      "Discover layered urban heritage through carved timber, inward-facing spaces, and stories preserved in daily life.",
    image:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Festival Songs of the Highlands",
    subtitle: "Featured oral tradition",
    description:
      "Listen to community memory expressed through ceremonial singing, shared movement, and intergenerational storytelling.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
];

function FeaturedSection() {
  return (
    <section className="homepage-section reveal-section">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Highlights</span>
        <h2 className="section-heading__title">Featured Heritage Stories</h2>
        <p className="section-heading__text">
          A rotating selection of places, practices, and objects that invite deeper exploration.
        </p>
      </div>

      <div className="featured-grid">
        {featuredItems.map((item) => (
          <Card
            key={item.title}
            className="featured-card"
            title={item.title}
            subtitle={item.subtitle}
            description={item.description}
            image={item.image}
            imageAlt={item.title}
          />
        ))}
      </div>
    </section>
  );
}

export default FeaturedSection;
