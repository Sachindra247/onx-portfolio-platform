import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Delete",
  isConfirming = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isConfirming) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirming, isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isConfirming) {
          onCancel();
        }
      }}
    >
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <header className="confirm-dialog__header">
          <span className="confirm-dialog__icon">
            <AlertTriangle size={21} aria-hidden="true" />
          </span>

          <div>
            <h2 id="confirm-dialog-title">{title}</h2>

            <p id="confirm-dialog-description">{description}</p>
          </div>

          <button
            type="button"
            aria-label="Close confirmation dialog"
            disabled={isConfirming}
            onClick={onCancel}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <footer className="confirm-dialog__footer">
          <button
            className="secondary-button"
            type="button"
            disabled={isConfirming}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="danger-button"
            type="button"
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {isConfirming ? "Deleting..." : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
