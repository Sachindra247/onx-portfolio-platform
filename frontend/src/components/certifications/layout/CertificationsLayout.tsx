import type { ReactNode } from "react";

import CertificationsDashboardNav from "../dashboard/CertificationsDashboardNav";

import type { CertificationsSection } from "../../../types/certifications";

interface CertificationsLayoutProps {
  activeSection: CertificationsSection;
  onSectionChange: (section: CertificationsSection) => void;
  onAddCertification: () => void;
  onExportCsv: () => void;
  addCertificationDisabled?: boolean;
  exportDisabled?: boolean;
  gapCount?: number;
  expiringCount?: number;
  children: ReactNode;
}

export default function CertificationsLayout({
  activeSection,
  onSectionChange,
  onAddCertification,
  onExportCsv,
  addCertificationDisabled = false,
  exportDisabled = false,
  gapCount = 0,
  expiringCount = 0,
  children,
}: CertificationsLayoutProps) {
  return (
    <main className="certifications-page">
      <div className="certifications-workspace">
        <CertificationsDashboardNav
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onAddCertification={onAddCertification}
          onExportCsv={onExportCsv}
          addCertificationDisabled={addCertificationDisabled}
          exportDisabled={exportDisabled}
          gapCount={gapCount}
          expiringCount={expiringCount}
        />

        <div className="certifications-workspace__content">{children}</div>
      </div>
    </main>
  );
}
