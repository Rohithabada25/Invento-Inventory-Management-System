
import { useState } from "react";
import "./Login.css";

function Login({ onLogin, onCreateAccount }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed. Please try again.");
        return;
      }

      onLogin(data.user);
    } catch (error) {
      console.error("Login error:", error);
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
            Manage your
            <br />
            inventory.
            <br />
            <span>Grow your business.</span>
          </h1>

          <p>
            Keep track of products, monitor stock levels, and manage
            purchases and sales from one simple workspace.
          </p>

          <div className="visual-features">
            <div>
              <span className="feature-check">✓</span>
              Real-time stock visibility
            </div>
            <div>
              <span className="feature-check">✓</span>
              Organized purchase and sales records
            </div>
            <div>
              <span className="feature-check">✓</span>
              Access based on your role
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
            <div className="welcome-icon">↗</div>
            <h2>Welcome back!</h2>
            <p>Enter your account details to access your workspace.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-field">
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                <span className="password-hint">Keep it secure</span>
              </div>

              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-label">
                <input type="checkbox" />
                Remember me
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  alert(
                    "Password recovery has not been implemented yet."
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in to your account"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="create-account-prompt">
            <span>Don't have an account?</span>{" "}
            <button
              type="button"
              className="create-account-link"
              onClick={onCreateAccount}
            >
              Create account
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

export default Login;

