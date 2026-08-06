import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Palmtree,
  ShieldCheck,
  Users,
} from "lucide-react";

export interface VacationOverviewItem {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface VacationOverviewProps {
  leaveRequests?: VacationOverviewItem[];
  teamSize?: number;
}

export default function VacationOverview({
  leaveRequests = [],
  teamSize = 9,
}: VacationOverviewProps) {
  const today = startOfToday();

  const peopleAwayToday = leaveRequests.filter(
    (request) =>
      request.status === "Approved" &&
      isDateWithinRange(today, request.startDate, request.endDate),
  );

  const pendingRequests = leaveRequests.filter(
    (request) => request.status === "Pending",
  );

  const upcomingLeave = leaveRequests
    .filter((request) => {
      const startDate = parseDateOnly(request.startDate);

      if (!startDate) {
        return false;
      }

      const daysUntilStart = Math.ceil(
        (startDate.getTime() - today.getTime()) / 86_400_000,
      );

      return (
        request.status === "Approved" &&
        daysUntilStart >= 0 &&
        daysUntilStart <= 30
      );
    })
    .sort((first, second) => first.startDate.localeCompare(second.startDate));

  const availabilityPercent =
    teamSize === 0
      ? 100
      : Math.max(
          0,
          Math.round(((teamSize - peopleAwayToday.length) / teamSize) * 100),
        );

  const overlappingDates = findCoverageWarnings(leaveRequests);

  const leaveDistribution = buildLeaveDistribution(leaveRequests);

  const summaryCards = [
    {
      label: "People away today",
      value: peopleAwayToday.length,
      detail:
        peopleAwayToday.length === 0
          ? "Everyone is available"
          : peopleAwayToday
              .slice(0, 2)
              .map((request) => request.employeeName)
              .join(", "),
      icon: Users,
      modifier: "away",
    },
    {
      label: "Pending requests",
      value: pendingRequests.length,
      detail: "Awaiting review",
      icon: Clock3,
      modifier: "pending",
    },
    {
      label: "Upcoming leave",
      value: upcomingLeave.length,
      detail: "Approved within 30 days",
      icon: CalendarClock,
      modifier: "upcoming",
    },
    {
      label: "Team availability",
      value: `${availabilityPercent}%`,
      detail: "Available today",
      icon: ShieldCheck,
      modifier: "availability",
    },
  ];

  return (
    <div className="vacation-overview">
      <section
        className="vacation-overview-summary"
        aria-label="Vacation overview summary"
      >
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className={[
                "vacation-overview-card",
                `vacation-overview-card--${card.modifier}`,
              ].join(" ")}
            >
              <span className="vacation-overview-card__icon">
                <Icon size={19} aria-hidden="true" />
              </span>

              <span className="vacation-overview-card__label">
                {card.label}
              </span>

              <strong className="vacation-overview-card__value">
                {card.value}
              </strong>

              <span className="vacation-overview-card__detail">
                {card.detail}
              </span>
            </article>
          );
        })}
      </section>

      <div className="vacation-overview-grid">
        <section className="vacation-overview-panel">
          <header className="vacation-overview-panel__header">
            <div>
              <h2>Upcoming leave</h2>
              <p>Approved absences starting within the next 30 days</p>
            </div>

            <Palmtree size={19} aria-hidden="true" />
          </header>

          {upcomingLeave.length > 0 ? (
            <div className="vacation-upcoming-list">
              {upcomingLeave.slice(0, 6).map((request) => (
                <article key={request.id} className="vacation-upcoming-item">
                  <div>
                    <strong>{request.employeeName}</strong>

                    <span>{request.leaveType}</span>
                  </div>

                  <div className="vacation-upcoming-item__dates">
                    <strong>
                      {formatDateRange(request.startDate, request.endDate)}
                    </strong>

                    <span
                      className={[
                        "vacation-request-status",
                        `vacation-request-status--${request.status.toLocaleLowerCase()}`,
                      ].join(" ")}
                    >
                      {request.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="vacation-overview-empty">
              <CalendarClock size={29} aria-hidden="true" />

              <h3>No upcoming leave</h3>

              <p>
                Approved leave starting within the next 30 days will appear
                here.
              </p>
            </div>
          )}
        </section>

        <section className="vacation-overview-panel">
          <header className="vacation-overview-panel__header">
            <div>
              <h2>Coverage warnings</h2>
              <p>Dates with multiple team members away</p>
            </div>

            <ShieldCheck size={19} aria-hidden="true" />
          </header>

          {overlappingDates.length > 0 ? (
            <div className="vacation-warning-list">
              {overlappingDates.slice(0, 6).map((warning) => (
                <article key={warning.date} className="vacation-warning-item">
                  <div>
                    <strong>{formatDate(warning.date)}</strong>

                    <span>{warning.people.join(", ")}</span>
                  </div>

                  <span>{warning.people.length} away</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="vacation-overview-empty vacation-overview-empty--success">
              <CheckCircle2 size={29} aria-hidden="true" />

              <h3>No coverage warnings</h3>

              <p>No dates currently have multiple approved absences.</p>
            </div>
          )}
        </section>
      </div>

      <section className="vacation-overview-panel">
        <header className="vacation-overview-panel__header">
          <div>
            <h2>Leave distribution</h2>
            <p>Current requests grouped by leave type</p>
          </div>
        </header>

        {leaveDistribution.length > 0 ? (
          <div className="vacation-distribution">
            {leaveDistribution.map((item) => (
              <div key={item.label} className="vacation-distribution__row">
                <span>{item.label}</span>

                <div className="vacation-distribution__track">
                  <span
                    style={{
                      width: `${item.percent}%`,
                    }}
                  />
                </div>

                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="vacation-overview-empty">
            <Palmtree size={29} aria-hidden="true" />

            <h3>No leave activity yet</h3>

            <p>
              Leave distribution will appear after the first request is created.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

interface CoverageWarning {
  date: string;
  people: string[];
}

function findCoverageWarnings(
  leaveRequests: VacationOverviewItem[],
): CoverageWarning[] {
  const peopleByDate = new Map<string, Set<string>>();

  leaveRequests
    .filter((request) => request.status === "Approved")
    .forEach((request) => {
      const dates = getDateRange(request.startDate, request.endDate);

      dates.forEach((date) => {
        const people = peopleByDate.get(date) ?? new Set<string>();

        people.add(request.employeeName);
        peopleByDate.set(date, people);
      });
    });

  return Array.from(peopleByDate.entries())
    .filter(([, people]) => people.size >= 2)
    .map(([date, people]) => ({
      date,
      people: Array.from(people).sort(),
    }))
    .sort((first, second) => first.date.localeCompare(second.date));
}

function buildLeaveDistribution(leaveRequests: VacationOverviewItem[]) {
  const totals = new Map<string, number>();

  leaveRequests.forEach((request) => {
    totals.set(request.leaveType, (totals.get(request.leaveType) ?? 0) + 1);
  });

  const maximum = Math.max(1, ...totals.values());

  return Array.from(totals.entries())
    .map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / maximum) * 100),
    }))
    .sort((first, second) => second.count - first.count);
}

function isDateWithinRange(
  date: Date,
  startValue: string,
  endValue: string,
): boolean {
  const startDate = parseDateOnly(startValue);
  const endDate = parseDateOnly(endValue);

  if (!startDate || !endDate) {
    return false;
  }

  return date >= startDate && date <= endDate;
}

function getDateRange(startValue: string, endValue: string): string[] {
  const startDate = parseDateOnly(startValue);
  const endDate = parseDateOnly(endValue);

  if (!startDate || !endDate || endDate < startDate) {
    return [];
  }

  const dates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const day = currentDate.getDay();

    if (day !== 0 && day !== 6) {
      dates.push(toDateOnly(currentDate));
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function parseDateOnly(value: string): Date | null {
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

function startOfToday(): Date {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function formatDateRange(startValue: string, endValue: string): string {
  if (startValue === endValue) {
    return formatDate(startValue);
  }

  return `${formatDate(startValue)} – ${formatDate(endValue)}`;
}

function formatDate(value: string): string {
  const date = parseDateOnly(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
