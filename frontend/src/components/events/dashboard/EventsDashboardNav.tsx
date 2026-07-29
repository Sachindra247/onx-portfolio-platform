import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  List,
  Users,
} from "lucide-react";

import type { EventsSection } from "../../../types/events";

interface EventsDashboardNavProps {
  activeSection: EventsSection;
  onSectionChange: (section: EventsSection) => void;
}

const navigationItems = [
  {
    id: "overview" as const,
    name: "Overview",
    summary: "Portfolio dashboard",
    icon: BarChart3,
  },
  {
    id: "events" as const,
    name: "All Events",
    summary: "Browse and manage events",
    icon: List,
  },
  {
    id: "vendors" as const,
    name: "By Vendor",
    summary: "View vendor activity",
    icon: Users,
  },
  {
    id: "upcoming" as const,
    name: "Upcoming",
    summary: "Scheduled events",
    icon: CalendarDays,
  },
  {
    id: "completed" as const,
    name: "Completed",
    summary: "Finished events",
    icon: CheckCircle2,
  },
];

export default function EventsDashboardNav({
  activeSection,
  onSectionChange,
}: EventsDashboardNavProps) {
  return (
    <aside className="events-sidebar" aria-label="Events navigation">
      <div className="events-sidebar__heading"></div>

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

                <span className="events-sidebar-item__summary">
                  {item.summary}
                </span>
              </span>

              <span
                className="events-sidebar-item__indicator"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
