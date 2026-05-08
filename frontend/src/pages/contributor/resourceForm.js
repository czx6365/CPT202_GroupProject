export const EMPTY_RESOURCE_FORM = {
  resourceId: null,
  title: "",
  topic: "",
  placeName: "",
  categoryId: "",
  tags: "",
  description: "",
  file: null,
  fileUrl: "",
  externalLink: "",
  copyrightDeclaration: "",
  selectedFileName: "",
  status: "",
  reviewerFeedback: "",
  updatedAt: "",
};

export function createResourceFormState(resource) {
  if (!resource) {
    return {
      ...EMPTY_RESOURCE_FORM,
    };
  }

  return {
    ...EMPTY_RESOURCE_FORM,
    resourceId: resource.resourceId || null,
    title: resource.title || "",
    topic: resource.topic || "",
    placeName: resource.placeName || "",
    categoryId: resource.categoryId ? String(resource.categoryId) : "",
    tags: Array.isArray(resource.tags) ? resource.tags.join(", ") : "",
    description: resource.description || "",
    file: null,
    fileUrl: resource.fileUrl || "",
    externalLink: resource.externalLink || "",
    copyrightDeclaration: resource.copyrightDeclaration || "",
    selectedFileName: resource.selectedFileName || "",
    status: resource.status || "",
    reviewerFeedback: resource.reviewerFeedback || "",
    updatedAt: resource.updatedAt || "",
  };
}

export function buildResourcePayload(form) {
  return {
    title: form.title.trim(),
    topic: form.topic.trim(),
    placeName: form.placeName.trim(),
    description: form.description.trim(),
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    tags: splitTags(form.tags),
    fileUrl: form.fileUrl.trim() || null,
    externalLink: form.externalLink.trim() || null,
    copyrightDeclaration: form.copyrightDeclaration.trim(),
  };
}

export function buildResourcePayloadWithFileUrl(form, fileUrl) {
  return {
    ...buildResourcePayload(form),
    fileUrl: String(fileUrl || "").trim() || null,
  };
}

export function splitTags(value) {
  if (!value) return [];

  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function joinTags(tags) {
  if (!Array.isArray(tags)) return "";
  return tags.filter(Boolean).join(", ");
}

export function addTag(currentValue, nextTag) {
  const normalizedTag = String(nextTag || "").trim();
  if (!normalizedTag) return currentValue;

  const existingTags = splitTags(currentValue);
  if (existingTags.includes(normalizedTag)) {
    return joinTags(existingTags);
  }

  return joinTags([...existingTags, normalizedTag]);
}

export function removeTag(currentValue, tagToRemove) {
  return joinTags(splitTags(currentValue).filter((tag) => tag !== tagToRemove));
}

export function hasMediaReference(form) {
  return Boolean(form.file || form.fileUrl.trim() || form.externalLink.trim());
}

export function isValidExternalUrl(value) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return false;

  try {
    const url = new URL(normalizedValue);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function addUrlErrors(form, nextErrors) {
  if (form.fileUrl.trim() && !isValidExternalUrl(form.fileUrl)) {
    nextErrors.fileUrl = "Enter a full file URL starting with http:// or https://.";
  }

  if (form.externalLink.trim() && !isValidExternalUrl(form.externalLink)) {
    nextErrors.externalLink = "Enter a full external link starting with http:// or https://.";
  }
}

export function validateDraftForm(form) {
  const nextErrors = {};

  if (!form.title.trim()) {
    nextErrors.title = "Title is required to save a draft.";
  }

  addUrlErrors(form, nextErrors);

  return nextErrors;
}

export function validateSubmissionForm(form) {
  const nextErrors = {};

  if (!form.title.trim()) nextErrors.title = "Title is required.";
  if (!form.topic.trim()) nextErrors.topic = "Topic is required.";
  if (!form.placeName.trim()) nextErrors.placeName = "Place is required.";
  if (!form.categoryId) nextErrors.categoryId = "Please choose a category.";
  if (!form.description.trim()) nextErrors.description = "Description is required.";
  if (!form.copyrightDeclaration.trim()) {
    nextErrors.copyrightDeclaration = "Usage declaration is required.";
  }
  if (!hasMediaReference(form)) {
    nextErrors.media = "Provide at least one media reference: file URL or external link.";
  }
  addUrlErrors(form, nextErrors);

  return nextErrors;
}

export function requiredMetadataStatus(form) {
  const fields = [
    form.title.trim(),
    form.topic.trim(),
    form.placeName.trim(),
    form.categoryId,
    form.description.trim(),
    form.copyrightDeclaration.trim(),
  ];

  const completed = fields.filter(Boolean).length;
  return `${completed}/${fields.length} complete`;
}
