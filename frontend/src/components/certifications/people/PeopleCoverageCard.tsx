import {
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  CircleAlert,
} from "lucide-react";
import { useState } from "react";

import type { PersonCoverage } from "../../../types/personCoverage";
import { formatCertificationStatus } from "../../../utils/certificationAnalytics";

interface PeopleCoverageCardProps {
  person: PersonCoverage;
}

export default function PeopleCoverageCard({
  person,
}: PeopleCoverageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const health = getHealthContent(person.health);

  const HealthIcon = health.icon;

  return (
    <article
      className={[
        "people-coverage-card",
        `people-coverage-card--${person.health}`,
        isExpanded ? "people-coverage-card--expanded" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="people-coverage-card__header">
        <div>
          <h3>{person.personName}</h3>

          <div
            className={[
              "people-health-badge",
              `people-health-badge--${person.health}`,
            ].join(" ")}
          >
            <HealthIcon size={13} aria-hidden="true" />
            {health.label}
          </div>
        </div>

        <div className="people-coverage-card__count">
          <strong>{person.certificationCount}</strong>
          <span>Certifications</span>
        </div>
      </div>

      <div className="people-coverage-card__coverage">
        <div className="people-coverage-card__coverage-heading">
          <span>Current coverage</span>
          <strong>{person.coveragePercent}%</strong>
        </div>

        <div
          className="people-coverage-progress"
          role="progressbar"
          aria-label={`${person.personName} certification coverage`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={person.coveragePercent}
        >
          <span
            style={{
              width: `${person.coveragePercent}%`,
            }}
          />
        </div>
      </div>

      <div className="people-coverage-card__metrics">
        <div>
          <strong>{person.currentCount}</strong>
          <span>Current</span>
        </div>

        <div>
          <strong>{person.expiringSoonCount}</strong>
          <span>Expiring</span>
        </div>

        <div>
          <strong>{person.expiredCount}</strong>
          <span>Expired</span>
        </div>

        <div>
          <strong>{person.vendorNames.length}</strong>
          <span>Vendors</span>
        </div>
      </div>

      <div className="people-coverage-card__vendors">
        {person.vendorNames.slice(0, 5).map((vendorName) => (
          <span key={vendorName}>{vendorName}</span>
        ))}

        {person.vendorNames.length > 5 && (
          <span>+{person.vendorNames.length - 5}</span>
        )}
      </div>

      <button
        type="button"
        className="people-coverage-card__toggle"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
      >
        {isExpanded ? "Hide details" : "View details"}

        {isExpanded ? (
          <ChevronUp size={16} aria-hidden="true" />
        ) : (
          <ChevronDown size={16} aria-hidden="true" />
        )}
      </button>

      {isExpanded && (
        <div className="people-coverage-card__details">
          {person.certifications.map((certification) => (
            <div key={certification.id} className="people-certification-row">
              <div className="people-certification-row__identity">
                <strong>{certification.certificationName}</strong>
                <span>{certification.vendorName}</span>
              </div>

              <div className="people-certification-row__dates">
                <span>
                  Completed: {formatDate(certification.dateCompleted)}
                </span>

                <span>Expires: {formatDate(certification.expiryDate)}</span>
              </div>

              <span
                className={[
                  "certification-status",
                  `certification-status--${getStatusClass(
                    certification.status,
                  )}`,
                ].join(" ")}
              >
                {formatCertificationStatus(certification.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function getHealthContent(health: PersonCoverage["health"]) {
  switch (health) {
    case "critical":
      return {
        label: "Action needed",
        icon: CircleAlert,
      };

    case "warning":
      return {
        label: "Expiring soon",
        icon: AlertTriangle,
      };

    case "healthy":
      return {
        label: "Healthy",
        icon: BadgeCheck,
      };
  }
}

function getStatusClass(
  status: PersonCoverage["certifications"][number]["status"],
): string {
  switch (status) {
    case "Complete":
      return "complete";
    case "InProgress":
      return "in-progress";
    case "Pending":
      return "pending";
    case "Tbd":
      return "tbd";
    case "Expired":
      return "expired";
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
