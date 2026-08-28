import { ArrowRight, Building2 } from "lucide-react";

import type { RebateDto } from "../../../types/rebates";

import {
  formatRebateAmount,
  getRebateVendorSummary,
} from "../../../utils/rebateAnalytics";

interface RebateVendorSummaryProps {
  rebates: RebateDto[];
  onViewVendor: (vendorId: string) => void;
}

export default function RebateVendorSummary({
  rebates,
  onViewVendor,
}: RebateVendorSummaryProps) {
  const vendors = getRebateVendorSummary(rebates)
    .slice()
    .sort((first, second) => {
      if (second.estimatedAmount !== first.estimatedAmount) {
        return second.estimatedAmount - first.estimatedAmount;
      }

      return first.vendorName.localeCompare(second.vendorName);
    });

  if (vendors.length === 0) {
    return (
      <div className="rebate-vendors-empty">
        <span className="rebate-vendors-empty__icon">
          <Building2 size={24} aria-hidden="true" />
        </span>

        <h2>No Vendor Rebates Yet</h2>

        <p>Vendor summaries will appear after rebate records are added.</p>
      </div>
    );
  }

  return (
    <div className="rebate-vendor-table-shell">
      <div className="rebate-vendor-table-scroll">
        <table className="rebate-vendor-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Rebates</th>
              <th>Active</th>
              <th>Pending</th>
              <th>Completed</th>
              <th>Estimated Value</th>
              <th>Actual Value</th>
              <th aria-label="Actions" />
            </tr>
          </thead>

          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.vendorId}>
                <td>
                  <div className="rebate-vendor-table__vendor">
                    <span>
                      <Building2 size={16} aria-hidden="true" />
                    </span>

                    <strong>{vendor.vendorName}</strong>
                  </div>
                </td>

                <td>
                  <strong className="rebate-vendor-table__count">
                    {vendor.rebateCount}
                  </strong>
                </td>

                <td>
                  <span className="rebate-vendor-metric rebate-vendor-metric--active">
                    {vendor.activeCount}
                  </span>
                </td>

                <td>
                  <span className="rebate-vendor-metric rebate-vendor-metric--pending">
                    {vendor.pendingCount}
                  </span>
                </td>

                <td>
                  <span className="rebate-vendor-metric rebate-vendor-metric--completed">
                    {vendor.completedCount}
                  </span>
                </td>

                <td className="rebate-vendor-table__money">
                  {formatRebateAmount(vendor.estimatedAmount)}
                </td>

                <td className="rebate-vendor-table__money">
                  {formatRebateAmount(vendor.actualAmount)}
                </td>

                <td>
                  <button
                    type="button"
                    className="rebate-vendor-table__view"
                    title={`View ${vendor.vendorName} rebates`}
                    aria-label={`View ${vendor.vendorName} rebates`}
                    onClick={() => onViewVendor(vendor.vendorId)}
                  >
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
