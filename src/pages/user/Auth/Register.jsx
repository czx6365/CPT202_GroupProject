import React, { useMemo, useState } from "react";
import "./Auth.css";

function Register() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "viewer",
        agree: false,
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");

    // 邮箱格式校验
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // 密码强度
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

    // 表单校验
    const validateForm = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";
        if (!formData.email.trim()) newErrors.email = "Email is required.";
        else if (!validateEmail(formData.email)) newErrors.email = "Please enter a valid email address.";
        if (!formData.password) newErrors.password = "Password is required.";
        else if (formData.password.length < 6) newErrors.password = "Password must contain at least 6 characters.";
        if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
        if (!formData.agree) newErrors.agree = "You must agree to the platform terms and privacy notice.";
        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
        setErrors(prev => ({ ...prev, [name]: "" }));
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

        // 保存注册信息到 localStorage
        localStorage.setItem("registeredEmail", formData.email);
        localStorage.setItem("registeredRole", formData.role);

        setSuccessMessage("Registration successful. You can now sign in with your account.");
        console.log("Register submitted:", formData);
    };

    return (
        <section className="auth-page">
            <div className="auth-shell">
                {/* 左侧展示区 */}
                <div className="auth-showcase">
                    <div className="auth-showcase__content">
                        <div className="auth-showcase__eyebrow">Create an Account</div>
                        <h1 className="auth-showcase__title">Start your journey with HeritageHub.</h1>
                        <p className="auth-showcase__text">
                            Register to browse public collections, save discoveries, interact with stories,
                            and build your place in a shared cultural archive.
                        </p>
                        <div className="auth-badge-list">
                            <span className="auth-badge">Easy onboarding</span>
                            <span className="auth-badge">Public discovery</span>
                            <span className="auth-badge">Future contributor access</span>
                        </div>
                    </div>

                    <div className="auth-showcase__grid">
                        <div className="auth-feature">
                            <h4>Build your profile</h4>
                            <p>Create a personal space to manage identity, interests, and saved resources.</p>
                        </div>
                        <div className="auth-feature">
                            <h4>Save meaningful content</h4>
                            <p>Bookmark resources and return to collections that matter to you.</p>
                        </div>
                        <div className="auth-feature">
                            <h4>Interact with the platform</h4>
                            <p>Comment, engage, and participate in an inclusive heritage knowledge community.</p>
                        </div>
                        <div className="auth-feature">
                            <h4>Grow into contribution</h4>
                            <p>Apply later to become a contributor and support richer cultural sharing.</p>
                        </div>
                    </div>
                </div>

                {/* 右侧表单卡片 */}
                <div className="auth-card">
                    <div className="auth-card__eyebrow">Register</div>
                    <h2 className="auth-card__title">Create your HeritageHub account</h2>
                    <p className="auth-card__subtitle">
                        Complete the form below to join the platform and unlock a personalized browsing experience.
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-form__row">
                            <div className="auth-field">
                                <label htmlFor="firstName">First name</label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    placeholder="Enter your first name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={errors.firstName ? "is-invalid" : ""}
                                />
                                {errors.firstName && <div className="auth-error">{errors.firstName}</div>}
                            </div>

                            <div className="auth-field">
                                <label htmlFor="lastName">Last name</label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    placeholder="Enter your last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={errors.lastName ? "is-invalid" : ""}
                                />
                                {errors.lastName && <div className="auth-error">{errors.lastName}</div>}
                            </div>
                        </div>

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
                            <small>This email will be used for login, identity, and account recovery.</small>
                            {errors.email && <div className="auth-error">{errors.email}</div>}
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
                                    <span
                                        className={`auth-password-strength__text ${
                                            formData.password ? passwordStrength.textClass : ""
                                        }`}
                                    >
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

                        <div className="auth-field">
                            <label htmlFor="role">Register as</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="contributor">Contributor</option>
                            </select>
                            <small>
                                Most users begin as viewers and can later apply for contributor access in their profile.
                            </small>
                        </div>

                        <div className="auth-form__options">
                            <label className="auth-checkbox">
                                <input
                                    type="checkbox"
                                    name="agree"
                                    checked={formData.agree}
                                    onChange={handleChange}
                                />
                                I agree to the platform terms and privacy notice.
                            </label>
                        </div>
                        {errors.agree && <div className="auth-error">{errors.agree}</div>}

                        {successMessage && <div className="auth-success">{successMessage}</div>}

                        <button type="submit" className="auth-button auth-button--accent">
                            Create Account
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account? <a href="/login" className="auth-link">Sign in</a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Register;