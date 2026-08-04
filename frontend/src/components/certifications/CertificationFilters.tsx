import { Search, SlidersHorizontal, X } from "lucide-react";

import type { CertificationStatus } from "../../types/certifications";

interface CertificationFiltersProps {
  search: string;
  vendor: string;
  status: CertificationStatus | "";
  practiceLead: string;
  vendors: string[];
  practiceLeads: string[];
  resultCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onVendorChange: (value: string) => void;
  onStatusChange: (value: CertificationStatus | "") => void;
  onPracticeLeadChange: (value: string) => void;
  onReset: () => void;
}

export default function CertificationFilters({
  search,
  vendor,
  status,
  practiceLead,
  vendors,
  practiceLeads,
  resultCount,
  totalCount,
  onSearchChange,
  onVendorChange,
  onStatusChange,
  onPracticeLeadChange,
  onReset,
}: CertificationFiltersProps) {
  const hasFilters =
    search.length > 0 ||
    vendor.length > 0 ||
    status.length > 0 ||
    practiceLead.length > 0;

  return (
    <div className="certification-filters">
      <div className="certification-filters__top">
        <div className="certification-search">
          <Search size={16} aria-hidden="true" />

          <input
            type="search"
            value={search}
            placeholder="Search people, vendors, or certifications..."
            aria-label="Search certifications"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="certification-filters__count">
          {resultCount === totalCount
            ? `${totalCount} records`
            : `${resultCount} of ${totalCount} records`}
        </div>
      </div>

      <div className="certification-filters__controls">
        <span className="certification-filters__label">
          <SlidersHorizontal size={14} aria-hidden="true" />
          Filters
        </span>

        <select
          value={vendor}
          aria-label="Filter by vendor"
          onChange={(event) => onVendorChange(event.target.value)}
        >
          <option value="">All vendors</option>

          {vendors.map((vendorName) => (
            <option key={vendorName} value={vendorName}>
              {vendorName}
            </option>
          ))}
        </select>

        <select
          value={status}
          aria-label="Filter by certification status"
          onChange={(event) =>
            onStatusChange(event.target.value as CertificationStatus | "")
          }
        >
          <option value="">All statuses</option>
          <option value="Complete">Complete</option>
          <option value="InProgress">In Progress</option>
          <option value="Pending">Pending</option>
          <option value="Tbd">TBD</option>
          <option value="Expired">Expired</option>
        </select>

        <select
          value={practiceLead}
          aria-label="Filter by practice lead"
          onChange={(event) => onPracticeLeadChange(event.target.value)}
        >
          <option value="">All practice leads</option>

          {practiceLeads.map((lead) => (
            <option key={lead} value={lead}>
              {lead}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            className="certification-filters__reset"
            onClick={onReset}
          >
            <X size={14} aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
