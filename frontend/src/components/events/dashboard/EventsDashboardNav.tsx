import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  List,
  Plus,
  Users,
} from "lucide-react";

import type { EventsSection } from "../../../types/events";

interface EventsDashboardNavProps {
  activeSection: EventsSection;

  onSectionChange: (section: EventsSection) => void;

  onAddEvent: () => void;

  canManageEvents: boolean;

  addEventDisabled?: boolean;
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
  canManageEvents,
  addEventDisabled = false,
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

      {canManageEvents && (
        <div className="events-sidebar__actions">
          <button
            type="button"
            className="events-sidebar__add-button"
            disabled={addEventDisabled}
            onClick={onAddEvent}
          >
            <Plus size={17} aria-hidden="true" />

            <span>Add Event</span>
          </button>
        </div>
      )}
    </aside>
  );
}
