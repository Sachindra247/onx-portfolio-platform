import { Plus, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import {
  eventStages,
  type EventDto,
  type EventFormValues,
  type VendorDto,
} from "../../types/events";

import {
  createEmptyEventForm,
  formatEventStage,
} from "../../utils/eventFormatting";

interface EventFormModalProps {
  isOpen: boolean;
  event: EventDto | null;
  vendors: VendorDto[];

  isSaving: boolean;
  serverError: string | null;

  onClose: () => void;

  onSubmit: (values: EventFormValues) => Promise<void>;

  onCreateVendor: (name: string) => Promise<VendorDto>;
}

interface FormErrors {
  description?: string;
  businessPurpose?: string;
  budgetCad?: string;
  vendorId?: string;
}

function mapEventToForm(event: EventDto): EventFormValues {
  return {
    description: event.description,

    eventDate: event.eventDate ?? "",

    stage: event.stage,

    venue: event.venue ?? "",

    businessPurpose: event.businessPurpose ?? "",

    budgetCad: event.budgetCad.toString(),

    notes: event.notes ?? "",

    vendorId: event.vendorId,
  };
}

export default function EventFormModal({
  isOpen,
  event,
  vendors,
  isSaving,
  serverError,
  onClose,
  onSubmit,
  onCreateVendor,
}: EventFormModalProps) {
  const [values, setValues] = useState<EventFormValues>(createEmptyEventForm);

  const [errors, setErrors] = useState<FormErrors>({});

  const [showVendorCreator, setShowVendorCreator] = useState(false);

  const [newVendorName, setNewVendorName] = useState("");

  const [isCreatingVendor, setIsCreatingVendor] = useState(false);

  const [vendorCreationError, setVendorCreationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(
      event
        ? mapEventToForm(event)
        : {
            ...createEmptyEventForm(),
            vendorId: vendors[0]?.id ?? "",
          },
    );

    setErrors({});
    setShowVendorCreator(false);
    setNewVendorName("");
    setVendorCreationError(null);
  }, [event, isOpen, vendors]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === "Escape" && !isSaving && !isCreatingVendor) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = "";
    };
  }, [isOpen, isSaving, isCreatingVendor, onClose]);

  if (!isOpen) {
    return null;
  }

  function updateField<Key extends keyof EventFormValues>(
    field: Key,
    value: EventFormValues[Key],
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
    const nextErrors: FormErrors = {};

    const parsedBudget = Number(values.budgetCad);

    if (values.description.trim().length < 2) {
      nextErrors.description =
        "Enter an event description with at least two characters.";
    }

    if (!values.vendorId) {
      nextErrors.vendorId = "Select a vendor.";
    }

    if (values.businessPurpose.trim().length < 2) {
      nextErrors.businessPurpose =
        "Enter the business purpose or objective for this event.";
    }

    if (
      values.budgetCad.trim() === "" ||
      !Number.isFinite(parsedBudget) ||
      parsedBudget < 0
    ) {
      nextErrors.budgetCad =
        "Enter a valid budget greater than or equal to zero.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(values);
  }

  async function handleCreateVendor() {
    const name = newVendorName.trim();

    if (name.length < 2) {
      setVendorCreationError("Enter a vendor name.");

      return;
    }

    setIsCreatingVendor(true);

    setVendorCreationError(null);

    try {
      const createdVendor = await onCreateVendor(name);

      updateField("vendorId", createdVendor.id);

      setNewVendorName("");
      setShowVendorCreator(false);
    } catch (error) {
      setVendorCreationError(
        error instanceof Error ? error.message : "Unable to create the vendor.",
      );
    } finally {
      setIsCreatingVendor(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (
          mouseEvent.target === mouseEvent.currentTarget &&
          !isSaving &&
          !isCreatingVendor
        ) {
          onClose();
        }
      }}
    >
      <section
        className="event-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
      >
        <header className="event-modal__header">
          <div>
            <p>{event ? "Update portfolio record" : "New portfolio record"}</p>

            <h2 id="event-modal-title">{event ? "Edit Event" : "Add Event"}</h2>
          </div>

          <button
            className="event-modal__close"
            type="button"
            aria-label="Close event form"
            disabled={isSaving || isCreatingVendor}
            onClick={onClose}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <form className="event-form" onSubmit={handleSubmit}>
          {serverError && (
            <div className="form-server-error" role="alert">
              {serverError}
            </div>
          )}

          <div className="form-field form-field--full">
            <label htmlFor="event-description">Description</label>

            <input
              id="event-description"
              type="text"
              maxLength={300}
              value={values.description}
              placeholder="Example: Cisco Partner Technology Summit"
              aria-invalid={Boolean(errors.description)}
              autoFocus
              onChange={(event) =>
                updateField("description", event.target.value)
              }
            />

            {errors.description && (
              <span className="form-field__error">{errors.description}</span>
            )}
          </div>

          <div className="event-form__grid">
            <div className="form-field">
              <label htmlFor="event-vendor">Vendor</label>

              <select
                id="event-vendor"
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

              <button
                className="event-form__add-vendor"
                type="button"
                onClick={() => setShowVendorCreator((current) => !current)}
              >
                <Plus size={14} aria-hidden="true" />
                Add new vendor
              </button>

              {showVendorCreator && (
                <div className="event-vendor-creator">
                  <input
                    type="text"
                    maxLength={200}
                    value={newVendorName}
                    placeholder="Vendor name"
                    disabled={isCreatingVendor}
                    onChange={(event) => setNewVendorName(event.target.value)}
                  />

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={isCreatingVendor}
                    onClick={() => void handleCreateVendor()}
                  >
                    {isCreatingVendor ? "Adding..." : "Add"}
                  </button>
                </div>
              )}

              {vendorCreationError && (
                <span className="form-field__error">{vendorCreationError}</span>
              )}

              {errors.vendorId && (
                <span className="form-field__error">{errors.vendorId}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="event-stage">Stage</label>

              <select
                id="event-stage"
                value={values.stage}
                onChange={(event) =>
                  updateField(
                    "stage",
                    event.target.value as EventFormValues["stage"],
                  )
                }
              >
                {eventStages.map((stage) => (
                  <option value={stage} key={stage}>
                    {formatEventStage(stage)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="event-date">Event date</label>

              <input
                id="event-date"
                type="date"
                value={values.eventDate}
                onChange={(event) =>
                  updateField("eventDate", event.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="event-venue">Venue</label>

              <input
                id="event-venue"
                type="text"
                maxLength={300}
                value={values.venue}
                placeholder="Example: Toronto Congress Centre"
                onChange={(event) => updateField("venue", event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="event-budget">Budget (CAD)</label>

              <input
                id="event-budget"
                type="number"
                min="0"
                max="999999999.99"
                step="0.01"
                value={values.budgetCad}
                placeholder="0.00"
                aria-invalid={Boolean(errors.budgetCad)}
                onChange={(event) =>
                  updateField("budgetCad", event.target.value)
                }
              />

              {errors.budgetCad && (
                <span className="form-field__error">{errors.budgetCad}</span>
              )}
            </div>
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="event-business-purpose">
              Business purpose / Event objective
            </label>

            <textarea
              id="event-business-purpose"
              maxLength={2000}
              rows={4}
              value={values.businessPurpose}
              placeholder="Describe why the event is being planned and the intended business outcome..."
              aria-invalid={Boolean(errors.businessPurpose)}
              onChange={(event) =>
                updateField("businessPurpose", event.target.value)
              }
            />

            {errors.businessPurpose && (
              <span className="form-field__error">
                {errors.businessPurpose}
              </span>
            )}

            <span className="form-field__hint">
              {values.businessPurpose.length} / 2000
            </span>
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="event-notes">Notes</label>

            <textarea
              id="event-notes"
              maxLength={4000}
              rows={5}
              value={values.notes}
              placeholder="Add planning details or other notes..."
              onChange={(event) => updateField("notes", event.target.value)}
            />

            <span className="form-field__hint">
              {values.notes.length} / 4000
            </span>
          </div>

          <footer className="event-modal__footer">
            <button
              className="secondary-button"
              type="button"
              disabled={isSaving || isCreatingVendor}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              type="submit"
              disabled={isSaving || isCreatingVendor}
            >
              {isSaving ? "Saving..." : event ? "Save changes" : "Add event"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
