import { ChevronLeft, ChevronRight } from "lucide-react";

interface CertificationPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function CertificationPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: CertificationPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;

  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="certification-pagination">
      <div className="certification-pagination__summary">
        Showing {firstItem}–{lastItem} of {totalItems}
      </div>

      <div className="certification-pagination__controls">
        <label>
          Rows
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>

        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
