import { Search, SlidersHorizontal, X } from "lucide-react";

import type { RebateDto, RebateStatus } from "../../types/rebates";

interface RebateFiltersProps {
  rebates: RebateDto[];
  search: string;
  status: string;
  vendorId: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onVendorChange: (value: string) => void;
  onClear: () => void;
}

const statuses: RebateStatus[] = [
  "Draft",
  "Active",
  "Pending",
  "Completed",
  "Cancelled",
];

export default function RebateFilters({
  rebates,
  search,
  status,
  vendorId,
  onSearchChange,
  onStatusChange,
  onVendorChange,
  onClear,
}: RebateFiltersProps) {
  const vendors = Array.from(
    new Map(
      rebates.map((rebate) => [rebate.vendorId, rebate.vendorName]),
    ).entries(),
  )
    .map(([id, name]) => ({
      id,
      name,
    }))
    .sort((first, second) => first.name.localeCompare(second.name));

  const hasFilters =
    search.trim().length > 0 || status.length > 0 || vendorId.length > 0;

  return (
    <div className="rebate-filters">
      <div className="rebate-filters__search">
        <Search size={17} aria-hidden="true" />

        <input
          type="search"
          value={search}
          placeholder="Search rebates..."
          aria-label="Search rebates"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="rebate-filters__select-wrap">
        <SlidersHorizontal size={16} aria-hidden="true" />

        <select
          value={status}
          aria-label="Filter by status"
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="">All Statuses</option>

          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="rebate-filters__select-wrap">
        <select
          value={vendorId}
          aria-label="Filter by vendor"
          onChange={(event) => onVendorChange(event.target.value)}
        >
          <option value="">All Vendors</option>

          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </option>
          ))}
        </select>
      </div>

      {hasFilters ? (
        <button
          type="button"
          className="rebate-filters__clear"
          onClick={onClear}
        >
          <X size={15} aria-hidden="true" />
          Clear
        </button>
      ) : null}
    </div>
  );
}
