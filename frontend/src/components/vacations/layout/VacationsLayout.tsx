import type { ReactNode } from "react";

import VacationsDashboardNav, {
  type VacationSection,
} from "../dashboard/VacationsDashboardNav";

interface VacationsLayoutProps {
  activeSection: VacationSection;
  onSectionChange: (section: VacationSection) => void;
  onAddLeaveRequest: () => void;
  onExportCsv: () => void;
  children: ReactNode;
}

export default function VacationsLayout({
  activeSection,
  onSectionChange,
  onAddLeaveRequest,
  onExportCsv,
  children,
}: VacationsLayoutProps) {
  return (
    <main className="vacations-page">
      <div className="vacations-workspace">
        <VacationsDashboardNav
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onAddLeaveRequest={onAddLeaveRequest}
          onExportCsv={onExportCsv}
        />

        <div className="vacations-workspace__content">{children}</div>
      </div>
    </main>
  );
}
