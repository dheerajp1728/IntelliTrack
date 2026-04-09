import { useState } from "react";
import { useAuth } from "./AuthContext";
import { SplineScene } from "./components/ui/splite";
import { Spotlight } from "./components/ui/spotlight";
import { LiquidMetalButton } from "./components/ui/liquid-metal-button";
import "./RegisterPage.css";

export default function RegisterPage({ onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Developer");
  const [githubUrl, setGithubUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!name || !email || !password || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }

      await register(name, email, password, role, githubUrl);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-split dark">
      {/* Left side — Register form */}
      <div className="register-form-side">
        <div className="register-glass-card">
          <h1 className="register-dark-title">INTELLITRACT</h1>

          <form onSubmit={handleSubmit} className="register-dark-form">
            <div className="register-dark-field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="register-dark-input"
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="register-dark-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="register-dark-input"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="register-dark-field-row">
              <div className="register-dark-field flex-1">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="register-dark-input"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div className="register-dark-field flex-1">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="register-dark-input"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="register-dark-field">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="register-dark-input register-dark-select"
                disabled={loading}
              >
                <option value="Developer">Developer</option>
                <option value="Scrum Master">Scrum Master</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="register-dark-field">
              <label htmlFor="githubUrl">GitHub URL <span style={{ opacity: 0.45, fontWeight: 400 }}>(optional)</span></label>
              <input
                id="githubUrl"
                type="url"
                placeholder="https://github.com/yourusername"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="register-dark-input"
                disabled={loading}
                autoComplete="off"
              />
            </div>

            {error && <div className="register-dark-error">{error}</div>}

            <div className="flex justify-center">
              <LiquidMetalButton
                label={loading ? "Creating Account..." : "Register"}
                onClick={handleSubmit}
              />
            </div>
          </form>

          <div className="register-dark-footer">
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="register-dark-switch"
                disabled={loading}
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right side — 3D Scene */}
      <div className="register-scene-side">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />

        <div className="scene-3d">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
