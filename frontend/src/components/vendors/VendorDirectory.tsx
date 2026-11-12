import { useEffect, useState } from "react";
import { Building2, Search } from "lucide-react";

import { getVendors } from "../../api/vendorsApi";
import type { CertificationVendorDto } from "../../types/certifications";

import { useAuth } from "../../auth/AuthContext";
import VendorContactsSection from "../certifications/vendors/VendorContactsSection";
import VendorCertificationsSection from "./VendorCertificationsSection";
import VendorEventsSection from "./VendorEventsSection";
import type { VendorManagementSection } from "./VendorManagementNav";

interface VendorDirectoryProps {
  section?: VendorManagementSection;
}

const sectionContent = {
  vendors: {
    title: "Vendor Directory",
    description: "Browse vendors and view their complete profiles.",
  },
  contacts: {
    title: "Vendor Contacts",
    description: "Select a vendor to view and manage its contacts.",
  },
  events: {
    title: "Vendor Events",
    description: "Select a vendor to view its related events.",
  },
  certifications: {
    title: "Vendor Certifications",
    description: "Select a vendor to view its certification records.",
  },
};

export default function VendorDirectory({
  section = "vendors",
}: VendorDirectoryProps) {
  const [vendors, setVendors] = useState<CertificationVendorDto[]>([]);
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] =
    useState<CertificationVendorDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useAuth();

  const canManageVendors = Boolean(
    user?.isGlobalAdministrator || user?.certificationsAccess === "Admin",
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadVendors() {
      try {
        setLoading(true);
        setError("");

        const data = await getVendors(controller.signal);

        if (!controller.signal.aborted) {
          setVendors(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load vendors.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadVendors();

    return () => controller.abort();
  }, []);

  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const currentSection = section === "overview" ? "vendors" : section;

  const currentContent = sectionContent[currentSection];

  return (
    <div style={{ padding: "24px" }}>
      <header style={{ marginBottom: "24px" }}>
        <h2>{currentContent.title}</h2>
        <p>{currentContent.description}</p>
      </header>

      <div style={{ position: "relative", marginBottom: "20px" }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: "12px",
            top: "12px",
            color: "#64748b",
          }}
        />

        <input
          type="search"
          placeholder="Search vendors..."
          aria-label="Search vendors"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            width: "100%",
            padding: "12px 12px 12px 40px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
          }}
        />
      </div>

      {loading && <p>Loading vendors...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1fr) 2fr",
            gap: "20px",
          }}
        >
          <div>
            {filteredVendors.length === 0 && <p>No vendors found.</p>}

            {filteredVendors.map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onClick={() => setSelectedVendor(vendor)}
                aria-pressed={selectedVendor?.id === vendor.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "14px",
                  marginBottom: "8px",
                  textAlign: "left",
                  background:
                    selectedVendor?.id === vendor.id ? "#e8f4ee" : "#ffffff",
                  border:
                    selectedVendor?.id === vendor.id
                      ? "1px solid #28785d"
                      : "1px solid #e2e8f0",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <Building2 size={18} />
                <span>{vendor.name}</span>
              </button>
            ))}
          </div>

          <div
            style={{
              padding: "24px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
            }}
          >
            {selectedVendor ? (
              <>
                <h3>{selectedVendor.name}</h3>

                <p>Status: {selectedVendor.isActive ? "Active" : "Inactive"}</p>

                {currentSection === "vendors" && (
                  <>
                    <hr style={{ margin: "20px 0" }} />

                    <h4>Partnership Overview</h4>

                    <p>
                      Partnership details will be added after requirements are
                      confirmed.
                    </p>
                  </>
                )}

                {(currentSection === "vendors" ||
                  currentSection === "contacts") && (
                  <>
                    <hr style={{ margin: "24px 0" }} />

                    <VendorContactsSection
                      key={`contacts-${selectedVendor.id}`}
                      vendorId={selectedVendor.id}
                      canManage={canManageVendors}
                    />
                  </>
                )}

                {(currentSection === "vendors" ||
                  currentSection === "certifications") && (
                  <>
                    <hr style={{ margin: "24px 0" }} />

                    <VendorCertificationsSection
                      key={`certifications-${selectedVendor.id}`}
                      vendorId={selectedVendor.id}
                    />
                  </>
                )}

                {(currentSection === "vendors" ||
                  currentSection === "events") && (
                  <>
                    <hr style={{ margin: "24px 0" }} />

                    <VendorEventsSection
                      key={`events-${selectedVendor.id}`}
                      vendorId={selectedVendor.id}
                    />
                  </>
                )}
              </>
            ) : (
              <p>Select a vendor to view its details.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
