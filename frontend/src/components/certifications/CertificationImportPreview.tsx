import { AlertCircle, CheckCircle2, X } from "lucide-react";

import type { CertificationImportPreviewDto } from "../../types/certifications";

interface CertificationImportPreviewProps {
  preview: CertificationImportPreviewDto;
  isConfirming: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function CertificationImportPreview({
  preview,
  isConfirming,
  onConfirm,
  onClose,
}: CertificationImportPreviewProps) {
  const canConfirm =
    preview.errorRows === 0 && preview.validRows > 0 && !isConfirming;

  return (
    <section className="certification-table-card">
      <header className="certification-table-card__header">
        <div>
          <h2>Certification Import Preview</h2>

          <p>
            Review the proposed changes before updating certification records.
            No data has been saved yet.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="certifications-sidebar__action-button"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {isConfirming ? "Importing..." : "Confirm Import"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={isConfirming}
          >
            <X size={15} aria-hidden="true" />
            Close Preview
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(100px, 1fr))",
          gap: "12px",
          margin: "18px 0",
        }}
      >
        <SummaryItem label="Total" value={preview.totalRows} />
        <SummaryItem label="Valid" value={preview.validRows} />
        <SummaryItem label="Errors" value={preview.errorRows} />
        <SummaryItem label="New" value={preview.newRecords} />
        <SummaryItem label="Updates" value={preview.updates} />
        <SummaryItem label="Archives" value={preview.archives} />
      </div>

      {preview.errorRows > 0 && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <AlertCircle size={18} aria-hidden="true" />

          <span>
            {preview.errorRows} row
            {preview.errorRows === 1 ? "" : "s"} must be corrected before the
            file can be imported.
          </span>
        </div>
      )}

      {preview.errorRows === 0 && preview.validRows > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <CheckCircle2 size={18} aria-hidden="true" />

          <span>
            All rows passed validation. Review the changes below, then select
            Confirm Import to update the certification records.
          </span>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table className="certification-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>Action</th>
              <th>Person</th>
              <th>Vendor</th>
              <th>Certification</th>
              <th>Status</th>
              <th>Validation</th>
            </tr>
          </thead>

          <tbody>
            {preview.rows.map((row) => (
              <tr key={row.rowNumber}>
                <td>{row.rowNumber}</td>

                <td>{row.action}</td>

                <td>{row.personName || "—"}</td>

                <td>{row.vendorName || "—"}</td>

                <td>{row.certificationName || "—"}</td>

                <td>{row.status || "—"}</td>

                <td>
                  {row.errors.length > 0 ? (
                    <div>
                      {row.errors.map((error) => (
                        <div key={error}>{error}</div>
                      ))}
                    </div>
                  ) : row.warnings.length > 0 ? (
                    <div>
                      {row.warnings.map((warning) => (
                        <div key={warning}>{warning}</div>
                      ))}
                    </div>
                  ) : (
                    "Valid"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface SummaryItemProps {
  label: string;
  value: number;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div
      style={{
        border: "1px solid #d9dee8",
        borderRadius: "8px",
        padding: "12px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>

      <strong style={{ fontSize: "20px" }}>{value}</strong>
    </div>
  );
}
