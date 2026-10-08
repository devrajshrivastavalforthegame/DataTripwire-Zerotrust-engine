import { Search, Bell, Plus, HelpCircle } from "lucide-react";
import { useState } from "react";

import GlobalSearch from "./GlobalSearch";
import NotificationPanel from "./NotificationPanel";

export default function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <>
      <header className="ws-topbar">
        <button
          className="ws-global-search"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={16} />
          <span>Search tasks, documents, people</span>
          <kbd>? K</kbd>
        </button>

        <div className="ws-topbar-actions">
          <button className="ws-topbar-new">
            <Plus size={15} />
            New
          </button>

          <button className="ws-topbar-icon">
            <HelpCircle size={17} />
          </button>

          <button
            className={`ws-topbar-icon notification-trigger ${notificationsOpen ? "active" : ""}`}
            onClick={() => setNotificationsOpen(value => !value)}
          >
            <Bell size={17} />
            <i />
          </button>

          <button className="ws-topbar-avatar">
            OM
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
