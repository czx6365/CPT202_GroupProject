import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { createResourceComment, fetchResourceComments, fetchResourceDetail } from "../../../services/resourceService";
import "../Discovery/Discovery.css";

function ResourceDetail() {
  const { id } = useParams();
  const { token, isAuthenticated } = useAuth();
  const [resource, setResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [commentError, setCommentError] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

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

  useEffect(() => {
    let isUnmounted = false;

    async function loadComments() {
      if (!isNumericId(id)) {
        setComments([]);
        setCommentError("");
        setIsCommentsLoading(false);
        return;
      }

      setIsCommentsLoading(true);
      setCommentError("");
      try {
        const data = await fetchResourceComments(id);
        if (!isUnmounted) {
          setComments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!isUnmounted) {
          setComments([]);
          setCommentError(error.message || "Failed to load comments.");
        }
      } finally {
        if (!isUnmounted) {
          setIsCommentsLoading(false);
        }
      }
    }

    loadComments();
    return () => {
      isUnmounted = true;
    };
  }, [id]);

  const tagList = useMemo(() => getTagList(resource?.tags), [resource?.tags]);
  const isApproved = (resource?.status || "APPROVED").toUpperCase() === "APPROVED";
  const fileLinkUrl = getFileLinkUrl(resource);

  async function handleSubmitComment(event) {
    event.preventDefault();
    const content = commentContent.trim();

    if (!content) {
      setSubmitError("Please enter a comment before submitting.");
      return;
    }
    if (!token) {
      setSubmitError("Please log in to leave a comment.");
      return;
    }

    setSubmitError("");
    setIsSubmittingComment(true);
    try {
      const created = await createResourceComment(id, content, token);
      setComments((previous) => [created, ...previous]);
      setCommentContent("");
    } catch (error) {
      setSubmitError(error.message || "Failed to submit comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

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
                <h2>Description</h2>
                <p>{resource.description || "No description has been provided for this resource."}</p>

                {resource.fileUrl && <ResourceMedia url={resource.fileUrl} title={resource.title} />}

                <div className="resource-detail__links">
                  {fileLinkUrl && (
                    <a href={fileLinkUrl} target="_blank" rel="noreferrer">
                      Open file
                    </a>
                  )}
                  {resource.externalLink && resource.externalLink !== fileLinkUrl && (
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

            <section className="resource-detail__comments">
              <h2>Comments & Feedback</h2>

              {!isApproved && (
                <p className="resource-detail__comments-hint">
                  Comments are available only on approved resources.
                </p>
              )}

              {isApproved && (
                <>
                  <form className="resource-detail__comment-form" onSubmit={handleSubmitComment}>
                    <label htmlFor="comment-content" className="resource-detail__comment-label">
                      Share your feedback
                    </label>
                    <textarea
                      id="comment-content"
                      className="resource-detail__comment-input"
                      value={commentContent}
                      onChange={(event) => setCommentContent(event.target.value)}
                      placeholder="Write a constructive comment..."
                      maxLength={1000}
                      disabled={isSubmittingComment || !isAuthenticated}
                    />
                    <div className="resource-detail__comment-actions">
                      {!isAuthenticated && (
                        <p className="resource-detail__comments-hint">
                          Please <Link to="/login">log in</Link> to post comments.
                        </p>
                      )}
                      <button
                        className="discovery-btn discovery-btn--primary"
                        type="submit"
                        disabled={isSubmittingComment || !isAuthenticated}
                      >
                        {isSubmittingComment ? "Posting..." : "Post Comment"}
                      </button>
                    </div>
                    {submitError && <p className="resource-detail__comment-error">{submitError}</p>}
                  </form>

                  <div className="resource-detail__comment-list">
                    {isCommentsLoading && <div className="discovery-state resource-detail__state">Loading comments...</div>}
                    {!isCommentsLoading && commentError && <div className="discovery-alert">{commentError}</div>}
                    {!isCommentsLoading && !commentError && comments.length === 0 && (
                      <div className="discovery-state resource-detail__state">No comments yet. Be the first to share feedback.</div>
                    )}
                    {!isCommentsLoading && !commentError && comments.length > 0 && comments.map((comment) => (
                      <article className="resource-detail__comment-item" key={comment.commentId}>
                        <div className="resource-detail__comment-head">
                          <strong>{comment.userName || "Anonymous"}</strong>
                          <span>{formatDateTime(comment.createdAt)}</span>
                        </div>
                        <p>{comment.content}</p>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
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
  const [imageFailed, setImageFailed] = useState(false);
  const mediaType = getMediaType(url);
  const shouldTryImage = mediaType === "image" || (mediaType === "database-file" && !imageFailed);

  if (shouldTryImage) {
    return (
      <figure className="resource-detail__media">
        <img
          src={url}
          alt={title || "Resource media"}
          onError={() => setImageFailed(true)}
        />
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
  if (isDatabaseFileUrl(path)) return "database-file";
  return "file";
}

function isDatabaseFileUrl(url) {
  return String(url || "").toLowerCase().includes("/api/public/resource-files/");
}

function getFileLinkUrl(resource) {
  if (!resource) return "";
  if (resource.externalLink) return resource.externalLink;
  if (resource.fileUrl && !isDatabaseFileUrl(resource.fileUrl)) return resource.fileUrl;
  return "";
}

export default ResourceDetail;
