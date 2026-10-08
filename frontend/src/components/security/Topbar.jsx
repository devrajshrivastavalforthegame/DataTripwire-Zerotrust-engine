import { Bell, Command, Search } from "lucide-react";

export default function SecurityTopbar() {
  return (
    <header className="topbar security-topbar">
      <div className="security-search">
        <Search size={17} />
        <input placeholder="Search users, events, incidents" />
        <span className="security-shortcut">
          <Command size={11} />
          K
        </span>
      </div>

      <div className="security-topbar-actions">
        <div className="security-live-indicator">
          <span />
          LIVE
        </div>

        <button className="security-icon-button" aria-label="Notifications">
          <Bell size={18} />
          <i />
        </button>

        <div className="security-topbar-avatar">AD</div>
      </div>
    </header>
  );
}
