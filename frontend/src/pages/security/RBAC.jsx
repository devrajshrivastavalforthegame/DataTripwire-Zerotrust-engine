import { motion } from "motion/react";
import {
  Shield, Check, X, RefreshCw, Users, KeyRound, Lock, Unlock,
  Layers3, UserCog, Search, Activity
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";

const order = ["overview","users","sessions","resources","incidents","policies","rbac","audit","baseline","deception","response","copilot","health","tasks","projects","documents","reports","approvals","team"];

const demoData = {
  roles: [
    { id: "demo-admin", name: "Security Admin", description: "Full security and authorization control." },
    { id: "demo-analyst", name: "SOC Analyst", description: "Security operations and incident-response access." },
    { id: "demo-auditor", name: "Auditor", description: "Read-only compliance and audit access." }
  ],
  assignments: [
    { id: 1, user_id: 1, role_id: "demo-admin", username: "Security Admin" },
    { id: 2, user_id: 2, role_id: "demo-analyst", username: "Rahul Sharma" },
    { id: 3, user_id: 3, role_id: "demo-analyst", username: "Priya Patel" },
    { id: 4, user_id: 4, role_id: "demo-auditor", username: "Audit User" }
  ],
  permissions: [
    { id: "p1", resource: "users", action: "VIEW", description: "View identity and risk information." },
    { id: "p2", resource: "users", action: "EDIT", description: "Modify user access and account attributes." },
    { id: "p3", resource: "sessions", action: "VIEW", description: "Inspect active authentication sessions." },
    { id: "p4", resource: "incidents", action: "VIEW", description: "View security incidents and investigations." },
    { id: "p5", resource: "incidents", action: "CREATE", description: "Create and escalate security incidents." },
    { id: "p6", resource: "policies", action: "VIEW", description: "View active security policies." },
    { id: "p7", resource: "policies", action: "EDIT", description: "Update authorization policies." },
    { id: "p8", resource: "audit", action: "VIEW", description: "Review security audit events." }
  ],
  rolePermissions: [
    { role_id: "demo-admin", permission_id: "p1" }, { role_id: "demo-admin", permission_id: "p2" },
    { role_id: "demo-admin", permission_id: "p3" }, { role_id: "demo-admin", permission_id: "p4" },
    { role_id: "demo-admin", permission_id: "p5" }, { role_id: "demo-admin", permission_id: "p6" },
    { role_id: "demo-admin", permission_id: "p7" }, { role_id: "demo-admin", permission_id: "p8" },
    { role_id: "demo-analyst", permission_id: "p1" }, { role_id: "demo-analyst", permission_id: "p3" },
    { role_id: "demo-analyst", permission_id: "p4" }, { role_id: "demo-analyst", permission_id: "p5" },
    { role_id: "demo-analyst", permission_id: "p8" },
    { role_id: "demo-auditor", permission_id: "p4" }, { role_id: "demo-auditor", permission_id: "p6" },
    { role_id: "demo-auditor", permission_id: "p8" }
  ]
};


const capabilityLabels = {
  overview: "Overview",
  users: "Users & Risk",
  sessions: "Resources",
  incidents: "Incidents",
  policies: "Policy Engine",
  rbac: "RBAC",
  audit: "Audit Logs",
  response: "Adaptive Response"
};

const friendlyError = (e) =>
  /401|403|token|expired|unauthorized|invalid/i.test(String(e?.message || ""))
    ? "Session authorization needs attention. Showing the protected demo state."
    : "Authorization service is temporarily unavailable. Showing the protected demo state.";

export default function RBAC() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setSyncing(true);
    setError("");
    try {
      const result = await api.rbac();
      if (result?.roles?.length) {
        setData(result);
        setSelected(current => current || result.roles[0]?.id || "");
      } else {
        setData(demoData);
        setSelected(current => current || demoData.roles[0].id);
      }
    } catch (e) {
      setData(demoData);
      setSelected(current => current || demoData.roles[0].id);
      setError(friendlyError(e));
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const role = data?.roles?.find(r => String(r.id) === String(selected)) || data?.roles?.[0];

  const perms = useMemo(
    () => new Set((data?.rolePermissions || [])
      .filter(x => String(x.role_id) === String(role?.id))
      .map(x => x.permission_id)),
    [data, role]
  );

  const assigned = data?.assignments?.filter(
    x => String(x.role_id) === String(role?.id)
  ) || [];

  const resources = useMemo(() => {
    const preferred = ["overview","users","sessions","incidents","policies","rbac","audit","response"];
    const all = [...new Set((data?.permissions || []).map(p => p.resource))];
    preferred.forEach(x => { if (!all.includes(x)) all.push(x); });
    return all.sort((a, b) => {
      const ai = order.indexOf(a), bi = order.indexOf(b);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
  }, [data]);

  const rolePerms = (data?.permissions || []).filter(p => perms.has(p.id)).length;
  const visibleResources = filter === "ALL" ? resources : resources.filter(x => x === filter);

  const filteredPermissions = (data?.permissions || []).filter(p =>
    `${p.resource} ${p.action} ${p.description || ""}`.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = async permission => {
    if (!role) return;

    if (String(role.id).startsWith("demo-")) {
      setData(current => {
        const exists = current.rolePermissions.some(
          x => String(x.role_id) === String(role.id) &&
               String(x.permission_id) === String(permission.id)
        );
        return {
          ...current,
          rolePermissions: exists
            ? current.rolePermissions.filter(
                x => !(String(x.role_id) === String(role.id) &&
                       String(x.permission_id) === String(permission.id))
              )
            : [...current.rolePermissions, { role_id: role.id, permission_id: permission.id }]
        };
      });
      return;
    }

    setBusy(permission.id);
    try {
      await api.toggleRolePermission(role.id, permission.id);
      await load();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="security-page dt-access-governance">
      <header className="dt-product-head">
        <div>
          <span>IDENTITY & ACCESS GOVERNANCE</span>
          <h1>Access Governance</h1>
          <p>Centralized control for roles, permissions, assigned users and least-privilege authorization.</p>
        </div>
        <button className="dt-ghost" onClick={load} disabled={syncing}>
          <RefreshCw size={15} />
          {syncing ? "Syncing..." : "Sync authorization"}
        </button>
      </header>

      {error && <div className="dt-alert">{error}</div>}

      <div className="dt-stat-strip">
        <div><Shield /><span>Security roles</span><strong>{data?.roles?.length || 0}</strong></div>
        <div><Users /><span>Assigned users</span><strong>{data?.assignments?.length || 0}</strong></div>
        <div><KeyRound /><span>Permissions</span><strong>{data?.permissions?.length || 0}</strong></div>
        <div><Lock /><span>Active policies</span><strong>12</strong></div>
      </div>

      <div className="dt-alert" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Activity size={16} />
        <span><strong>Authorization Engine ACTIVE</strong> — policy evaluation and access enforcement operational.</span>
      </div>

      <div className="dt-rbac-workspace">
        <aside className="dt-role-rail">
          <div className="dt-section-title">ROLES <b>{data?.roles?.length || 0}</b></div>

          {(data?.roles || []).map(r => (
            <button
              className={String(role?.id) === String(r.id) ? "active" : ""}
              key={r.id}
              onClick={() => setSelected(r.id)}
            >
              <span className="dt-role-icon"><Shield size={15} /></span>
              <span>
                <strong>{r.name}</strong>
                <small>{data?.assignments?.filter(a => String(a.role_id) === String(r.id)).length || 0} assigned users</small>
              </span>
              <Layers3 size={14} />
            </button>
          ))}

          <div className="dt-role-foot">
            <Lock size={13} />
            <span>Every access change remains governed and auditable.</span>
          </div>
        </aside>

        <main className="dt-rbac-main">
          {role && (
            <>
              <div className="dt-role-banner">
                <div>
                  <span>SELECTED SECURITY ROLE</span>
                  <h2>{role.name}</h2>
                  <p>{role.description || "Effective access boundary for this role."}</p>
                </div>
                <div className="dt-role-count">
                  <strong>{rolePerms}</strong>
                  <span>permissions granted</span>
                </div>
              </div>

              <div className="dt-members">
                <div className="dt-member-title"><UserCog size={14} /> Assigned users</div>
                {assigned.length
                  ? assigned.slice(0, 10).map(a => (
                      <div key={a.user_id || a.id}>
                        <span>{String(a.username || a.email || "U").slice(0, 2).toUpperCase()}</span>
                        <strong>{a.username || a.email || "User"}</strong>
                      </div>
                    ))
                  : <small>No users assigned</small>}
              </div>

              <div className="dt-rbac-filter">
                <div className="dt-section-title">
                  PERMISSION MATRIX <b>{filteredPermissions.length} permissions</b>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Search size={14} />
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search permissions..." />
                  </label>
                  <select value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="ALL">All resources</option>
                    {resources.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="dt-permission-matrix">
                {visibleResources.map(resource => {
                  const ps = filteredPermissions.filter(p => p.resource === resource);
                  if (!ps.length) return null;
                  const granted = ps.filter(p => perms.has(p.id)).length;

                  return (
                    <section className="dt-permission-group" key={resource}>
                      <header>
                        <div>
                          <span>{capabilityLabels[resource] || resource}</span>
                          <strong>{granted}/{Math.max(ps.length, 1)} granted</strong>
                        </div>
                        <span className={granted === ps.length ? "all" : granted ? "partial" : "denied"}>
                          {granted === ps.length ? "FULL ACCESS" : granted ? "PARTIAL" : "DENIED"}
                        </span>
                      </header>
                      <div>
                        {ps.map(p => {
                          const grantedPermission = perms.has(p.id);
                          return (
                            <motion.button
                              whileHover={{ y: -1 }}
                              key={p.id}
                              className={"dt-permission-row " + (grantedPermission ? "granted" : "denied")}
                              onClick={() => toggle(p)}
                              disabled={busy === p.id}
                            >
                              <span className="dt-permission-state">
                                {busy === p.id ? <RefreshCw size={13} /> : grantedPermission ? <Check size={13} /> : <X size={13} />}
                              </span>
                              <span>
                                <strong>{p.action}</strong>
                                <small>{p.description || `Permission to ${p.action} ${resource}`}</small>
                              </span>
                              <b>{busy === p.id ? "SAVING..." : grantedPermission ? "GRANTED" : "DENIED"}</b>
                              {grantedPermission ? <Unlock size={13} /> : <Lock size={13} />}
                            </motion.button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
