interface EventEmptyStateProps {
  hasEvents: boolean;
  filtersAreActive: boolean;
  onClearFilters?: () => void;
}

export default function EventEmptyState({
  hasEvents,
  filtersAreActive,
  onClearFilters,
}: EventEmptyStateProps) {
  const noMatches = hasEvents && filtersAreActive;

  return (
    <div className="event-table-empty">
      <h3>{noMatches ? "No matching events" : "No events available"}</h3>
      <p>
        {noMatches
          ? "No events match your current filters."
          : "There are no events to display yet."}
      </p>
      {noMatches && onClearFilters && (
        <button type="button" className="toolbar-button" onClick={onClearFilters}>
          Clear filters
        </button>
      )}
    </div>
  );
}
