import { useState } from "react";

import VendorManagementNav, {
  type VendorManagementSection,
} from "../components/vendors/VendorManagementNav";

import VendorDirectory from "../components/vendors/VendorDirectory";
import VendorOverview from "../components/vendors/VendorOverview";

export default function VendorManagementPage() {
  const [activeSection, setActiveSection] =
    useState<VendorManagementSection>("overview");

  return (
    <main className="certifications-page">
      <div className="certifications-workspace">
        <VendorManagementNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <div className="certifications-workspace__content">
          {activeSection === "overview" ? (
            <VendorOverview onNavigate={setActiveSection} />
          ) : (
            <VendorDirectory section={activeSection} />
          )}
        </div>
      </div>
    </main>
  );
}
