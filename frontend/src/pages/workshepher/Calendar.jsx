import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Clock3
} from "lucide-react";

import { PageHeading } from "../../components/workshepher/WorkspaceWidgets";

const days = ["MON 12", "TUE 13", "WED 14", "THU 15", "FRI 16"];
const hours = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00"
];

const events = [
  { day: 0, start: 0, span: 1, title: "Team stand-up", type: "Meeting" },
  { day: 1, start: 1, span: 1, title: "Design review", type: "Review" },
  { day: 2, start: 2, span: 2, title: "Product planning", type: "Planning" },
  { day: 3, start: 3, span: 1, title: "Client sync", type: "Meeting" },
  { day: 4, start: 5, span: 1, title: "Finance review", type: "Review" }
];

export default function Calendar() {
  return (
    <div className="ws-page">
      <PageHeading
        eyebrow="WORKSPACE"
        title="Calendar"
        description="Keep meetings and focused work in one place."
        action={
          <button className="ws-primary-button">
            <Plus size={17} />
            New event
          </button>
        }
      />

      <div className="ws-calendar-toolbar">
        <div className="ws-calendar-nav">
          <button className="ws-icon-button"><ChevronLeft size={17} /></button>
          <strong>October 12 – 16, 2026</strong>
          <button className="ws-icon-button"><ChevronRight size={17} /></button>
        </div>

        <div className="ws-view-switcher">
          <button>Day</button>
          <button className="active">Week</button>
          <button>Month</button>
        </div>
      </div>

      <section className="ws-calendar-panel">
        <div className="ws-calendar-header-row">
          <div />
          {days.map((day, index) => (
            <div className={index === 1 ? "today" : ""} key={day}>
              {day}
            </div>
          ))}
        </div>

        <div className="ws-calendar-body">
          {hours.map((hour, hourIndex) => (
            <div className="ws-calendar-time-row" key={hour}>
              <div className="ws-hour">{hour}</div>

              {days.map((day, dayIndex) => (
                <div
                  className={`ws-calendar-cell ${dayIndex === 1 ? "today-column" : ""}`}
                  key={`${day}-${hour}`}
                >
                  {events
                    .filter(event => event.day === dayIndex && event.start === hourIndex)
                    .map(event => (
                      <motion.div
                        className={`ws-calendar-event event-${event.type.toLowerCase()}`}
                        key={event.title}
                        initial={{ opacity: 0, scale: .97 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <strong>{event.title}</strong>
                        <span>
                          <Clock3 size={11} />
                          {hour}
                        </span>
                        {event.type === "Meeting" && <Video size={12} />}
                      </motion.div>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
