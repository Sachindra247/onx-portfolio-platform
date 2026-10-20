import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import type { CertificationDto } from "../../types/certifications";
import { formatCertificationStatus } from "../../utils/certificationAnalytics";

interface CertificationDetailsModalProps {
  certification: CertificationDto;
  onClose: () => void;
}

export default function CertificationDetailsModal({
  certification,
  onClose,
}: CertificationDetailsModalProps) {
  const modalRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const modal = modalRef.current;

    const getFocusableElements = () =>
      Array.from(
        modal?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    getFocusableElements()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = getFocusableElements();

      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!modal?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const details = [
    ["Employee", certification.personName],
    ["Vendor", certification.vendorName],
    ["Certification", certification.certificationName],
    ["Program", certification.program],
    ["Category", certification.category],
    ["Status", formatCertificationStatus(certification.status)],
    ["Location", certification.location],
    ["Fee", certification.fee],
    ["Assigned Date", certification.assignedDate],
    ["Completed Date", certification.dateCompleted],
    ["Expiry Date", certification.expiryDate],
    ["Practice Lead", certification.practiceLead],
    ["Rebate Impact", certification.rebateImpact],
    ["Notes", certification.notes],
  ];

  return (
    <div
      className="certification-details-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={modalRef}
        className="certification-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="certification-details-title"
      >
        <header className="certification-details-header">
          <div>
            <h2 id="certification-details-title">Certification Details</h2>
            <p>{certification.certificationName}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close certification details"
          >
            <X size={20} />
          </button>
        </header>

        <div className="certification-details-grid">
          {details.map(([label, value]) => (
            <div className="certification-details-field" key={label}>
              <span>{label}</span>
              <strong>{value || "—"}</strong>
            </div>
          ))}
        </div>

        <footer className="certification-details-footer">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
