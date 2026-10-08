import {
  Search,
  Bell,
  Plus,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

import GlobalSearch from "./GlobalSearch";
import NotificationPanel from "./NotificationPanel";

export default function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <>
      <header className="ws-topbar">
        <div className="ws-topbar-search-wrap">
          <button
            type="button"
            className="ws-global-search"
            onClick={() => setSearchOpen(true)}
            aria-label="Search tasks, documents and people"
          >
            <span className="ws-search-leading">
              <Search size={17} strokeWidth={2} />
            </span>
            <span className="ws-search-text">
              Search tasks, documents, people...
            </span>
            <span className="ws-search-shortcut">
              <span>Ctrl</span>
              <b>K</b>
            </span>
          </button>
        </div>

        <div className="ws-topbar-actions">
          <button
            type="button"
            className="ws-topbar-new"
            aria-label="Create new"
          >
            <Plus size={16} strokeWidth={2.2} />
            <span>New</span>
            <ChevronDown size={13} strokeWidth={2} />
          </button>

          <button
            type="button"
            className="ws-topbar-icon"
            aria-label="Help"
            title="Help"
          >
            <HelpCircle size={18} strokeWidth={1.9} />
          </button>

          <button
            type="button"
            className={"ws-topbar-icon ws-notification-trigger " + (notificationsOpen ? "active" : "")}
            onClick={() => setNotificationsOpen(value => !value)}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            title="Notifications"
          >
            <Bell size={18} strokeWidth={1.9} />
            <span className="ws-notification-dot" />
          </button>

          <span className="ws-topbar-divider" />

          <button
            type="button"
            className="ws-topbar-user"
            aria-label="Open account menu"
          >
            <span className="ws-topbar-user-avatar">OM</span>
            <span className="ws-topbar-user-name">OM</span>
            <ChevronDown size={14} strokeWidth={1.9} />
          </button>
        </div>

        <NotificationPanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
      </header>

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
