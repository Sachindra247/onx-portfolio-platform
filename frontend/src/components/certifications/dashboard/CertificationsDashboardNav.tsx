import {
  AlertTriangle,
  Award,
  Building2,
  CalendarClock,
  Download,
  LayoutDashboard,
  Plus,
  Users,
} from "lucide-react";

import type { CertificationsSection } from "../../../types/certifications";

interface CertificationsDashboardNavProps {
  activeSection: CertificationsSection;
  onSectionChange: (section: CertificationsSection) => void;
  onAddCertification: () => void;
  onExportCsv: () => void;
  addCertificationDisabled?: boolean;
  exportDisabled?: boolean;
  gapCount?: number;
  expiringCount?: number;
}

const navigationItems = [
  {
    id: "overview" as const,
    name: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "certifications" as const,
    name: "Certifications",
    icon: Award,
  },
  {
    id: "people" as const,
    name: "People",
    icon: Users,
  },
  {
    id: "gaps" as const,
    name: "Gaps & Actions",
    icon: AlertTriangle,
  },
  {
    id: "expiring" as const,
    name: "Expiring Certs",
    icon: CalendarClock,
  },
  {
    id: "vendors" as const,
    name: "Vendors & Partners",
    icon: Building2,
  },
];

export default function CertificationsDashboardNav({
  activeSection,
  onSectionChange,
  onAddCertification,
  onExportCsv,
  addCertificationDisabled = false,
  exportDisabled = false,
  gapCount = 0,
  expiringCount = 0,
}: CertificationsDashboardNavProps) {
  function getBadgeCount(section: CertificationsSection): number {
    if (section === "gaps") {
      return gapCount;
    }

    if (section === "expiring") {
      return expiringCount;
    }

    return 0;
  }

  return (
    <aside
      className="certifications-sidebar"
      aria-label="Certifications navigation"
    >
      <div className="certifications-sidebar__heading" />

      <div className="certifications-sidebar__items">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const badgeCount = getBadgeCount(item.id);

          return (
            <button
              key={item.id}
              type="button"
              className={[
                "certifications-sidebar-item",
                isActive ? "certifications-sidebar-item--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSectionChange(item.id)}
            >
              <span className="certifications-sidebar-item__icon">
                <Icon size={18} aria-hidden="true" />
              </span>

              <span className="certifications-sidebar-item__content">
                <span className="certifications-sidebar-item__name">
                  {item.name}
                </span>
              </span>

              {badgeCount > 0 ? (
                <span className="certifications-sidebar-item__badge">
                  {badgeCount}
                </span>
              ) : (
                <span
                  className="certifications-sidebar-item__indicator"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="certifications-sidebar__actions">
        <button
          type="button"
          className="certifications-sidebar__add-button"
          disabled={addCertificationDisabled}
          onClick={onAddCertification}
        >
          <Plus size={17} aria-hidden="true" />
          <span>Add Certification</span>
        </button>

        <button
          type="button"
          className="certifications-sidebar__export-button"
          disabled={exportDisabled}
          onClick={onExportCsv}
        >
          <Download size={17} aria-hidden="true" />
          <span>Export CSV</span>
        </button>
      </div>
    </aside>
  );
}
