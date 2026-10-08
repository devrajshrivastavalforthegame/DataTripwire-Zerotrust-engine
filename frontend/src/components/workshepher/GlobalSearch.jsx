import { Search, ArrowRight, Command, FileText, Users, CheckSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const results = [
  ["Q4 Financial Report", "Document", FileText, "/documents"],
  ["Prepare quarterly budget", "Task", CheckSquare, "/tasks"],
  ["Meera Iyer", "Person", Users, "/team"]
];

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    const listener = event => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = results.filter(item =>
    item[0].toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="ws-search-overlay" onMouseDown={onClose}>
      <div
        className="ws-command"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="ws-command-input">
          <Search size={19} />
          <input
            autoFocus
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search tasks, documents, people..."
          />
          <kbd>ESC</kbd>
        </div>

        <div className="ws-command-label">SUGGESTED</div>

        {filtered.map(([title, type, Icon, path]) => (
          <button
            className="ws-command-result"
            key={title}
            onClick={() => {
              navigate(path);
              onClose();
            }}
          >
            <div>
              <Icon size={17} />
            </div>
            <span>
              <strong>{title}</strong>
              <small>{type}</small>
            </span>
            <ArrowRight size={15} />
          </button>
        ))}

        {!filtered.length && (
          <div className="ws-command-empty">
            No results found
          </div>
        )}

        <div className="ws-command-footer">
          <span><Command size={12} /> Search</span>
          <span>?? Navigate</span>
          <span>? Open</span>
        </div>
      </div>
    </div>
  );
}
