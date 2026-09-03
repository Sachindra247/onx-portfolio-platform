import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  List,
  Plus,
  Users,
} from "lucide-react";

import type { EventsSection } from "../../../types/events";

interface EventsDashboardNavProps {
  activeSection: EventsSection;
  onSectionChange: (section: EventsSection) => void;
  onAddEvent: () => void;
  onExportCsv: () => void;
  canManageEvents: boolean;
  addEventDisabled?: boolean;
  exportDisabled?: boolean;
}

const navigationItems = [
  {
    id: "overview" as const,
    name: "Overview",
    icon: BarChart3,
  },
  {
    id: "events" as const,
    name: "All Events",
    icon: List,
  },
  {
    id: "vendors" as const,
    name: "By Vendor",
    icon: Users,
  },
  {
    id: "upcoming" as const,
    name: "Upcoming",
    icon: CalendarDays,
  },
  {
    id: "completed" as const,
    name: "Completed",
    icon: CheckCircle2,
  },
];

export default function EventsDashboardNav({
  activeSection,
  onSectionChange,
  onAddEvent,
  onExportCsv,
  canManageEvents,
  addEventDisabled = false,
  exportDisabled = false,
}: EventsDashboardNavProps) {
  return (
    <aside className="events-sidebar">
      <div className="events-sidebar__items">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={[
                "events-sidebar-item",
                isActive ? "events-sidebar-item--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSectionChange(item.id)}
            >
              <span className="events-sidebar-item__icon">
                <Icon size={18} aria-hidden="true" />
              </span>

              <span className="events-sidebar-item__content">
                <span className="events-sidebar-item__name">{item.name}</span>
              </span>

              <span
                className="events-sidebar-item__indicator"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      <div className="events-sidebar__actions">
        {canManageEvents && (
          <button
            type="button"
            className="events-sidebar__add-button"
            disabled={addEventDisabled}
            onClick={onAddEvent}
          >
            <Plus size={17} aria-hidden="true" />
            <span>Add Event</span>
          </button>
        )}

        <button
          type="button"
          className="events-sidebar__export-button"
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
