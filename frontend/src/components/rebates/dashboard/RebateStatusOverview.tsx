import type { RebateDto, RebateStatus } from "../../../types/rebates";

interface RebateStatusOverviewProps {
  rebates: RebateDto[];
  onViewStatus: (status: RebateStatus) => void;
}

const statuses: RebateStatus[] = [
  "Active",
  "Pending",
  "Draft",
  "Completed",
  "Cancelled",
];

export default function RebateStatusOverview({
  rebates,
  onViewStatus,
}: RebateStatusOverviewProps) {
  const total = rebates.length;

  const counts = new Map<RebateStatus, number>();

  statuses.forEach((status) => {
    counts.set(
      status,
      rebates.filter((rebate) => rebate.status === status).length,
    );
  });

  return (
    <section className="rebates-dashboard-card">
      <div className="rebates-dashboard-card__header">
        <div>
          <h2>Status Overview</h2>

          <p>Current rebate pipeline by status.</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="rebates-dashboard-empty">No rebate records yet.</div>
      ) : (
        <div className="rebate-status-overview">
          {statuses.map((status) => {
            const count = counts.get(status) ?? 0;

            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <button
                key={status}
                type="button"
                className="rebate-status-overview__row"
                onClick={() => onViewStatus(status)}
              >
                <div className="rebate-status-overview__label">
                  <span
                    className={`rebate-status rebate-status--${status.toLowerCase()}`}
                  >
                    {status}
                  </span>

                  <strong>{count}</strong>
                </div>

                <div className="rebate-status-overview__track">
                  <span
                    className={`rebate-status-overview__fill rebate-status-overview__fill--${status.toLowerCase()}`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <span className="rebate-status-overview__percentage">
                  {percentage.toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
