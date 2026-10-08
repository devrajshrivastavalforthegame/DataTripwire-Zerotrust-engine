import { motion } from "motion/react";
import {
  Camera,
  Mail,
  MapPin,
  Briefcase,
  CalendarDays,
  ShieldCheck,
  Pencil
} from "lucide-react";

import { PageHeading } from "../../components/workshepher/WorkspaceWidgets";

export default function Profile() {
  return (
    <div className="ws-page">
      <PageHeading
        eyebrow="ACCOUNT"
        title="Profile"
        description="Manage your workspace identity and personal information."
      />

      <section className="ws-profile-hero">
        <div className="ws-profile-cover" />

        <div className="ws-profile-main">
          <div className="ws-profile-avatar-wrap">
            <div className="ws-profile-avatar">OM</div>
            <button><Camera size={14} /></button>
          </div>

          <div className="ws-profile-title">
            <h2>Om Barange</h2>
            <p>Frontend & UI/UX · DataTripwire</p>
          </div>

          <button className="ws-secondary-button profile-edit">
            <Pencil size={14} />
            Edit profile
          </button>
        </div>
      </section>

      <div className="ws-profile-grid">
        <section className="ws-panel">
          <div className="ws-panel-header">
            <div>
              <span className="ws-section-label">PERSONAL</span>
              <h2>About you</h2>
            </div>
          </div>

          <div className="ws-profile-details">
            <div><Mail size={16} /><span>Email</span><strong>om@workspace.local</strong></div>
            <div><Briefcase size={16} /><span>Role</span><strong>Frontend & UI/UX</strong></div>
            <div><MapPin size={16} /><span>Location</span><strong>Indore, India</strong></div>
            <div><CalendarDays size={16} /><span>Joined</span><strong>January 2026</strong></div>
          </div>
        </section>

        <section className="ws-panel">
          <div className="ws-panel-header">
            <div>
              <span className="ws-section-label">WORKSPACE</span>
              <h2>Access & role</h2>
            </div>
          </div>

          <div className="ws-profile-access">
            <div className="ws-access-icon">
              <ShieldCheck size={19} />
            </div>
            <div>
              <strong>Workspace member</strong>
              <span>Standard workspace permissions</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
