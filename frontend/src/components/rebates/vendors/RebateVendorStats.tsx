import {
  BadgeDollarSign,
  Building2,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";

import type { RebateDto } from "../../../types/rebates";

import {
  formatRebateAmount,
  getRebateVendorSummary,
} from "../../../utils/rebateAnalytics";

interface RebateVendorStatsProps {
  rebates: RebateDto[];
}

export default function RebateVendorStats({ rebates }: RebateVendorStatsProps) {
  const vendors = getRebateVendorSummary(rebates);

  const estimatedValue = vendors.reduce(
    (total, vendor) => total + vendor.estimatedAmount,
    0,
  );

  const actualValue = vendors.reduce(
    (total, vendor) => total + vendor.actualAmount,
    0,
  );

  const topVendor =
    vendors.length > 0
      ? vendors
          .slice()
          .sort(
            (first, second) => second.estimatedAmount - first.estimatedAmount,
          )[0]
      : null;

  return (
    <div className="rebate-vendor-stats">
      <article className="rebate-vendor-stat">
        <span className="rebate-vendor-stat__icon">
          <Building2 size={18} aria-hidden="true" />
        </span>

        <div>
          <strong>{vendors.length}</strong>

          <span>Vendors with Rebates</span>
        </div>
      </article>

      <article className="rebate-vendor-stat">
        <span className="rebate-vendor-stat__icon">
          <BadgeDollarSign size={18} aria-hidden="true" />
        </span>

        <div>
          <strong>{formatRebateAmount(estimatedValue)}</strong>

          <span>Estimated Value</span>
        </div>
      </article>

      <article className="rebate-vendor-stat">
        <span className="rebate-vendor-stat__icon">
          <CircleDollarSign size={18} aria-hidden="true" />
        </span>

        <div>
          <strong>{formatRebateAmount(actualValue)}</strong>

          <span>Actual Value</span>
        </div>
      </article>

      <article className="rebate-vendor-stat">
        <span className="rebate-vendor-stat__icon">
          <TrendingUp size={18} aria-hidden="true" />
        </span>

        <div>
          <strong
            className={topVendor ? "" : "rebate-vendor-stat__empty-value"}
            title={topVendor?.vendorName}
          >
            {topVendor?.vendorName ?? "—"}
          </strong>

          <span>Highest Potential Vendor</span>
        </div>
      </article>
    </div>
  );
}
