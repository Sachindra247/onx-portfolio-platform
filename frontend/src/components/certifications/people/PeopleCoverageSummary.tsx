import { AlertTriangle, BadgeCheck, CircleAlert, Users } from "lucide-react";

import type { PersonCoverage } from "../../../types/personCoverage";

interface PeopleCoverageSummaryProps {
  people: PersonCoverage[];
}

export default function PeopleCoverageSummary({
  people,
}: PeopleCoverageSummaryProps) {
  const healthyCount = people.filter(
    (person) => person.health === "healthy",
  ).length;

  const warningCount = people.filter(
    (person) => person.health === "warning",
  ).length;

  const criticalCount = people.filter(
    (person) => person.health === "critical",
  ).length;

  const averageCoverage =
    people.length === 0
      ? 0
      : Math.round(
          people.reduce((total, person) => total + person.coveragePercent, 0) /
            people.length,
        );

  const cards = [
    {
      label: "People",
      value: people.length,
      detail: "Unique individuals",
      icon: Users,
      modifier: "people",
    },
    {
      label: "Healthy",
      value: healthyCount,
      detail: "No urgent renewals",
      icon: BadgeCheck,
      modifier: "healthy",
    },
    {
      label: "Needs attention",
      value: warningCount,
      detail: "Expiring within 90 days",
      icon: AlertTriangle,
      modifier: "warning",
    },
    {
      label: "Critical",
      value: criticalCount,
      detail: "Expired certifications",
      icon: CircleAlert,
      modifier: "critical",
    },
    {
      label: "Average coverage",
      value: `${averageCoverage}%`,
      detail: "Current certifications",
      icon: BadgeCheck,
      modifier: "coverage",
    },
  ];

  return (
    <section
      className="people-coverage-summary"
      aria-label="People coverage summary"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className={[
              "people-summary-card",
              `people-summary-card--${card.modifier}`,
            ].join(" ")}
          >
            <span className="people-summary-card__icon">
              <Icon size={18} aria-hidden="true" />
            </span>

            <span className="people-summary-card__label">{card.label}</span>

            <strong className="people-summary-card__value">{card.value}</strong>

            <span className="people-summary-card__detail">{card.detail}</span>
          </article>
        );
      })}
    </section>
  );
}
