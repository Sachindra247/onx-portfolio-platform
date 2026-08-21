import { CalendarRange, Pencil, Search, Trash2 } from "lucide-react";

import { useMemo, useState } from "react";

import type {
  LeaveRequestDto,
  LeaveRequestStatus,
  LeaveType,
} from "../../../types/vacations";

interface LeaveRequestsViewProps {
  requests: LeaveRequestDto[];

  isLoading: boolean;

  error: string | null;

  /*
   * Used only to decide which actions should
   * be displayed in the UI.
   *
   * The backend remains the authoritative
   * permission check.
   */
  currentUserName: string;

  onRetry: () => void;

  onEdit: (request: LeaveRequestDto) => void;

  onDelete: (request: LeaveRequestDto) => void;

  canReview: boolean;

  onApprove: (request: LeaveRequestDto) => Promise<void>;

  onReject: (request: LeaveRequestDto) => Promise<void>;
}

export default function LeaveRequestsView({
  requests,
  isLoading,
  error,
  currentUserName,
  onRetry,
  onEdit,
  onDelete,
  canReview,
  onApprove,
  onReject,
}: LeaveRequestsViewProps) {
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatus | "">("");

  const [typeFilter, setTypeFilter] = useState<LeaveType | "">("");

  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(
    null,
  );

  // =========================================================
  // FILTERING
  // =========================================================

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !normalizedSearch ||
        request.employeeName.toLocaleLowerCase().includes(normalizedSearch) ||
        request.leaveType.toLocaleLowerCase().includes(normalizedSearch) ||
        request.approverName?.toLocaleLowerCase().includes(normalizedSearch) ||
        request.reason?.toLocaleLowerCase().includes(normalizedSearch);

      const matchesStatus = !statusFilter || request.status === statusFilter;

      const matchesType = !typeFilter || request.leaveType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, search, statusFilter, typeFilter]);

  // =========================================================
  // REVIEW
  // =========================================================

  async function handleApprove(request: LeaveRequestDto) {
    if (reviewingRequestId) {
      return;
    }

    setReviewingRequestId(request.id);

    try {
      await onApprove(request);
    } finally {
      setReviewingRequestId(null);
    }
  }

  async function handleReject(request: LeaveRequestDto) {
    if (reviewingRequestId) {
      return;
    }

    setReviewingRequestId(request.id);

    try {
      await onReject(request);
    } finally {
      setReviewingRequestId(null);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (isLoading) {
    return (
      <div className="leave-requests-state">
        <CalendarRange size={28} aria-hidden="true" />

        <h3>Loading leave requests</h3>

        <p>Please wait while the records load.</p>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="leave-requests-state">
        <h3>Unable to load leave requests</h3>

        <p>{error}</p>

        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="leave-requests-view">
      {/* =====================================================
          FILTERS
         ===================================================== */}

      <section className="leave-requests-toolbar">
        <div className="leave-requests-search">
          <Search size={16} aria-hidden="true" />

          <input
            type="search"
            value={search}
            placeholder="Search employee, leave type, approver, or reason..."
            aria-label="Search leave requests"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={typeFilter}
          aria-label="Filter by leave type"
          onChange={(event) =>
            setTypeFilter(event.target.value as LeaveType | "")
          }
        >
          <option value="">All leave types</option>

          <option value="Vacation">Vacation</option>

          <option value="Sick">Sick</option>

          <option value="Parental">Parental</option>

          <option value="Personal">Personal</option>

          <option value="Bereavement">Bereavement</option>

          <option value="Unpaid">Unpaid</option>

          <option value="Other">Other</option>
        </select>

        <select
          value={statusFilter}
          aria-label="Filter by request status"
          onChange={(event) =>
            setStatusFilter(event.target.value as LeaveRequestStatus | "")
          }
        >
          <option value="">All statuses</option>

          <option value="Draft">Draft</option>

          <option value="Pending">Pending</option>

          <option value="Approved">Approved</option>

          <option value="Rejected">Rejected</option>

          <option value="Cancelled">Cancelled</option>
        </select>

        {(search || typeFilter || statusFilter) && (
          <button
            type="button"
            className="leave-requests-toolbar__clear"
            onClick={() => {
              setSearch("");
              setTypeFilter("");
              setStatusFilter("");
            }}
          >
            Clear filters
          </button>
        )}

        <span className="leave-requests-toolbar__count">
          {filteredRequests.length} of {requests.length} requests
        </span>
      </section>

      {/* =====================================================
          TABLE
         ===================================================== */}

      <section className="leave-requests-card">
        <header className="leave-requests-card__header">
          <div>
            <h2>Leave requests</h2>

            <p>Review and manage permitted leave records</p>
          </div>

          <span>{filteredRequests.length} records</span>
        </header>

        {filteredRequests.length > 0 ? (
          <div className="leave-requests-table-scroll">
            <table className="leave-requests-table">
              <thead>
                <tr>
                  <th>Employee</th>

                  <th>Leave type</th>

                  <th>Start</th>

                  <th>End</th>

                  <th>Working days</th>

                  <th>Status</th>

                  <th>Approver</th>

                  <th>Reason</th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => {
                  const isReviewing = reviewingRequestId === request.id;

                  /*
                   * UI ownership check.
                   *
                   * Backend authorization still
                   * performs the real security
                   * validation.
                   */
                  const isOwner =
                    normalizeName(request.employeeName) ===
                    normalizeName(currentUserName);

                  /*
                   * Users may only edit/delete
                   * their OWN Pending or Draft
                   * requests.
                   */
                  const canModify =
                    isOwner &&
                    (request.status === "Pending" ||
                      request.status === "Draft");

                  /*
                   * Reviewers may only review
                   * ANOTHER person's Pending
                   * request.
                   */
                  const canReviewRequest =
                    canReview && !isOwner && request.status === "Pending";

                  const hasActions = canModify || canReviewRequest;

                  return (
                    <tr key={request.id}>
                      <td>
                        <strong>{request.employeeName}</strong>

                        {isOwner && (
                          <span className="leave-request-owner-badge">You</span>
                        )}
                      </td>

                      <td>
                        <span
                          className={[
                            "leave-type-badge",
                            `leave-type-badge--${request.leaveType.toLocaleLowerCase()}`,
                          ].join(" ")}
                        >
                          {formatLeaveType(request.leaveType)}
                        </span>
                      </td>

                      <td>{formatDate(request.startDate)}</td>

                      <td>{formatDate(request.endDate)}</td>

                      <td>
                        {countWorkingDays(request.startDate, request.endDate)}
                      </td>

                      <td>
                        <span
                          className={[
                            "vacation-request-status",
                            `vacation-request-status--${request.status.toLocaleLowerCase()}`,
                          ].join(" ")}
                        >
                          {request.status}
                        </span>
                      </td>

                      <td>{request.approverName ?? "—"}</td>

                      <td>
                        <span className="leave-request-reason">
                          {request.reason ?? "—"}
                        </span>
                      </td>

                      <td>
                        {hasActions ? (
                          <div className="leave-request-actions">
                            {/* =================================
                                  APPROVE / REJECT
                                 ================================= */}

                            {canReviewRequest && (
                              <>
                                <button
                                  type="button"
                                  className="leave-request-actions__approve"
                                  title="Approve request"
                                  disabled={isReviewing}
                                  onClick={() => void handleApprove(request)}
                                >
                                  {isReviewing ? "..." : "Approve"}
                                </button>

                                <button
                                  type="button"
                                  className="leave-request-actions__reject"
                                  title="Reject request"
                                  disabled={isReviewing}
                                  onClick={() => void handleReject(request)}
                                >
                                  {isReviewing ? "..." : "Reject"}
                                </button>
                              </>
                            )}

                            {/* =================================
                                  OWNER EDIT / DELETE
                                 ================================= */}

                            {canModify && (
                              <>
                                <button
                                  type="button"
                                  aria-label={`Edit your leave request starting ${request.startDate}`}
                                  title="Edit your request"
                                  onClick={() => onEdit(request)}
                                >
                                  <Pencil size={14} aria-hidden="true" />
                                </button>

                                <button
                                  type="button"
                                  className="leave-request-actions__delete"
                                  aria-label={`Delete your leave request starting ${request.startDate}`}
                                  title="Delete your request"
                                  onClick={() => onDelete(request)}
                                >
                                  <Trash2 size={14} aria-hidden="true" />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="leave-request-actions__none">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="leave-requests-state">
            <CalendarRange size={30} aria-hidden="true" />

            <h3>No leave requests found</h3>

            <p>Add a leave request or change the current filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}

// =========================================================
// LEAVE TYPE
// =========================================================

function formatLeaveType(leaveType: LeaveType): string {
  switch (leaveType) {
    case "Sick":
      return "Sick Leave";

    case "Parental":
      return "Parental Leave";

    case "Personal":
      return "Personal Leave";

    case "Unpaid":
      return "Unpaid Leave";

    default:
      return leaveType;
  }
}

// =========================================================
// WORKING DAYS
// =========================================================

function countWorkingDays(startValue: string, endValue: string): number {
  const startDate = parseDate(startValue);

  const endDate = parseDate(endValue);

  if (!startDate || !endDate || endDate < startDate) {
    return 0;
  }

  let count = 0;

  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay();

    if (day !== 0 && day !== 6) {
      count += 1;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

// =========================================================
// DATE
// =========================================================

function formatDate(value: string): string {
  const date = parseDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function parseDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

// =========================================================
// NAME NORMALIZATION
// =========================================================

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
