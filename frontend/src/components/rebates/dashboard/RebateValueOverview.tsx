import { CircleDollarSign, TrendingUp } from "lucide-react";

import type { RebateDto } from "../../../types/rebates";

import { formatRebateAmount } from "../../../utils/rebateAnalytics";

interface RebateValueOverviewProps {
  rebates: RebateDto[];
}

export default function RebateValueOverview({
  rebates,
}: RebateValueOverviewProps) {
  const estimated = rebates.reduce(
    (total, rebate) => total + (rebate.estimatedAmount ?? 0),
    0,
  );

  const actual = rebates.reduce(
    (total, rebate) => total + (rebate.actualAmount ?? 0),
    0,
  );

  const realizationRate = estimated > 0 ? (actual / estimated) * 100 : 0;

  const remaining = Math.max(estimated - actual, 0);

  const progressWidth = Math.min(Math.max(realizationRate, 0), 100);

  return (
    <section className="rebates-dashboard-card">
      <div className="rebates-dashboard-card__header">
        <div>
          <h2>Value Tracking</h2>

          <p>Estimated versus actual rebate value.</p>
        </div>

        <span className="rebates-dashboard-card__header-icon">
          <CircleDollarSign size={18} aria-hidden="true" />
        </span>
      </div>

      <div className="rebate-value-overview">
        <div className="rebate-value-overview__primary">
          <span>Realization Rate</span>

          <strong>{realizationRate.toFixed(1)}%</strong>

          <div className="rebate-value-overview__progress">
            <span
              style={{
                width: `${progressWidth}%`,
              }}
            />
          </div>
        </div>

        <div className="rebate-value-overview__values">
          <div>
            <span>Estimated</span>

            <strong>{formatRebateAmount(estimated)}</strong>
          </div>

          <div>
            <span>Actual</span>

            <strong>{formatRebateAmount(actual)}</strong>
          </div>

          <div>
            <span>Remaining Potential</span>

            <strong>{formatRebateAmount(remaining)}</strong>
          </div>
        </div>

        <div className="rebate-value-overview__note">
          <TrendingUp size={15} aria-hidden="true" />

          <span>
            Actual value represents realized rebate value recorded to date.
          </span>
        </div>
      </div>
    </section>
  );
}
