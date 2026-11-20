import { useEffect, useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import axios from "axios";

import { createVendor, getVendors } from "../../api/vendorsApi";
import type { CertificationVendorDto } from "../../types/certifications";

import { useAuth } from "../../auth/AuthContext";
import VendorContactsSection from "../certifications/vendors/VendorContactsSection";
import VendorCertificationsSection from "./VendorCertificationsSection";
import VendorEventsSection from "./VendorEventsSection";
import VendorPartnershipSection from "./VendorPartnershipSection";
import VendorBenefitsSection from "./VendorBenefitsSection";
import VendorActivitiesSection from "./VendorActivitiesSection";
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
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [createError, setCreateError] = useState("");
  const [creatingVendor, setCreatingVendor] = useState(false);

  const { user } = useAuth();

  const canManageVendors = Boolean(
    user?.isGlobalAdministrator ||
    user?.eventsAccess === "Admin" ||
    user?.certificationsAccess === "Admin",
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadVendors() {
      try {
        setLoading(true);
        setError("");

        const data = await getVendors(controller.signal);

        if (!controller.signal.aborted) {
          const sortedVendors = [...data].sort((a, b) =>
            a.name.localeCompare(b.name),
          );

          setVendors(sortedVendors);
          setSelectedVendor(sortedVendors[0] ?? null);
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

  async function handleCreateVendor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageVendors || creatingVendor) {
      return;
    }

    const name = newVendorName.trim();

    if (name.length < 2 || name.length > 150) {
      setCreateError("Vendor name must be between 2 and 150 characters.");
      return;
    }

    try {
      setCreatingVendor(true);
      setCreateError("");

      const createdVendor = await createVendor(name);

      setVendors((current) =>
        [...current, createdVendor].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );

      setSelectedVendor(createdVendor);
      setSearch("");
      setNewVendorName("");
      setShowAddVendor(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          setCreateError("You do not have permission to create vendors.");
        } else if (error.response?.status === 400) {
          setCreateError(
            "Unable to create vendor. Check whether the name already exists.",
          );
        } else {
          setCreateError("Unable to create vendor. Please try again.");
        }
      } else {
        setCreateError("Unable to create vendor. Please try again.");
      }
    } finally {
      setCreatingVendor(false);
    }
  }

  function handleVendorUpdated(updatedVendor: CertificationVendorDto) {
    setVendors((current) =>
      current.map((vendor) =>
        vendor.id === updatedVendor.id ? updatedVendor : vendor,
      ),
    );

    setSelectedVendor((current) =>
      current?.id === updatedVendor.id ? updatedVendor : current,
    );
  }

  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const currentSection = section === "overview" ? "vendors" : section;

  const currentContent = sectionContent[currentSection];

  return (
    <div style={{ padding: "24px" }}>
      <header style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div>
            <h2>{currentContent.title}</h2>
            <p>{currentContent.description}</p>
          </div>

          {currentSection === "vendors" && canManageVendors && (
            <button
              type="button"
              onClick={() => {
                setShowAddVendor((current) => !current);
                setCreateError("");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                background: "#28785d",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              <Plus size={18} />
              Add Vendor
            </button>
          )}
        </div>

        {showAddVendor && canManageVendors && (
          <form
            onSubmit={handleCreateVendor}
            style={{
              marginTop: "20px",
              padding: "20px",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              background: "#ffffff",
            }}
          >
            <label
              htmlFor="new-vendor-name"
              style={{ display: "block", marginBottom: "8px" }}
            >
              Vendor Name
            </label>

            <input
              id="new-vendor-name"
              type="text"
              value={newVendorName}
              onChange={(event) => setNewVendorName(event.target.value)}
              placeholder="Enter vendor name"
              minLength={2}
              maxLength={150}
              required
              disabled={creatingVendor}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                marginBottom: "12px",
              }}
            />

            {createError && (
              <p role="alert" style={{ color: "#b91c1c" }}>
                {createError}
              </p>
            )}

            <button
              type="submit"
              disabled={creatingVendor}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                background: "#28785d",
                color: "#ffffff",
                cursor: creatingVendor ? "not-allowed" : "pointer",
              }}
            >
              {creatingVendor ? "Creating..." : "Save Vendor"}
            </button>
          </form>
        )}
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

                <p>
                  Partnership Tier:{" "}
                  <strong>
                    {selectedVendor.partnershipTier || "Not specified"}
                  </strong>
                </p>

                {currentSection === "vendors" && (
                  <>
                    <hr style={{ margin: "20px 0" }} />

                    <VendorPartnershipSection
                      key={`partnership-${selectedVendor.id}`}
                      vendor={selectedVendor}
                      canManageVendors={canManageVendors}
                      onVendorUpdated={handleVendorUpdated}
                    />

                    <hr style={{ margin: "24px 0" }} />

                    <VendorBenefitsSection
                      key={`benefits-${selectedVendor.id}`}
                      vendor={selectedVendor}
                      canManageVendors={canManageVendors}
                      onVendorUpdated={handleVendorUpdated}
                    />

                    <hr style={{ margin: "24px 0" }} />

                    <VendorActivitiesSection
                      key={`activities-${selectedVendor.id}`}
                      vendorId={selectedVendor.id}
                      canManageVendors={canManageVendors}
                    />
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
