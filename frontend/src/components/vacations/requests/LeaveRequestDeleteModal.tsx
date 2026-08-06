import { Trash2, X } from "lucide-react";

import type { LeaveRequestDto } from "../../../types/vacations";

interface LeaveRequestDeleteModalProps {
  request: LeaveRequestDto | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export default function LeaveRequestDeleteModal({
  request,
  isDeleting,
  onCancel,
  onConfirm,
}: LeaveRequestDeleteModalProps) {
  if (!request) {
    return null;
  }

  return (
    <div
      className="vacation-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        className="vacation-modal vacation-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-delete-title"
      >
        <header className="vacation-modal__header">
          <div>
            <h2 id="leave-delete-title">Delete Leave Request</h2>

            <p>This action cannot be undone.</p>
          </div>

          <button
            type="button"
            aria-label="Close delete dialog"
            onClick={onCancel}
          >
            <X size={18} />
          </button>
        </header>

        <div className="vacation-delete-modal__body">
          <span className="vacation-delete-modal__icon">
            <Trash2 size={20} />
          </span>

          <p>
            Delete the <strong>{request.leaveType}</strong> request for{" "}
            <strong>{request.employeeName}</strong> from{" "}
            <strong>{formatDate(request.startDate)}</strong> to{" "}
            <strong>{formatDate(request.endDate)}</strong>?
          </p>
        </div>

        <footer className="vacation-modal__footer">
          <button
            type="button"
            className="vacation-modal__cancel"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="vacation-modal__delete"
            disabled={isDeleting}
            onClick={() => void onConfirm()}
          >
            {isDeleting ? "Deleting..." : "Delete Request"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function formatDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}
