import { BadgeDollarSign, CalendarDays, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { CertificationVendorDto } from "../../types/certifications";
import {
  rebateStatuses,
  type RebateDto,
  type RebateFormValues,
  type RebateRequest,
} from "../../types/rebates";

interface RebateFormModalProps {
  isOpen: boolean;
  rebate: RebateDto | null;
  vendors: CertificationVendorDto[];
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (request: RebateRequest) => Promise<void>;
}

const emptyForm: RebateFormValues = {
  title: "",
  programName: "",
  description: "",
  status: "Draft",
  estimatedAmount: "",
  actualAmount: "",
  startDate: "",
  dueDate: "",
  completedDate: "",
  ownerName: "",
  ownerEmail: "",
  notes: "",
  vendorId: "",
};

function rebateToForm(rebate: RebateDto): RebateFormValues {
  return {
    title: rebate.title,
    programName: rebate.programName ?? "",
    description: rebate.description ?? "",
    status: rebate.status,
    estimatedAmount: rebate.estimatedAmount?.toString() ?? "",
    actualAmount: rebate.actualAmount?.toString() ?? "",
    startDate: rebate.startDate ?? "",
    dueDate: rebate.dueDate ?? "",
    completedDate: rebate.completedDate ?? "",
    ownerName: rebate.ownerName ?? "",
    ownerEmail: rebate.ownerEmail ?? "",
    notes: rebate.notes ?? "",
    vendorId: rebate.vendorId,
  };
}

function optionalText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function optionalAmount(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  return Number(value);
}

export default function RebateFormModal({
  isOpen,
  rebate,
  vendors,
  isSaving,
  error,
  onClose,
  onSubmit,
}: RebateFormModalProps) {
  const [form, setForm] = useState<RebateFormValues>(emptyForm);

  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditing = rebate !== null;

  const activeVendors = useMemo(
    () =>
      vendors
        .filter((vendor) => vendor.isActive || vendor.id === form.vendorId)
        .slice()
        .sort((first, second) => first.name.localeCompare(second.name)),
    [vendors, form.vendorId],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(rebate ? rebateToForm(rebate) : { ...emptyForm });

    setValidationError(null);
  }, [isOpen, rebate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) {
    return null;
  }

  function updateField<K extends keyof RebateFormValues>(
    field: K,
    value: RebateFormValues[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setValidationError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      setValidationError("Rebate title is required.");
      return;
    }

    if (!form.vendorId) {
      setValidationError("Please select a vendor.");
      return;
    }

    const estimatedAmount = optionalAmount(form.estimatedAmount);

    const actualAmount = optionalAmount(form.actualAmount);

    if (
      estimatedAmount !== null &&
      (!Number.isFinite(estimatedAmount) || estimatedAmount < 0)
    ) {
      setValidationError("Estimated amount must be zero or greater.");
      return;
    }

    if (
      actualAmount !== null &&
      (!Number.isFinite(actualAmount) || actualAmount < 0)
    ) {
      setValidationError("Actual amount must be zero or greater.");
      return;
    }

    if (form.startDate && form.dueDate && form.dueDate < form.startDate) {
      setValidationError("Due date cannot be before the start date.");
      return;
    }

    if (
      form.ownerEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail.trim())
    ) {
      setValidationError("Enter a valid owner email address.");
      return;
    }

    const request: RebateRequest = {
      title,
      programName: optionalText(form.programName),
      description: optionalText(form.description),
      status: form.status,
      estimatedAmount,
      actualAmount,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      completedDate: form.completedDate || null,
      ownerName: optionalText(form.ownerName),
      ownerEmail: optionalText(form.ownerEmail),
      notes: optionalText(form.notes),
      vendorId: form.vendorId,
    };

    await onSubmit(request);
  }

  return (
    <div
      className="rebate-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <section
        className="rebate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rebate-form-title"
      >
        <header className="rebate-modal__header">
          <div className="rebate-modal__heading">
            <span className="rebate-modal__icon">
              <BadgeDollarSign size={20} aria-hidden="true" />
            </span>

            <div>
              <h2 id="rebate-form-title">
                {isEditing ? "Edit Rebate" : "Add Rebate"}
              </h2>

              <p>
                {isEditing
                  ? "Update the rebate record and tracking information."
                  : "Create a new vendor rebate record."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="rebate-modal__close"
            aria-label="Close"
            disabled={isSaving}
            onClick={onClose}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <form className="rebate-form" onSubmit={handleSubmit}>
          <div className="rebate-form__body">
            {(validationError || error) && (
              <div className="rebates-alert rebates-alert--error" role="alert">
                {validationError || error}
              </div>
            )}

            <section className="rebate-form__section">
              <div className="rebate-form__section-heading">
                <h3>Rebate Information</h3>

                <p>Basic program and vendor details.</p>
              </div>

              <div className="rebate-form__grid">
                <label className="rebate-form__field rebate-form__field--wide">
                  <span>
                    Rebate Title
                    <strong> *</strong>
                  </span>

                  <input
                    value={form.title}
                    maxLength={300}
                    placeholder="e.g. FY26 Growth Incentive"
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                  />
                </label>

                <label className="rebate-form__field">
                  <span>
                    Vendor
                    <strong> *</strong>
                  </span>

                  <select
                    value={form.vendorId}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField("vendorId", event.target.value)
                    }
                  >
                    <option value="">Select vendor</option>

                    {activeVendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rebate-form__field">
                  <span>Program Name</span>

                  <input
                    value={form.programName}
                    maxLength={300}
                    placeholder="Optional program name"
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField("programName", event.target.value)
                    }
                  />
                </label>

                <label className="rebate-form__field">
                  <span>Status</span>

                  <select
                    value={form.status}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value as RebateFormValues["status"],
                      )
                    }
                  >
                    {rebateStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rebate-form__field rebate-form__field--wide">
                  <span>Description</span>

                  <textarea
                    value={form.description}
                    maxLength={3000}
                    rows={3}
                    placeholder="Optional description or rebate criteria"
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                  />
                </label>
              </div>
            </section>

            <section className="rebate-form__section">
              <div className="rebate-form__section-heading">
                <h3>Value</h3>

                <p>Track estimated and realized rebate value.</p>
              </div>

              <div className="rebate-form__grid">
                <label className="rebate-form__field">
                  <span>Estimated Amount</span>

                  <div className="rebate-form__money">
                    <span>$</span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={form.estimatedAmount}
                      placeholder="0.00"
                      disabled={isSaving}
                      onChange={(event) =>
                        updateField("estimatedAmount", event.target.value)
                      }
                    />
                  </div>
                </label>

                <label className="rebate-form__field">
                  <span>Actual Amount</span>

                  <div className="rebate-form__money">
                    <span>$</span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={form.actualAmount}
                      placeholder="0.00"
                      disabled={isSaving}
                      onChange={(event) =>
                        updateField("actualAmount", event.target.value)
                      }
                    />
                  </div>
                </label>
              </div>
            </section>

            <section className="rebate-form__section">
              <div className="rebate-form__section-heading">
                <div className="rebate-form__section-title">
                  <CalendarDays size={16} aria-hidden="true" />

                  <h3>Timeline</h3>
                </div>

                <p>Important rebate tracking dates.</p>
              </div>

              <div className="rebate-form__grid rebate-form__grid--three">
                <label className="rebate-form__field">
                  <span>Start Date</span>

                  <input
                    type="date"
                    value={form.startDate}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField("startDate", event.target.value)
                    }
                  />
                </label>

                <label className="rebate-form__field">
                  <span>Due Date</span>

                  <input
                    type="date"
                    value={form.dueDate}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField("dueDate", event.target.value)
                    }
                  />
                </label>

                <label className="rebate-form__field">
                  <span>Completed Date</span>

                  <input
                    type="date"
                    value={form.completedDate}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField("completedDate", event.target.value)
                    }
                  />
                </label>
              </div>
            </section>

            <section className="rebate-form__section">
              <div className="rebate-form__section-heading">
                <h3>Ownership</h3>

                <p>Internal ownership and supporting notes.</p>
              </div>

              <div className="rebate-form__grid">
                <label className="rebate-form__field">
                  <span>Owner Name</span>

                  <input
                    value={form.ownerName}
                    maxLength={200}
                    placeholder="Optional owner"
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField("ownerName", event.target.value)
                    }
                  />
                </label>

                <label className="rebate-form__field">
                  <span>Owner Email</span>

                  <input
                    type="email"
                    value={form.ownerEmail}
                    maxLength={250}
                    placeholder="name@onx.com"
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField("ownerEmail", event.target.value)
                    }
                  />
                </label>

                <label className="rebate-form__field rebate-form__field--wide">
                  <span>Notes</span>

                  <textarea
                    value={form.notes}
                    maxLength={3000}
                    rows={3}
                    placeholder="Optional internal notes"
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField("notes", event.target.value)
                    }
                  />
                </label>
              </div>
            </section>
          </div>

          <footer className="rebate-modal__footer">
            <button
              type="button"
              className="rebate-form__cancel"
              disabled={isSaving}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rebate-form__save"
              disabled={isSaving}
            >
              <Save size={16} aria-hidden="true" />

              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Rebate"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
