import {
  CalendarDays,
  CheckCircle2,
  Pencil,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import type { EventAttendeeDto, EventDto } from "../../types/events";

import {
  formatBudget,
  formatEventDate,
  formatEventStage,
} from "../../utils/eventFormatting";

interface EventDetailsModalProps {
  event: EventDto | null;

  isRegistered: boolean;
  isRegistrationLoading: boolean;
  isRegistrationSaving: boolean;

  attendees: EventAttendeeDto[];
  attendeesLoading: boolean;

  canManage: boolean;
  canViewAttendees: boolean;

  onClose: () => void;

  onEdit: (event: EventDto) => void;

  onRegister: (event: EventDto) => Promise<void>;

  onCancelRegistration: (event: EventDto) => Promise<void>;
}

export default function EventDetailsModal({
  event,
  isRegistered,
  isRegistrationLoading,
  isRegistrationSaving,
  attendees,
  attendeesLoading,
  canManage,
  canViewAttendees,
  onClose,
  onEdit,
  onRegister,
  onCancelRegistration,
}: EventDetailsModalProps) {
  if (!event) {
    return null;
  }

  const registrationAvailable = event.approvalStatus === "Approved";

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="event-modal event-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-details-title"
      >
        <header className="event-modal__header">
          <div>
            <p>{event.vendorName}</p>

            <h2 id="event-details-title">{event.description}</h2>
          </div>

          <button
            className="event-modal__close"
            type="button"
            aria-label="Close event details"
            onClick={onClose}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="event-details-modal__body">
          <div className="event-details-modal__status-row">
            <span className="stage-chip">{formatEventStage(event.stage)}</span>

            <span
              className={[
                "event-approval-badge",
                `event-approval-badge--${event.approvalStatus.toLowerCase()}`,
              ].join(" ")}
            >
              {event.approvalStatus}
            </span>
          </div>

          <div className="event-details-grid">
            <div>
              <CalendarDays size={17} aria-hidden="true" />

              <span>Event date</span>

              <strong>{formatEventDate(event.eventDate)}</strong>
            </div>

            <div>
              <span>Budget</span>

              <strong>{formatBudget(event.budgetCad)}</strong>
            </div>
          </div>

          {event.notes && (
            <div className="event-details-modal__notes">
              <h3>Notes</h3>

              <p>{event.notes}</p>
            </div>
          )}

          {event.submittedByUserName && (
            <p className="event-details-modal__metadata">
              Submitted by <strong>{event.submittedByUserName}</strong>
            </p>
          )}

          {event.reviewedByUserName && (
            <p className="event-details-modal__metadata">
              Reviewed by <strong>{event.reviewedByUserName}</strong>
            </p>
          )}

          {canViewAttendees && (
            <section className="event-details-attendees">
              <header>
                <Users size={17} aria-hidden="true" />

                <h3>Registered attendees</h3>

                <span>{attendees.length}</span>
              </header>

              {attendeesLoading ? (
                <p>Loading attendees...</p>
              ) : attendees.length === 0 ? (
                <p>No registrations yet.</p>
              ) : (
                <div className="event-details-attendee-list">
                  {attendees.map((attendee) => (
                    <div key={attendee.userId}>
                      <strong>{attendee.name}</strong>

                      <span>{attendee.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="event-modal__footer">
          {canManage && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => onEdit(event)}
            >
              <Pencil size={15} aria-hidden="true" />
              Edit Event
            </button>
          )}

          {registrationAvailable &&
            !isRegistrationLoading &&
            (isRegistered ? (
              <button
                type="button"
                className="secondary-button"
                disabled={isRegistrationSaving}
                onClick={() => void onCancelRegistration(event)}
              >
                <CheckCircle2 size={15} aria-hidden="true" />

                {isRegistrationSaving ? "Updating..." : "Cancel Registration"}
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                disabled={isRegistrationSaving}
                onClick={() => void onRegister(event)}
              >
                <UserCheck size={15} aria-hidden="true" />

                {isRegistrationSaving ? "Registering..." : "Register"}
              </button>
            ))}

          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
