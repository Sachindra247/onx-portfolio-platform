import { ArrowRight, CalendarClock } from "lucide-react";

import type { RebateDto } from "../../../types/rebates";

import {
  formatRebateAmount,
  isRebateOverdue,
} from "../../../utils/rebateAnalytics";

interface UpcomingRebatesProps {
  rebates: RebateDto[];
  onViewRebate: (rebate: RebateDto) => void;
  onViewAll: () => void;
}

function formatDate(value: string): string {
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
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function UpcomingRebates({
  rebates,
  onViewRebate,
  onViewAll,
}: UpcomingRebatesProps) {
  const upcoming = rebates
    .filter(
      (rebate) =>
        rebate.dueDate &&
        rebate.status !== "Completed" &&
        rebate.status !== "Cancelled",
    )
    .slice()
    .sort((first, second) => first.dueDate!.localeCompare(second.dueDate!))
    .slice(0, 5);

  return (
    <section className="rebates-dashboard-card rebates-dashboard-card--wide">
      <div className="rebates-dashboard-card__header">
        <div>
          <h2>Upcoming Deadlines</h2>

          <p>Rebates requiring attention based on due date.</p>
        </div>

        {rebates.length > 0 ? (
          <button
            type="button"
            className="rebates-dashboard-link"
            onClick={onViewAll}
          >
            View All
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {upcoming.length === 0 ? (
        <div className="rebates-dashboard-empty">
          <CalendarClock size={22} aria-hidden="true" />

          <span>No upcoming rebate deadlines.</span>
        </div>
      ) : (
        <div className="rebate-deadlines">
          {upcoming.map((rebate) => {
            const overdue = isRebateOverdue(rebate);

            return (
              <button
                key={rebate.id}
                type="button"
                className="rebate-deadline"
                onClick={() => onViewRebate(rebate)}
              >
                <div className="rebate-deadline__main">
                  <strong>{rebate.title}</strong>

                  <span>
                    {rebate.vendorName}

                    {rebate.programName ? ` · ${rebate.programName}` : ""}
                  </span>
                </div>

                <div className="rebate-deadline__value">
                  <span>Estimated</span>

                  <strong>{formatRebateAmount(rebate.estimatedAmount)}</strong>
                </div>

                <div
                  className={[
                    "rebate-deadline__date",
                    overdue ? "rebate-deadline__date--overdue" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <CalendarClock size={14} aria-hidden="true" />

                  <div>
                    <strong>{formatDate(rebate.dueDate!)}</strong>

                    {overdue ? <span>Overdue</span> : <span>Due date</span>}
                  </div>
                </div>

                <ArrowRight
                  className="rebate-deadline__arrow"
                  size={15}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
