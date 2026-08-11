import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  Pencil,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import type {
  CertificationDto,
  CertificationStatus,
} from "../../../types/certifications";

import type {
  ExpiringCertification,
  ExpiryUrgency,
} from "../../../types/expiryAnalytics";

import { buildExpiryAnalytics } from "../../../utils/expiryAnalytics";

import { formatCertificationStatus } from "../../../utils/certificationAnalytics";

interface ExpiringCertificationsViewProps {
  canManage: boolean;
  certifications: CertificationDto[];
  onEdit: (certification: CertificationDto) => void;
}

type ExpiryFilter = "" | ExpiryUrgency;

export default function ExpiringCertificationsView({
  certifications,
  canManage,
  onEdit,
}: ExpiringCertificationsViewProps) {
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<ExpiryFilter>("");

  const analytics = useMemo(
    () => buildExpiryAnalytics(certifications),
    [certifications],
  );

  const vendorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          analytics.expiring
            .filter(hasRealExpiryDate)
            .map((item) => item.certification.vendorName),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [analytics.expiring],
  );

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return analytics.expiring.filter((item) => {
      if (!hasRealExpiryDate(item)) {
        return false;
      }

      const certification = item.certification;

      const matchesSearch =
        !normalizedSearch ||
        certification.personName
          .toLocaleLowerCase()
          .includes(normalizedSearch) ||
        certification.vendorName
          .toLocaleLowerCase()
          .includes(normalizedSearch) ||
        certification.certificationName
          .toLocaleLowerCase()
          .includes(normalizedSearch);

      const matchesVendor =
        !vendorFilter || certification.vendorName === vendorFilter;

      const matchesUrgency = !urgencyFilter || item.urgency === urgencyFilter;

      return matchesSearch && matchesVendor && matchesUrgency;
    });
  }, [analytics.expiring, search, urgencyFilter, vendorFilter]);

  const expiredPeople = useMemo(() => {
    const groups = new Map<string, ExpiringCertification[]>();

    analytics.expiring
      .filter((item) => item.urgency === "expired" && hasRealExpiryDate(item))
      .forEach((item) => {
        const personName = item.certification.personName.trim();

        const existing = groups.get(personName) ?? [];

        existing.push(item);

        groups.set(personName, existing);
      });

    return Array.from(groups.entries())
      .map(([personName, records]) => ({
        personName,
        records: [...records].sort(
          (first, second) => first.daysRemaining - second.daysRemaining,
        ),
      }))
      .sort((first, second) =>
        first.personName.localeCompare(second.personName),
      );
  }, [analytics.expiring]);

  const summaryCards = [
    {
      label: "Expired",
      value: analytics.summary.expired,
      description: "Immediate action required",
      modifier: "expired",
      icon: CircleAlert,
      filter: "expired" as const,
    },
    {
      label: "Under 30 days",
      value: analytics.summary.under30,
      description: "Renewal required soon",
      modifier: "urgent",
      icon: AlertTriangle,
      filter: "30" as const,
    },
    {
      label: "31–60 days",
      value: analytics.summary.under60,
      description: "Plan upcoming renewals",
      modifier: "warning",
      icon: CalendarClock,
      filter: "60" as const,
    },
    {
      label: "61–90 days",
      value: analytics.summary.under90,
      description: "Renewal planning window",
      modifier: "planning",
      icon: CalendarClock,
      filter: "90" as const,
    },
    {
      label: "Average time",
      value:
        analytics.summary.averageDaysRemaining > 0
          ? `${analytics.summary.averageDaysRemaining}d`
          : "—",
      description: "Average future expiry",
      modifier: "average",
      icon: CalendarClock,
      filter: "" as const,
    },
  ];

  return (
    <div className="expiring-certifications">
      <section
        className="expiry-summary"
        aria-label="Certification expiry summary"
      >
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.label}
              type="button"
              className={[
                "expiry-summary-card",
                `expiry-summary-card--${card.modifier}`,
                urgencyFilter === card.filter && card.filter
                  ? "expiry-summary-card--selected"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() =>
                setUrgencyFilter((current) =>
                  current === card.filter ? "" : card.filter,
                )
              }
            >
              <span className="expiry-summary-card__icon">
                <Icon size={18} aria-hidden="true" />
              </span>

              <span className="expiry-summary-card__label">{card.label}</span>

              <strong className="expiry-summary-card__value">
                {card.value}
              </strong>

              <span className="expiry-summary-card__description">
                {card.description}
              </span>
            </button>
          );
        })}
      </section>

      <section className="expiry-table-card">
        <header className="expiry-table-card__header">
          <div>
            <h2>Renewal schedule</h2>
            <p>Certifications ordered by nearest expiry date</p>
          </div>

          <span>{filteredRecords.length} records</span>
        </header>

        <div className="expiry-toolbar">
          <div className="expiry-search">
            <Search size={16} aria-hidden="true" />

            <input
              type="search"
              value={search}
              placeholder="Search person, vendor, or certification..."
              aria-label="Search expiring certifications"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={vendorFilter}
            aria-label="Filter by vendor"
            onChange={(event) => setVendorFilter(event.target.value)}
          >
            <option value="">All vendors</option>

            {vendorOptions.map((vendorName) => (
              <option key={vendorName} value={vendorName}>
                {vendorName}
              </option>
            ))}
          </select>

          <select
            value={urgencyFilter}
            aria-label="Filter by expiry urgency"
            onChange={(event) =>
              setUrgencyFilter(event.target.value as ExpiryFilter)
            }
          >
            <option value="">All expiry windows</option>
            <option value="expired">Expired</option>
            <option value="30">Under 30 days</option>
            <option value="60">31–60 days</option>
            <option value="90">61–90 days</option>
            <option value="healthy">Over 90 days</option>
          </select>

          {(search || vendorFilter || urgencyFilter) && (
            <button
              type="button"
              className="expiry-toolbar__clear"
              onClick={() => {
                setSearch("");
                setVendorFilter("");
                setUrgencyFilter("");
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredRecords.length > 0 ? (
          <div className="expiry-table-scroll">
            <table className="expiry-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Vendor</th>
                  <th>Certification</th>
                  <th>Status</th>
                  <th>Expiry date</th>
                  <th>Remaining</th>
                  <th>Urgency</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((item) => {
                  const certification = item.certification;

                  return (
                    <tr key={certification.id}>
                      <td>
                        <strong>{certification.personName}</strong>
                      </td>

                      <td>{certification.vendorName}</td>

                      <td>{certification.certificationName}</td>

                      <td>
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
                      </td>

                      <td>{formatDate(certification.expiryDate)}</td>

                      <td>
                        <strong
                          className={`expiry-days expiry-days--${item.urgency}`}
                        >
                          {formatDaysRemaining(item.daysRemaining)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={[
                            "expiry-urgency",
                            `expiry-urgency--${item.urgency}`,
                          ].join(" ")}
                        >
                          {formatUrgency(item.urgency)}
                        </span>
                      </td>

                      <td>
                        {canManage && (
                          <button
                            type="button"
                            className="expiry-edit-button"
                            aria-label={`Edit ${certification.certificationName}`}
                            onClick={() => onEdit(certification)}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="expiry-empty">
            <CalendarClock size={30} aria-hidden="true" />
            <h3>No certifications found</h3>
            <p>Try changing the current search or expiry filters.</p>
          </div>
        )}
      </section>
      <section className="expired-people-card">
        <header className="expired-people-card__header">
          <div>
            <h2>Expired certifications by person</h2>
            <p>People with one or more expired certification records</p>
          </div>

          <span>{expiredPeople.length} people</span>
        </header>

        {expiredPeople.length > 0 ? (
          <div className="expired-people-grid">
            {expiredPeople.map((person) => (
              <article key={person.personName} className="expired-person-card">
                <div className="expired-person-card__header">
                  <div>
                    <h3>{person.personName}</h3>
                    <span>
                      {person.records.length} expired{" "}
                      {person.records.length === 1
                        ? "certification"
                        : "certifications"}
                    </span>
                  </div>

                  <CircleAlert size={19} aria-hidden="true" />
                </div>

                <div className="expired-person-card__records">
                  {person.records.map((item) => (
                    <div
                      key={item.certification.id}
                      className="expired-person-record"
                    >
                      <div>
                        <strong>{item.certification.certificationName}</strong>

                        <span>{item.certification.vendorName}</span>
                      </div>

                      <div className="expired-person-record__meta">
                        <span>
                          Expired {formatDate(item.certification.expiryDate)}
                        </span>

                        <strong>
                          {formatDaysRemaining(item.daysRemaining)}
                        </strong>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          aria-label={`Edit ${item.certification.certificationName}`}
                          onClick={() => onEdit(item.certification)}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="expired-people-empty">
            <BadgeCheck size={28} aria-hidden="true" />
            <h3>No expired certifications</h3>
            <p>There are currently no expired certification records.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function hasRealExpiryDate(item: ExpiringCertification): boolean {
  return item.daysRemaining !== Number.MAX_SAFE_INTEGER;
}

function formatUrgency(urgency: ExpiryUrgency): string {
  switch (urgency) {
    case "expired":
      return "Expired";
    case "30":
      return "Immediate";
    case "60":
      return "Upcoming";
    case "90":
      return "Planning";
    case "healthy":
      return "Healthy";
  }
}

function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const expiredDays = Math.abs(daysRemaining);

    return `${expiredDays}d overdue`;
  }

  if (daysRemaining === 0) {
    return "Today";
  }

  return `${daysRemaining}d`;
}

function getStatusClass(status: CertificationStatus): string {
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
