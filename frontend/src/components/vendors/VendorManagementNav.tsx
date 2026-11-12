import {
  Award,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Users,
} from "lucide-react";

export type VendorManagementSection =
  | "overview"
  | "vendors"
  | "contacts"
  | "events"
  | "certifications";

interface VendorManagementNavProps {
  activeSection: VendorManagementSection;
  onSectionChange: (section: VendorManagementSection) => void;
}

const navigationItems = [
  {
    id: "overview",
    name: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "vendors",
    name: "Vendors",
    icon: Building2,
  },
  {
    id: "contacts",
    name: "Contacts",
    icon: Users,
  },
  {
    id: "events",
    name: "Events",
    icon: CalendarDays,
  },
  {
    id: "certifications",
    name: "Certifications",
    icon: Award,
  },
] as const;

export default function VendorManagementNav({
  activeSection,
  onSectionChange,
}: VendorManagementNavProps) {
  return (
    <aside
      className="certifications-sidebar"
      aria-label="Vendor Management navigation"
    >
      <div className="certifications-sidebar__heading" />

      <div className="certifications-sidebar__items">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

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

              <span
                className="certifications-sidebar-item__indicator"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
