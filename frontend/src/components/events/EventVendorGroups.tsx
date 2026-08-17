import { Building2, Pencil } from "lucide-react";

import type { EventDto } from "../../types/events";

import {
  formatBudget,
  formatEventDate,
  formatEventStage,
  getStageClassName,
} from "../../utils/eventFormatting";

import { groupEventsByVendor } from "../../utils/eventAnalytics";

interface EventVendorGroupsProps {
  events: EventDto[];

  canManage: boolean;

  onView: (event: EventDto) => void;

  onEdit: (event: EventDto) => void;
}

export default function EventVendorGroups({
  events,
  canManage,
  onView,
  onEdit,
}: EventVendorGroupsProps) {
  const vendorGroups = groupEventsByVendor(events);

  if (vendorGroups.size === 0) {
    return (
      <div className="event-table-empty">
        <h3>No events found</h3>

        <p>Try changing or clearing the current filters.</p>
      </div>
    );
  }

  return (
    <div className="vendor-groups">
      {[...vendorGroups.entries()].map(([vendorName, vendorEvents]) => {
        const totalBudget = vendorEvents.reduce(
          (total, event) => total + event.budgetCad,
          0,
        );

        return (
          <section className="vendor-group" key={vendorName}>
            <header className="vendor-group__header">
              <div>
                <span className="vendor-group__icon">
                  <Building2 size={17} aria-hidden="true" />
                </span>

                <div>
                  <h3>{vendorName}</h3>

                  <p>
                    {vendorEvents.length} event
                    {vendorEvents.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {canManage && <strong>{formatBudget(totalBudget)}</strong>}
            </header>

            <div className="vendor-group__events">
              {vendorEvents.map((event) => (
                <article className="vendor-group-event" key={event.id}>
                  <button
                    type="button"
                    className="vendor-group-event__main vendor-group-event__main--button"
                    onClick={() => onView(event)}
                  >
                    <strong>{event.description}</strong>

                    <span>{formatEventDate(event.eventDate)}</span>
                  </button>

                  <span
                    className={[
                      "stage-chip",
                      getStageClassName(event.stage),
                    ].join(" ")}
                  >
                    {formatEventStage(event.stage)}
                  </span>

                  {canManage && (
                    <span className="vendor-group-event__budget">
                      {formatBudget(event.budgetCad)}
                    </span>
                  )}

                  {canManage && (
                    <button
                      type="button"
                      aria-label={`Edit ${event.description}`}
                      title="Edit event"
                      onClick={() => onEdit(event)}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
