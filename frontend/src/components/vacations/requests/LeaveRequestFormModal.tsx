import { X } from "lucide-react";
import { useEffect, useState } from "react";

import type {
  LeaveRequestDto,
  LeaveRequestPayload,
  LeaveRequestStatus,
  LeaveType,
} from "../../../types/vacations";

interface LeaveRequestFormModalProps {
  isOpen: boolean;
  request: LeaveRequestDto | null;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: LeaveRequestPayload) => Promise<void>;
}

const defaultPayload: LeaveRequestPayload = {
  employeeName: "",
  leaveType: "Vacation",
  startDate: "",
  endDate: "",
  status: "Pending",
  reason: null,
  approverName: null,
  notes: null,
};

export default function LeaveRequestFormModal({
  isOpen,
  request,
  isSaving,
  error,
  onClose,
  onSubmit,
}: LeaveRequestFormModalProps) {
  const [form, setForm] = useState<LeaveRequestPayload>(defaultPayload);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (request) {
      setForm({
        employeeName: request.employeeName,
        leaveType: request.leaveType,
        startDate: request.startDate,
        endDate: request.endDate,
        status: request.status,
        reason: request.reason,
        approverName: request.approverName,
        notes: request.notes,
      });

      return;
    }

    setForm(defaultPayload);
  }, [isOpen, request]);

  if (!isOpen) {
    return null;
  }

  const isValid =
    form.employeeName.trim() &&
    form.startDate &&
    form.endDate &&
    form.endDate >= form.startDate;

  return (
    <div
      className="vacation-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="vacation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-request-modal-title"
      >
        <header className="vacation-modal__header">
          <div>
            <h2 id="leave-request-modal-title">
              {request ? "Edit Leave Request" : "Add Leave Request"}
            </h2>

            <p>Manage employee leave dates, status, and supporting details.</p>
          </div>

          <button
            type="button"
            aria-label="Close leave request dialog"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form
          className="vacation-form"
          onSubmit={(event) => {
            event.preventDefault();

            if (!isValid || isSaving) {
              return;
            }

            void onSubmit({
              ...form,
              employeeName: form.employeeName.trim(),
              reason: form.reason?.trim() || null,
              approverName: form.approverName?.trim() || null,
              notes: form.notes?.trim() || null,
            });
          }}
        >
          <div className="vacation-form__grid">
            <label>
              <span>Employee</span>

              <input
                required
                maxLength={150}
                value={form.employeeName}
                placeholder="Employee name"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    employeeName: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>Leave Type</span>

              <select
                value={form.leaveType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    leaveType: event.target.value as LeaveType,
                  }))
                }
              >
                <option value="Vacation">Vacation</option>
                <option value="Sick">Sick Leave</option>
                <option value="Parental">Parental Leave</option>
                <option value="Personal">Personal Leave</option>
                <option value="Bereavement">Bereavement</option>
                <option value="Unpaid">Unpaid Leave</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              <span>Start Date</span>

              <input
                required
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>End Date</span>

              <input
                required
                type="date"
                min={form.startDate || undefined}
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>Status</span>

              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as LeaveRequestStatus,
                  }))
                }
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>

            <label>
              <span>Approver</span>

              <input
                maxLength={150}
                value={form.approverName ?? ""}
                placeholder="Approver name"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    approverName: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="vacation-form__full">
            <span>Reason</span>

            <textarea
              maxLength={500}
              rows={3}
              value={form.reason ?? ""}
              placeholder="Optional reason"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
            />
          </label>

          <label className="vacation-form__full">
            <span>Notes</span>

            <textarea
              maxLength={1000}
              rows={3}
              value={form.notes ?? ""}
              placeholder="Optional internal notes"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </label>

          {form.startDate && form.endDate && form.endDate < form.startDate && (
            <div className="vacation-form__error">
              End date cannot be earlier than the start date.
            </div>
          )}

          {error && <div className="vacation-form__error">{error}</div>}

          <footer className="vacation-modal__footer">
            <button
              type="button"
              className="vacation-modal__cancel"
              disabled={isSaving}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="vacation-modal__save"
              disabled={!isValid || isSaving}
            >
              {isSaving
                ? "Saving..."
                : request
                  ? "Save Changes"
                  : "Add Leave Request"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
