import { AlertTriangle, CheckCircle2, ShieldAlert, Users } from "lucide-react";
import { useMemo } from "react";

import type { LeaveRequestDto } from "../../../types/vacations";

interface CoverageWarningsViewProps {
  requests: LeaveRequestDto[];
}

interface CoverageWarning {
  date: string;
  people: string[];
  severity: "warning" | "critical";
}

export default function CoverageWarningsView({
  requests,
}: CoverageWarningsViewProps) {
  const warnings = useMemo(() => buildCoverageWarnings(requests), [requests]);

  const criticalCount = warnings.filter(
    (warning) => warning.severity === "critical",
  ).length;

  return (
    <div className="vacation-coverage-view">
      <section className="vacation-coverage-summary">
        <article>
          <ShieldAlert size={18} />
          <div>
            <strong>{warnings.length}</strong>
            <span>Coverage warnings</span>
          </div>
        </article>

        <article>
          <AlertTriangle size={18} />
          <div>
            <strong>{criticalCount}</strong>
            <span>Critical dates</span>
          </div>
        </article>

        <article>
          <Users size={18} />
          <div>
            <strong>
              {new Set(warnings.flatMap((warning) => warning.people)).size}
            </strong>
            <span>People involved</span>
          </div>
        </article>
      </section>

      <section className="vacation-coverage-card">
        <header>
          <div>
            <h2>Team coverage</h2>
            <p>Dates where multiple approved absences overlap</p>
          </div>
        </header>

        {warnings.length > 0 ? (
          <div className="vacation-coverage-list">
            {warnings.map((warning) => (
              <article
                key={warning.date}
                className={[
                  "vacation-coverage-warning",
                  `vacation-coverage-warning--${warning.severity}`,
                ].join(" ")}
              >
                <span className="vacation-coverage-warning__icon">
                  <AlertTriangle size={17} aria-hidden="true" />
                </span>

                <div>
                  <strong>{formatDate(warning.date)}</strong>

                  <p>
                    {warning.people.length} team members have approved leave.
                  </p>

                  <span>{warning.people.join(", ")}</span>
                </div>

                <span className="vacation-coverage-warning__status">
                  {warning.severity === "critical"
                    ? "High coverage risk"
                    : "Review coverage"}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="vacation-overview-empty vacation-overview-empty--success">
            <CheckCircle2 size={29} aria-hidden="true" />

            <h3>No coverage conflicts</h3>

            <p>
              There are currently no business days with multiple approved
              absences.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function buildCoverageWarnings(requests: LeaveRequestDto[]): CoverageWarning[] {
  const peopleByDate = new Map<string, Set<string>>();

  requests
    .filter((request) => request.status === "Approved")
    .forEach((request) => {
      const start = parseDate(request.startDate);
      const end = parseDate(request.endDate);

      if (!start || !end) {
        return;
      }

      const current = new Date(start);

      while (current <= end) {
        const day = current.getDay();

        if (day !== 0 && day !== 6) {
          const key = toDateOnly(current);

          const people = peopleByDate.get(key) ?? new Set<string>();

          people.add(request.employeeName);

          peopleByDate.set(key, people);
        }

        current.setDate(current.getDate() + 1);
      }
    });

  return Array.from(peopleByDate.entries())
    .filter(([, people]) => people.size >= 2)
    .map(([date, people]) => ({
      date,
      people: Array.from(people).sort(),
      severity: people.size >= 3 ? ("critical" as const) : ("warning" as const),
    }))
    .sort((first, second) => first.date.localeCompare(second.date));
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
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
