import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { applyContributor, getProfile, updateProfile } from "../../../services/authService";
import "../../Homepage.css";
import "./Profile.css";

function Profile() {
  const { isAuthenticated, token, user, setUser } = useAuth();
  const [profile, setProfile] = useState(user || null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [applicationText, setApplicationText] = useState("");
  const [applicationFeedback, setApplicationFeedback] = useState("");
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  useEffect(() => {
    const sections = document.querySelectorAll(".reveal-section");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.userId || !token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const profileData = await getProfile(user.userId, token);
        setProfile(profileData);
        setUser(profileData);
        setApplicationText(profileData?.contributorApplication || "");
      } catch (error) {
        setErrorMessage(error.message || "Unable to load profile.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [setUser, token, user?.userId]);

  const roleLabel = useMemo(() => {
    const role =
      profile?.role === "CONTRIBUTOR" && profile?.contributorApproved
        ? "CONTRIBUTOR"
        : "REGISTERED_VIEWER";
    if (role === "ADMIN_REVIEWER") return "Admin";
    if (role === "CONTRIBUTOR") return "Contributor";
    return "Registered Viewer";
  }, [profile?.contributorApproved, profile?.role]);

  const contributorStatus = useMemo(() => {
    if (!profile) return "";
    if (profile.role === "CONTRIBUTOR" && profile.contributorApproved) return "Approved";
    if (profile.contributorRequestedAt) return "Pending review";
    return "Not applied";
  }, [profile]);
  const isApprovedContributor = profile?.role === "CONTRIBUTOR" && Boolean(profile?.contributorApproved);
  const isContributorPending = Boolean(profile?.contributorRequestedAt) && !profile?.contributorApproved;

  const contributorHeading = isApprovedContributor
    ? "Contributor Access Approved"
    : isContributorPending
    ? "Contributor Application Pending"
    : "Become a Contributor";

  const contributorDescription = isApprovedContributor
    ? "Your account has been approved for contributor access. You can now move into the submission workflow."
    : isContributorPending
    ? "Your application has been submitted and is waiting for administrator review. You can still revise the text below before approval."
    : "Apply to share your cultural content. New accounts begin as registered viewers and can request contributor access here.";

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));
    setPasswordFeedback("");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwordData.currentPassword.trim()) {
      setPasswordFeedback("Please enter your current password.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordFeedback("New password must contain at least 6 characters.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordFeedback("New password and confirmation do not match.");
      return;
    }

    setIsSavingPassword(true);
    setPasswordFeedback("");

    try {
      const updatedUser = await updateProfile(
        profile.userId,
        {
          currentPassword: passwordData.currentPassword,
          password: passwordData.newPassword,
        },
        token
      );

      setProfile(updatedUser);
      setUser(updatedUser);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      setPasswordFeedback("Password updated successfully.");
    } catch (error) {
      setPasswordFeedback(error.message || "Unable to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleContributorSubmit = async (event) => {
    event.preventDefault();

    if (!applicationText.trim()) {
      setApplicationFeedback("Please enter your contributor application.");
      return;
    }

    setIsSubmittingApplication(true);
    setApplicationFeedback("");

    try {
      const updatedUser = await applyContributor(profile.userId, applicationText.trim(), token);
      setProfile(updatedUser);
      setUser(updatedUser);
      setApplicationFeedback("Application submitted. Admin can now review it in User Approval.");
    } catch (error) {
      setApplicationFeedback(error.message || "Unable to submit contributor application.");
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  return (
    <div className="homepage">
      <section className="homepage-section reveal-section">
        <div className="section-heading">
          <div className="section-heading__eyebrow">User Profile</div>
          <h2 className="section-heading__title">Manage your account</h2>
          <p className="section-heading__text">View your personal information and manage your account settings.</p>
        </div>

        <div className="profile-bubble profile-bubble--split">
          <div className="profile-left">
            <div className="profile-avatar-large profile-avatar-initial">
              {(profile?.userName || user?.userName || "U").charAt(0).toUpperCase()}
            </div>

            {isLoading ? (
              <div className="profile-info-large">Loading profile...</div>
            ) : (
              <div className="profile-info-large">
                <div>
                  <strong>Name:</strong> {profile?.userName || "-"}
                </div>
                <div>
                  <strong>Email:</strong> {profile?.email || "-"}
                </div>
                <div>
                  <strong>Role:</strong>
                  <span className="profile-role-badge">{roleLabel}</span>
                </div>
                <div>
                  <strong>Contributor Status:</strong> {contributorStatus}
                </div>
              </div>
            )}

            {errorMessage && <p className="profile-feedback profile-feedback--error">{errorMessage}</p>}
          </div>

          <div className="profile-right">
            <div className="profile-placeholder">
              <h3 className="profile-panel-title">Security Settings</h3>
              <p>You can update your password to keep your account secure.</p>
            </div>

            {!showPasswordForm ? (
              <button className="profile-button" onClick={() => setShowPasswordForm(true)} type="button" disabled={isLoading}>
                Change Password
              </button>
            ) : (
              <form className="profile-password-form" onSubmit={handlePasswordSubmit}>
                <div className="profile-field">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <button className="profile-button profile-button--accent" type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? "Saving..." : "Confirm"}
                </button>
              </form>
            )}

            {passwordFeedback && (
              <p className={`profile-feedback ${passwordFeedback.includes("success") ? "profile-feedback--ok" : "profile-feedback--error"}`}>
                {passwordFeedback}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="homepage-section reveal-section">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Contributor</div>
          <h2 className="section-heading__title">{contributorHeading}</h2>
          <p className="section-heading__text">{contributorDescription}</p>
        </div>

        <div className="profile-bubble">
          <div className="profile-application-status">
            <span className="profile-application-status__label">Application Status</span>
            <strong className="profile-application-status__value">{contributorStatus || "Not applied"}</strong>
            <p className="profile-application-status__text">
              {isApprovedContributor
                ? "Contributor access is active on this account."
                : isContributorPending
                ? "An administrator will review your request before your role changes."
                : "Submit an application below if you want to contribute heritage resources."}
            </p>
          </div>

          <form className="profile-form" onSubmit={handleContributorSubmit}>
            <textarea
              placeholder="Explain why you want contributor access and what kind of heritage content you plan to submit."
              rows="5"
              value={applicationText}
              onChange={(event) => {
                setApplicationText(event.target.value);
                setApplicationFeedback("");
              }}
              disabled={isSubmittingApplication || isApprovedContributor}
            />

            <button
              className="profile-button profile-button--accent"
              type="submit"
              disabled={isSubmittingApplication || isLoading || isApprovedContributor}
            >
              {isApprovedContributor
                ? "Contributor Approved"
                : isSubmittingApplication
                ? "Submitting..."
                : isContributorPending
                ? "Update Pending Application"
                : "Submit Application"}
            </button>
          </form>

          {applicationFeedback && (
            <p className={`profile-feedback ${applicationFeedback.includes("submitted") ? "profile-feedback--ok" : "profile-feedback--error"}`}>
              {applicationFeedback}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Profile;
