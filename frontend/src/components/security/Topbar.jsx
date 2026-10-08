import { Bell, Command, Search, ChevronDown, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function SecurityTopbar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKeyDown = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        inputRef.current?.blur();
        setFocused(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="topbar security-topbar">
      <div className={`security-search ${focused ? "focused" : ""}`}>
        <Search size={16} />
        <input
          ref={inputRef}
          value={query}
          onChange={event => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search users, events, incidents..."
          aria-label="Search users, events and incidents"
        />
        {!query && (
          <span className="security-shortcut">
            <Command size={10} />
            K
          </span>
        )}
      </div>

      <div className="security-topbar-actions">
        <div className="security-live-indicator">
          <span />
          <strong>LIVE MONITORING</strong>
        </div>

        <button
          className="security-icon-button"
          aria-label="Notifications"
          title="Security notifications"
        >
          <Bell size={17} />
          <i />
        </button>

        <span className="security-topbar-divider" />

        <button className="security-topbar-user" aria-label="Open security admin menu">
          <span className="security-topbar-avatar">AD</span>
          <span className="security-topbar-user-copy">
            <strong>Security Admin</strong>
            <small>Administrator</small>
          </span>
          <ChevronDown size={14} />
        </button>

        <div className="security-shield-status" title="Security console protected">
          <ShieldCheck size={14} />
        </div>
      </div>
    </header>
  );
}
