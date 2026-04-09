import React, { useState } from "react";
import "./Auth.css";

function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "viewer",
        remember: false,
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!validateEmail(formData.email)) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (!formData.password.trim()) {
            newErrors.password = "Password is required.";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must contain at least 6 characters.";
        }

        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
        setSuccessMessage("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setSuccessMessage("");
            return;
        }

        const fakeToken = "demo-token-123456";
        const storage = formData.remember ? localStorage : sessionStorage;

        storage.setItem("token", fakeToken);
        storage.setItem("role", formData.role);
        storage.setItem("userEmail", formData.email);

        setSuccessMessage("Login successful. Your session has been saved.");
        console.log("Login submitted:", formData);
    };

    return (
        <section className="auth-page">
            <div className="auth-shell">
                <div className="auth-showcase">
                    <div className="auth-showcase__content">
                        <div className="auth-showcase__eyebrow">HeritageHub Access</div>
                        <h1 className="auth-showcase__title">
                            Welcome back to your cultural archive.
                        </h1>
                        <p className="auth-showcase__text">
                            Sign in to continue exploring heritage resources, saved collections,
                            and community stories through a seamless and secure system entrance.
                        </p>

                        <div className="auth-badge-list">
                            <span className="auth-badge">Secure sign-in</span>
                            <span className="auth-badge">Role-based access</span>
                            <span className="auth-badge">Saved collections</span>
                        </div>
                    </div>

                    <div className="auth-showcase__grid">
                        <div className="auth-feature">
                            <h4>Explore with continuity</h4>
                            <p>Return to your saved resources, browsing history, and curated discoveries.</p>
                        </div>
                        <div className="auth-feature">
                            <h4>Access your profile</h4>
                            <p>Manage personal details and track your path from viewer to contributor.</p>
                        </div>
                        <div className="auth-feature">
                            <h4>Join the community</h4>
                            <p>Read stories, engage with comments, and discover living heritage in one place.</p>
                        </div>
                        <div className="auth-feature">
                            <h4>Protected entry point</h4>
                            <p>Your authentication flow supports a reliable and role-aware user experience.</p>
                        </div>
                    </div>
                </div>

                <div className="auth-card">
                    <div className="auth-card__eyebrow">Login</div>
                    <h2 className="auth-card__title">Sign in to HeritageHub</h2>
                    <p className="auth-card__subtitle">
                        Enter your account details to access personalized features, saved resources,
                        and contributor-related services.
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label htmlFor="email">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? "is-invalid" : ""}
                            />
                            <small>Please use the email linked to your HeritageHub account.</small>
                            {errors.email && <div className="auth-error">{errors.email}</div>}
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

                        <div className="auth-field">
                            <label htmlFor="role">Sign in as</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="contributor">Contributor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="auth-form__options">
                            <label className="auth-checkbox">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={formData.remember}
                                    onChange={handleChange}
                                />
                                Remember me
                            </label>

                            <a href="/forgot-password" className="auth-link">
                                Forgot password?
                            </a>
                        </div>

                        {successMessage && (
                            <div className="auth-success">{successMessage}</div>
                        )}

                        <button type="submit" className="auth-button">
                            Sign In
                        </button>

                        <div className="auth-divider" />

                        <button type="button" className="auth-button auth-button--accent">
                            Continue as Guest
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don’t have an account? <a href="/register" className="auth-link">Create one</a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Login;