import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";

import type {
  CertificationDto,
  CertificationSortField,
  SortDirection,
} from "../../types/certifications";

import { formatCertificationStatus } from "../../utils/certificationAnalytics";

interface CertificationTableProps {
  certifications: CertificationDto[];
  sortField: CertificationSortField;
  sortDirection: SortDirection;
  onSort: (field: CertificationSortField) => void;
  onEdit: (certification: CertificationDto) => void;
  onDelete: (certification: CertificationDto) => void;
}

interface SortableHeadingProps {
  field: CertificationSortField;
  label: string;
  activeField: CertificationSortField;
  direction: SortDirection;
  onSort: (field: CertificationSortField) => void;
}

export default function CertificationTable({
  certifications,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
}: CertificationTableProps) {
  if (certifications.length === 0) {
    return (
      <div className="certification-table-empty">
        <h3>No certifications found</h3>
        <p>Try changing the search or filter selections.</p>
      </div>
    );
  }

  return (
    <div className="certification-table-scroll">
      <table className="certification-table">
        <thead>
          <tr>
            <SortableHeading
              field="personName"
              label="Person"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />

            <SortableHeading
              field="vendorName"
              label="Vendor"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />

            <SortableHeading
              field="certificationName"
              label="Certification"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />

            <SortableHeading
              field="status"
              label="Status"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />

            <SortableHeading
              field="dateCompleted"
              label="Completed"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />

            <SortableHeading
              field="expiryDate"
              label="Expiry"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />

            <SortableHeading
              field="practiceLead"
              label="Lead"
              activeField={sortField}
              direction={sortDirection}
              onSort={onSort}
            />

            <th className="certification-table__actions-heading">Actions</th>
          </tr>
        </thead>

        <tbody>
          {certifications.map((certification) => (
            <tr key={certification.id}>
              <td>
                <strong className="certification-table__person">
                  {certification.personName}
                </strong>
              </td>

              <td>
                <span className="certification-table__vendor">
                  {certification.vendorName}
                </span>
              </td>

              <td>
                <div className="certification-table__certification">
                  <strong>{certification.certificationName}</strong>

                  {certification.rebateImpact && (
                    <span>{certification.rebateImpact}</span>
                  )}
                </div>
              </td>

              <td>
                <span
                  className={[
                    "certification-status",
                    `certification-status--${getStatusClass(
                      certification.status,
                    )}`,
                  ].join(" ")}
                >
                  {formatCertificationStatus(certification.status)}
                </span>
              </td>

              <td>{formatDate(certification.dateCompleted)}</td>

              <td>
                <span className={getExpiryClass(certification.expiryDate)}>
                  {formatDate(certification.expiryDate)}
                </span>
              </td>

              <td>{certification.practiceLead ?? "—"}</td>

              <td>
                <div className="certification-table__actions">
                  <button
                    type="button"
                    aria-label={`Edit ${certification.certificationName}`}
                    title="Edit certification"
                    onClick={() => onEdit(certification)}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="certification-table__delete"
                    aria-label={`Delete ${certification.certificationName}`}
                    title="Delete certification"
                    onClick={() => onDelete(certification)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeading({
  field,
  label,
  activeField,
  direction,
  onSort,
}: SortableHeadingProps) {
  const isActive = field === activeField;

  let Icon = ArrowUpDown;

  if (isActive) {
    Icon = direction === "ascending" ? ArrowUp : ArrowDown;
  }

  return (
    <th>
      <button
        type="button"
        className={[
          "certification-table__sort",
          isActive ? "certification-table__sort--active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onSort(field)}
      >
        {label}
        <Icon size={13} aria-hidden="true" />
      </button>
    </th>
  );
}

function getStatusClass(status: CertificationDto["status"]): string {
  switch (status) {
    case "Complete":
      return "complete";

    case "InProgress":
      return "in-progress";

    case "Pending":
      return "pending";

    case "Tbd":
      return "tbd";

    case "Expired":
      return "expired";
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  const date = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
  );

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getExpiryClass(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const expiry = new Date(`${value}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil(
    (expiry.getTime() - today.getTime()) / 86_400_000,
  );

  if (daysRemaining < 0) {
    return "certification-expiry certification-expiry--expired";
  }

  if (daysRemaining <= 30) {
    return "certification-expiry certification-expiry--urgent";
  }

  if (daysRemaining <= 90) {
    return "certification-expiry certification-expiry--soon";
  }

  return undefined;
}
