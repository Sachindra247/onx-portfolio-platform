import {
  BadgeDollarSign,
  Building2,
  LayoutDashboard,
  Plus,
} from "lucide-react";

import type { RebatesSection } from "../../../types/rebates";

interface RebatesDashboardNavProps {
  activeSection: RebatesSection;
  canManage: boolean;
  onSectionChange: (section: RebatesSection) => void;
  onAddRebate: () => void;
}

const navigationItems = [
  {
    id: "overview" as const,
    name: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "rebates" as const,
    name: "All Rebates",
    icon: BadgeDollarSign,
  },
  {
    id: "vendors" as const,
    name: "Vendors",
    icon: Building2,
  },
];

export default function RebatesDashboardNav({
  activeSection,
  canManage,
  onSectionChange,
  onAddRebate,
}: RebatesDashboardNavProps) {
  return (
    <aside className="rebates-sidebar" aria-label="Rebates navigation">
      <div className="rebates-sidebar__heading" />

      <div className="rebates-sidebar__items">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={[
                "rebates-sidebar-item",
                isActive ? "rebates-sidebar-item--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSectionChange(item.id)}
            >
              <span className="rebates-sidebar-item__icon">
                <Icon size={18} aria-hidden="true" />
              </span>

              <span className="rebates-sidebar-item__content">
                <span className="rebates-sidebar-item__name">{item.name}</span>
              </span>

              <span
                className="rebates-sidebar-item__indicator"
                aria-hidden="true"
              />
            </button>
          );
        })}

        {canManage ? (
          <div className="rebates-sidebar__actions">
            <button
              type="button"
              className="rebates-sidebar__add-button"
              onClick={onAddRebate}
            >
              <Plus size={17} aria-hidden="true" />
              Add Rebate
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
