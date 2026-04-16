const CONTRIBUTOR_NOTICE_KEY = "heritagehub.contributor.notice";

export function storeContributorNotice(type, message) {
  if (!message) return;

  try {
    sessionStorage.setItem(
      CONTRIBUTOR_NOTICE_KEY,
      JSON.stringify({
        type,
        message,
        createdAt: Date.now(),
      })
    );
  } catch {
    // Ignore storage errors and fall back to same-page notices only.
  }
}

export function applyContributorNotice(type, message, setStatusMessage, setErrorMessage) {
  if (!message) return;

  if (type === "error") {
    setErrorMessage(message);
    setStatusMessage("");
  } else {
    setStatusMessage(message);
    setErrorMessage("");
  }
}

export function applyStoredContributorNotice(notice, setStatusMessage, setErrorMessage) {
  if (!notice) return;

  applyContributorNotice(notice.type, notice.message, setStatusMessage, setErrorMessage);
}

export function consumeContributorNotice() {
  try {
    const raw = sessionStorage.getItem(CONTRIBUTOR_NOTICE_KEY);
    if (!raw) return null;

    sessionStorage.removeItem(CONTRIBUTOR_NOTICE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
