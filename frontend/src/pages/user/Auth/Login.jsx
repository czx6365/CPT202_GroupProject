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
            <h1 className="auth-showcase__title">Welcome back to HeritageHub.</h1>
            <p className="auth-showcase__text">
              Continue exploring cultural stories, saved resources, and community contributions from one personal space.
            </p>

          </div>

          <div className="auth-showcase__grid">
            <div className="auth-feature">
              <h4>Your saved discoveries</h4>
              <p>Return to the heritage resources, stories, and collections you have explored before.</p>
            </div>
            <div className="auth-feature">
              <h4>Personal workspace</h4>
              <p>Manage your profile, saved items, and contribution activity in one place.</p>
            </div>
            <div className="auth-feature">
              <h4>Contributor access</h4>
              <p>Approved contributors can create and update cultural heritage submissions.</p>
            </div>
            <div className="auth-feature">
              <h4>Secure account</h4>
              <p>Your account keeps your activity connected while helping protect community content.</p>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card__eyebrow">Login</div>
          <h2 className="auth-card__title">Sign in to HeritageHub</h2>
          <p className="auth-card__subtitle">
            Use your username and password to access your HeritageHub account.
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
              <small>Enter the username you used when creating your account.</small>
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
