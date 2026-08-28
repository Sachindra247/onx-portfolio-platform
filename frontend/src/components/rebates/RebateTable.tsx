import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  Pencil,
  Trash2,
} from "lucide-react";

import type {
  RebateDto,
  RebateSortDirection,
  RebateSortField,
} from "../../types/rebates";

import {
  formatRebateAmount,
  isRebateDueSoon,
  isRebateOverdue,
} from "../../utils/rebateAnalytics";

interface RebateTableProps {
  rebates: RebateDto[];
  canManage: boolean;

  sortField: RebateSortField;
  sortDirection: RebateSortDirection;

  onSort: (field: RebateSortField) => void;

  onEdit: (rebate: RebateDto) => void;

  onDelete: (rebate: RebateDto) => void;
}

interface SortButtonProps {
  label: string;
  field: RebateSortField;
  activeField: RebateSortField;
  direction: RebateSortDirection;
  onSort: (field: RebateSortField) => void;
}

function SortButton({
  label,
  field,
  activeField,
  direction,
  onSort,
}: SortButtonProps) {
  const isActive = activeField === field;

  const Icon = !isActive
    ? ArrowUpDown
    : direction === "ascending"
      ? ArrowUp
      : ArrowDown;

  return (
    <button
      type="button"
      className={[
        "rebate-table__sort",
        isActive ? "rebate-table__sort--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSort(field)}
    >
      <span>{label}</span>

      <Icon size={13} aria-hidden="true" />
    </button>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function statusClass(status: RebateDto["status"]): string {
  return `rebate-status rebate-status--${status.toLowerCase()}`;
}

export default function RebateTable({
  rebates,
  canManage,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
}: RebateTableProps) {
  if (rebates.length === 0) {
    return (
      <div className="rebate-table-empty">
        <strong>No rebates found</strong>

        <p>No rebate records match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="rebate-table-shell">
      <div className="rebate-table-scroll">
        <table className="rebate-table">
          <thead>
            <tr>
              <th>
                <SortButton
                  label="Rebate"
                  field="title"
                  activeField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>

              <th>
                <SortButton
                  label="Vendor"
                  field="vendorName"
                  activeField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>

              <th>
                <SortButton
                  label="Program"
                  field="programName"
                  activeField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>

              <th>
                <SortButton
                  label="Status"
                  field="status"
                  activeField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>

              <th className="rebate-table__amount">
                <SortButton
                  label="Estimated"
                  field="estimatedAmount"
                  activeField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>

              <th className="rebate-table__amount">
                <SortButton
                  label="Actual"
                  field="actualAmount"
                  activeField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>

              <th>
                <SortButton
                  label="Due Date"
                  field="dueDate"
                  activeField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>

              <th>
                <SortButton
                  label="Owner"
                  field="ownerName"
                  activeField={sortField}
                  direction={sortDirection}
                  onSort={onSort}
                />
              </th>

              {canManage ? (
                <th
                  className="rebate-table__actions-heading"
                  aria-label="Actions"
                />
              ) : null}
            </tr>
          </thead>

          <tbody>
            {rebates.map((rebate) => {
              const overdue = isRebateOverdue(rebate);

              const dueSoon = !overdue && isRebateDueSoon(rebate);

              return (
                <tr key={rebate.id}>
                  <td>
                    <div className="rebate-table__primary">
                      <strong>{rebate.title}</strong>

                      {rebate.description ? (
                        <span>{rebate.description}</span>
                      ) : null}
                    </div>
                  </td>

                  <td>{rebate.vendorName}</td>

                  <td>{rebate.programName || "—"}</td>

                  <td>
                    <span className={statusClass(rebate.status)}>
                      {rebate.status}
                    </span>
                  </td>

                  <td className="rebate-table__amount">
                    {formatRebateAmount(rebate.estimatedAmount)}
                  </td>

                  <td className="rebate-table__amount">
                    {formatRebateAmount(rebate.actualAmount)}
                  </td>

                  <td>
                    <div
                      className={[
                        "rebate-table__due",
                        overdue ? "rebate-table__due--overdue" : "",
                        dueSoon ? "rebate-table__due--soon" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {(overdue || dueSoon) && (
                        <CalendarClock size={14} aria-hidden="true" />
                      )}

                      <span>{formatDate(rebate.dueDate)}</span>
                    </div>

                    {overdue ? (
                      <small className="rebate-table__date-note rebate-table__date-note--overdue">
                        Overdue
                      </small>
                    ) : null}

                    {dueSoon ? (
                      <small className="rebate-table__date-note">
                        Due soon
                      </small>
                    ) : null}
                  </td>

                  <td>
                    <div className="rebate-table__owner">
                      <span>{rebate.ownerName || "—"}</span>

                      {rebate.ownerEmail ? (
                        <small>{rebate.ownerEmail}</small>
                      ) : null}
                    </div>
                  </td>

                  {canManage ? (
                    <td>
                      <div className="rebate-table__actions">
                        <button
                          type="button"
                          title={`Edit ${rebate.title}`}
                          aria-label={`Edit ${rebate.title}`}
                          onClick={() => onEdit(rebate)}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          className="rebate-table__delete"
                          title={`Delete ${rebate.title}`}
                          aria-label={`Delete ${rebate.title}`}
                          onClick={() => onDelete(rebate)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
