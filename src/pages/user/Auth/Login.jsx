import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { login as loginRequest } from "../../../services/authService";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    userName: "",
    password: "",
    remember: true,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.userName.trim()) {
      nextErrors.userName = "Username is required.";
    }

    if (!formData.password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Password must contain at least 6 characters.";
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
    setSubmitError("");
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

    try {
      const authPayload = await loginRequest({
        userName: formData.userName.trim(),
        password: formData.password,
      });

      login(authPayload, { persistent: formData.remember });

      if (authPayload?.user?.role === "ADMIN_REVIEWER") {
        navigate("/admin");
      } else if (authPayload?.user?.role === "CONTRIBUTOR" && authPayload?.user?.contributorApproved) {
        navigate("/dashboard");
      } else {
        navigate("/profile");
      }
    } catch (error) {
      setSubmitError(error.message || "Unable to sign in with the provided credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <div className="auth-showcase">
          <div className="auth-showcase__content">
            <div className="auth-showcase__eyebrow">HeritageHub Access</div>
            <h1 className="auth-showcase__title">Welcome back to your cultural archive.</h1>
            <p className="auth-showcase__text">
              Sign in with your real backend account to access saved discovery, role-based navigation, and protected features.
            </p>

            <div className="auth-badge-list">
              <span className="auth-badge">Spring Boot API</span>
              <span className="auth-badge">JWT token</span>
              <span className="auth-badge">Remember me</span>
            </div>
          </div>

          <div className="auth-showcase__grid">
            <div className="auth-feature">
              <h4>Live authentication</h4>
              <p>The login form now uses the backend response instead of creating a fake token in the browser.</p>
            </div>
            <div className="auth-feature">
              <h4>Persistent session</h4>
              <p>Choose whether the JWT should stay in localStorage or only survive this browser session.</p>
            </div>
            <div className="auth-feature">
              <h4>Role-based landing</h4>
              <p>After sign-in, viewers, contributors, and admins can be routed to different workspace pages.</p>
            </div>
            <div className="auth-feature">
              <h4>Consistent navbar state</h4>
              <p>The auth context updates immediately so the navbar can switch from guest actions to the user profile chip.</p>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card__eyebrow">Login</div>
          <h2 className="auth-card__title">Sign in to HeritageHub</h2>
          <p className="auth-card__subtitle">
            Use the same username and password stored in your backend database account.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="userName">Username</label>
              <input
                id="userName"
                name="userName"
                type="text"
                placeholder="Enter your username"
                value={formData.userName}
                onChange={handleChange}
                className={errors.userName ? "is-invalid" : ""}
              />
              <small>Backend login uses `userName`, not email.</small>
              {errors.userName && <div className="auth-error">{errors.userName}</div>}
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "is-invalid" : ""}
              />
              {errors.password && <div className="auth-error">{errors.password}</div>}
            </div>

            <div className="auth-form__options">
              <label className="auth-checkbox">
                <input type="checkbox" name="remember" checked={formData.remember} onChange={handleChange} />
                Remember me
              </label>

              <Link to="/register" className="auth-link">
                Create account
              </Link>
            </div>

            {submitError && <div className="auth-error auth-error--surface">{submitError}</div>}

            <button type="submit" className="auth-button" disabled={isSubmitting}>
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>

            <div className="auth-divider" />

            <Link to="/discovery" className="auth-button auth-button--accent auth-button--link">
              Continue as Guest
            </Link>
          </form>

          <div className="auth-footer">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
