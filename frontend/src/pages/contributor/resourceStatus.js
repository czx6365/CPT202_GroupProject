export function formatContributorStatus(status) {
  return (
    {
      DRAFT: "Draft",
      PENDING_REVIEW: "Pending Review",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      ARCHIVED: "Archived",
    }[status] || "Resource"
  );
}

export function getContributorStatusTone(status) {
  return (status || "DRAFT").toLowerCase();
}

export function getContributorStatusHint(status) {
  switch (status) {
    case "DRAFT":
      return "Still editable and not yet in review.";
    case "PENDING_REVIEW":
      return "Submitted and waiting for reviewer decision.";
    case "APPROVED":
      return "Published and visible in discovery.";
    case "REJECTED":
      return "Needs revision before resubmission.";
    case "ARCHIVED":
      return "Removed from public browse.";
    default:
      return "Workflow status not available.";
  }
}

export function getDraftReadiness(resource) {
  const checklist = [
    resource?.title,
    resource?.topic,
    resource?.placeName,
    resource?.categoryId || resource?.categoryName,
    resource?.description,
    resource?.copyrightDeclaration,
    resource?.fileUrl || resource?.fileLinkUrl || resource?.externalLink,
  ];

  const completed = checklist.filter((value) => Boolean(String(value || "").trim())).length;

  return {
    completed,
    total: checklist.length,
    isReady: completed === checklist.length,
    label: `${completed}/${checklist.length} ready`,
  };
}

export function summarizeContributorResources(resources = []) {
  return resources.reduce(
    (summary, resource) => {
      const status = resource.status || "DRAFT";
      summary.total += 1;
      summary[status] = (summary[status] || 0) + 1;
      return summary;
    },
    {
      total: 0,
      DRAFT: 0,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      ARCHIVED: 0,
    }
  );
}
