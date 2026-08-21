import { ArrowRight, CalendarDays, Palmtree, Users } from "lucide-react";
import { useMemo } from "react";

import type { LeaveRequestDto } from "../../../types/vacations";

interface PeopleBalancesViewProps {
  requests: LeaveRequestDto[];

  isGlobalAdministrator: boolean;

  onViewRequests: (employeeName: string) => void;
}

interface PersonSummary {
  employeeName: string;
  approvedVacationDays: number;
  pendingDays: number;
  sickDays: number;
  totalRequests: number;
  nextLeave: LeaveRequestDto | null;
}

export default function PeopleBalancesView({
  requests,
  isGlobalAdministrator,
  onViewRequests,
}: PeopleBalancesViewProps) {
  const people = useMemo(() => buildPeopleSummaries(requests), [requests]);

  const approvedVacationDays = people.reduce(
    (total, person) => total + person.approvedVacationDays,
    0,
  );

  const pendingDays = people.reduce(
    (total, person) => total + person.pendingDays,
    0,
  );

  return (
    <div className="vacation-people-view">
      {/* =====================================================
          HEADING
         ===================================================== */}

      <header className="vacation-people-view__heading">
        <div>
          <h2>People &amp; Balances</h2>

          <p>
            {isGlobalAdministrator
              ? "Vacation and leave information across all user groups."
              : "Vacation and leave information for members of your user group."}
          </p>
        </div>

        <span className="vacation-people-view__scope">
          <Users size={14} aria-hidden="true" />

          {isGlobalAdministrator ? "All groups" : "My group"}
        </span>
      </header>

      {/* =====================================================
          SUMMARY
         ===================================================== */}

      <section className="vacation-people-summary">
        <article>
          <Users size={18} aria-hidden="true" />

          <div>
            <strong>{people.length}</strong>

            <span>People tracked</span>
          </div>
        </article>

        <article>
          <Palmtree size={18} aria-hidden="true" />

          <div>
            <strong>{approvedVacationDays}</strong>

            <span>Approved vacation days</span>
          </div>
        </article>

        <article>
          <CalendarDays size={18} aria-hidden="true" />

          <div>
            <strong>{pendingDays}</strong>

            <span>Pending days</span>
          </div>
        </article>
      </section>

      {/* =====================================================
          PEOPLE
         ===================================================== */}

      {people.length > 0 ? (
        <section className="vacation-people-grid">
          {people.map((person) => (
            <article key={person.employeeName} className="vacation-person-card">
              <header className="vacation-person-card__header">
                <div>
                  <h3>{person.employeeName}</h3>

                  <span>
                    {person.totalRequests}{" "}
                    {person.totalRequests === 1 ? "request" : "requests"}
                  </span>
                </div>
              </header>

              <div className="vacation-person-card__metrics">
                <div>
                  <strong>{person.approvedVacationDays}</strong>

                  <span>Vacation</span>
                </div>

                <div>
                  <strong>{person.pendingDays}</strong>

                  <span>Pending</span>
                </div>

                <div>
                  <strong>{person.sickDays}</strong>

                  <span>Sick</span>
                </div>
              </div>

              <div className="vacation-person-card__next">
                <span>Next leave</span>

                {person.nextLeave ? (
                  <>
                    <strong>
                      {formatDateRange(
                        person.nextLeave.startDate,
                        person.nextLeave.endDate,
                      )}
                    </strong>

                    <small>
                      {person.nextLeave.leaveType} · {person.nextLeave.status}
                    </small>
                  </>
                ) : (
                  <strong>No upcoming leave</strong>
                )}
              </div>

              <footer className="vacation-person-card__footer">
                <button
                  type="button"
                  className="vacation-person-card__view-button"
                  onClick={() => onViewRequests(person.employeeName)}
                >
                  View Requests
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </footer>
            </article>
          ))}
        </section>
      ) : (
        <div className="vacation-overview-empty">
          <Users size={29} aria-hidden="true" />

          <h3>No people data yet</h3>

          <p>People summaries will appear after leave requests are created.</p>
        </div>
      )}
    </div>
  );
}

// =========================================================
// BUILD PEOPLE SUMMARIES
// =========================================================

function buildPeopleSummaries(requests: LeaveRequestDto[]): PersonSummary[] {
  const groups = new Map<string, LeaveRequestDto[]>();

  requests.forEach((request) => {
    const existing = groups.get(request.employeeName) ?? [];

    existing.push(request);

    groups.set(request.employeeName, existing);
  });

  const today = startOfToday();

  return Array.from(groups.entries())
    .map(([employeeName, records]) => {
      const approvedVacationDays = records
        .filter(
          (request) =>
            request.status === "Approved" && request.leaveType === "Vacation",
        )
        .reduce(
          (total, request) =>
            total + countWorkingDays(request.startDate, request.endDate),
          0,
        );

      const pendingDays = records
        .filter((request) => request.status === "Pending")
        .reduce(
          (total, request) =>
            total + countWorkingDays(request.startDate, request.endDate),
          0,
        );

      const sickDays = records
        .filter(
          (request) =>
            request.status === "Approved" && request.leaveType === "Sick",
        )
        .reduce(
          (total, request) =>
            total + countWorkingDays(request.startDate, request.endDate),
          0,
        );

      const nextLeave =
        records
          .filter((request) => {
            if (request.status !== "Approved" && request.status !== "Pending") {
              return false;
            }

            const endDate = parseDate(request.endDate);

            return endDate !== null && endDate >= today;
          })
          .sort((first, second) =>
            first.startDate.localeCompare(second.startDate),
          )[0] ?? null;

      return {
        employeeName,
        approvedVacationDays,
        pendingDays,
        sickDays,
        totalRequests: records.length,
        nextLeave,
      };
    })
    .sort((first, second) =>
      first.employeeName.localeCompare(second.employeeName),
    );
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
// DATE HELPERS
// =========================================================

function startOfToday(): Date {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function parseDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDateRange(start: string, end: string): string {
  return start === end
    ? formatDate(start)
    : `${formatDate(start)} – ${formatDate(end)}`;
}

function formatDate(value: string): string {
  const date = parseDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
