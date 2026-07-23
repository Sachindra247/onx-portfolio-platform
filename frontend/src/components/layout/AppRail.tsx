import {
  BadgeDollarSign,
  CalendarDays,
  GraduationCap,
  House,
  Palmtree,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    label: "Home",
    path: "/",
    icon: House,
    available: true,
  },
  {
    label: "Events",
    path: "/events",
    icon: CalendarDays,
    available: true,
  },
  {
    label: "Certifications",
    icon: GraduationCap,
    available: false,
  },
  {
    label: "Rebates",
    icon: BadgeDollarSign,
    available: false,
  },
  {
    label: "Vacations",
    icon: Palmtree,
    available: false,
  },
];

export default function AppRail() {
  return (
    <aside className="app-rail" aria-label="Primary navigation">
      <NavLink className="app-rail__brand" to="/" aria-label="OnX home">
        <span>ONX</span>
      </NavLink>

      <nav className="app-rail__navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          if (!item.available || !item.path) {
            return (
              <button
                className="app-rail__item app-rail__item--disabled"
                type="button"
                key={item.label}
                title={`${item.label} — coming soon`}
                disabled
              >
                <Icon size={20} aria-hidden="true" />
                <span className="app-rail__tooltip">
                  {item.label} — coming soon
                </span>
              </button>
            );
          }

          return (
            <NavLink
              className={({ isActive }) =>
                ["app-rail__item", isActive ? "app-rail__item--active" : ""]
                  .filter(Boolean)
                  .join(" ")
              }
              end={item.path === "/"}
              to={item.path}
              key={item.label}
              title={item.label}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="app-rail__tooltip">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
