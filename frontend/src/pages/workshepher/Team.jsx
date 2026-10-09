import { motion } from "motion/react";
import { Plus, Search, MoreHorizontal, Mail, MapPin, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeading, StatusPill } from "../../components/workshepher/WorkspaceWidgets";
import { api } from "../../api";

export default function Team() {
  const [people, setPeople] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState("");

  const load = async () => {
    try {
      setError("");
      const result = await api.workspaceTeam();
      setPeople(result?.users || []);
    } catch (e) {
      setError(e?.message || "Unable to load workspace team.");
    }
  };

  useEffect(() => { load(); }, []);

  const sendInvite = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await api.workspaceAction("invite_member", "invite", { email });
      setEmail("");
      setInvite(false);
      await load();
    } catch (e) {
      setError(e?.message || "Unable to create invitation.");
    }
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return people;
    return people.filter((p) =>
      `${p.username || ""} ${p.email || ""} ${p.role || ""}`.toLowerCase().includes(term)
    );
  }, [people, q]);

  return (
    <div className="ws-page">
      <PageHeading
        eyebrow="WORKSPACE"
        title="Team"
        description="The people behind the work."
        action={
          <button className="ws-secondary-button" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {error && <div className="ws-login-error">{error}</div>}

      <div className="ws-team-toolbar">
        <div className="ws-search-field">
          <Search size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people..."
          />
        </div>

        <button className="ws-primary-button" onClick={() => setInvite(true)}>
          <Plus size={17} /> Invite member
        </button>
      </div>

      <div className="ws-team-grid">
        {rows.map((p, i) => (
          <motion.article
            className="ws-person-card"
            key={p.id || p.email || p.username}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="ws-person-top">
              <div className="ws-avatar-large">
                {String(p.username || "U").slice(0, 2).toUpperCase()}
              </div>
              <button
                className="ws-icon-button"
                onClick={() => alert(`${p.username || "User"}\n${p.email || ""}\nRole: ${p.role || "Member"}`)}
              >
                <MoreHorizontal size={17} />
              </button>
            </div>

            <h2>{p.username || "Workspace User"}</h2>
            <p>{p.role || "Workspace member"}</p>

            <div className="ws-person-meta">
              <span>Workspace</span>
              <StatusPill tone={p.status === "active" ? "success" : "neutral"}>
                <span className="ws-status-dot" />
                {p.status || "unknown"}
              </StatusPill>
            </div>

            <div className="ws-person-actions">
              <button onClick={() => p.email && (window.location.href = "mailto:" + p.email)}>
                <Mail size={14} /> Message
              </button>
              <button onClick={() => alert(`Profile: ${p.username || "User"}\n${p.email || ""}`)}>
                <MapPin size={14} /> Profile
              </button>
            </div>
          </motion.article>
        ))}

        {!rows.length && !error && (
          <div className="ws-login-error">No workspace members match your search.</div>
        )}

        {invite && (
          <div className="ws-modal-overlay">
            <form className="ws-modal" onSubmit={sendInvite}>
              <button
                type="button"
                className="ws-modal-close"
                onClick={() => setInvite(false)}
              >
                <X size={17} />
              </button>
              <h2>Invite member</h2>
              <p>Send a workspace invitation request.</p>
              <input
                autoFocus
                type="email"
                required
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="ws-primary-button" type="submit">
                Create invitation
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
      </div>
    </div>
  );
}
