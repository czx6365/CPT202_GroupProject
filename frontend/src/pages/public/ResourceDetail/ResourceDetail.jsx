import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchResourceDetail } from "../../../services/resourceService";
import "../Discovery/Discovery.css";

function ResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isUnmounted = false;

    async function loadResourceDetail() {
      if (!isNumericId(id)) {
        setResource(null);
        setErrorMessage("Invalid resource link. Please open a resource from the discovery list.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await fetchResourceDetail(id);
        if (!isUnmounted) {
          setResource(data);
        }
      } catch (error) {
        if (!isUnmounted) {
          setResource(null);
          setErrorMessage(error.message || "Failed to load resource detail.");
        }
      } finally {
        if (!isUnmounted) {
          setIsLoading(false);
        }
      }
    }

    loadResourceDetail();

    return () => {
      isUnmounted = true;
    };
  }, [id]);

  const tagList = useMemo(() => getTagList(resource?.tags), [resource?.tags]);

  return (
    <section className="discovery-page resource-detail-page">
      <div className="discovery-page__ornament" aria-hidden="true" />
      <div className="resource-detail">
        <Link className="resource-detail__back-link" to="/discovery">
          Back to Discovery
        </Link>

        {isLoading && <div className="discovery-state resource-detail__state">Loading resource detail...</div>}

        {!isLoading && errorMessage && (
          <div className="discovery-alert">
            {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && resource && (
          <>
            <header className="resource-detail__hero">
              <div className="resource-detail__meta">
                <span className="discovery-chip discovery-chip--status">{resource.status || "APPROVED"}</span>
                <span className="discovery-chip">{resource.categoryName || "Uncategorized"}</span>
                <span className="discovery-chip">{resource.placeName || "Unknown place"}</span>
              </div>
              <h1 className="resource-detail__title">{resource.title || `Resource ${id}`}</h1>
              <p className="resource-detail__topic">{resource.topic || "No topic summary provided."}</p>
              <p className="resource-detail__contributor">Contributed by {resource.contributorName || "Unknown contributor"}</p>
            </header>

            <main className="resource-detail__layout">
              <section className="resource-detail__main">
                {resource.fileUrl && <ResourceMedia url={resource.fileUrl} title={resource.title} />}

                <h2>Description</h2>
                <p>{resource.description || "No description has been provided for this resource."}</p>

                <div className="resource-detail__links">
                  {resource.fileUrl && (
                    <a href={resource.fileUrl} target="_blank" rel="noreferrer">
                      Open file
                    </a>
                  )}
                  {resource.externalLink && (
                    <a href={resource.externalLink} target="_blank" rel="noreferrer">
                      External source
                    </a>
                  )}
                  {!resource.fileUrl && !resource.externalLink && (
                    <span>No file or external source linked.</span>
                  )}
                </div>
              </section>

              <aside className="resource-detail__side">
                <section className="resource-detail__section">
                  <h2>Tags</h2>
                  <div className="resource-detail__tags">
                    {tagList.map((tag) => (
                      <span key={tag} className="discovery-chip discovery-chip--tag">
                        #{tag}
                      </span>
                    ))}
                    {tagList.length === 0 && <span className="discovery-chip discovery-chip--muted">No tags</span>}
                  </div>
                </section>

                <section className="resource-detail__section">
                  <h2>Details</h2>
                  <dl className="resource-detail__facts">
                    <div>
                      <dt>Resource ID</dt>
                      <dd>{resource.resourceId || id}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{formatDateTime(resource.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{formatDateTime(resource.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt>Published</dt>
                      <dd>{formatDateTime(resource.publishedAt)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="resource-detail__section">
                  <h2>Copyright</h2>
                  <p>{resource.copyrightDeclaration || "No copyright declaration provided."}</p>
                </section>
              </aside>
            </main>
          </>
        )}
      </div>
    </section>
  );
}

function getTagList(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.filter(Boolean);
}

function isNumericId(value) {
  return /^\d+$/.test(String(value || ""));
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function ResourceMedia({ url, title }) {
  const mediaType = getMediaType(url);

  if (mediaType === "image") {
    return (
      <figure className="resource-detail__media">
        <img src={url} alt={title || "Resource media"} />
      </figure>
    );
  }

  if (mediaType === "video") {
    return (
      <figure className="resource-detail__media">
        <video src={url} controls />
      </figure>
    );
  }

  return null;
}

function getMediaType(url) {
  const path = String(url || "").split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp)$/.test(path)) return "image";
  if (/\.(mp4|mov|webm)$/.test(path)) return "video";
  return "file";
}

export default ResourceDetail;
