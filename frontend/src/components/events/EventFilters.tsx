import { RotateCcw, Search } from "lucide-react";
import {
  eventStages,
  type EventStage,
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
  onSearchChange: (value: string) => void;
  onStageChange: (value: EventStage | "") => void;
  onVendorChange: (value: string) => void;
  onReset: () => void;
}

export default function EventFilters({
  search,
  stage,
  vendorId,
  vendors,
  resultCount,
  totalCount,
  onSearchChange,
  onStageChange,
  onVendorChange,
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
              <option value={eventStage} key={eventStage}>
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
              <option value={vendor.id} key={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </label>

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
