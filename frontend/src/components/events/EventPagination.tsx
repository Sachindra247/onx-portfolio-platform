import { ChevronLeft, ChevronRight } from "lucide-react";

interface EventPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function EventPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: EventPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));

  const safePage = Math.min(page, pageCount);

  const firstItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;

  const lastItem = Math.min(safePage * pageSize, totalItems);

  return (
    <footer className="event-pagination">
      <div className="event-pagination__summary">
        Showing {firstItem}–{lastItem} of {totalItems}
      </div>

      <div className="event-pagination__controls">
        <label>
          <span>Rows</span>

          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>

        <button
          type="button"
          aria-label="Previous page"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        <span>
          Page {safePage} of {pageCount}
        </span>

        <button
          type="button"
          aria-label="Next page"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
