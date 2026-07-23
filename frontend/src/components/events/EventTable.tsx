import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type {
  EventDto,
  EventSortField,
  SortDirection,
} from "../../types/events";
import {
  formatBudget,
  formatEventDate,
  formatEventStage,
  getStageClassName,
} from "../../utils/eventFormatting";

interface EventTableProps {
  events: EventDto[];
  sortField: EventSortField;
  sortDirection: SortDirection;
  onSort: (field: EventSortField) => void;
  onEdit: (event: EventDto) => void;
  onDelete: (event: EventDto) => void;
}

interface SortButtonProps {
  field: EventSortField;
  label: string;
  currentField: EventSortField;
  direction: SortDirection;
  onSort: (field: EventSortField) => void;
}

function SortButton({
  field,
  label,
  currentField,
  direction,
  onSort,
}: SortButtonProps) {
  const isCurrentField = field === currentField;

  let Icon = ArrowUpDown;

  if (isCurrentField) {
    Icon = direction === "ascending" ? ArrowUp : ArrowDown;
  }

  return (
    <button
      className="table-sort-button"
      type="button"
      onClick={() => onSort(field)}
    >
      {label}
      <Icon size={12} aria-hidden="true" />
    </button>
  );
}

export default function EventTable({
  events,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
}: EventTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <div className="event-table-empty">
        <h3>No events found</h3>
        <p>Try changing or clearing the current filters.</p>
      </div>
    );
  }

  return (
    <div className="event-table-scroll">
      <table className="event-table">
        <thead>
          <tr>
            <th>
              <SortButton
                field="vendorName"
                label="Vendor"
                currentField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>

            <th>
              <SortButton
                field="description"
                label="Description"
                currentField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>

            <th>
              <SortButton
                field="eventDate"
                label="Date"
                currentField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>

            <th>
              <SortButton
                field="stage"
                label="Stage"
                currentField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>

            <th className="event-table__budget-header">
              <SortButton
                field="budgetCad"
                label="Budget"
                currentField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
            </th>

            <th>Notes</th>

            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {events.map((portfolioEvent) => {
            const menuIsOpen = openMenuId === portfolioEvent.id;

            return (
              <tr key={portfolioEvent.id}>
                <td>
                  <span className="vendor-name">
                    {portfolioEvent.vendorName}
                  </span>
                </td>

                <td>
                  <span className="event-description">
                    {portfolioEvent.description}
                  </span>
                </td>

                <td className="event-table__date">
                  {formatEventDate(portfolioEvent.eventDate)}
                </td>

                <td>
                  <span
                    className={[
                      "stage-chip",
                      getStageClassName(portfolioEvent.stage),
                    ].join(" ")}
                  >
                    {formatEventStage(portfolioEvent.stage)}
                  </span>
                </td>

                <td className="event-table__budget">
                  {formatBudget(portfolioEvent.budgetCad)}
                </td>

                <td>
                  <span
                    className="event-notes"
                    title={portfolioEvent.notes ?? undefined}
                  >
                    {portfolioEvent.notes || "—"}
                  </span>
                </td>

                <td className="event-table__actions">
                  <div className="row-menu">
                    <button
                      className="row-menu__trigger"
                      type="button"
                      aria-label={`Actions for ${portfolioEvent.description}`}
                      aria-expanded={menuIsOpen}
                      onClick={() =>
                        setOpenMenuId(menuIsOpen ? null : portfolioEvent.id)
                      }
                    >
                      <MoreHorizontal size={18} aria-hidden="true" />
                    </button>

                    {menuIsOpen && (
                      <div className="row-menu__popover">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEdit(portfolioEvent);
                          }}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          Edit
                        </button>

                        <button
                          className="row-menu__delete"
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDelete(portfolioEvent);
                          }}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
