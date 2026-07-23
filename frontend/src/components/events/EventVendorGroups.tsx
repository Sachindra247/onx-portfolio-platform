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
  onEdit: (event: EventDto) => void;
}

export default function EventVendorGroups({
  events,
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

              <strong>{formatBudget(totalBudget)}</strong>
            </header>

            <div className="vendor-group__events">
              {vendorEvents.map((event) => (
                <article className="vendor-group-event" key={event.id}>
                  <div className="vendor-group-event__main">
                    <strong>{event.description}</strong>

                    <span>{formatEventDate(event.eventDate)}</span>
                  </div>

                  <span
                    className={[
                      "stage-chip",
                      getStageClassName(event.stage),
                    ].join(" ")}
                  >
                    {formatEventStage(event.stage)}
                  </span>

                  <span className="vendor-group-event__budget">
                    {formatBudget(event.budgetCad)}
                  </span>

                  <button
                    type="button"
                    aria-label={`Edit ${event.description}`}
                    onClick={() => onEdit(event)}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
