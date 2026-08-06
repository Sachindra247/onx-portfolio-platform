import {
  CalendarDays,
  CalendarRange,
  Download,
  LayoutDashboard,
  Plus,
  ShieldAlert,
  Users,
} from "lucide-react";

export type VacationSection =
  | "overview"
  | "calendar"
  | "requests"
  | "people"
  | "coverage";

interface VacationsDashboardNavProps {
  activeSection: VacationSection;
  onSectionChange: (section: VacationSection) => void;
  onAddLeaveRequest: () => void;
  onExportCsv: () => void;
}

const navigationItems = [
  {
    id: "overview" as const,
    name: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "calendar" as const,
    name: "Team Calendar",
    icon: CalendarDays,
  },
  {
    id: "requests" as const,
    name: "Leave Requests",
    icon: CalendarRange,
  },
  {
    id: "people" as const,
    name: "People & Balances",
    icon: Users,
  },
  {
    id: "coverage" as const,
    name: "Coverage Warnings",
    icon: ShieldAlert,
  },
];

export default function VacationsDashboardNav({
  activeSection,
  onSectionChange,
  onAddLeaveRequest,
  onExportCsv,
}: VacationsDashboardNavProps) {
  return (
    <aside
      className="vacations-sidebar"
      aria-label="Vacation Tracker navigation"
    >
      <div className="vacations-sidebar__heading" />

      <div className="vacations-sidebar__items">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={[
                "vacations-sidebar-item",
                isActive ? "vacations-sidebar-item--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSectionChange(item.id)}
            >
              <span className="vacations-sidebar-item__icon">
                <Icon size={18} aria-hidden="true" />
              </span>

              <span className="vacations-sidebar-item__content">
                <span className="vacations-sidebar-item__name">
                  {item.name}
                </span>
              </span>

              <span
                className="vacations-sidebar-item__indicator"
                aria-hidden="true"
              />
            </button>
          );
        })}

        <div className="vacations-sidebar__actions">
          <button
            type="button"
            className="vacations-sidebar__add-button"
            onClick={onAddLeaveRequest}
          >
            <Plus size={17} aria-hidden="true" />
            Add Leave Request
          </button>

          <button
            type="button"
            className="vacations-sidebar__export-button"
            onClick={onExportCsv}
          >
            <Download size={16} aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>
    </aside>
  );
}
