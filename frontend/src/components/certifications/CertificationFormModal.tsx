import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import type {
  CertificationDto,
  CertificationFormValues,
  CertificationPersonLookupDto,
  CertificationStatus,
  CertificationVendorDto,
} from "../../types/certifications";

import { formatCertificationStatus } from "../../utils/certificationAnalytics";

import { searchCertificationPeople } from "../../api/certificationsApi";

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
  personEmail?: string;
  managerName?: string;
  managerEmail?: string;
  certificationName?: string;
  vendorId?: string;
  expiryDate?: string;
}

const createStatuses: CertificationStatus[] = [
  "Complete",
  "InProgress",
  "Pending",
  "Tbd",
  "Expired",
];

const editStatuses: CertificationStatus[] = [...createStatuses, "Archived"];

function createEmptyForm(): CertificationFormValues {
  return {
    certificationPersonId: "",
    personApplicationUserId: "",

    personName: "",
    personEmail: "",

    managerCertificationPersonId: "",
    managerApplicationUserId: "",
    managerName: "",
    managerEmail: "",

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
    certificationPersonId: certification.certificationPersonId ?? "",

    personApplicationUserId: certification.personApplicationUserId ?? "",

    personName: certification.personName,

    personEmail: certification.personEmail ?? "",

    managerCertificationPersonId:
      certification.managerCertificationPersonId ?? "",

    managerApplicationUserId: certification.managerApplicationUserId ?? "",

    managerName: certification.managerName ?? "",

    managerEmail: certification.managerEmail ?? "",

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

  const [personMatches, setPersonMatches] = useState<
    CertificationPersonLookupDto[]
  >([]);

  const [managerMatches, setManagerMatches] = useState<
    CertificationPersonLookupDto[]
  >([]);

  const [personLookupLoading, setPersonLookupLoading] = useState(false);

  const [managerLookupLoading, setManagerLookupLoading] = useState(false);

  const [personDropdownOpen, setPersonDropdownOpen] = useState(false);

  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);

  // =========================================================
  // PERSON LOOKUP
  // =========================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const query = values.personName.trim();

    if (
      query.length < 2 ||
      values.certificationPersonId ||
      values.personApplicationUserId
    ) {
      setPersonMatches([]);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setPersonLookupLoading(true);

      try {
        const matches = await searchCertificationPeople(
          query,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setPersonMatches(matches);

          setPersonDropdownOpen(true);
        }
      } catch {
        if (!controller.signal.aborted) {
          setPersonMatches([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setPersonLookupLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);

      controller.abort();
    };
  }, [
    isOpen,
    values.personName,
    values.certificationPersonId,
    values.personApplicationUserId,
  ]);

  // =========================================================
  // MANAGER LOOKUP
  // =========================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const query = values.managerName.trim();

    if (
      query.length < 2 ||
      values.managerCertificationPersonId ||
      values.managerApplicationUserId
    ) {
      setManagerMatches([]);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setManagerLookupLoading(true);

      try {
        const matches = await searchCertificationPeople(
          query,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setManagerMatches(matches);

          setManagerDropdownOpen(true);
        }
      } catch {
        if (!controller.signal.aborted) {
          setManagerMatches([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setManagerLookupLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);

      controller.abort();
    };
  }, [
    isOpen,
    values.managerName,
    values.managerCertificationPersonId,
    values.managerApplicationUserId,
  ]);

  // =========================================================
  // OPEN / RESET
  // =========================================================

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

    setPersonMatches([]);
    setManagerMatches([]);

    setPersonDropdownOpen(false);
    setManagerDropdownOpen(false);
  }, [certification, isOpen, vendors]);

  // =========================================================
  // ESCAPE / BODY SCROLL
  // =========================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        /*
         * Close lookup menus first.
         */
        if (personDropdownOpen || managerDropdownOpen) {
          setPersonDropdownOpen(false);

          setManagerDropdownOpen(false);

          return;
        }

        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = "";
    };
  }, [isOpen, isSaving, managerDropdownOpen, onClose, personDropdownOpen]);

  if (!isOpen) {
    return null;
  }

  const availableStatuses = certification ? editStatuses : createStatuses;

  // =========================================================
  // GENERIC FIELD UPDATE
  // =========================================================

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

  // =========================================================
  // SELECT PERSON
  // =========================================================

  function selectPerson(person: CertificationPersonLookupDto) {
    setValues((current) => ({
      ...current,

      certificationPersonId: person.certificationPersonId ?? "",

      personApplicationUserId: person.applicationUserId ?? "",

      personName: person.name,

      personEmail: person.email ?? "",

      managerCertificationPersonId: person.managerCertificationPersonId ?? "",

      managerApplicationUserId: person.managerApplicationUserId ?? "",

      managerName: person.managerName ?? "",

      managerEmail: person.managerEmail ?? "",
    }));

    setPersonMatches([]);
    setPersonDropdownOpen(false);

    setManagerMatches([]);
    setManagerDropdownOpen(false);

    setErrors((current) => ({
      ...current,
      personName: undefined,
      personEmail: undefined,
      managerName: undefined,
      managerEmail: undefined,
    }));
  }

  // =========================================================
  // SELECT MANAGER
  // =========================================================

  function selectManager(manager: CertificationPersonLookupDto) {
    /*
     * Prevent accidentally selecting
     * the person themselves as manager.
     */
    const sameApplicationUser = Boolean(
      values.personApplicationUserId &&
      manager.applicationUserId &&
      values.personApplicationUserId === manager.applicationUserId,
    );

    const sameDirectoryPerson = Boolean(
      values.certificationPersonId &&
      manager.certificationPersonId &&
      values.certificationPersonId === manager.certificationPersonId,
    );

    if (sameApplicationUser || sameDirectoryPerson) {
      setErrors((current) => ({
        ...current,
        managerName: "A person cannot be their own manager.",
      }));

      return;
    }

    setValues((current) => ({
      ...current,

      managerCertificationPersonId: manager.certificationPersonId ?? "",

      managerApplicationUserId: manager.applicationUserId ?? "",

      managerName: manager.name,

      managerEmail: manager.email ?? "",
    }));

    setManagerMatches([]);
    setManagerDropdownOpen(false);

    setErrors((current) => ({
      ...current,
      managerName: undefined,
      managerEmail: undefined,
    }));
  }

  // =========================================================
  // PERSON INPUT
  // =========================================================

  function handlePersonNameChange(value: string) {
    /*
     * If an existing person was selected and
     * the admin starts typing again, detach
     * from that selection and treat the value
     * as a new/manual lookup.
     */
    setValues((current) => ({
      ...current,

      certificationPersonId: "",

      personApplicationUserId: "",

      personName: value,

      personEmail: "",

      managerCertificationPersonId: "",

      managerApplicationUserId: "",

      managerName: "",

      managerEmail: "",
    }));

    setPersonDropdownOpen(true);

    setManagerMatches([]);

    setErrors((current) => ({
      ...current,
      personName: undefined,
      personEmail: undefined,
      managerName: undefined,
      managerEmail: undefined,
    }));
  }

  // =========================================================
  // MANAGER INPUT
  // =========================================================

  function handleManagerNameChange(value: string) {
    setValues((current) => ({
      ...current,

      managerCertificationPersonId: "",

      managerApplicationUserId: "",

      managerName: value,

      managerEmail: "",
    }));

    setManagerDropdownOpen(true);

    setErrors((current) => ({
      ...current,
      managerName: undefined,
      managerEmail: undefined,
    }));
  }

  // =========================================================
  // VALIDATION
  // =========================================================

  function validateForm(): boolean {
    const nextErrors: CertificationFormErrors = {};

    if (values.personName.trim().length < 2) {
      nextErrors.personName =
        "Enter a person name with at least two characters.";
    }

    if (values.personEmail && !isValidEmail(values.personEmail)) {
      nextErrors.personEmail = "Enter a valid email address.";
    }

    if (values.managerName.trim().length === 1) {
      nextErrors.managerName =
        "Enter a manager name with at least two characters.";
    }

    if (values.managerEmail && !isValidEmail(values.managerEmail)) {
      nextErrors.managerEmail = "Enter a valid manager email address.";
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

    const sameApplicationUser = Boolean(
      values.personApplicationUserId &&
      values.managerApplicationUserId &&
      values.personApplicationUserId === values.managerApplicationUserId,
    );

    const sameDirectoryPerson = Boolean(
      values.certificationPersonId &&
      values.managerCertificationPersonId &&
      values.certificationPersonId === values.managerCertificationPersonId,
    );

    if (sameApplicationUser || sameDirectoryPerson) {
      nextErrors.managerName = "A person cannot be their own manager.";
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

  // =========================================================
  // RENDER
  // =========================================================

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

          {/* =================================================
              PERSON
             ================================================= */}

          <section className="certification-person-section">
            <div className="certification-form__grid">
              <div className="form-field">
                <label htmlFor="cert-person">Person name</label>

                <div className="certification-person-autocomplete">
                  <input
                    id="cert-person"
                    type="text"
                    maxLength={200}
                    value={values.personName}
                    placeholder="Start typing a person's name..."
                    autoFocus
                    autoComplete="off"
                    aria-invalid={Boolean(errors.personName)}
                    onFocus={() => setPersonDropdownOpen(true)}
                    onChange={(event) =>
                      handlePersonNameChange(event.target.value)
                    }
                    onBlur={() => {
                      window.setTimeout(
                        () => setPersonDropdownOpen(false),
                        150,
                      );
                    }}
                  />

                  {personLookupLoading && (
                    <span className="certification-person-autocomplete__loading">
                      Searching...
                    </span>
                  )}

                  {personDropdownOpen && personMatches.length > 0 && (
                    <div className="certification-person-autocomplete__menu">
                      {personMatches.map((person) => (
                        <button
                          key={
                            person.certificationPersonId ??
                            person.applicationUserId ??
                            `${person.name}-${person.email ?? ""}`
                          }
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectPerson(person)}
                        >
                          <strong>{person.name}</strong>

                          {person.email && <span>{person.email}</span>}

                          {person.managerName && (
                            <small>Manager: {person.managerName}</small>
                          )}

                          {person.isApplicationUser && (
                            <small className="certification-person-autocomplete__source">
                              Existing platform user
                            </small>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {errors.personName && (
                  <span className="form-field__error">{errors.personName}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="cert-person-email">Email</label>

                <input
                  id="cert-person-email"
                  type="email"
                  maxLength={320}
                  value={values.personEmail}
                  placeholder="name@company.com"
                  readOnly={Boolean(values.personApplicationUserId)}
                  aria-invalid={Boolean(errors.personEmail)}
                  onChange={(event) =>
                    updateField("personEmail", event.target.value)
                  }
                />

                {values.personApplicationUserId && (
                  <span className="form-field__hint">
                    Loaded from the user's application profile.
                  </span>
                )}

                {errors.personEmail && (
                  <span className="form-field__error">
                    {errors.personEmail}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* =================================================
              MANAGER
             ================================================= */}

          <section className="certification-person-section">
            <div className="certification-form__grid">
              <div className="form-field">
                <label htmlFor="cert-manager">Manager name</label>

                <div className="certification-person-autocomplete">
                  <input
                    id="cert-manager"
                    type="text"
                    maxLength={200}
                    value={values.managerName}
                    placeholder="Start typing a manager name..."
                    autoComplete="off"
                    readOnly={Boolean(
                      values.personApplicationUserId &&
                      values.managerApplicationUserId,
                    )}
                    aria-invalid={Boolean(errors.managerName)}
                    onFocus={() => setManagerDropdownOpen(true)}
                    onChange={(event) =>
                      handleManagerNameChange(event.target.value)
                    }
                    onBlur={() => {
                      window.setTimeout(
                        () => setManagerDropdownOpen(false),
                        150,
                      );
                    }}
                  />

                  {managerLookupLoading && (
                    <span className="certification-person-autocomplete__loading">
                      Searching...
                    </span>
                  )}

                  {managerDropdownOpen && managerMatches.length > 0 && (
                    <div className="certification-person-autocomplete__menu">
                      {managerMatches.map((manager) => (
                        <button
                          key={
                            manager.certificationPersonId ??
                            manager.applicationUserId ??
                            `${manager.name}-${manager.email ?? ""}`
                          }
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectManager(manager)}
                        >
                          <strong>{manager.name}</strong>

                          {manager.email && <span>{manager.email}</span>}

                          {manager.isApplicationUser && (
                            <small className="certification-person-autocomplete__source">
                              Existing platform user
                            </small>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {values.personApplicationUserId &&
                  values.managerApplicationUserId && (
                    <span className="form-field__hint">
                      Loaded from the user's application profile.
                    </span>
                  )}

                {errors.managerName && (
                  <span className="form-field__error">
                    {errors.managerName}
                  </span>
                )}
              </div>

              {!values.managerApplicationUserId && (
                <div className="form-field">
                  <label htmlFor="cert-manager-email">Manager email</label>

                  <input
                    id="cert-manager-email"
                    type="email"
                    maxLength={320}
                    value={values.managerEmail}
                    placeholder="Optional for a new manager"
                    aria-invalid={Boolean(errors.managerEmail)}
                    onChange={(event) =>
                      updateField("managerEmail", event.target.value)
                    }
                  />

                  {errors.managerEmail && (
                    <span className="form-field__error">
                      {errors.managerEmail}
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              CERTIFICATION BASICS
             ================================================= */}

          <div className="certification-form__grid">
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

            <div className="form-field">
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
          </div>

          {/* =================================================
              STATUS / DATES
             ================================================= */}

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
                {availableStatuses.map((status) => (
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

          {/* =================================================
              PRACTICE / REBATE
             ================================================= */}

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

          {/* =================================================
              NOTES
             ================================================= */}

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

// =========================================================
// EMAIL VALIDATION
// =========================================================

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
