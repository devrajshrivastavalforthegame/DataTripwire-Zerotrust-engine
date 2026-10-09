import { motion } from "motion/react";
import {
  Plus,
  Search,
  FileText,
  FileSpreadsheet,
  FileImage,
  MoreHorizontal,
  Download,
  Clock3
} from "lucide-react";

import {
  PageHeading,
  StatusPill
} from "../../components/workshepher/WorkspaceWidgets";

const documents = [
  ["Q4 Financial Report", "Finance Operations", "PDF", "2.4 MB", "8 min ago"],
  ["Product Roadmap", "Product Strategy", "DOCX", "1.8 MB", "32 min ago"],
  ["Client Requirements", "Northwind Account", "PDF", "4.1 MB", "2 hrs ago"],
  ["Team Planning Sheet", "People Operations", "XLSX", "890 KB", "Yesterday"],
  ["Brand Guidelines", "Marketing", "PDF", "6.7 MB", "Yesterday"],
  ["Product Screens", "Product Strategy", "PNG", "3.2 MB", "2 days ago"]
];

function DocumentIcon({ type }) {
  if (type === "XLSX") return <FileSpreadsheet size={19} />;
  if (type === "PNG") return <FileImage size={19} />;
  return <FileText size={19} />;
}

export default function Documents() {
  return (
    <div className="ws-page">
      <PageHeading
        eyebrow="WORKSPACE"
        title="Documents"
        description="Everything your team needs, organized and easy to find."
        action={
          <button className="ws-primary-button">
            <Plus size={17} />
            Upload
          </button>
        }
      />

      <div className="ws-document-toolbar">
        <div className="ws-search-field">
          <Search size={17} />
          <input placeholder="Search documents..." />
          <kbd>? K</kbd>
        </div>

        <div className="ws-toolbar-filters">
          <button className="active">All</button>
          <button>Recent</button>
          <button>Shared</button>
          <button>My documents</button>
        </div>
      </div>

      <section className="ws-panel ws-documents-panel">
        <div className="ws-document-table-head">
          <span>Name</span>
          <span>Location</span>
          <span>Type</span>
          <span>Updated</span>
          <span />
        </div>

        <div className="ws-document-list">
          {documents.map((doc, index) => (
            <motion.div
              className="ws-document-row"
              key={doc[0]}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="ws-document-name">
                <div className="ws-document-icon">
                  <DocumentIcon type={doc[2]} />
                </div>

                <div>
                  <strong>{doc[0]}</strong>
                  <span>{doc[3]}</span>
                </div>
              </div>

              <span className="ws-document-location">{doc[1]}</span>

              <StatusPill>{doc[2]}</StatusPill>

              <span className="ws-document-updated">
                <Clock3 size={14} />
                {doc[4]}
              </span>

              <button className="ws-icon-button">
                <MoreHorizontal size={17} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
