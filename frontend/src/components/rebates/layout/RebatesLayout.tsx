import type { ReactNode } from "react";

import RebatesDashboardNav from "../dashboard/RebatesDashboardNav";

import type { RebatesSection } from "../../../types/rebates";

interface RebatesLayoutProps {
  activeSection: RebatesSection;
  canManage: boolean;
  onSectionChange: (section: RebatesSection) => void;
  onAddRebate: () => void;
  children: ReactNode;
}

export default function RebatesLayout({
  activeSection,
  canManage,
  onSectionChange,
  onAddRebate,
  children,
}: RebatesLayoutProps) {
  return (
    <main className="rebates-page">
      <div className="rebates-workspace">
        <RebatesDashboardNav
          activeSection={activeSection}
          canManage={canManage}
          onSectionChange={onSectionChange}
          onAddRebate={onAddRebate}
        />

        <div className="rebates-workspace__content">{children}</div>
      </div>
    </main>
  );
}
