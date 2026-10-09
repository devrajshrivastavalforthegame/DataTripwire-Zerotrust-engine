import { motion } from "motion/react";
import {
  Search,
  Plus,
  Paperclip,
  Smile,
  Send,
  MoreHorizontal
} from "lucide-react";
import { useState } from "react";

const conversations = [
  ["MI", "Meera Iyer", "The new designs look great!", "2m"],
  ["AS", "Aarav Sharma", "Can you review the roadmap?", "18m"],
  ["SK", "Sarah Kapoor", "Finance report is ready.", "1h"],
  ["RD", "Rohan Das", "Backend deployment is complete.", "2h"],
  ["NP", "Nisha Patel", "Shared a new document.", "Yesterday"]
];

export default function Messages() {
  const [message, setMessage] = useState("");

  return (
    <div className="ws-page ws-messages-page">
      <div className="ws-message-shell">
        <aside className="ws-conversation-sidebar">
          <div className="ws-message-sidebar-head">
            <div>
              <span className="ws-section-label">WORKSPACE</span>
              <h1>Messages</h1>
            </div>
            <button className="ws-icon-button">
              <Plus size={17} />
            </button>
          </div>

          <div className="ws-search-field">
            <Search size={15} />
            <input placeholder="Search messages..." />
          </div>

          <div className="ws-conversations">
            {conversations.map((item, index) => (
              <motion.button
                className={`ws-conversation ${index === 0 ? "active" : ""}`}
                key={item[1]}
                whileHover={{ x: 2 }}
              >
                <div className="ws-avatar">{item[0]}</div>
                <div>
                  <strong>{item[1]}</strong>
                  <span>{item[2]}</span>
                </div>
                <time>{item[3]}</time>
              </motion.button>
            ))}
          </div>
        </aside>

        <section className="ws-chat-panel">
          <header className="ws-chat-header">
            <div className="ws-avatar">MI</div>
            <div>
              <strong>Meera Iyer</strong>
              <span><i /> Online</span>
            </div>
            <button className="ws-icon-button">
              <MoreHorizontal size={18} />
            </button>
          </header>

          <div className="ws-chat-messages">
            <div className="ws-chat-date">Today</div>

            <div className="ws-message incoming">
              <span>Hey Om! Did you get a chance to look at the new designs?</span>
              <time>10:31 AM</time>
            </div>

            <div className="ws-message outgoing">
              <span>Yes, just checked them. The new direction looks really clean.</span>
              <time>10:34 AM</time>
            </div>

            <div className="ws-message incoming">
              <span>Perfect. I’ll update the final screens and share them shortly.</span>
              <time>10:35 AM</time>
            </div>

            <div className="ws-chat-date">Now</div>
          </div>

          <form
            className="ws-chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage("");
            }}
          >
            <button type="button"><Paperclip size={18} /></button>
            <input
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="Write a message..."
            />
            <button type="button"><Smile size={18} /></button>
            <button className="ws-send-button" type="submit">
              <Send size={16} />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
