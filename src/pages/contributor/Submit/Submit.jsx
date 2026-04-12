import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import Modal from "../../../components/Modal/Modal";
import { useAuth } from "../../../context/AuthContext";
import {
  createDraft,
  fetchCategories,
  fetchMyResources,
  fetchTags,
  submitResourceForReview,
  updateDraft,
} from "../../../services/resourceService";
import ContributorWorkspace from "../ContributorWorkspace";
import {
  getMockContributorResourceById,
  saveMockContributorDraft,
  submitMockContributorResource,
  updateMockContributorResource,
} from "../mockContributorData";
import {
  addTag,
  buildResourcePayload,
  createResourceFormState,
  removeTag,
  requiredMetadataStatus,
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
import "./Submit.css";

function Submit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [editingResource, setEditingResource] = useState(() => location.state?.resource || null);
  const isEditMode = Boolean(id || editingResource);

  const [form, setForm] = useState(() => createResourceFormState(editingResource));
  const [categories, setCategories] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const actionNoticeRef = useRef(null);

  useEffect(() => {
    setForm(createResourceFormState(editingResource));
    setTagInput("");
    setErrors({});
    setStatusMessage("");
    setErrorMessage("");
  }, [editingResource]);

  useEffect(() => {
    if (!id) {
      setEditingResource(location.state?.resource || null);
      return;
    }

    const loadEditingResource = async () => {
      if (location.state?.resource && String(location.state.resource.resourceId) === String(id)) {
        setEditingResource(location.state.resource);
        return;
      }

      if (!token) {
        setEditingResource(getMockContributorResourceById(id));
        return;
      }

      try {
        const myResources = await fetchMyResources(token);
        const matched = (Array.isArray(myResources) ? myResources : []).find(
          (resource) => String(resource.resourceId) === String(id)
        );
        setEditingResource(matched || null);
      } catch {
        setEditingResource(null);
      }
    };

    loadEditingResource();
  }, [id, location.state, token]);

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

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoadingMeta(true);
      setErrorMessage("");

      try {
        const [categoryResult, tagResult] = await Promise.all([fetchCategories(), fetchTags()]);
        setCategories(Array.isArray(categoryResult) ? categoryResult : []);
        setTagOptions(Array.isArray(tagResult) ? tagResult : []);
      } catch (error) {
        setErrorMessage(error.message || "Unable to load category and tag metadata.");
      } finally {
        setIsLoadingMeta(false);
      }
    };

    loadMetadata();
  }, []);

  const contributorApproved = Boolean(user?.contributorApproved);
  const parsedTags = useMemo(() => splitTags(form.tags), [form.tags]);

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

  const handleDraftSave = async () => {
    const validationErrors = validateDraftForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      applyContributorNotice(
        "error",
        "Add at least a draft title before saving.",
        setStatusMessage,
        setErrorMessage
      );
      return;
    }

    setIsSavingDraft(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const saved = isEditMode
        ? token
          ? await updateDraft(editingResource?.resourceId || id, buildResourcePayload(form), token)
          : updateMockContributorResource(editingResource?.resourceId || id, form, categories)
        : token
          ? await createDraft(buildResourcePayload(form), token)
          : saveMockContributorDraft(form, categories);

      if (!saved) {
        throw new Error("Unable to save this draft.");
      }

      const successMessage = isEditMode
        ? `Draft "${saved.title || form.title}" updated successfully.`
        : `Draft "${saved.title || form.title}" created successfully.`;

      applyContributorNotice("success", successMessage, setStatusMessage, setErrorMessage);

      if (!isEditMode && saved?.resourceId) {
        storeContributorNotice("success", successMessage);
        navigate(`/contributor/createdraft/${saved.resourceId}`, {
          replace: true,
          state: {
            mode: "edit",
            resource: saved,
          },
        });
      }
    } catch (error) {
      applyContributorNotice(
        "error",
        error.message || "Unable to save this draft.",
        setStatusMessage,
        setErrorMessage
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!(editingResource?.resourceId || id)) {
      applyContributorNotice(
        "error",
        "Save the draft first so the platform can assign it a resource ID.",
        setStatusMessage,
        setErrorMessage
      );
      setIsSubmitModalOpen(false);
      return;
    }

    setIsSavingDraft(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const validationErrors = validateSubmissionForm(form);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error("Please resolve the required metadata before submission.");
      }

      const resourceId = editingResource?.resourceId || id;
      if (token) {
        await updateDraft(resourceId, buildResourcePayload(form), token);
        await submitResourceForReview(resourceId, token);
      } else {
        const updated = updateMockContributorResource(resourceId, form, categories);
        if (!updated) {
          throw new Error("Unable to update this draft before submission.");
        }

        const submitted = submitMockContributorResource(resourceId);
        if (!submitted) {
          throw new Error("Unable to submit this draft for review.");
        }
      }
      storeContributorNotice("success", `"${form.title}" was submitted for review.`);
      setIsSubmitModalOpen(false);
      navigate("/contributor/submissions");
    } catch (error) {
      applyContributorNotice(
        "error",
        error.message || "Unable to submit this draft for review.",
        setStatusMessage,
        setErrorMessage
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <ContributorWorkspace
      eyebrow="New Submission"
      title={isEditMode ? "Edit Draft" : "Create Resource Draft"}
      description="Prepare a complete heritage record with structured metadata, supporting links, and rights declaration before sending it into the review workflow."
      actions={[{ label: "Back to Contributor Home", to: "/contributor", variant: "secondary" }]}
    >
      <div className="submit-page">
        <section className="submit-page__hero-panel">
          <div className="submit-page__hero-copy">
            <span className="submit-page__hero-label">Contributor Workflow</span>
            <h2 className="submit-page__hero-title">Build a draft that is ready for curator review.</h2>
            <p className="submit-page__hero-text">
              Organize the title, place, story, and classification details in stages so your submission
              can move smoothly through moderation and publication.
            </p>
          </div>

          <div className="submit-page__hero-status">
            <span className={`contributor-status contributor-status--${contributorApproved ? "approved" : "pending"}`}>
              {contributorApproved ? "Approved to Submit" : "Submission Approval Pending"}
            </span>
            <p className="submit-page__hero-note">
              {contributorApproved
                ? "You may save a draft or submit it directly for review once metadata is complete."
                : "You may prepare the draft now, but final review submission will remain disabled until administrator approval is granted."}
            </p>
          </div>
        </section>

        {statusMessage && <p className="submit-page__message">{statusMessage}</p>}
        {errorMessage && <p className="submit-page__error">{errorMessage}</p>}
        {isLoadingMeta && <p className="submit-page__state">Loading categories and tags...</p>}

        <div className="submit-page__layout">
          <div className="submit-page__main">
            <section className="submit-panel">
              <h3 className="submit-panel__title">Basic Information</h3>
              <div className="submit-form-grid">
                <Input
                  id="resource-title"
                  label="Title"
                  value={form.title}
                  onChange={updateField("title")}
                  placeholder="Enter a concise heritage title"
                />
                {errors.title && <p className="submit-field-error">{errors.title}</p>}

                <Input
                  id="resource-topic"
                  label="Topic"
                  value={form.topic}
                  onChange={updateField("topic")}
                  placeholder="Summarize the heritage theme"
                />
                {errors.topic && <p className="submit-field-error">{errors.topic}</p>}

                <Input
                  id="resource-place"
                  label="Place"
                  value={form.placeName}
                  onChange={updateField("placeName")}
                  placeholder="City, district, site, or locality"
                />
                {errors.placeName && <p className="submit-field-error">{errors.placeName}</p>}
              </div>
            </section>

            <section className="submit-panel">
              <h3 className="submit-panel__title">Classification</h3>
              <div className="submit-form-grid submit-form-grid--two">
                <div className="input-group">
                  <label className="input-group__label" htmlFor="resource-category">
                    Category
                  </label>
                  <select
                    id="resource-category"
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
                {errors.categoryId && <p className="submit-field-error">{errors.categoryId}</p>}

                <div className="input-group">
                  <label className="input-group__label" htmlFor="resource-tags-input">
                    Tags / Keywords
                  </label>
                  <div className="submit-tags-field">
                    {parsedTags.length > 0 && (
                      <div className="submit-tags-list">
                        {parsedTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className="submit-tag-pill"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            <span>{tag}</span>
                            <span className="submit-tag-pill__remove">x</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      id="resource-tags-input"
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
                <div className="submit-tag-hints">
                  {tagOptions.slice(0, 8).map((tag) => (
                    <button
                      key={tag.tagId || tag.name}
                      type="button"
                      className={`submit-tag-hint ${parsedTags.includes(tag.name) ? "submit-tag-hint--active" : ""}`}
                      onClick={() => handleSuggestedTagClick(tag.name)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="submit-panel">
              <h3 className="submit-panel__title">Content Details</h3>
              <div className="input-group">
                <label className="input-group__label" htmlFor="resource-description">
                  Description
                </label>
                <textarea
                  id="resource-description"
                  className="submit-textarea"
                  value={form.description}
                  onChange={updateField("description")}
                  placeholder="Describe the cultural context, significance, and story behind this resource."
                />
              </div>
              {errors.description && <p className="submit-field-error">{errors.description}</p>}
            </section>

            <section className="submit-panel">
              <h3 className="submit-panel__title">Media / Resource Access</h3>
              <div className="submit-form-grid">
                <Input
                  id="resource-file-url"
                  label="File URL"
                  value={form.fileUrl}
                  onChange={updateField("fileUrl")}
                  placeholder="Optional hosted file URL"
                />

                <Input
                  id="resource-external-link"
                  label="External Link"
                  value={form.externalLink}
                  onChange={updateField("externalLink")}
                  placeholder="Optional external reference link"
                />
              </div>

              <div className="input-group">
                <label className="input-group__label" htmlFor="resource-file-upload">
                  File Upload
                </label>
                <input id="resource-file-upload" type="file" className="submit-file-input" onChange={handleFileChange} />
                <p className="submit-help-text">
                  {form.selectedFileName
                    ? `Selected file: ${form.selectedFileName}.`
                    : "Frontend file selection is prepared here for future upload support. Current draft APIs continue to rely on URL-based metadata."}
                </p>
                {(filePreviewUrl || form.selectedFileName || form.fileUrl) && (
                  <FilePreview
                    file={form.file}
                    previewUrl={filePreviewUrl}
                    fallbackUrl={form.fileUrl}
                    selectedFileName={form.selectedFileName}
                  />
                )}
                {errors.media && <p className="submit-field-error">{errors.media}</p>}
              </div>
            </section>

            <section className="submit-panel">
              <h3 className="submit-panel__title">Rights / Usage Declaration</h3>
              <div className="input-group">
                <label className="input-group__label" htmlFor="resource-copyright">
                  Copyright / Usage Declaration
                </label>
                <textarea
                  id="resource-copyright"
                  className="submit-textarea submit-textarea--compact"
                  value={form.copyrightDeclaration}
                  onChange={updateField("copyrightDeclaration")}
                  placeholder="Confirm ownership, permissions, consent, and publication rights."
                />
              </div>
              {errors.copyrightDeclaration && <p className="submit-field-error">{errors.copyrightDeclaration}</p>}
            </section>
          </div>

          <aside className="submit-page__side">
            <section className="submit-panel">
              <h3 className="submit-panel__title">Submission Readiness</h3>
              <div className="submit-readiness-list">
                <ReadinessItem label="Required Metadata" value={requiredMetadataStatus(form)} />
                <ReadinessItem label="Contributor Approval" value={contributorApproved ? "Approved" : "Pending"} />
                <ReadinessItem label="Tag Coverage" value={parsedTags.length > 0 ? `${parsedTags.length} tags` : "Optional"} />
                <ReadinessItem
                  label="Media Reference"
                  value={form.file || form.fileUrl || form.externalLink || form.selectedFileName ? "Provided" : "Required for submission"}
                />
              </div>
            </section>

            <section className="submit-panel">
              <h3 className="submit-panel__title">Action Panel</h3>
              <p className="submit-panel__description">
                Save your work as a draft at any time. When the record is complete and contributor approval is active,
                send it forward for curator review.
              </p>

              <div ref={actionNoticeRef} className="submit-page__action-notice">
                {statusMessage && <p className="submit-page__message submit-page__message--inline">{statusMessage}</p>}
                {errorMessage && <p className="submit-page__error submit-page__error--inline">{errorMessage}</p>}
              </div>

              <div className="submit-page__actions">
                <Button variant="primary" onClick={handleDraftSave} disabled={isSavingDraft || isLoadingMeta}>
                  {isSavingDraft ? "Saving..." : isEditMode ? "Save Draft Changes" : "Save Draft"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsSubmitModalOpen(true)}
                  disabled={!contributorApproved || isSavingDraft || !isEditMode}
                >
                  Submit for Review
                </Button>
                <Link to="/contributor/drafts" className="contributor-workspace__action-link">
                  <Button variant="secondary">Cancel</Button>
                </Link>
              </div>

              {!isEditMode && (
                <p className="submit-panel__note">
                  A resource must exist as a saved draft before it can be submitted for review.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>

      <Modal
        isOpen={isSubmitModalOpen}
        title="Submit Draft for Review"
        onClose={() => setIsSubmitModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!contributorApproved || !isEditMode || isSavingDraft}
              onClick={handleSubmitForReview}
            >
              Confirm Submission
            </Button>
          </>
        }
      >
        <p className="submit-modal__text">
          This will place the draft into the contributor review queue and lock it until a reviewer responds.
        </p>
      </Modal>
    </ContributorWorkspace>
  );
}

function ReadinessItem({ label, value }) {
  return (
    <div className="submit-readiness-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FilePreview({ file, previewUrl, fallbackUrl, selectedFileName }) {
  const fileType = file?.type || "";
  const isImage = fileType.startsWith("image/");
  const isVideo = fileType.startsWith("video/");

  return (
    <div className="submit-file-preview">
      <span className="submit-file-preview__label">Preview</span>

      {isImage && previewUrl && (
        <img className="submit-file-preview__media" src={previewUrl} alt={selectedFileName || "Selected upload preview"} />
      )}

      {isVideo && previewUrl && (
        <video className="submit-file-preview__media" src={previewUrl} controls />
      )}

      {!isImage && !isVideo && (
        <div className="submit-file-preview__card">
          <strong>{selectedFileName || "Selected file"}</strong>
          <span>{fileType || "Preview is available after upload."}</span>
        </div>
      )}

      {!file && fallbackUrl && (
        <a className="submit-file-preview__link" href={fallbackUrl} target="_blank" rel="noreferrer">
          Open current file URL
        </a>
      )}
    </div>
  );
}

export default Submit;
