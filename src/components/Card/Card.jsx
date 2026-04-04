import React from "react";
import "./Card.css";

function Card({
  title,
  subtitle,
  description,
  image,
  imageAlt = "",
  children,
  footer,
  onClick,
  className = "",
  variant = "default",
  eyebrow,
}) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={`card card--${variant} ${onClick ? "card--clickable" : ""} ${className}`.trim()}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <div className="card__media">
        {image ? (
          <img className="card__image" src={image} alt={imageAlt} />
        ) : (
          <div className="card__placeholder" aria-hidden="true">
            Heritage Resource
          </div>
        )}

        {variant === "overlay" && (
          <div className="card__media-overlay">
            {eyebrow && <span className="card__eyebrow">{eyebrow}</span>}
            {title && <h3 className="card__media-title">{title}</h3>}
            {subtitle && <p className="card__media-subtitle">{subtitle}</p>}
          </div>
        )}
      </div>

      {variant !== "overlay" && (
        <div className="card__content">
        {(title || subtitle) && (
          <div className="card__header">
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
        )}

        {description && <p className="card__description">{description}</p>}
        {children && <div className="card__body">{children}</div>}
        {footer && <div className="card__footer">{footer}</div>}
        </div>
      )}
    </Component>
  );
}

export default Card;
