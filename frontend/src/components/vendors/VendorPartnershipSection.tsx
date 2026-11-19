import { useEffect, useState } from "react";

import {
  getVendorPartnerManagers,
  updateVendorPartnership,
} from "../../api/vendorsApi";

import type { VendorPartnerManager } from "../../api/vendorsApi";

import type { CertificationVendorDto } from "../../types/certifications";

interface VendorPartnershipSectionProps {
  vendor: CertificationVendorDto;
  canManageVendors: boolean;
  onVendorUpdated: (vendor: CertificationVendorDto) => void;
}

export default function VendorPartnershipSection({
  vendor,
  canManageVendors,
  onVendorUpdated,
}: VendorPartnershipSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [managers, setManagers] = useState<VendorPartnerManager[]>([]);

  const [loadingManagers, setLoadingManagers] = useState(false);

  const [managerError, setManagerError] = useState("");

  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [managerId, setManagerId] = useState("");
  const [benefits, setBenefits] = useState("");
  const [programs, setPrograms] = useState("");

  useEffect(() => {
    if (!canManageVendors) {
      return;
    }

    const controller = new AbortController();

    async function loadManagers() {
      setLoadingManagers(true);
      setManagerError("");

      try {
        const data = await getVendorPartnerManagers(controller.signal);

        if (!controller.signal.aborted) {
          setManagers(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setManagerError("Unable to load partner managers.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingManagers(false);
        }
      }
    }

    void loadManagers();

    return () => controller.abort();
  }, [canManageVendors]);

  const assignedManager = managers.find(
    (manager) => manager.id === vendor.primaryPartnerManagerId,
  );

  function handleEdit() {
    setTier(vendor.partnershipTier ?? "");
    setStatus(vendor.partnershipStatus ?? "");
    setManagerId(vendor.primaryPartnerManagerId ?? "");
    setBenefits(vendor.partnershipBenefits ?? "");
    setPrograms(vendor.partnerPrograms ?? "");
    setError("");
    setEditing(true);
  }

  function handleCancel() {
    if (saving) {
      return;
    }

    setEditing(false);
    setError("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageVendors || saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedVendor = await updateVendorPartnership(vendor.id, {
        partnershipTier: tier.trim() || null,
        partnershipStatus: status.trim() || null,
        primaryPartnerManagerId: managerId || null,
        partnershipBenefits: benefits.trim() || null,
        partnerPrograms: programs.trim() || null,
      });

      onVendorUpdated(updatedVendor);
      setEditing(false);
    } catch {
      setError("Unable to save partnership information. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="vendor-partnership">
      <div className="vendor-partnership__header">
        <h4>Partnership Overview</h4>

        {canManageVendors && !editing && (
          <button type="button" onClick={handleEdit}>
            Edit Partnership
          </button>
        )}
      </div>

      {editing && canManageVendors ? (
        <form className="vendor-partnership__form" onSubmit={handleSave}>
          <div className="vendor-partnership__grid">
            <label>
              Partnership Tier
              <input
                type="text"
                value={tier}
                maxLength={100}
                placeholder="e.g. Gold, Premier, Silver"
                disabled={saving}
                onChange={(event) => setTier(event.target.value)}
              />
            </label>

            <label>
              Partnership Status
              <input
                type="text"
                value={status}
                maxLength={100}
                placeholder="e.g. Active"
                disabled={saving}
                onChange={(event) => setStatus(event.target.value)}
              />
            </label>

            <label className="vendor-partnership__full">
              Primary Partner Manager
              <select
                value={managerId}
                disabled={saving || loadingManagers || Boolean(managerError)}
                onChange={(event) => setManagerId(event.target.value)}
              >
                <option value="">
                  {loadingManagers ? "Loading managers..." : "Not assigned"}
                </option>

                {managerId &&
                  !managers.some((manager) => manager.id === managerId) && (
                    <option value={managerId}>Existing assigned manager</option>
                  )}

                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="vendor-partnership__full">
              Partnership Benefits
              <textarea
                value={benefits}
                maxLength={4000}
                rows={3}
                disabled={saving}
                onChange={(event) => setBenefits(event.target.value)}
              />
            </label>

            <label className="vendor-partnership__full">
              Partner Programs
              <textarea
                value={programs}
                maxLength={4000}
                rows={3}
                disabled={saving}
                onChange={(event) => setPrograms(event.target.value)}
              />
            </label>
          </div>

          {managerError && <p role="alert">{managerError}</p>}

          {error && <p role="alert">{error}</p>}

          <div className="vendor-partnership__actions">
            <button type="submit" disabled={saving || loadingManagers}>
              {saving ? "Saving..." : "Save Partnership"}
            </button>

            <button type="button" disabled={saving} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="vendor-partnership__grid">
          <div>
            <span>Partnership Tier</span>
            <p>{vendor.partnershipTier || "Not specified"}</p>
          </div>

          <div>
            <span>Partnership Status</span>
            <p>{vendor.partnershipStatus || "Not specified"}</p>
          </div>

          <div className="vendor-partnership__full">
            <span>Primary Partner Manager</span>
            <p>
              {assignedManager?.name ||
                (vendor.primaryPartnerManagerId ? "Assigned" : "Not assigned")}
            </p>
          </div>

          <div className="vendor-partnership__full">
            <span>Partnership Benefits</span>
            <p>{vendor.partnershipBenefits || "Not specified"}</p>
          </div>

          <div className="vendor-partnership__full">
            <span>Partner Programs</span>
            <p>{vendor.partnerPrograms || "Not specified"}</p>
          </div>
        </div>
      )}
    </section>
  );
}
