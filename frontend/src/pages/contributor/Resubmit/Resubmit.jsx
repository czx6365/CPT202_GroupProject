import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import Modal from "../../../components/Modal/Modal";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchCategories,
  fetchContributorResourceById,
  fetchTags,
  resubmitResource,
  updateDraft,
} from "../../../services/resourceService";
import ContributorWorkspace from "../ContributorWorkspace";
import {
  addTag,
  buildResourcePayload,
  createResourceFormState,
  isValidExternalUrl,
  removeTag,
  splitTags,
  validateDraftForm,
  validateSubmissionForm,
} from "../resourceForm";
import {
  applyContributorNotice,
  applyStoredContributorNotice,
  consumeContributorNotice,
  storeContributorNotice,
} from "../actionNotice";
import "./Resubmit.css";

function Resubmit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();

  const [resource, setResource] = useState(location.state?.resource || null);
  const [form, setForm] = useState(() => createResourceFormState(location.state?.resource));
  const [categories, setCategories] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const actionNoticeRef = useRef(null);

  useEffect(() => {
    const loadResource = async () => {
      if (!token) {
        setResource(null);
        setForm(createResourceFormState(null));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const [categoryResult, tagResult, listResult] = await Promise.all([
          fetchCategories(),
          fetchTags(),
          fetchContributorResourceById(id, token, location.state?.resource || null),
        ]);

        setCategories(Array.isArray(categoryResult) ? categoryResult : []);
        setTagOptions(Array.isArray(tagResult) ? tagResult : []);

        const resolved = listResult || null;
        setResource(resolved);
        setForm(createResourceFormState(resolved));
        setTagInput("");
      } catch (error) {
        setResource(null);
        setForm(createResourceFormState(null));
        setErrorMessage(error.message || "Unable to load this rejected resource right now.");
      } finally {
        setIsLoading(false);
      }
    };

    loadResource();
  }, [id, location.state?.resource, token]);

  useEffect(() => {
    const notice = consumeContributorNotice();
    applyStoredContributorNotice(notice, setStatusMessage, setErrorMessage);
  }, [location.key]);

  useEffect(() => {
    if ((!statusMessage && !errorMessage) || !actionNoticeRef.current) return;

    actionNoticeRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [statusMessage, errorMessage]);

  useEffect(() => {
    if (!form.file) {
      setFilePreviewUrl("");
      return undefined;
    }

    const nextUrl = URL.createObjectURL(form.file);
    setFilePreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [form.file]);

  const parsedTags = useMemo(() => splitTags(form.tags), [form.tags]);
  const contributorApproved = Boolean(user?.contributorApproved);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "", media: "" }));
  };

  const handleTagInputChange = (event) => {
    setTagInput(event.target.value);
  };

  const commitTag = (rawTag = tagInput) => {
    const nextValue = addTag(form.tags, rawTag);
    if (nextValue === form.tags) {
      setTagInput("");
      return;
    }

    setForm((previous) => ({
      ...previous,
      tags: nextValue,
    }));
    setTagInput("");
  };

  const handleTagKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitTag();
    }

    if (event.key === "Backspace" && !tagInput.trim() && parsedTags.length > 0) {
      event.preventDefault();
      handleRemoveTag(parsedTags[parsedTags.length - 1]);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm((previous) => ({
      ...previous,
      tags: removeTag(previous.tags, tagToRemove),
    }));
  };

  const handleSuggestedTagClick = (tagName) => {
    commitTag(tagName);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setForm((previous) => ({
      ...previous,
      file: file || null,
      selectedFileName: file?.name || "",
    }));
    setErrors((previous) => ({ ...previous, media: "" }));
  };

  const handleSaveChanges = async () => {
    if (!resource?.resourceId) {
      applyContributorNotice(
        "error",
        "This rejected resource is missing a valid ID, so the revision cannot be saved.",
        setStatusMessage,
        setErrorMessage
      );
      return;
    }

    const validationErrors = validateDraftForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      applyContributorNotice(
        "error",
        "Add at least a title before saving your revision.",
        setStatusMessage,
        setErrorMessage
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      if (!token) {
        throw new Error("Please log in with an approved contributor account.");
      }

      const saved = await updateDraft(resource.resourceId, buildResourcePayload(form), token);

      if (!saved) {
        throw new Error("Unable to save the revised draft.");
      }

      const resolved = { ...resource, ...saved };
      setResource(resolved);
      setForm(createResourceFormState(resolved));
      applyContributorNotice(
        "success",
        "Revision changes saved successfully.",
        setStatusMessage,
        setErrorMessage
      );
    } catch (error) {
      applyContributorNotice(
        "error",
        error.message || "Unable to save the revised draft.",
        setStatusMessage,
        setErrorMessage
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResubmit = async () => {
    if (!resource?.resourceId) {
      applyContributorNotice(
        "error",
        "This rejected resource is missing a valid ID, so it cannot be resubmitted.",
        setStatusMessage,
        setErrorMessage
      );
      setIsConfirmOpen(false);
      return;
    }

    const validationErrors = validateSubmissionForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      applyContributorNotice(
        "error",
        "Please complete the required fields before resubmitting.",
        setStatusMessage,
        setErrorMessage
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      if (!token) {
        throw new Error("Please log in with an approved contributor account.");
      }

      await updateDraft(resource.resourceId, buildResourcePayload(form), token);
      await resubmitResource(resource.resourceId, token);
      storeContributorNotice("success", `"${form.title}" was resubmitted for review.`);
      setIsConfirmOpen(false);
      navigate("/contributor/submissions");
    } catch (error) {
      applyContributorNotice(
        "error",
        error.message || "Unable to resubmit this resource.",
        setStatusMessage,
        setErrorMessage
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ContributorWorkspace
      eyebrow="Revision Workflow"
      title="Revise and Resubmit"
      description="Respond to reviewer comments, refine your metadata, and return the resource to the moderation queue with a clearer submission package."
      actions={[{ label: "Back to Contributor Home", to: "/contributor", variant: "secondary" }]}
    >
      <div className="resubmit-page">
        {statusMessage && <p className="resubmit-page__message">{statusMessage}</p>}
        {errorMessage && <p className="resubmit-page__error">{errorMessage}</p>}
        {isLoading && <p className="resubmit-page__state">Loading rejected submission...</p>}

        {!isLoading && resource && (
          <>
            <section className="resubmit-feedback-panel">
              <div className="resubmit-feedback-panel__header">
                <div>
                  <span className="resubmit-feedback-panel__eyebrow">Reviewer Feedback</span>
                  <h2 className="resubmit-feedback-panel__title">{resource.title}</h2>
                </div>
                <span className={`contributor-status contributor-status--${resource.status?.toLowerCase() || "rejected"}`}>
                  {resource.status === "REJECTED" ? "Rejected" : resource.status || "Revision"}
                </span>
              </div>

              <p className="resubmit-feedback-panel__text">
                {resource.reviewerFeedback ||
                  "Review the resource details carefully, update any incomplete information, and resubmit when the record is ready."}
              </p>
            </section>

            <div className="resubmit-page__layout">
              <div className="resubmit-page__main">
                <section className="resubmit-panel">
                  <h3 className="resubmit-panel__title">Basic Information</h3>
                  <div className="resubmit-form-grid">
                    <Input
                      id="resubmit-title"
                      label="Title"
                      value={form.title}
                      onChange={updateField("title")}
                      placeholder="Enter a concise heritage title"
                    />
                    {errors.title && <p className="resubmit-field-error">{errors.title}</p>}

                    <Input
                      id="resubmit-topic"
                      label="Topic"
                      value={form.topic}
                      onChange={updateField("topic")}
                      placeholder="Summarize the heritage theme"
                    />
                    {errors.topic && <p className="resubmit-field-error">{errors.topic}</p>}

                    <Input
                      id="resubmit-place"
                      label="Place"
                      value={form.placeName}
                      onChange={updateField("placeName")}
                      placeholder="City, district, site, or locality"
                    />
                    {errors.placeName && <p className="resubmit-field-error">{errors.placeName}</p>}
                  </div>
                </section>

                <section className="resubmit-panel">
                  <h3 className="resubmit-panel__title">Classification</h3>
                  <div className="resubmit-form-grid resubmit-form-grid--two">
                    <div className="input-group">
                      <label className="input-group__label" htmlFor="resubmit-category">
                        Category
                      </label>
                      <select
                        id="resubmit-category"
                        className="input-group__field"
                        value={form.categoryId}
                        onChange={updateField("categoryId")}
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.categoryId} value={category.categoryId}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.categoryId && <p className="resubmit-field-error">{errors.categoryId}</p>}

                    <div className="input-group">
                      <label className="input-group__label" htmlFor="resubmit-tags-input">
                        Tags / Keywords
                      </label>
                      <div className="resubmit-tags-field">
                        {parsedTags.length > 0 && (
                          <div className="resubmit-tags-list">
                            {parsedTags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                className="resubmit-tag-pill"
                                onClick={() => handleRemoveTag(tag)}
                              >
                                <span>{tag}</span>
                                <span className="resubmit-tag-pill__remove">x</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <input
                          id="resubmit-tags-input"
                          className="input-group__field"
                          value={tagInput}
                          onChange={handleTagInputChange}
                          onKeyDown={handleTagKeyDown}
                          onBlur={() => commitTag()}
                          placeholder="Type a tag and press Enter"
                        />
                      </div>
                    </div>
                  </div>

                  {tagOptions.length > 0 && (
                    <div className="resubmit-tag-hints">
                      {tagOptions.slice(0, 8).map((tag) => (
                        <button
                          key={tag.tagId || tag.name}
                          type="button"
                          className={`resubmit-tag-hint ${parsedTags.includes(tag.name) ? "resubmit-tag-hint--active" : ""}`}
                          onClick={() => handleSuggestedTagClick(tag.name)}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="resubmit-panel">
                  <h3 className="resubmit-panel__title">Content Details</h3>
                  <div className="input-group">
                    <label className="input-group__label" htmlFor="resubmit-description">
                      Description
                    </label>
                    <textarea
                      id="resubmit-description"
                      className="resubmit-textarea"
                      value={form.description}
                      onChange={updateField("description")}
                      placeholder="Describe the refined cultural context and significance."
                    />
                  </div>
                  {errors.description && <p className="resubmit-field-error">{errors.description}</p>}
                </section>

                <section className="resubmit-panel">
                  <h3 className="resubmit-panel__title">Media / Resource Access</h3>
                  <div className="resubmit-form-grid">
                    <Input
                      id="resubmit-file-url"
                      label="File URL"
                      value={form.fileUrl}
                      onChange={updateField("fileUrl")}
                      placeholder="https://example.com/file.pdf"
                    />
                    {errors.fileUrl && <p className="resubmit-field-error">{errors.fileUrl}</p>}

                    <Input
                      id="resubmit-external-link"
                      label="External Link"
                      value={form.externalLink}
                      onChange={updateField("externalLink")}
                      placeholder="https://example.com/reference"
                    />
                    {errors.externalLink && <p className="resubmit-field-error">{errors.externalLink}</p>}
                  </div>

                  <div className="input-group">
                    <label className="input-group__label" htmlFor="resubmit-file-upload">
                      File Upload
                    </label>
                    <input id="resubmit-file-upload" type="file" className="resubmit-file-input" onChange={handleFileChange} />
                    <p className="resubmit-help-text">
                      {form.selectedFileName
                        ? `Selected file: ${form.selectedFileName}.`
                        : "Add a hosted file URL or external reference link so reviewers can access the revised material."}
                    </p>
                    {(filePreviewUrl || form.selectedFileName || form.fileUrl) && (
                      <FilePreview
                        file={form.file}
                        previewUrl={filePreviewUrl}
                        fallbackUrl={form.fileUrl}
                        selectedFileName={form.selectedFileName}
                      />
                    )}
                    {errors.media && <p className="resubmit-field-error">{errors.media}</p>}
                  </div>
                </section>

                <section className="resubmit-panel">
                  <h3 className="resubmit-panel__title">Rights / Usage Declaration</h3>
                  <div className="input-group">
                    <label className="input-group__label" htmlFor="resubmit-copyright">
                      Copyright / Usage Declaration
                    </label>
                    <textarea
                      id="resubmit-copyright"
                      className="resubmit-textarea resubmit-textarea--compact"
                      value={form.copyrightDeclaration}
                      onChange={updateField("copyrightDeclaration")}
                      placeholder="Confirm ownership, permissions, consent, and publication rights."
                    />
                  </div>
                  {errors.copyrightDeclaration && <p className="resubmit-field-error">{errors.copyrightDeclaration}</p>}
                </section>
              </div>

              <aside className="resubmit-page__side">
                <section className="resubmit-panel">
                  <h3 className="resubmit-panel__title">Revision Context</h3>
                  <div className="resubmit-context-list">
                    <ContextItem label="Current Status" value={resource.status || "Rejected"} />
                    <ContextItem label="Last Updated" value={formatDate(resource.updatedAt)} />
                    <ContextItem label="Contributor Approval" value={contributorApproved ? "Approved" : "Pending"} />
                    <ContextItem
                      label="Feedback Availability"
                      value={resource.reviewerFeedback ? "Included" : "Summary endpoint only"}
                    />
                  </div>
                </section>

                <section className="resubmit-panel">
                  <h3 className="resubmit-panel__title">Action Panel</h3>
                  <p className="resubmit-panel__description">
                    Save your revisions first, then return the resource to the review queue once the metadata is consistent.
                  </p>

                  <div ref={actionNoticeRef} className="resubmit-page__action-notice">
                    {statusMessage && (
                      <p className="resubmit-page__message resubmit-page__message--inline">{statusMessage}</p>
                    )}
                    {errorMessage && (
                      <p className="resubmit-page__error resubmit-page__error--inline">{errorMessage}</p>
                    )}
                  </div>

                  <div className="resubmit-page__actions">
                    <Button variant="primary" onClick={handleSaveChanges} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setIsConfirmOpen(true)}
                      disabled={isSaving || !contributorApproved}
                    >
                      Resubmit for Review
                    </Button>
                    <Link to="/contributor/submissions" className="contributor-workspace__action-link">
                      <Button variant="secondary">Back to My Submission</Button>
                    </Link>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isConfirmOpen}
        title="Resubmit Resource"
        onClose={() => setIsConfirmOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResubmit} disabled={isSaving || !contributorApproved}>
              {isSaving ? "Resubmitting..." : "Confirm Resubmission"}
            </Button>
          </>
        }
      >
        <p className="resubmit-modal__text">
          This will save the current revision and send the resource back into the review queue.
        </p>
      </Modal>
    </ContributorWorkspace>
  );
}

function ContextItem({ label, value }) {
  return (
    <div className="resubmit-context-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FilePreview({ file, previewUrl, fallbackUrl, selectedFileName }) {
  const fileType = file?.type || "";
  const isImage = fileType.startsWith("image/");
  const isVideo = fileType.startsWith("video/");
  const hasFallbackUrl = Boolean(String(fallbackUrl || "").trim());
  const canOpenFallbackUrl = isValidExternalUrl(fallbackUrl);

  return (
    <div className="resubmit-file-preview">
      <span className="resubmit-file-preview__label">Preview</span>

      {isImage && previewUrl && (
        <img className="resubmit-file-preview__media" src={previewUrl} alt={selectedFileName || "Selected upload preview"} />
      )}

      {isVideo && previewUrl && (
        <video className="resubmit-file-preview__media" src={previewUrl} controls />
      )}

      {!isImage && !isVideo && (
        <div className="resubmit-file-preview__card">
          <strong>{selectedFileName || "Selected file"}</strong>
          <span>{fileType || "Preview is available after upload."}</span>
        </div>
      )}

      {!file && canOpenFallbackUrl && (
        <a className="resubmit-file-preview__link" href={fallbackUrl} target="_blank" rel="noreferrer">
          Open current file URL
        </a>
      )}

      {!file && hasFallbackUrl && !canOpenFallbackUrl && (
        <span className="resubmit-file-preview__hint">Enter a full http:// or https:// URL before opening it.</span>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default Resubmit;
