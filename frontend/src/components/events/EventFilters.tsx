import { LayoutGrid, List, RotateCcw, Search } from "lucide-react";

import {
  eventStages,
  type EventStage,
  type EventViewMode,
  type VendorDto,
} from "../../types/events";

import { formatEventStage } from "../../utils/eventFormatting";

interface EventFiltersProps {
  search: string;
  stage: EventStage | "";
  vendorId: string;
  vendors: VendorDto[];
  resultCount: number;
  totalCount: number;
  viewMode: EventViewMode;
  onSearchChange: (value: string) => void;
  onStageChange: (value: EventStage | "") => void;
  onVendorChange: (value: string) => void;
  onViewModeChange: (viewMode: EventViewMode) => void;
  onReset: () => void;
}

export default function EventFilters({
  search,
  stage,
  vendorId,
  vendors,
  resultCount,
  totalCount,
  viewMode,
  onSearchChange,
  onStageChange,
  onVendorChange,
  onViewModeChange,
  onReset,
}: EventFiltersProps) {
  const filtersAreActive =
    search.trim().length > 0 || stage !== "" || vendorId !== "";

  return (
    <div className="event-toolbar">
      <div className="event-toolbar__heading">
        <div>
          <h2>All Events</h2>

          <p>
            Showing {resultCount} of {totalCount} events
          </p>
        </div>
      </div>

      <div className="event-toolbar__controls">
        <label className="search-control">
          <Search size={15} aria-hidden="true" />

          <span className="sr-only">Search events</span>

          <input
            type="search"
            value={search}
            placeholder="Search events..."
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <label className="select-control">
          <span className="sr-only">Filter by stage</span>

          <select
            value={stage}
            onChange={(event) =>
              onStageChange(event.target.value as EventStage | "")
            }
          >
            <option value="">All stages</option>

            {eventStages.map((eventStage) => (
              <option key={eventStage} value={eventStage}>
                {formatEventStage(eventStage)}
              </option>
            ))}
          </select>
        </label>

        <label className="select-control">
          <span className="sr-only">Filter by vendor</span>

          <select
            value={vendorId}
            onChange={(event) => onVendorChange(event.target.value)}
          >
            <option value="">All vendors</option>

            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </label>

        <div
          className="view-toggle"
          role="group"
          aria-label="Event display mode"
        >
          <button
            type="button"
            className={viewMode === "table" ? "is-active" : ""}
            aria-label="Table view"
            aria-pressed={viewMode === "table"}
            onClick={() => onViewModeChange("table")}
          >
            <List size={15} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={viewMode === "vendor" ? "is-active" : ""}
            aria-label="Group by vendor"
            aria-pressed={viewMode === "vendor"}
            onClick={() => onViewModeChange("vendor")}
          >
            <LayoutGrid size={15} aria-hidden="true" />
          </button>
        </div>

        {filtersAreActive && (
          <button className="toolbar-button" type="button" onClick={onReset}>
            <RotateCcw size={14} aria-hidden="true" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
