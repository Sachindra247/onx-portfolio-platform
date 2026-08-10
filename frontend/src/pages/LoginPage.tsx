import { LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated, isInitializing } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);

      const state = location.state as { from?: string } | null;

      navigate(state?.from ?? "/", {
        replace: true,
      });
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <header className="login-card__header">
          <div className="login-card__brand">ONX</div>

          <div>
            <h1>Welcome back</h1>

            <p>Sign in to access the OnX Portfolio workspace.</p>
          </div>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>

            <div className="login-field">
              <Mail size={16} aria-hidden="true" />

              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                placeholder="name@onx.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          <label>
            <span>Password</span>

            <div className="login-field">
              <LockKeyhole size={16} aria-hidden="true" />

              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                placeholder="Enter your password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          {error && (
            <div className="login-form__error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-form__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <footer className="login-card__footer">Internal users only</footer>
      </section>
    </main>
  );
}
