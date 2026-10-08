import { useState } from "react";
import {
  Bell,
  Lock,
  Palette,
  UserRound,
  Shield,
  Check
} from "lucide-react";

import { PageHeading } from "../../components/workshepher/WorkspaceWidgets";

const sections = [
  ["profile", "Profile", UserRound],
  ["notifications", "Notifications", Bell],
  ["security", "Security", Lock],
  ["appearance", "Appearance", Palette]
];

export default function Settings() {
  const [active, setActive] = useState("notifications");
  const [saved, setSaved] = useState(false);

  return (
    <div className="ws-page">
      <PageHeading
        eyebrow="ACCOUNT"
        title="Settings"
        description="Customize your workspace experience."
      />

      <div className="ws-settings-layout">
        <aside className="ws-settings-nav">
          {sections.map(([id, label, Icon]) => (
            <button
              key={id}
              className={active === id ? "active" : ""}
              onClick={() => setActive(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </aside>

        <section className="ws-panel ws-settings-content">
          <div className="ws-panel-header">
            <div>
              <span className="ws-section-label">
                {active.toUpperCase()}
              </span>
              <h2>{sections.find(item => item[0] === active)?.[1]}</h2>
            </div>
          </div>

          {active === "notifications" && (
            <div className="ws-setting-list">
              {[
                ["Task reminders", "Get notified when tasks are due soon.", true],
                ["Mentions", "Receive alerts when someone mentions you.", true],
                ["Project updates", "Stay informed about project activity.", true],
                ["Weekly summary", "Receive a weekly productivity summary.", false]
              ].map(item => (
                <SettingToggle key={item[0]} title={item[0]} description={item[1]} initial={item[2]} />
              ))}
            </div>
          )}

          {active === "security" && (
            <div className="ws-setting-list">
              <div className="ws-security-setting">
                <div className="ws-access-icon"><Shield size={18} /></div>
                <div>
                  <strong>Organization security</strong>
                  <p>Your workspace security is managed by your organization.</p>
                </div>
                <span className="ws-secure-label">
                  <Check size={13} />
                  Protected
                </span>
              </div>
            </div>
          )}

          {active === "appearance" && (
            <div className="ws-setting-list">
              <div className="ws-theme-choice">
                <div className="ws-theme-preview light">
                  <div />
                  <div />
                </div>
                <strong>Light</strong>
                <span>Current</span>
              </div>
            </div>
          )}

          {active === "profile" && (
            <div className="ws-setting-list">
              <label className="ws-setting-field">
                Display name
                <input defaultValue="Om Barange" />
              </label>

              <label className="ws-setting-field">
                Job title
                <input defaultValue="Frontend & UI/UX" />
              </label>

              <button
                className="ws-primary-button"
                onClick={() => {
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1800);
                }}
              >
                {saved ? <Check size={16} /> : null}
                {saved ? "Saved" : "Save changes"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SettingToggle({ title, description, initial }) {
  const [enabled, setEnabled] = useState(initial);

  return (
    <div className="ws-toggle-setting">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <button
        className={`ws-toggle ${enabled ? "on" : ""}`}
        onClick={() => setEnabled(!enabled)}
      >
        <span />
      </button>
    </div>
  );
}
