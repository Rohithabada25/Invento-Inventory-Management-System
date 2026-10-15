
import { useState } from "react";
import "./Login.css";

function Register({ onRegister, onBackToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create your account.");
        return;
      }

      setSuccess(
        data.message || "Account created successfully! You can now sign in."
      );

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      if (onRegister) {
        setTimeout(() => onRegister(), 1200);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-brand">
          <div className="login-brand-icon">I</div>
          <span>Invento</span>
        </div>

        <div className="login-visual-content">
          <div className="visual-badge">
            <span className="online-dot"></span>
            SMART INVENTORY MANAGEMENT
          </div>

          <h1>
            Start managing
            <br />
            your inventory.
            <br />
            <span>Grow your business.</span>
          </h1>

          <p>
            Create your account to organize products, monitor stock levels,
            and manage purchases and sales in one workspace.
          </p>

          <div className="visual-features">
            <div>
              <span className="feature-check">✓</span>
              Easy product management
            </div>
            <div>
              <span className="feature-check">✓</span>
              Organized purchase and sales records
            </div>
            <div>
              <span className="feature-check">✓</span>
              Secure account access
            </div>
          </div>
        </div>

        <div className="visual-footer">
          © 2026 Invento Inventory Management System
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-form-container">
          <div className="mobile-brand">
            <div className="login-brand-icon">I</div>
            <span>Invento</span>
          </div>

          <div className="login-heading">
            <div className="welcome-icon">+</div>
            <h2>Create your account</h2>
            <p>Enter your details to get started with Invento.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                maxLength={150}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="register-success" role="status">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="create-account-prompt">
            <span>Already have an account?</span>{" "}
            <button
              type="button"
              className="create-account-link"
              onClick={onBackToLogin}
            >
              Sign in
            </button>
          </div>

          <p className="login-security-note">
            🔒 Secure access to your inventory workspace
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;

