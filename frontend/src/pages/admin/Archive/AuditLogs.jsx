import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/Button/Button";
import Input from "../../../components/Input/Input";
import { useAuth } from "../../../context/AuthContext";
import { fetchAuditLogs } from "../../../services/adminService";
import AdminWorkspace from "../AdminWorkspace";
import "./AuditLogs.css";

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function AuditLogs() {
  const { token, isAuthenticated, user } = useAuth();
  const [auditEntries, setAuditEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const isAdmin = user?.role === "ADMIN_REVIEWER";
  const showAuthError = !isAuthenticated || !token;
  const showRoleError = isAuthenticated && Boolean(token) && !isAdmin;

  useEffect(() => {
    const loadAuditLogs = async () => {
      if (!token) {
        setAuditEntries([]);
        setSelectedEntryId(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchAuditLogs(
          {
            keyword: appliedKeyword,
            module: moduleFilter || undefined,
            status: statusFilter || undefined,
          },
          token
        );
        const entries = Array.isArray(result) ? result : [];
        setAuditEntries(entries);
        setSelectedEntryId((previous) => (
          entries.some((entry) => entry.id === previous) ? previous : (entries[0]?.id || null)
        ));
      } catch (error) {
        setAuditEntries([]);
        setSelectedEntryId(null);
        setErrorMessage(error.message || "Unable to load audit logs.");
      } finally {
        setIsLoading(false);
      }
    };

    if (showAuthError || showRoleError) {
      setAuditEntries([]);
      setSelectedEntryId(null);
      setIsLoading(false);
      return;
    }

    loadAuditLogs();
  }, [appliedKeyword, moduleFilter, statusFilter, token, showAuthError, showRoleError]);

  const selectedEntry = useMemo(
    () => auditEntries.find((entry) => entry.id === selectedEntryId) || auditEntries[0] || null,
    [auditEntries, selectedEntryId]
  );

  const summary = useMemo(() => ({
    total: auditEntries.length,
    archiveFlow: auditEntries.filter((entry) => entry.module === "Archive" || entry.module === "Restore").length,
    reviewActions: auditEntries.filter((entry) => entry.module === "Review").length,
    taxonomyUpdates: auditEntries.filter((entry) => entry.module === "Master Categories" || entry.module === "Master Tags").length,
  }), [auditEntries]);

  const effectiveErrorMessage = showAuthError
    ? "Please log in with an administrator account to view audit logs."
    : showRoleError
    ? "Your account does not have administrator access to view audit logs."
    : errorMessage;

  const applyFilters = () => {
    setAppliedKeyword(keywordInput);
  };

  const resetFilters = () => {
    setKeywordInput("");
    setAppliedKeyword("");
    setModuleFilter("");
    setStatusFilter("");
  };

  return (
    <AdminWorkspace
      eyebrow="Audit"
      title="Audit Logs"
      description="Review administrator activity across archive actions, contributor approvals, resource moderation, and taxonomy updates from one traceable operations log."
      actions={[{ label: "Back to Dashboard", to: "/admin", variant: "secondary" }]}
    >
      <div className="audit-toolbar">
        <div className="audit-toolbar__filters admin-panel">
          <Input
            id="audit-keyword"
            label="Keyword"
            placeholder="Search target, operator, or action"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            disabled={showAuthError || showRoleError}
          />

          <div className="input-group">
            <label className="input-group__label" htmlFor="audit-module">
              Module
            </label>
            <select
              id="audit-module"
              className="input-group__field"
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              disabled={showAuthError || showRoleError}
            >
              <option value="">All Modules</option>
              <option value="Archive">Archive</option>
              <option value="Restore">Restore</option>
              <option value="Review">Review</option>
              <option value="Promotion">Promotion</option>
              <option value="Master Categories">Master Categories</option>
              <option value="Master Tags">Master Tags</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-group__label" htmlFor="audit-status">
              Status
            </label>
            <select
              id="audit-status"
              className="input-group__field"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              disabled={showAuthError || showRoleError}
            >
              <option value="">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Rejected">Rejected</option>
              <option value="Needs Follow-up">Needs Follow-up</option>
            </select>
          </div>

          <div className="audit-toolbar__actions">
            <Button variant="primary" onClick={applyFilters} disabled={showAuthError || showRoleError}>Apply Filters</Button>
            <Button variant="secondary" onClick={resetFilters} disabled={showAuthError || showRoleError}>Reset</Button>
          </div>
        </div>

        <div className="audit-toolbar__summary">
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Events Today</span>
            <strong className="audit-summary-card__value">{summary.total}</strong>
            <p className="audit-summary-card__hint">Administrative actions currently returned by the live audit endpoint.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Archive Flow</span>
            <strong className="audit-summary-card__value">{summary.archiveFlow}</strong>
            <p className="audit-summary-card__hint">Archive and restore events recorded in the resource lifecycle workflow.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Review Actions</span>
            <strong className="audit-summary-card__value">{summary.reviewActions}</strong>
            <p className="audit-summary-card__hint">Approval and rejection decisions captured from the moderation queue.</p>
          </div>
          <div className="audit-summary-card">
            <span className="audit-summary-card__label">Taxonomy Updates</span>
            <strong className="audit-summary-card__value">{summary.taxonomyUpdates}</strong>
            <p className="audit-summary-card__hint">Category and tag changes tracked for later accountability review.</p>
          </div>
        </div>
      </div>

      {effectiveErrorMessage && <p className="review-feedback-message review-feedback-message--error">{effectiveErrorMessage}</p>}
      {isLoading && <p className="review-feedback-message">Loading audit logs...</p>}
      {!isLoading && !effectiveErrorMessage && auditEntries.length === 0 && (
        <p className="review-feedback-message">No audit log entries matched the current filters.</p>
      )}

      <div className="audit-layout">
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Operator</th>
                <th>Module</th>
                <th>Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => setSelectedEntryId(entry.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{formatDateTime(entry.createdAt)}</td>
                  <td>
                    <span className="audit-chip">{entry.operatorName}</span>
                  </td>
                  <td>{entry.module || "-"}</td>
                  <td>
                    <div className="audit-table__action">
                      <strong>{entry.action}</strong>
                      <span>{entry.targetName || "-"}</span>
                    </div>
                  </td>
                  <td>
                    <span className="audit-chip--status">{entry.status || "-"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedEntry && (
          <div className="audit-panel">
            <section className="audit-panel__card">
              <h3 className="audit-panel__title">Selected Event</h3>
              <p className="audit-panel__description">
                This panel summarizes the currently selected admin action using live audit data from the backend.
              </p>

              <div className="audit-detail-grid">
                <div className="audit-detail-item">
                  <span className="audit-detail-item__label">Module</span>
                  <p className="audit-detail-item__value">{selectedEntry.module || "-"}</p>
                </div>
                <div className="audit-detail-item">
                  <span className="audit-detail-item__label">Operator</span>
                  <p className="audit-detail-item__value">{selectedEntry.operatorName || "-"}</p>
                </div>
                <div className="audit-detail-item">
                  <span className="audit-detail-item__label">Action</span>
                  <p className="audit-detail-item__value">{selectedEntry.action || "-"}</p>
                </div>
                <div className="audit-detail-item">
                  <span className="audit-detail-item__label">Target</span>
                  <p className="audit-detail-item__value">{selectedEntry.targetName || "-"}</p>
                </div>
                <div className="audit-detail-item">
                  <span className="audit-detail-item__label">Timestamp</span>
                  <p className="audit-detail-item__value">{formatDateTime(selectedEntry.createdAt)}</p>
                </div>
                <div className="audit-detail-item">
                  <span className="audit-detail-item__label">Status</span>
                  <p className="audit-detail-item__value">{selectedEntry.status || "-"}</p>
                </div>
                <div className="audit-detail-item audit-detail-item--wide">
                  <span className="audit-detail-item__label">Detail</span>
                  <p className="audit-detail-item__text">{selectedEntry.detail || "No additional detail recorded."}</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </AdminWorkspace>
  );
}

export default AuditLogs;
