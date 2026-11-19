import { useState } from "react";
import axios from "axios";

import { updateVendorBenefits } from "../../api/vendorsApi";
import type { CertificationVendorDto } from "../../types/certifications";

interface VendorBenefitsSectionProps {
  vendor: CertificationVendorDto;
  canManageVendors: boolean;
  onVendorUpdated: (vendor: CertificationVendorDto) => void;
}

function formatPercentage(value: number | null | undefined): string {
  return value == null ? "Not specified" : `${value.toFixed(2)}%`;
}

function formatAvailability(value: boolean | null | undefined): string {
  if (value == null) return "Not specified";
  return value ? "Available" : "Not available";
}

function toSelectValue(value: boolean | null | undefined): string {
  return value == null ? "" : String(value);
}

function parseAvailability(value: string): boolean | null {
  return value === "" ? null : value === "true";
}

function parsePercentage(value: string, label: string): number | null {
  const trimmed = value.trim();

  if (trimmed === "") return null;

  const number = Number(trimmed);

  if (!Number.isFinite(number) || number < 0 || number > 100) {
    throw new Error(`${label} must be between 0 and 100.`);
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`${label} must be a number with up to two decimal places.`);
  }

  return number;
}

export default function VendorBenefitsSection({
  vendor,
  canManageVendors,
  onVendorUpdated,
}: VendorBenefitsSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [discount, setDiscount] = useState("");
  const [rebate, setRebate] = useState("");
  const [dealRegistration, setDealRegistration] = useState("");
  const [conditions, setConditions] = useState("");
  const [spiff, setSpiff] = useState("");

  function handleEdit() {
    setDiscount(
      vendor.discountPercentage == null
        ? ""
        : String(vendor.discountPercentage),
    );

    setRebate(
      vendor.rebatePercentage == null ? "" : String(vendor.rebatePercentage),
    );

    setDealRegistration(toSelectValue(vendor.dealRegistrationAvailable));

    setConditions(vendor.dealRegistrationConditions ?? "");
    setSpiff(toSelectValue(vendor.spiffAvailable));

    setError("");
    setEditing(true);
  }

  function handleCancel() {
    if (saving) return;

    setError("");
    setEditing(false);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageVendors || saving) return;

    setError("");

    let discountPercentage: number | null;
    let rebatePercentage: number | null;

    try {
      discountPercentage = parsePercentage(discount, "Discount percentage");

      rebatePercentage = parsePercentage(rebate, "Rebate percentage");
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Please check the percentage values.",
      );
      return;
    }

    setSaving(true);

    try {
      const updatedVendor = await updateVendorBenefits(vendor.id, {
        discountPercentage,
        rebatePercentage,
        dealRegistrationAvailable: parseAvailability(dealRegistration),
        dealRegistrationConditions: conditions.trim() || null,
        spiffAvailable: parseAvailability(spiff),
      });

      onVendorUpdated(updatedVendor);
      setEditing(false);
    } catch (requestError) {
      if (
        axios.isAxiosError(requestError) &&
        requestError.response?.status === 403
      ) {
        setError("You do not have permission to update vendor benefits.");
      } else {
        setError("Unable to save vendor benefits. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="vendor-partnership">
      <div className="vendor-partnership__header">
        <h4>Vendor Benefits</h4>

        {canManageVendors && !editing && (
          <button type="button" onClick={handleEdit}>
            Edit Benefits
          </button>
        )}
      </div>

      {editing && canManageVendors ? (
        <form
          className="vendor-partnership__form"
          onSubmit={handleSave}
          noValidate
        >
          <div className="vendor-partnership__grid">
            <label>
              Discount Percentage (%)
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={discount}
                placeholder="e.g. 15.50"
                disabled={saving}
                onChange={(event) => {
                  setDiscount(event.target.value);
                  setError("");
                }}
              />
            </label>

            <label>
              Rebate Percentage (%)
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={rebate}
                placeholder="e.g. 5.25"
                disabled={saving}
                onChange={(event) => {
                  setRebate(event.target.value);
                  setError("");
                }}
              />
            </label>

            <label>
              Deal Registration
              <select
                value={dealRegistration}
                disabled={saving}
                onChange={(event) => setDealRegistration(event.target.value)}
              >
                <option value="">Not specified</option>
                <option value="true">Yes — Available</option>
                <option value="false">No — Not available</option>
              </select>
            </label>

            <label>
              SPIFF Availability
              <select
                value={spiff}
                disabled={saving}
                onChange={(event) => setSpiff(event.target.value)}
              >
                <option value="">Not specified</option>
                <option value="true">Yes — Available</option>
                <option value="false">No — Not available</option>
              </select>
            </label>

            <label className="vendor-partnership__full">
              Deal Registration Conditions
              <textarea
                value={conditions}
                maxLength={4000}
                rows={3}
                placeholder="Enter eligibility criteria or restrictions."
                disabled={saving}
                onChange={(event) => setConditions(event.target.value)}
              />
            </label>
          </div>

          {error && <p role="alert">{error}</p>}

          <div className="vendor-partnership__actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Benefits"}
            </button>

            <button type="button" disabled={saving} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="vendor-partnership__grid">
          <div>
            <span>Discount Percentage</span>
            <p>{formatPercentage(vendor.discountPercentage)}</p>
          </div>

          <div>
            <span>Rebate Percentage</span>
            <p>{formatPercentage(vendor.rebatePercentage)}</p>
          </div>

          <div>
            <span>Deal Registration</span>
            <p>{formatAvailability(vendor.dealRegistrationAvailable)}</p>
          </div>

          <div>
            <span>SPIFF Availability</span>
            <p>{formatAvailability(vendor.spiffAvailable)}</p>
          </div>

          <div className="vendor-partnership__full">
            <span>Deal Registration Conditions</span>
            <p>{vendor.dealRegistrationConditions || "Not specified"}</p>
          </div>
        </div>
      )}
    </section>
  );
}
