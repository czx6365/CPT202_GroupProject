import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerRequest, sendVerificationCode } from "../../../services/authService";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    verificationCode: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;

    const timerId = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [resendSeconds]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { label: "Weak", width: "33%", background: "#d64545", textClass: "password-weak" };
    if (score <= 4) return { label: "Medium", width: "66%", background: "#c8a96a", textClass: "password-medium" };
    return { label: "Strong", width: "100%", background: "#2f3e2f", textClass: "password-strong" };
  };

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.userName.trim()) nextErrors.userName = "Username is required.";
    if (!formData.email.trim()) nextErrors.email = "Email is required.";
    else if (!validateEmail(formData.email)) nextErrors.email = "Please enter a valid email address.";
    if (!formData.verificationCode.trim()) nextErrors.verificationCode = "Verification code is required.";
    else if (!/^\d{6}$/.test(formData.verificationCode.trim())) {
      nextErrors.verificationCode = "Enter the 6-digit code sent to your email.";
    }
    if (!formData.password) nextErrors.password = "Password is required.";
    else if (formData.password.length < 6) nextErrors.password = "Password must contain at least 6 characters.";
    if (!formData.confirmPassword) nextErrors.confirmPassword = "Please confirm your password.";
    else if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    if (!formData.agree) nextErrors.agree = "You must agree to the platform terms and privacy notice.";

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "email" ? { verificationCode: "" } : {}),
    }));
    if (name === "email") {
      setResendSeconds(0);
    }
    setErrors((previous) => ({
      ...previous,
      [name]: "",
      ...(name === "email" ? { verificationCode: "" } : {}),
    }));
    setSubmitError("");
    setSuccessMessage("");
  };

  const handleSendCode = async () => {
    const email = formData.email.trim().toLowerCase();
    if (!email) {
      setErrors((previous) => ({ ...previous, email: "Email is required." }));
      return;
    }
    if (!validateEmail(email)) {
      setErrors((previous) => ({ ...previous, email: "Please enter a valid email address." }));
      return;
    }

    setIsSendingCode(true);
    setSubmitError("");
    setSuccessMessage("");
    setErrors((previous) => ({ ...previous, email: "", verificationCode: "" }));

    try {
      await sendVerificationCode(email);
      setFormData((previous) => ({ ...previous, email }));
      setSuccessMessage("Verification code sent. Please check your email.");
      setResendSeconds(60);
    } catch (error) {
      setSubmitError(error.message || "Unable to send verification code.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      await registerRequest({
        userName: formData.userName.trim(),
        email: formData.email.trim().toLowerCase(),
        verificationCode: formData.verificationCode.trim(),
        password: formData.password,
      });

      setSuccessMessage("Registration successful. You can now sign in with your new account.");
      window.setTimeout(() => navigate("/login"), 900);
    } catch (error) {
      setSubmitError(error.message || "Unable to register with the provided information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <div className="auth-showcase">
          <div className="auth-showcase__content">
            <div className="auth-showcase__eyebrow">Create an Account</div>
            <h1 className="auth-showcase__title">Start your journey with HeritageHub.</h1>
            <p className="auth-showcase__text">
              Create an account to save discoveries, follow cultural resources, and take part in the HeritageHub community.
            </p>
          </div>

          <div className="auth-showcase__grid">
            <div className="auth-feature">
              <h4>Build your profile</h4>
              <p>Set up a personal account for exploring heritage resources and keeping track of your activity.</p>
            </div>
            <div className="auth-feature">
              <h4>Explore as a member</h4>
              <p>Browse stories, collections, and cultural materials with a space that belongs to you.</p>
            </div>
            <div className="auth-feature">
              <h4>Join the community</h4>
              <p>Connect with a platform designed for sharing, preserving, and discovering living heritage.</p>
            </div>
            <div className="auth-feature">
              <h4>Contribute later</h4>
              <p>After joining, you can request contributor access when you are ready to share resources.</p>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card__eyebrow">Register</div>
          <h2 className="auth-card__title">Create your HeritageHub account</h2>
          <p className="auth-card__subtitle">
            Complete the form below to create your personal HeritageHub account.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="userName">Username</label>
              <input
                id="userName"
                name="userName"
                type="text"
                placeholder="Create a username"
                value={formData.userName}
                onChange={handleChange}
                className={errors.userName ? "is-invalid" : ""}
              />
              <small>Choose a unique username for signing in.</small>
              {errors.userName && <div className="auth-error">{errors.userName}</div>}
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <div className="auth-code-row">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "is-invalid" : ""}
                />
                <button
                  type="button"
                  className="auth-button auth-button--compact"
                  onClick={handleSendCode}
                  disabled={isSendingCode || resendSeconds > 0}
                >
                  {isSendingCode ? "Sending..." : resendSeconds > 0 ? `${resendSeconds}s` : "Send code"}
                </button>
              </div>
              <small>Use an email address you can access.</small>
              {errors.email && <div className="auth-error">{errors.email}</div>}
            </div>

            <div className="auth-field">
              <label htmlFor="verificationCode">Email verification code</label>
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={formData.verificationCode}
                onChange={handleChange}
                className={errors.verificationCode ? "is-invalid" : ""}
              />
              <small>The code is valid for 5 minutes. You can resend it after the 60-second countdown.</small>
              {errors.verificationCode && <div className="auth-error">{errors.verificationCode}</div>}
            </div>

            <div className="auth-form__row">
              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "is-invalid" : ""}
                />
                <div className="auth-password-strength">
                  <div className="auth-password-strength__bar">
                    <div
                      className="auth-password-strength__fill"
                      style={{
                        width: formData.password ? passwordStrength.width : "0%",
                        background: passwordStrength.background,
                      }}
                    />
                  </div>
                  <span className={`auth-password-strength__text ${formData.password ? passwordStrength.textClass : ""}`}>
                    {formData.password ? passwordStrength.label : ""}
                  </span>
                </div>
                {errors.password && <div className="auth-error">{errors.password}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? "is-invalid" : ""}
                />
                {errors.confirmPassword && <div className="auth-error">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="auth-form__options">
              <label className="auth-checkbox">
                <input type="checkbox" name="agree" checked={formData.agree} onChange={handleChange} />
                I agree to the platform terms and privacy notice.
              </label>
            </div>

            {errors.agree && <div className="auth-error">{errors.agree}</div>}
            {submitError && <div className="auth-error auth-error--surface">{submitError}</div>}
            {successMessage && <div className="auth-success">{successMessage}</div>}

            <button type="submit" className="auth-button auth-button--accent" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Register;
