import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { registerStepUpHandler } from "../../api";

export default function StepUpGate({ children }) {
  const [challenge, setChallenge] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => registerStepUpHandler((continueRequest) => new Promise((resolve, reject) => {
    setPassword("");
    setError("");
    setChallenge({ continueRequest, resolve, reject });
  })), []);

  function cancel() {
    if (!challenge || busy) return;
    const cancelled = new Error("Step-up verification cancelled");
    cancelled.status = 403;
    cancelled.body = { code: "STEP_UP_CANCELLED" };
    challenge.reject(cancelled);
    setChallenge(null);
    setPassword("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!challenge || busy) return;

    setBusy(true);
    setError("");
    try {
      const result = await challenge.continueRequest(password);
      challenge.resolve(result);
      setChallenge(null);
      setPassword("");
    } catch (e) {
      if (["STEP_UP_INVALID_CREDENTIALS", "STEP_UP_PASSWORD_REQUIRED"].includes(e?.body?.code)) {
        setError("That password could not be verified. Check it and try again.");
      } else {
        challenge.reject(e);
        setChallenge(null);
        setPassword("");
      }
    } finally {
      setBusy(false);
    }
  }

  return <>
    {children}
    {challenge && <div className="ws-modal-overlay">
      <form className="ws-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="step-up-title">
        <button type="button" className="ws-modal-close" onClick={cancel} aria-label="Cancel verification"><X size={17}/></button>
        <div className="ws-access-icon"><ShieldCheck size={22}/></div>
        <span className="security-eyebrow">CONTINUOUS TRUST · STEP-UP</span>
        <h2 id="step-up-title">Verify your identity</h2>
        <p>This protected action needs additional verification. Re-enter your account password to continue.</p>
        <label>
          Account password
          <input autoFocus type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <div className="ws-login-error" role="alert">{error}</div>}
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
          <button type="button" className="ws-secondary-button" onClick={cancel} disabled={busy}>Cancel</button>
          <button type="submit" className="ws-primary-button" disabled={busy}>{busy ? "Verifying…" : "Verify and continue"}</button>
        </div>
      </form>
    </div>}
  </>;
}
