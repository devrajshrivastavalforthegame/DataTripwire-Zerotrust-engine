import { motion } from "motion/react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

  return (
    <main className="ws-login">
      <div className="ws-login-ambient">
        <span />
        <span />
        <span />
        <span />
      </div>

      <section className="ws-login-visual">
        <div className="ws-login-brand">
          <div className="ws-brand-mark">W</div>
          <span>WorkShepher</span>
        </div>

        <div className="ws-login-message">
          <span className="ws-login-kicker">YOUR TEAM'S CALM PLACE</span>
          <h1>
            Everything your team needs,
            <em> in one calm workspace.</em>
          </h1>
          <p>
            Tasks, projects, documents and conversations together.
          </p>
        </div>

        <div className="ws-login-orbit orbit-one" />
        <div className="ws-login-orbit orbit-two" />
        <div className="ws-login-orbit orbit-three" />
      </section>

      <section className="ws-login-form-area">
        <motion.div
          className="ws-login-form"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="ws-mobile-brand">
            <div className="ws-brand-mark">W</div>
            <span>WorkShepher</span>
          </div>

          <div className="ws-login-heading">
            <span>WELCOME BACK</span>
            <h2>Sign in to your workspace</h2>
            <p>Use your organization account to continue.</p>
          </div>

          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setError(""); setLoading(true);
              try { const result=await api.login({email,password}); navigate(result.user.roles.some(r=>r.includes("Security"))?"/security":"/"); }
              catch (e) { setError(e.message || "Unable to sign in."); }
              finally { setLoading(false); }
            }}
          >
            <label>
              Work email
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                required
              />
            </label>

            <label>
              Password
              <div className="ws-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <div className="ws-login-options">
              <label className="ws-checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button type="button">Forgot password?</button>
            </div>

            {error && <div className="ws-login-error">{error}</div>}
            <button className="ws-login-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="ws-login-divider">
            <span>or</span>
          </div>

          <button className="ws-sso-button">
            <ShieldCheck size={17} />
            Continue with Organization SSO
          </button>

          <p className="ws-login-footer">
            By continuing, you agree to your organization's workspace policies.
          </p>
        </motion.div>
      </section>
    </main>
  );
}
