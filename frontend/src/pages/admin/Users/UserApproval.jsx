import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import { useAuth } from "../../../context/AuthContext";
import { approveContributor, fetchPendingUsers, rejectContributor } from "../../../services/adminService";
import AdminWorkspace from "../AdminWorkspace";
import "./UserApproval.css";

function formatRequestedAt(value) {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function UserApproval() {
  const { token, isAuthenticated, user, logout } = useAuth();
  const [pendingApplicants, setPendingApplicants] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadPendingUsers = async () => {
    if (!token) {
      setPendingApplicants([]);
      setSelectedUserId(null);
      setErrorMessage("Please log in with an administrator account to review contributor applications.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const users = await fetchPendingUsers(token);
      const applicantList = Array.isArray(users) ? users : [];
      setPendingApplicants(applicantList);
      setSelectedUserId((previous) => (
        applicantList.some((item) => item.userId === previous) ? previous : (applicantList[0]?.userId || null)
      ));
    } catch (error) {
      if (error.status === 401) {
        logout();
        return;
      }
      setPendingApplicants([]);
      setSelectedUserId(null);
      setErrorMessage(error.message || "Unable to load pending applicants.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, [token]);

  const filteredApplicants = useMemo(() => {
    const normalizedKeyword = appliedKeyword.trim().toLowerCase();
    const keywordMatchedApplicants = normalizedKeyword
      ? pendingApplicants.filter((applicant) => {
      const name = applicant.userName?.toLowerCase() || "";
      const email = applicant.email?.toLowerCase() || "";
      const application = applicant.contributorApplication?.toLowerCase() || "";
      return (
        name.includes(normalizedKeyword) ||
        email.includes(normalizedKeyword) ||
        application.includes(normalizedKeyword)
      );
    })
      : pendingApplicants;

    if (appliedStatusFilter === "selected") {
      return keywordMatchedApplicants.filter((applicant) => applicant.userId === selectedUserId);
    }

    return keywordMatchedApplicants;
  }, [appliedKeyword, appliedStatusFilter, pendingApplicants, selectedUserId]);

  const selectedApplicant = useMemo(
    () => filteredApplicants.find((applicant) => applicant.userId === selectedUserId) || null,
    [filteredApplicants, selectedUserId]
  );
  const decisionApplicant = selectedApplicant || filteredApplicants[0] || null;

  useEffect(() => {
    if (!filteredApplicants.length) {
      setSelectedUserId(null);
      return;
    }

    if (appliedStatusFilter !== "selected" && !filteredApplicants.some((applicant) => applicant.userId === selectedUserId)) {
      setSelectedUserId(filteredApplicants[0].userId);
    }
  }, [appliedStatusFilter, filteredApplicants, selectedUserId]);

  const applyFilters = () => {
    setAppliedKeyword(keywordInput);
    setAppliedStatusFilter(statusFilter);
  };

  const resetFilters = () => {
    setKeywordInput("");
    setAppliedKeyword("");
    setStatusFilter("all");
    setAppliedStatusFilter("all");
    setSuccessMessage("");
  };

  const handleApprove = async () => {
    if (!decisionApplicant || !token) return;

    setIsApproving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await approveContributor(decisionApplicant.userId, token);
      setSuccessMessage(`Approved ${decisionApplicant.userName} as contributor.`);
      setRejectionReason("");
      await loadPendingUsers();
    } catch (error) {
      if (error.status === 401) {
        logout();
        return;
      }
      setErrorMessage(error.message || "Unable to approve this applicant.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!decisionApplicant || !token) return;
    if (!rejectionReason.trim()) {
      setErrorMessage("Please enter a rejection reason before rejecting this application.");
      setSuccessMessage("");
      return;
    }

    setIsRejecting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await rejectContributor(decisionApplicant.userId, rejectionReason.trim(), token);
      setSuccessMessage(`Rejected ${decisionApplicant.userName}'s contributor application.`);
      setRejectionReason("");
      await loadPendingUsers();
    } catch (error) {
      if (error.status === 401) {
        logout();
        return;
      }
      setErrorMessage(error.message || "Unable to reject this applicant.");
    } finally {
      setIsRejecting(false);
    }
  };

  useEffect(() => {
    setRejectionReason("");
  }, [selectedUserId]);

  const normalizedRole = String(user?.role || "").toUpperCase();
  const isAdmin = normalizedRole === "ADMIN_REVIEWER" || normalizedRole === "ADMIN";
  const showAuthError = !isAuthenticated || !token;
  const showRoleError = isAuthenticated && Boolean(token) && !isAdmin;
  const effectiveErrorMessage = showAuthError
    ? "Please log in with an administrator account to review contributor applications."
    : showRoleError
    ? "Your account does not have administrator access to approve contributors."
    : errorMessage;

  return (
    <AdminWorkspace
      eyebrow="Contributor Access"
      title="User Approval"
      description="Review contributor promotion requests from registered users and approve eligible applications."
      actions={[{ label: "Back to Dashboard", to: "/admin", variant: "secondary" }]}
    >
      <div className="approval-toolbar">
        <div className="approval-toolbar__filters admin-panel">
          <Input
            id="approval-keyword"
            label="Keyword"
            placeholder="Search applicant name or email"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            disabled={showAuthError || showRoleError}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="approval-status">
              Status
            </label>
            <select
              id="approval-status"
              className="input-group__field"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              disabled={showAuthError || showRoleError}
            >
              <option value="all">All pending applications</option>
              <option value="awaiting">Awaiting Approval</option>
              <option value="selected">Selected Applicant</option>
            </select>
          </div>

          <div className="approval-toolbar__actions">
            <Button variant="primary" onClick={applyFilters} disabled={showAuthError || showRoleError}>Apply Filters</Button>
            <Button variant="secondary" onClick={resetFilters} disabled={showAuthError || showRoleError}>Reset</Button>
          </div>
        </div>

        <div className="approval-toolbar__summary">
          <div className="approval-summary-card">
            <span className="approval-summary-card__label">Pending</span>
            <strong className="approval-summary-card__value">{pendingApplicants.length}</strong>
            <p className="approval-summary-card__hint">Applications waiting for administrator decision.</p>
          </div>
          <div className="approval-summary-card">
            <span className="approval-summary-card__label">Selected</span>
            <strong className="approval-summary-card__value">{decisionApplicant ? "1" : "0"}</strong>
            <p className="approval-summary-card__hint">Current application shown in the decision panel.</p>
          </div>
        </div>
      </div>

      {effectiveErrorMessage && <p className="approval-feedback approval-feedback--error">{effectiveErrorMessage}</p>}
      {successMessage && <p className="approval-feedback approval-feedback--success">{successMessage}</p>}

      <div className="approval-layout">
        <div className="approval-list">
          {isLoading && <p className="approval-panel__note">Loading pending applicants...</p>}

          {!isLoading && !effectiveErrorMessage && filteredApplicants.map((applicant) => (
            <article
              key={applicant.userId}
              className={`approval-card ${decisionApplicant?.userId === applicant.userId ? "approval-card--active" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedUserId(applicant.userId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedUserId(applicant.userId);
                }
              }}
            >
              <div className="approval-card__content">
                <div className="approval-card__meta">
                  <span className="approval-chip--status">Awaiting Approval</span>
                  <span className="approval-chip">Registered Viewer</span>
                </div>

                <h2 className="approval-card__title">{applicant.userName}</h2>
                <p className="approval-card__subtitle">{applicant.email}</p>
                <p className="approval-card__description">{applicant.contributorApplication || "No application text submitted."}</p>
              </div>

              <div className="approval-card__facts">
                <div className="approval-card__fact">
                  <span>Requested</span>
                  <strong>{formatRequestedAt(applicant.contributorRequestedAt)}</strong>
                </div>
                <div className="approval-card__fact">
                  <span>Promotion Path</span>
                  <strong>Viewer to Contributor</strong>
                </div>
              </div>
            </article>
          ))}
        </div>

        {decisionApplicant ? (
          <div className="approval-detail">
              <section className="approval-panel">
                <div className="approval-profile">
                  <span className="approval-profile__avatar">
                    {decisionApplicant.userName.charAt(0).toUpperCase()}
                  </span>

                  <div>
                    <h3 className="approval-profile__name">{decisionApplicant.userName}</h3>
                    <p className="approval-profile__role">Registered Viewer requesting promotion to Contributor</p>
                  </div>
                </div>

              <div className="approval-data-grid">
                <div className="approval-data-item">
                  <span className="approval-data-item__label">Email</span>
                  <p className="approval-data-item__value">{decisionApplicant.email}</p>
                </div>

                <div className="approval-data-item">
                  <span className="approval-data-item__label">Requested At</span>
                  <p className="approval-data-item__value">
                    {formatRequestedAt(decisionApplicant.contributorRequestedAt)}
                  </p>
                </div>

                <div className="approval-data-item approval-data-item--full">
                  <span className="approval-data-item__label">Application Text</span>
                  <p className="approval-data-item__text">{decisionApplicant.contributorApplication || "No application text submitted."}</p>
                </div>
              </div>
              </section>

              <section className="approval-panel">
                <h3 className="approval-panel__title">Decision Panel</h3>
                <p className="approval-panel__description">
                  Approve this request to unlock contributor submission access, or reject it to clear the pending promotion request.
                </p>

                <div className="approval-panel__section">
                  <label className="approval-panel__section-label" htmlFor="approval-rejection-reason">
                    Rejection Reason
                  </label>
                  <textarea
                    id="approval-rejection-reason"
                    className="approval-note"
                    placeholder="Explain why this contributor application was not approved."
                    value={rejectionReason}
                    onChange={(event) => {
                      setRejectionReason(event.target.value);
                      setErrorMessage("");
                    }}
                    disabled={isApproving || isRejecting || showAuthError || showRoleError}
                  />
                </div>

                <div className="approval-panel__actions">
                  <Button
                    variant="primary"
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting || showAuthError || showRoleError}
                  >
                    {isApproving ? "Approving..." : "Approve Contributor"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleReject}
                    disabled={isApproving || isRejecting || showAuthError || showRoleError}
                  >
                    {isRejecting ? "Rejecting..." : "Reject Application"}
                  </Button>
                </div>
              </section>
          </div>
        ) : (
          <section className="approval-panel approval-panel--empty">
            <h3 className="approval-panel__title">No pending applications</h3>
            <p className="approval-panel__description">
              Contributor requests will appear here after registered viewers submit an application from their profile.
            </p>
          </section>
        )}
      </div>
    </AdminWorkspace>
  );
}

export default UserApproval;
