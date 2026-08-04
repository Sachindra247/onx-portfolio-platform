import {
  AlertTriangle,
  Award,
  Building2,
  CalendarClock,
  Users,
} from "lucide-react";

import type {
  CertificationSummary,
  CertificationsSection,
} from "../../../types/certifications";

interface CertificationStatsProps {
  summary: CertificationSummary;
  onSectionChange: (section: CertificationsSection) => void;
}

export default function CertificationStats({
  summary,
  onSectionChange,
}: CertificationStatsProps) {
  const cards = [
    {
      label: "Vendors tracked",
      value: summary.vendorCount,
      description: "Active partnerships",
      section: "vendors" as const,
      icon: Building2,
      accent: "teal",
    },
    {
      label: "Cert records",
      value: summary.certificationCount,
      description: "Individual entries",
      section: "certifications" as const,
      icon: Award,
      accent: "gold",
    },
    {
      label: "People certified",
      value: summary.peopleCount,
      description: "Unique individuals",
      section: "people" as const,
      icon: Users,
      accent: "green",
    },
    {
      label: "Open gaps",
      value: summary.gapCount,
      description: "Flagged needs",
      section: "gaps" as const,
      icon: AlertTriangle,
      accent: "red",
    },
    {
      label: "Expiring under 90d",
      value: summary.expiringWithin90Days,
      description: "Renewal attention",
      section: "expiring" as const,
      icon: CalendarClock,
      accent: "blue",
    },
  ];

  return (
    <section
      className="certification-stats"
      aria-label="Certification portfolio summary"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <button
            key={card.label}
            type="button"
            className={[
              "certification-stat-card",
              `certification-stat-card--${card.accent}`,
            ].join(" ")}
            onClick={() => onSectionChange(card.section)}
          >
            <span className="certification-stat-card__arrow">›</span>

            <span className="certification-stat-card__icon">
              <Icon size={18} aria-hidden="true" />
            </span>

            <span className="certification-stat-card__label">{card.label}</span>

            <strong className="certification-stat-card__value">
              {card.value}
            </strong>

            <span className="certification-stat-card__description">
              {card.description}
            </span>
          </button>
        );
      })}
    </section>
  );
}
