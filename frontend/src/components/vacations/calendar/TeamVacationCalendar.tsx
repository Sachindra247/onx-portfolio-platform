import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";

import type {
  LeaveRequestDto,
  LeaveRequestStatus,
  LeaveType,
} from "../../../types/vacations";

interface TeamVacationCalendarProps {
  requests: LeaveRequestDto[];
  onEdit: (request: LeaveRequestDto) => void;
}

const teamMembers = [
  "Joel William",
  "Lisa Sambleson",
  "Marcel Morisett",
  "Lauren Pereira",
  "Donna Bitaxi",
  "Ashita Pattni",
  "Sabrina Jubran",
  "Raed Jabak",
  "Zach Schneider",
];

const holidays2026: Record<string, string> = {
  "2026-01-01": "New Year's Day",
  "2026-02-16": "Family Day",
  "2026-04-03": "Good Friday",
  "2026-05-18": "Victoria Day",
  "2026-07-01": "Canada Day",
  "2026-08-03": "Civic Holiday",
  "2026-09-07": "Labour Day",
  "2026-10-12": "Thanksgiving",
  "2026-11-11": "Remembrance Day",
  "2026-12-25": "Christmas Day",
  "2026-12-26": "Boxing Day",
};

export default function TeamVacationCalendar({
  requests,
  onEdit,
}: TeamVacationCalendarProps) {
  const today = new Date();

  const [visibleDate, setVisibleDate] = useState(
    new Date(2026, today.getMonth(), 1),
  );

  const [memberFilter, setMemberFilter] = useState("all");

  const year = visibleDate.getFullYear();
  const month = visibleDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const displayedMembers = useMemo(() => {
    const names = new Set(teamMembers);

    requests.forEach((request) => {
      if (request.employeeName.trim()) {
        names.add(request.employeeName.trim());
      }
    });

    const allMembers = Array.from(names).sort((first, second) =>
      first.localeCompare(second),
    );

    return memberFilter === "all"
      ? allMembers
      : allMembers.filter((name) => name === memberFilter);
  }, [memberFilter, requests]);

  const memberOptions = useMemo(() => {
    const names = new Set(teamMembers);

    requests.forEach((request) => {
      if (request.employeeName.trim()) {
        names.add(request.employeeName.trim());
      }
    });

    return Array.from(names).sort((first, second) =>
      first.localeCompare(second),
    );
  }, [requests]);

  const requestsByMemberAndDate = useMemo(() => {
    const map = new Map<string, LeaveRequestDto>();

    requests
      .filter(
        (request) =>
          request.status !== "Rejected" && request.status !== "Cancelled",
      )
      .forEach((request) => {
        const start = parseDate(request.startDate);
        const end = parseDate(request.endDate);

        if (!start || !end) {
          return;
        }

        const current = new Date(start);

        while (current <= end) {
          const dateKey = toDateOnly(current);

          map.set(`${request.employeeName}|${dateKey}`, request);

          current.setDate(current.getDate() + 1);
        }
      });

    return map;
  }, [requests]);

  const monthLeaveDays = useMemo(() => {
    let count = 0;

    requestsByMemberAndDate.forEach((_, key) => {
      const date = key.split("|")[1];

      if (date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) {
        count += 1;
      }
    });

    return count;
  }, [month, requestsByMemberAndDate, year]);

  function changeMonth(offset: number) {
    setVisibleDate(new Date(year, month + offset, 1));
  }

  return (
    <div className="team-vacation-calendar">
      <section className="vacation-calendar-toolbar">
        <div className="vacation-calendar-month-control">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft size={17} aria-hidden="true" />
          </button>

          <div>
            <strong>
              {new Intl.DateTimeFormat("en-CA", {
                month: "long",
                year: "numeric",
              }).format(visibleDate)}
            </strong>

            <span>
              {monthLeaveDays} scheduled leave{" "}
              {monthLeaveDays === 1 ? "day" : "days"}
            </span>
          </div>

          <button
            type="button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="vacation-calendar-filter">
          <label htmlFor="vacation-member-filter">Team member</label>

          <select
            id="vacation-member-filter"
            value={memberFilter}
            onChange={(event) => setMemberFilter(event.target.value)}
          >
            <option value="all">All team members</option>

            {memberOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="vacation-calendar-legend">
        <Legend label="Approved Vacation" modifier="vacation-approved" />
        <Legend label="Pending" modifier="pending" />
        <Legend label="Sick Leave" modifier="sick" />
        <Legend label="Parental Leave" modifier="parental" />
        <Legend label="Personal / Other" modifier="personal" />
        <Legend label="Holiday" modifier="holiday" />
        <Legend label="Weekend" modifier="weekend" />
      </section>

      <section className="vacation-calendar-card">
        <header className="vacation-calendar-card__header">
          <div>
            <h2>Team calendar</h2>
            <p>Approved and pending leave across the team</p>
          </div>

          <CalendarDays size={19} aria-hidden="true" />
        </header>

        <div className="vacation-calendar-scroll">
          <table className="vacation-calendar-table">
            <thead>
              <tr>
                <th className="vacation-calendar-name-column">Team Member</th>

                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;

                  const date = new Date(year, month, day);

                  const dateKey = toDateOnly(date);

                  const weekend = isWeekend(date);

                  const holiday = holidays2026[dateKey];

                  return (
                    <th
                      key={day}
                      className={[
                        weekend ? "is-weekend" : "",
                        holiday ? "is-holiday" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      title={holiday ?? undefined}
                    >
                      <span>{day}</span>

                      <small>
                        {new Intl.DateTimeFormat("en-CA", {
                          weekday: "short",
                        })
                          .format(date)
                          .slice(0, 2)}
                      </small>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {displayedMembers.map((member) => (
                <tr key={member}>
                  <td className="vacation-calendar-name-column">
                    <strong>{member}</strong>
                  </td>

                  {Array.from(
                    {
                      length: daysInMonth,
                    },
                    (_, index) => {
                      const day = index + 1;

                      const date = new Date(year, month, day);

                      const dateKey = toDateOnly(date);

                      const weekend = isWeekend(date);

                      const holiday = holidays2026[dateKey];

                      const request = requestsByMemberAndDate.get(
                        `${member}|${dateKey}`,
                      );

                      const modifier = request
                        ? getRequestModifier(request.leaveType, request.status)
                        : "";

                      return (
                        <td
                          key={day}
                          className={[
                            "vacation-calendar-day",
                            weekend ? "is-weekend" : "",
                            holiday ? "is-holiday" : "",
                            modifier
                              ? `vacation-calendar-day--${modifier}`
                              : "",
                            request ? "has-leave" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          title={
                            request
                              ? buildRequestTitle(request)
                              : holiday
                                ? holiday
                                : undefined
                          }
                          onClick={() => {
                            if (request) {
                              onEdit(request);
                            }
                          }}
                        >
                          {request && (
                            <span
                              aria-label={`${request.leaveType}, ${request.status}`}
                            />
                          )}
                        </td>
                      );
                    },
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

interface LegendProps {
  label: string;
  modifier: string;
}

function Legend({ label, modifier }: LegendProps) {
  return (
    <span className="vacation-calendar-legend__item">
      <span
        className={[
          "vacation-calendar-legend__swatch",
          `vacation-calendar-legend__swatch--${modifier}`,
        ].join(" ")}
      />

      {label}
    </span>
  );
}

function getRequestModifier(
  leaveType: LeaveType,
  status: LeaveRequestStatus,
): string {
  if (status === "Pending") {
    return "pending";
  }

  switch (leaveType) {
    case "Vacation":
      return "vacation-approved";

    case "Sick":
      return "sick";

    case "Parental":
      return "parental";

    case "Personal":
    case "Bereavement":
    case "Unpaid":
    case "Other":
      return "personal";
  }
}

function buildRequestTitle(request: LeaveRequestDto): string {
  return [
    request.employeeName,
    formatLeaveType(request.leaveType),
    request.status,
    `${formatDate(request.startDate)} – ${formatDate(request.endDate)}`,
  ].join("\n");
}

function formatLeaveType(leaveType: LeaveType): string {
  switch (leaveType) {
    case "Vacation":
      return "Vacation";
    case "Sick":
      return "Sick Leave";
    case "Parental":
      return "Parental Leave";
    case "Personal":
      return "Personal Leave";
    case "Bereavement":
      return "Bereavement";
    case "Unpaid":
      return "Unpaid Leave";
    case "Other":
      return "Other Leave";
  }
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();

  return day === 0 || day === 6;
}

function parseDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toDateOnly(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
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
