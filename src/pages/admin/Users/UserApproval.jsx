import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import { useAuth } from "../../../context/AuthContext";
import { approveContributor, fetchPendingUsers } from "../../../services/adminService";
import AdminWorkspace from "../AdminWorkspace";
import "./UserApproval.css";

function UserApproval() {
  const { token } = useAuth();
  const [pendingApplicants, setPendingApplicants] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const loadPendingUsers = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const users = await fetchPendingUsers(token);
        setPendingApplicants(Array.isArray(users) ? users : []);
        setSelectedUserId(users?.[0]?.userId || null);
      } catch (error) {
        setErrorMessage(error.message || "Unable to load pending applicants.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingUsers();
  }, [token]);

  const filteredApplicants = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return pendingApplicants;

    return pendingApplicants.filter((applicant) => {
      const name = applicant.userName?.toLowerCase() || "";
      const email = applicant.email?.toLowerCase() || "";
      const application = applicant.contributorApplication?.toLowerCase() || "";
      return (
        name.includes(normalizedKeyword) ||
        email.includes(normalizedKeyword) ||
        application.includes(normalizedKeyword)
      );
    });
  }, [keyword, pendingApplicants]);

  const selectedApplicant = useMemo(
    () => filteredApplicants.find((applicant) => applicant.userId === selectedUserId) || filteredApplicants[0] || null,
    [filteredApplicants, selectedUserId]
  );

  const applyKeyword = () => {
    setSelectedUserId((previous) => {
      if (filteredApplicants.some((applicant) => applicant.userId === previous)) {
        return previous;
      }
      return filteredApplicants[0]?.userId || null;
    });
  };

  const resetKeyword = () => {
    setKeyword("");
    setSelectedUserId(pendingApplicants[0]?.userId || null);
  };

  const handleApprove = async () => {
    if (!selectedApplicant || !token) return;

    setIsApproving(true);
    setActionMessage("");

    try {
      await approveContributor(selectedApplicant.userId, token);
      setPendingApplicants((previous) => previous.filter((item) => item.userId !== selectedApplicant.userId));
      setSelectedUserId(null);
      setActionMessage(`Approved ${selectedApplicant.userName} as contributor.`);
    } catch (error) {
      setActionMessage(error.message || "Unable to approve this applicant.");
    } finally {
      setIsApproving(false);
    }
  };

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
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="approval-status">
              Status
            </label>
            <select id="approval-status" className="input-group__field" value="pending" disabled>
              <option value="pending">Awaiting Approval</option>
            </select>
          </div>

          <div className="approval-toolbar__actions">
            <Button variant="primary" onClick={applyKeyword}>Apply Filters</Button>
            <Button variant="secondary" onClick={resetKeyword}>Reset</Button>
          </div>
        </div>

        <div className="approval-toolbar__summary">
          <div className="approval-summary-card">
            <span className="approval-summary-card__label">Pending</span>
            <strong className="approval-summary-card__value">{filteredApplicants.length}</strong>
            <p className="approval-summary-card__hint">Applications waiting for administrator decision.</p>
          </div>
          <div className="approval-summary-card">
            <span className="approval-summary-card__label">Selected</span>
            <strong className="approval-summary-card__value">{selectedApplicant ? "1" : "0"}</strong>
            <p className="approval-summary-card__hint">Current application shown in the decision panel.</p>
          </div>
          <div className="approval-summary-card">
            <span className="approval-summary-card__label">Filter</span>
            <strong className="approval-summary-card__value">{keyword.trim() ? "ON" : "OFF"}</strong>
            <p className="approval-summary-card__hint">Keyword filter for applicant name, email, or application text.</p>
          </div>
          <div className="approval-summary-card">
            <span className="approval-summary-card__label">Data Source</span>
            <strong className="approval-summary-card__value">Live API</strong>
            <p className="approval-summary-card__hint">Pending applicants now come from backend `/api/admin/contributors/pending`.</p>
          </div>
        </div>
      </div>

      <div className="approval-layout">
        <div className="approval-list">
          {isLoading && <p>Loading pending applicants...</p>}
          {!isLoading && errorMessage && <p className="approval-panel__note">{errorMessage}</p>}
          {!isLoading && !errorMessage && filteredApplicants.length === 0 && (
            <p className="approval-panel__note">No pending contributor applications.</p>
          )}

          {!isLoading && !errorMessage && filteredApplicants.map((applicant) => (
            <article
              key={applicant.userId}
              className={`approval-card ${selectedApplicant?.userId === applicant.userId ? "approval-card--active" : ""}`}
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
                  <strong>{applicant.contributorRequestedAt ? new Date(applicant.contributorRequestedAt).toLocaleString() : "-"}</strong>
                </div>
                <div className="approval-card__fact">
                  <span>Promotion Path</span>
                  <strong>Viewer to Contributor</strong>
                </div>

                <div className="approval-card__footer">
                  <Button variant="primary" onClick={() => setSelectedUserId(applicant.userId)}>Open Applicant</Button>
                  <Button variant="secondary" className="approval-card__secondary" onClick={() => setSelectedUserId(applicant.userId)}>
                    Quick Review
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="approval-detail">
          <section className="approval-panel">
            <div className="approval-profile">
              <span className="approval-profile__avatar">
                {(selectedApplicant?.userName || "U").charAt(0).toUpperCase()}
              </span>

              <div>
                <h3 className="approval-profile__name">{selectedApplicant?.userName || "No applicant selected"}</h3>
                <p className="approval-profile__role">
                  {selectedApplicant ? "Registered Viewer requesting promotion to Contributor" : "Select an applicant to review details."}
                </p>
              </div>
            </div>

            {selectedApplicant && (
              <div className="approval-data-grid">
                <div className="approval-data-item">
                  <span className="approval-data-item__label">Email</span>
                  <p className="approval-data-item__value">{selectedApplicant.email}</p>
                </div>

                <div className="approval-data-item">
                  <span className="approval-data-item__label">Requested At</span>
                  <p className="approval-data-item__value">
                    {selectedApplicant.contributorRequestedAt
                      ? new Date(selectedApplicant.contributorRequestedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>

                <div className="approval-data-item approval-data-item--full">
                  <span className="approval-data-item__label">Application Text</span>
                  <p className="approval-data-item__text">{selectedApplicant.contributorApplication || "No application text submitted."}</p>
                </div>
              </div>
            )}
          </section>

          <section className="approval-panel">
            <h3 className="approval-panel__title">Decision Panel</h3>
            <p className="approval-panel__description">
              Approve this request to grant contributor access and unlock the submission workflow for this account.
            </p>

            <div className="approval-panel__actions">
              <Button variant="primary" onClick={handleApprove} disabled={!selectedApplicant || isApproving}>
                {isApproving ? "Approving..." : "Approve Contributor"}
              </Button>
            </div>

            {actionMessage && <p className="approval-panel__note">{actionMessage}</p>}
          </section>
        </div>
      </div>
    </AdminWorkspace>
  );
}

export default UserApproval;
