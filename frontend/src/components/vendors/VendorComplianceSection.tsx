import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";

import {
  getVendorComplianceRequirements,
  createVendorComplianceRequirement,
  updateVendorComplianceRequirement,
  VENDOR_COMPLIANCE_REQUIREMENT_TYPES,
} from "../../api/vendorComplianceApi";

import type {
  VendorComplianceRequirementDto,
  VendorComplianceRequirementInput,
  VendorComplianceRequirementType,
} from "../../api/vendorComplianceApi";

interface VendorComplianceSectionProps {
  vendorId: string;
  canManageVendors: boolean;
}

interface ComplianceForm {
  name: string;
  requirementType: VendorComplianceRequirementType;
  targetValue: string;
  actualValue: string;
  unit: string;
  periodStart: string;
  periodEnd: string;
  notes: string;
}

function emptyForm(): ComplianceForm {
  const year = new Date().getFullYear();

  return {
    name: "",
    requirementType: "Sales",
    targetValue: "",
    actualValue: "",
    unit: "",
    periodStart: `${year}-01-01`,
    periodEnd: `${year}-12-31`,
    notes: "",
  };
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-CA", {
    maximumFractionDigits: 2,
  });
}

function getTypeLabel(value: VendorComplianceRequirementType): string {
  return (
    VENDOR_COMPLIANCE_REQUIREMENT_TYPES.find((item) => item.value === value)
      ?.label ?? value
  );
}

function sortRequirements(
  requirements: VendorComplianceRequirementDto[],
): VendorComplianceRequirementDto[] {
  return [...requirements].sort(
    (a, b) =>
      b.periodStart.localeCompare(a.periodStart) ||
      getTypeLabel(a.requirementType).localeCompare(
        getTypeLabel(b.requirementType),
      ) ||
      a.name.localeCompare(b.name),
  );
}

function getAchievementStatus(value: number | null): string {
  if (value === null) return "Not reported";
  if (value >= 100) return "Target met";
  return "Below target";
}

function getAchievementColor(value: number | null): string {
  if (value === null) return "#94a3b8";
  if (value >= 100) return "#15803d";
  return "#64748b";
}

export default function VendorComplianceSection({
  vendorId,
  canManageVendors,
}: VendorComplianceSectionProps) {
  const [requirements, setRequirements] = useState<
    VendorComplianceRequirementDto[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ComplianceForm>(emptyForm);

  useEffect(() => {
    if (!canManageVendors) return;

    const controller = new AbortController();

    async function loadRequirements() {
      setLoading(true);
      setLoadError("");
      setRequirements([]);

      try {
        const data = await getVendorComplianceRequirements(
          vendorId,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setRequirements(sortRequirements(data));
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoadError("Unable to load vendor compliance requirements.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadRequirements();

    return () => controller.abort();
  }, [vendorId, canManageVendors]);

  function updateField<K extends keyof ComplianceForm>(
    field: K,
    value: ComplianceForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function handleAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setEditing(true);
  }

  function handleEdit(requirement: VendorComplianceRequirementDto) {
    setEditingId(requirement.id);

    setForm({
      name: requirement.name,
      requirementType: requirement.requirementType,
      targetValue: String(requirement.targetValue),
      actualValue:
        requirement.actualValue === null ? "" : String(requirement.actualValue),
      unit: requirement.unit,
      periodStart: requirement.periodStart,
      periodEnd: requirement.periodEnd,
      notes: requirement.notes ?? "",
    });

    setError("");
    setEditing(true);
  }

  function handleCancel() {
    if (saving) return;

    setEditing(false);
    setEditingId(null);
    setError("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageVendors || saving) return;

    setError("");

    const name = form.name.trim();
    const unit = form.unit.trim();
    const notes = form.notes.trim();

    const targetValue = Number(form.targetValue);

    const actualValue =
      form.actualValue.trim() === "" ? null : Number(form.actualValue);

    const decimalPattern = /^\d+(?:\.\d{1,2})?$/;

    if (!name || name.length > 200) {
      setError("Requirement name must be between 1 and 200 characters.");
      return;
    }

    if (
      !decimalPattern.test(form.targetValue) ||
      !Number.isFinite(targetValue) ||
      targetValue <= 0 ||
      targetValue > 99999999999999.99
    ) {
      setError(
        "Target value must be greater than zero and contain no more than two decimal places.",
      );
      return;
    }

    if (
      actualValue !== null &&
      (!decimalPattern.test(form.actualValue) ||
        !Number.isFinite(actualValue) ||
        actualValue < 0 ||
        actualValue > 99999999999999.99)
    ) {
      setError(
        "Actual value must be zero or greater and contain no more than two decimal places.",
      );
      return;
    }

    if (!unit || unit.length > 50) {
      setError("Unit must be between 1 and 50 characters.");
      return;
    }

    if (!form.periodStart || !form.periodEnd) {
      setError("Both reporting period dates are required.");
      return;
    }

    if (form.periodEnd < form.periodStart) {
      setError("Period end cannot be earlier than period start.");
      return;
    }

    if (notes.length > 10000) {
      setError("Notes cannot exceed 10,000 characters.");
      return;
    }

    const input: VendorComplianceRequirementInput = {
      name,
      requirementType: form.requirementType,
      targetValue,
      actualValue,
      unit,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      notes: notes || null,
    };

    setSaving(true);

    try {
      const savedRequirement = editingId
        ? await updateVendorComplianceRequirement(vendorId, editingId, input)
        : await createVendorComplianceRequirement(vendorId, input);

      setRequirements((current) =>
        sortRequirements([
          ...current.filter((item) => item.id !== savedRequirement.id),
          savedRequirement,
        ]),
      );

      setEditing(false);
      setEditingId(null);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const status = requestError.response?.status;

        if (status === 403) {
          setError(
            "You do not have permission to manage compliance requirements.",
          );
        } else if (status === 400) {
          const validationErrors = requestError.response?.data?.errors;

          if (validationErrors && typeof validationErrors === "object") {
            setError(Object.values(validationErrors).flat().join(" "));
          } else {
            setError("Please check the requirement details and try again.");
          }
        } else if (status === 404) {
          setError("The vendor or compliance requirement could not be found.");
        } else {
          setError(
            "Unable to save the compliance requirement. Please try again.",
          );
        }
      } else {
        setError("Unable to save the compliance requirement.");
      }
    } finally {
      setSaving(false);
    }
  }

  const targetsMet = requirements.filter(
    (item) =>
      item.achievementPercentage !== null && item.achievementPercentage >= 100,
  ).length;

  const belowTarget = requirements.filter(
    (item) =>
      item.achievementPercentage !== null && item.achievementPercentage < 100,
  ).length;

  const notReported = requirements.filter(
    (item) => item.achievementPercentage === null,
  ).length;

  if (!canManageVendors) return null;

  return (
    <section className="vendor-partnership vendor-compliance">
      <div className="vendor-partnership__header">
        <h4>Vendor Compliance Requirements</h4>

        {!editing && !loading && !loadError && (
          <button type="button" onClick={handleAdd}>
            + Add Requirement
          </button>
        )}
      </div>

      {!loading && !loadError && requirements.length > 0 && (
        <div className="vendor-compliance__summary">
          <div className="vendor-compliance__metric">
            <span>Total Requirements</span>
            <strong>{requirements.length}</strong>
          </div>

          <div className="vendor-compliance__metric">
            <span>Targets Met</span>
            <strong style={{ color: "#15803d" }}>{targetsMet}</strong>
          </div>

          <div className="vendor-compliance__metric">
            <span>Below Target</span>
            <strong>{belowTarget}</strong>
          </div>

          <div className="vendor-compliance__metric">
            <span>Not Reported</span>
            <strong>{notReported}</strong>
          </div>
        </div>
      )}

      {editing && (
        <form
          className="vendor-partnership__form"
          onSubmit={handleSave}
          noValidate
        >
          <h5>
            {editingId
              ? "Edit Compliance Requirement"
              : "New Compliance Requirement"}
          </h5>

          <div className="vendor-partnership__grid">
            <label>
              Requirement Name
              <input
                type="text"
                value={form.name}
                maxLength={200}
                placeholder="e.g. Annual certified engineers target"
                disabled={saving}
                required
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>

            <label>
              Requirement Type
              <select
                value={form.requirementType}
                disabled={saving}
                onChange={(event) =>
                  updateField(
                    "requirementType",
                    event.target.value as VendorComplianceRequirementType,
                  )
                }
              >
                {VENDOR_COMPLIANCE_REQUIREMENT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Target Value
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.targetValue}
                disabled={saving}
                required
                onChange={(event) =>
                  updateField("targetValue", event.target.value)
                }
              />
            </label>

            <label>
              Actual Value (Optional)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.actualValue}
                placeholder="Not reported"
                disabled={saving}
                onChange={(event) =>
                  updateField("actualValue", event.target.value)
                }
              />
            </label>

            <label>
              Unit
              <input
                type="text"
                value={form.unit}
                maxLength={50}
                placeholder="e.g. CAD, Engineers, Certifications"
                disabled={saving}
                required
                onChange={(event) => updateField("unit", event.target.value)}
              />
            </label>

            <label>
              Period Start
              <input
                type="date"
                value={form.periodStart}
                disabled={saving}
                required
                onChange={(event) =>
                  updateField("periodStart", event.target.value)
                }
              />
            </label>

            <label>
              Period End
              <input
                type="date"
                value={form.periodEnd}
                disabled={saving}
                required
                onChange={(event) =>
                  updateField("periodEnd", event.target.value)
                }
              />
            </label>

            <label className="vendor-partnership__full">
              Notes (Optional)
              <textarea
                value={form.notes}
                rows={4}
                maxLength={10000}
                disabled={saving}
                placeholder="Additional compliance details or supporting information..."
                onChange={(event) => updateField("notes", event.target.value)}
              />
            </label>
          </div>

          {error && <p role="alert">{error}</p>}

          <div className="vendor-partnership__actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Requirement"}
            </button>

            <button type="button" disabled={saving} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p>Loading compliance requirements...</p>}

      {loadError && <p role="alert">{loadError}</p>}

      {!loading && !loadError && requirements.length === 0 && (
        <p className="vendor-activities__empty">
          No compliance requirements recorded for this vendor yet.
        </p>
      )}

      {!loading && !loadError && requirements.length > 0 && (
        <div className="vendor-activities__list">
          {requirements.map((requirement) => {
            const percentage = requirement.achievementPercentage;

            const color = getAchievementColor(percentage);

            return (
              <article key={requirement.id} className="vendor-activities__item">
                <div className="vendor-activities__item-header">
                  <div>
                    <span className="vendor-activities__date">
                      {getTypeLabel(requirement.requirementType)}
                    </span>

                    <h5>{requirement.name}</h5>
                  </div>

                  {!editing && (
                    <button
                      type="button"
                      className="vendor-activities__edit"
                      onClick={() => handleEdit(requirement)}
                    >
                      Edit
                    </button>
                  )}
                </div>

                <p className="vendor-compliance__period">
                  Reporting period: {formatDate(requirement.periodStart)}
                  {" – "}
                  {formatDate(requirement.periodEnd)}
                </p>

                <div className="vendor-compliance__values">
                  <div>
                    <span>Target</span>
                    <strong>
                      {formatNumber(requirement.targetValue)} {requirement.unit}
                    </strong>
                  </div>

                  <div>
                    <span>Actual</span>
                    <strong>
                      {requirement.actualValue === null
                        ? "Not reported"
                        : `${formatNumber(
                            requirement.actualValue,
                          )} ${requirement.unit}`}
                    </strong>
                  </div>

                  <div>
                    <span>Achievement</span>
                    <strong style={{ color }}>
                      {percentage === null
                        ? "—"
                        : `${formatNumber(percentage)}%`}
                    </strong>
                  </div>
                </div>

                <div className="vendor-compliance__progress">
                  <div
                    className="vendor-compliance__progress-track"
                    role="progressbar"
                    aria-label={`${requirement.name} achievement`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={
                      percentage === null
                        ? undefined
                        : Math.min(percentage, 100)
                    }
                    aria-valuetext={
                      percentage === null ? "Not reported" : `${percentage}%`
                    }
                  >
                    <div
                      className="vendor-compliance__progress-fill"
                      style={{
                        width: `${Math.min(
                          Math.max(percentage ?? 0, 0),
                          100,
                        )}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>

                  <span style={{ color }}>
                    {getAchievementStatus(percentage)}
                  </span>
                </div>

                {requirement.notes && (
                  <p className="vendor-activities__notes">
                    {requirement.notes}
                  </p>
                )}

                <div className="vendor-activities__metadata">
                  <span>
                    Last updated:{" "}
                    {new Date(requirement.updatedAtUtc).toLocaleString("en-CA")}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
