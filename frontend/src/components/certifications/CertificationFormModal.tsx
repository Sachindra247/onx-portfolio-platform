import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import type {
  CertificationDto,
  CertificationFormValues,
  CertificationStatus,
  CertificationVendorDto,
} from "../../types/certifications";

import { formatCertificationStatus } from "../../utils/certificationAnalytics";

interface CertificationFormModalProps {
  isOpen: boolean;
  certification: CertificationDto | null;
  vendors: CertificationVendorDto[];
  isSaving: boolean;
  serverError: string | null;
  onClose: () => void;
  onSubmit: (values: CertificationFormValues) => Promise<void>;
}

interface CertificationFormErrors {
  personName?: string;
  certificationName?: string;
  vendorId?: string;
  expiryDate?: string;
}

const statuses: CertificationStatus[] = [
  "Complete",
  "InProgress",
  "Pending",
  "Tbd",
  "Expired",
];

function createEmptyForm(): CertificationFormValues {
  return {
    personName: "",
    certificationName: "",
    status: "Complete",
    dateCompleted: "",
    expiryDate: "",
    practiceLead: "",
    rebateImpact: "",
    notes: "",
    vendorId: "",
  };
}

function mapCertificationToForm(
  certification: CertificationDto,
): CertificationFormValues {
  return {
    personName: certification.personName,
    certificationName: certification.certificationName,
    status: certification.status,
    dateCompleted: certification.dateCompleted ?? "",
    expiryDate: certification.expiryDate ?? "",
    practiceLead: certification.practiceLead ?? "",
    rebateImpact: certification.rebateImpact ?? "",
    notes: certification.notes ?? "",
    vendorId: certification.vendorId,
  };
}

export default function CertificationFormModal({
  isOpen,
  certification,
  vendors,
  isSaving,
  serverError,
  onClose,
  onSubmit,
}: CertificationFormModalProps) {
  const [values, setValues] =
    useState<CertificationFormValues>(createEmptyForm);

  const [errors, setErrors] = useState<CertificationFormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(
      certification
        ? mapCertificationToForm(certification)
        : {
            ...createEmptyForm(),
            vendorId: vendors[0]?.id ?? "",
          },
    );

    setErrors({});
  }, [certification, isOpen, vendors]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = "";
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) {
    return null;
  }

  function updateField<Key extends keyof CertificationFormValues>(
    field: Key,
    value: CertificationFormValues[Key],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  }

  function validateForm(): boolean {
    const nextErrors: CertificationFormErrors = {};

    if (values.personName.trim().length < 2) {
      nextErrors.personName =
        "Enter a person name with at least two characters.";
    }

    if (values.certificationName.trim().length < 2) {
      nextErrors.certificationName =
        "Enter a certification name with at least two characters.";
    }

    if (!values.vendorId) {
      nextErrors.vendorId = "Select a vendor.";
    }

    if (
      values.dateCompleted &&
      values.expiryDate &&
      values.expiryDate < values.dateCompleted
    ) {
      nextErrors.expiryDate =
        "Expiry date cannot be earlier than the completion date.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(values);
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <section
        className="certification-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="certification-modal-title"
      >
        <header className="certification-form-modal__header">
          <div>
            <p>
              {certification
                ? "Update certification record"
                : "New certification record"}
            </p>

            <h2 id="certification-modal-title">
              {certification ? "Edit Certification" : "Add Certification"}
            </h2>
          </div>

          <button
            type="button"
            className="certification-form-modal__close"
            aria-label="Close certification form"
            disabled={isSaving}
            onClick={onClose}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <form className="certification-form" onSubmit={handleSubmit}>
          {serverError && (
            <div className="form-server-error" role="alert">
              {serverError}
            </div>
          )}

          <div className="certification-form__grid">
            <div className="form-field">
              <label htmlFor="cert-person">Person name</label>

              <input
                id="cert-person"
                type="text"
                maxLength={200}
                value={values.personName}
                placeholder="Example: Stuart Foster"
                autoFocus
                aria-invalid={Boolean(errors.personName)}
                onChange={(event) =>
                  updateField("personName", event.target.value)
                }
              />

              {errors.personName && (
                <span className="form-field__error">{errors.personName}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="cert-vendor">Vendor</label>

              <select
                id="cert-vendor"
                value={values.vendorId}
                aria-invalid={Boolean(errors.vendorId)}
                onChange={(event) =>
                  updateField("vendorId", event.target.value)
                }
              >
                <option value="">Select a vendor</option>

                {vendors.map((vendor) => (
                  <option value={vendor.id} key={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>

              {errors.vendorId && (
                <span className="form-field__error">{errors.vendorId}</span>
              )}
            </div>
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="cert-name">Certification name</label>

            <input
              id="cert-name"
              type="text"
              maxLength={400}
              value={values.certificationName}
              placeholder="Example: MASE Storage V4"
              aria-invalid={Boolean(errors.certificationName)}
              onChange={(event) =>
                updateField("certificationName", event.target.value)
              }
            />

            {errors.certificationName && (
              <span className="form-field__error">
                {errors.certificationName}
              </span>
            )}
          </div>

          <div className="certification-form__grid certification-form__grid--three">
            <div className="form-field">
              <label htmlFor="cert-status">Status</label>

              <select
                id="cert-status"
                value={values.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value as CertificationStatus,
                  )
                }
              >
                {statuses.map((status) => (
                  <option value={status} key={status}>
                    {formatCertificationStatus(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="cert-completed">Date completed</label>

              <input
                id="cert-completed"
                type="date"
                value={values.dateCompleted}
                onChange={(event) =>
                  updateField("dateCompleted", event.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="cert-expiry">Expiry date</label>

              <input
                id="cert-expiry"
                type="date"
                value={values.expiryDate}
                aria-invalid={Boolean(errors.expiryDate)}
                onChange={(event) =>
                  updateField("expiryDate", event.target.value)
                }
              />

              {errors.expiryDate && (
                <span className="form-field__error">{errors.expiryDate}</span>
              )}
            </div>
          </div>

          <div className="certification-form__grid">
            <div className="form-field">
              <label htmlFor="cert-lead">Practice lead</label>

              <input
                id="cert-lead"
                type="text"
                maxLength={300}
                value={values.practiceLead}
                placeholder="Example: Raed Jabak"
                onChange={(event) =>
                  updateField("practiceLead", event.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="cert-rebate">Rebate impact</label>

              <input
                id="cert-rebate"
                type="text"
                maxLength={500}
                value={values.rebateImpact}
                placeholder="Example: 4% GreenLake Flex"
                onChange={(event) =>
                  updateField("rebateImpact", event.target.value)
                }
              />
            </div>
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="cert-notes">Notes</label>

            <textarea
              id="cert-notes"
              rows={5}
              maxLength={3000}
              value={values.notes}
              placeholder="Requirements, deadlines, links, or other notes..."
              onChange={(event) => updateField("notes", event.target.value)}
            />

            <span className="form-field__hint">
              {values.notes.length} / 3000
            </span>
          </div>

          <footer className="certification-form-modal__footer">
            <button
              type="button"
              className="secondary-button"
              disabled={isSaving}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={isSaving || vendors.length === 0}
            >
              {isSaving
                ? "Saving..."
                : certification
                  ? "Save Changes"
                  : "Add Certification"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
