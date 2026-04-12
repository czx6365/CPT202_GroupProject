const MOCK_STORAGE_KEY = "heritagehub.contributor.mock.resources";

const MOCK_CONTRIBUTOR_RESOURCES = [
  {
    resourceId: 101,
    title: "Lantern Festival Story Archive",
    topic: "Community festival traditions and oral memory",
    placeName: "Suzhou, Jiangsu",
    categoryId: 4,
    categoryName: "Festivals",
    tags: ["festival", "lanterns", "oral history"],
    description:
      "A draft resource collecting stories, images, and educational notes about neighborhood lantern customs and their intergenerational meaning.",
    fileUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
    externalLink: "https://example.org/lantern-festival",
    copyrightDeclaration: "Contributor holds permission to share interview excerpts and related photographs.",
    status: "DRAFT",
    reviewerFeedback: "",
    selectedFileName: "",
    updatedAt: "2026-04-08T10:30:00Z",
    createdAt: "2026-04-05T08:00:00Z",
    submittedAt: null,
  },
  {
    resourceId: 102,
    title: "Old Town Craft Stalls",
    topic: "Seasonal craft market",
    placeName: "Chengdu, Sichuan",
    categoryId: 3,
    categoryName: "Art & Crafts",
    tags: ["market", "crafts"],
    description: "",
    fileUrl: "",
    externalLink: "",
    copyrightDeclaration: "",
    status: "DRAFT",
    reviewerFeedback: "",
    selectedFileName: "",
    updatedAt: "2026-04-07T03:20:00Z",
    createdAt: "2026-04-06T12:20:00Z",
    submittedAt: null,
  },
  {
    resourceId: 201,
    title: "Wooden Opera Stage Documentation",
    topic: "Historic performance architecture",
    placeName: "Quanzhou, Fujian",
    categoryId: 1,
    categoryName: "Architecture",
    tags: ["opera", "stage", "timber"],
    description:
      "Documentation of a surviving timber opera stage, including conservation notes and local accounts of festival use.",
    fileUrl: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80",
    externalLink: "https://example.org/opera-stage",
    copyrightDeclaration: "Images contributed with site permission.",
    status: "PENDING_REVIEW",
    reviewerFeedback: "",
    selectedFileName: "",
    updatedAt: "2026-04-09T05:45:00Z",
    createdAt: "2026-04-02T09:00:00Z",
    submittedAt: "2026-04-09T05:45:00Z",
  },
  {
    resourceId: 202,
    title: "Bamboo Weaving Learning Kit",
    topic: "Traditional craft teaching material",
    placeName: "Anji, Zhejiang",
    categoryId: 3,
    categoryName: "Art & Crafts",
    tags: ["bamboo", "education", "craft"],
    description:
      "A curated educational package introducing bamboo weaving techniques, terminology, and workshop documentation for schools.",
    fileUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80",
    externalLink: "https://example.org/bamboo-weaving",
    copyrightDeclaration: "Contributor created the teaching notes and owns the attached photos.",
    status: "APPROVED",
    reviewerFeedback: "Approved after minor metadata cleanup.",
    selectedFileName: "",
    updatedAt: "2026-04-01T07:30:00Z",
    createdAt: "2026-03-28T11:10:00Z",
    submittedAt: "2026-03-30T06:15:00Z",
  },
  {
    resourceId: 203,
    title: "River Blessing Ceremony Record",
    topic: "Intangible water ritual",
    placeName: "Wuzhen, Zhejiang",
    categoryId: 2,
    categoryName: "Intangible Heritage",
    tags: ["ritual", "river", "community"],
    description:
      "A community record of seasonal river blessing practices, including ceremony sequence and local narration from elders.",
    fileUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
    externalLink: "https://example.org/river-blessing",
    copyrightDeclaration: "Contributor has oral consent for quoted community statements.",
    status: "REJECTED",
    reviewerFeedback:
      "Please clarify the copyright basis for the ceremony photographs and expand the description with more specific ritual context before resubmitting.",
    selectedFileName: "",
    updatedAt: "2026-04-06T14:10:00Z",
    createdAt: "2026-03-25T09:40:00Z",
    submittedAt: "2026-04-04T08:00:00Z",
  },
  {
    resourceId: 204,
    title: "Village Gate Inscription Photoset",
    topic: "Historic inscription reference",
    placeName: "Huizhou, Anhui",
    categoryId: 1,
    categoryName: "Architecture",
    tags: ["inscription", "gate", "archive"],
    description:
      "Reference image set documenting carved inscriptions on a preserved village gate before restoration.",
    fileUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    externalLink: "",
    copyrightDeclaration: "Shared under contributor-owned documentation rights.",
    status: "ARCHIVED",
    reviewerFeedback: "Archived after duplicate material was replaced by an updated record.",
    selectedFileName: "",
    updatedAt: "2026-03-20T10:20:00Z",
    createdAt: "2026-03-10T06:00:00Z",
    submittedAt: "2026-03-12T07:00:00Z",
  },
];

function cloneResource(resource) {
  return {
    ...resource,
    tags: Array.isArray(resource.tags) ? [...resource.tags] : [],
  };
}

function readStoredResources() {
  if (typeof window === "undefined") {
    return MOCK_CONTRIBUTOR_RESOURCES.map(cloneResource);
  }

  try {
    const raw = window.sessionStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) return MOCK_CONTRIBUTOR_RESOURCES.map(cloneResource);

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return MOCK_CONTRIBUTOR_RESOURCES.map(cloneResource);
    return parsed.map(cloneResource);
  } catch {
    return MOCK_CONTRIBUTOR_RESOURCES.map(cloneResource);
  }
}

function writeStoredResources(resources) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(resources));
  } catch {
    // Ignore storage failures and fall back to in-memory defaults.
  }
}

function nextMockResourceId(resources) {
  return resources.reduce((maxId, resource) => Math.max(maxId, Number(resource.resourceId) || 0), 300) + 1;
}

export function getMockContributorResources() {
  return readStoredResources();
}

export function getMockContributorResourceById(resourceId) {
  const match = readStoredResources().find(
    (resource) => String(resource.resourceId) === String(resourceId)
  );

  return match ? cloneResource(match) : null;
}

export function saveMockContributorDraft(form, categories = []) {
  const resources = readStoredResources();
  const categoryMatch = categories.find(
    (category) => String(category.categoryId) === String(form.categoryId)
  );
  const now = new Date().toISOString();

  const resource = {
    resourceId: nextMockResourceId(resources),
    title: form.title.trim(),
    topic: form.topic.trim(),
    placeName: form.placeName.trim(),
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    categoryName: categoryMatch?.name || "",
    tags: Array.isArray(form.tags) ? form.tags : String(form.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    description: form.description.trim(),
    fileUrl: form.fileUrl.trim(),
    externalLink: form.externalLink.trim(),
    copyrightDeclaration: form.copyrightDeclaration.trim(),
    selectedFileName: form.selectedFileName || "",
    reviewerFeedback: "",
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
  };

  const nextResources = [resource, ...resources];
  writeStoredResources(nextResources);
  return cloneResource(resource);
}

export function updateMockContributorResource(resourceId, form, categories = []) {
  const resources = readStoredResources();
  const categoryMatch = categories.find(
    (category) => String(category.categoryId) === String(form.categoryId)
  );

  let updatedResource = null;
  const nextResources = resources.map((resource) => {
    if (String(resource.resourceId) !== String(resourceId)) return resource;

    updatedResource = {
      ...resource,
      title: form.title.trim(),
      topic: form.topic.trim(),
      placeName: form.placeName.trim(),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      categoryName: categoryMatch?.name || resource.categoryName || "",
      tags: Array.isArray(form.tags)
        ? form.tags
        : String(form.tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
      description: form.description.trim(),
      fileUrl: form.fileUrl.trim(),
      externalLink: form.externalLink.trim(),
      copyrightDeclaration: form.copyrightDeclaration.trim(),
      selectedFileName: form.selectedFileName || resource.selectedFileName || "",
      updatedAt: new Date().toISOString(),
    };

    return updatedResource;
  });

  if (!updatedResource) return null;

  writeStoredResources(nextResources);
  return cloneResource(updatedResource);
}

export function submitMockContributorResource(resourceId) {
  const resources = readStoredResources();
  let updatedResource = null;

  const nextResources = resources.map((resource) => {
    if (String(resource.resourceId) !== String(resourceId)) return resource;

    updatedResource = {
      ...resource,
      status: "PENDING_REVIEW",
      reviewerFeedback: "",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return updatedResource;
  });

  if (!updatedResource) return null;

  writeStoredResources(nextResources);
  return cloneResource(updatedResource);
}

export function resubmitMockContributorResource(resourceId, form, categories = []) {
  const updated = updateMockContributorResource(resourceId, form, categories);
  if (!updated) return null;
  return submitMockContributorResource(resourceId);
}

export function deleteMockContributorDraft(resourceId) {
  const resources = readStoredResources();
  const match = resources.find((resource) => String(resource.resourceId) === String(resourceId));

  if (!match) return null;

  const nextResources = resources.filter((resource) => String(resource.resourceId) !== String(resourceId));
  writeStoredResources(nextResources);
  return cloneResource(match);
}
