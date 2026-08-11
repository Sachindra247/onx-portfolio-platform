import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { CertificationDto } from "../../../types/certifications";
import { buildVendorAnalytics } from "../../../utils/vendorAnalytics";
import { formatCertificationStatus } from "../../../utils/certificationAnalytics";

interface VendorIntelligenceViewProps {
  canManage: boolean;
  certifications: CertificationDto[];
  onEdit: (certification: CertificationDto) => void;
}

export default function VendorIntelligenceView({
  certifications,
  canManage,
  onEdit,
}: VendorIntelligenceViewProps) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  const vendors = useMemo(
    () => buildVendorAnalytics(certifications),
    [certifications],
  );

  const filteredVendors = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return vendors.filter((vendor) => {
      const matchesSearch =
        !normalizedSearch ||
        vendor.vendorName.toLocaleLowerCase().includes(normalizedSearch) ||
        vendor.records.some(
          (record) =>
            record.personName.toLocaleLowerCase().includes(normalizedSearch) ||
            record.certificationName
              .toLocaleLowerCase()
              .includes(normalizedSearch),
        );

      const matchesRisk =
        !riskFilter ||
        (riskFilter === "expired" && vendor.expired > 0) ||
        (riskFilter === "expiring" &&
          vendor.expired === 0 &&
          vendor.expiring > 0) ||
        (riskFilter === "healthy" &&
          vendor.expired === 0 &&
          vendor.expiring === 0);

      return matchesSearch && matchesRisk;
    });
  }, [riskFilter, search, vendors]);

  const totalPeople = new Set(
    certifications.map((certification) =>
      certification.personName.trim().toLocaleLowerCase(),
    ),
  ).size;

  const totalExpired = vendors.reduce(
    (total, vendor) => total + vendor.expired,
    0,
  );

  const totalExpiring = vendors.reduce(
    (total, vendor) => total + vendor.expiring,
    0,
  );

  const averageCompletion =
    vendors.length === 0
      ? 0
      : Math.round(
          vendors.reduce((total, vendor) => total + vendor.completionRate, 0) /
            vendors.length,
        );

  return (
    <div className="vendor-intelligence">
      <section className="vendor-intelligence-summary">
        <SummaryCard
          label="Vendors"
          value={vendors.length}
          detail="Technology partners"
          modifier="vendors"
          icon={Building2}
        />

        <SummaryCard
          label="People"
          value={totalPeople}
          detail="Unique individuals"
          modifier="people"
          icon={Users}
        />

        <SummaryCard
          label="Expiring"
          value={totalExpiring}
          detail="Within 90 days"
          modifier="expiring"
          icon={AlertTriangle}
        />

        <SummaryCard
          label="Expired"
          value={totalExpired}
          detail="Immediate attention"
          modifier="expired"
          icon={AlertTriangle}
        />

        <SummaryCard
          label="Completion"
          value={`${averageCompletion}%`}
          detail="Average by vendor"
          modifier="completion"
          icon={BadgeCheck}
        />
      </section>

      <section className="vendor-intelligence-toolbar">
        <div className="vendor-intelligence-search">
          <Search size={16} aria-hidden="true" />

          <input
            type="search"
            value={search}
            placeholder="Search vendors, people, or certifications..."
            aria-label="Search vendor certification data"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={riskFilter}
          aria-label="Filter vendors by renewal risk"
          onChange={(event) => setRiskFilter(event.target.value)}
        >
          <option value="">All vendor health</option>
          <option value="healthy">Healthy</option>
          <option value="expiring">Expiring soon</option>
          <option value="expired">Expired records</option>
        </select>

        {(search || riskFilter) && (
          <button
            type="button"
            className="vendor-intelligence-toolbar__clear"
            onClick={() => {
              setSearch("");
              setRiskFilter("");
            }}
          >
            Clear filters
          </button>
        )}

        <span className="vendor-intelligence-toolbar__count">
          {filteredVendors.length} of {vendors.length} vendors
        </span>
      </section>

      {filteredVendors.length > 0 ? (
        <section className="vendor-intelligence-grid">
          {filteredVendors.map((vendor) => {
            const isExpanded = expandedVendor === vendor.vendorName;

            const health =
              vendor.expired > 0
                ? "critical"
                : vendor.expiring > 0
                  ? "warning"
                  : "healthy";

            return (
              <article
                key={vendor.vendorName}
                className={[
                  "vendor-intelligence-card",
                  `vendor-intelligence-card--${health}`,
                ].join(" ")}
              >
                <header className="vendor-intelligence-card__header">
                  <div>
                    <h3>{vendor.vendorName}</h3>

                    <span
                      className={[
                        "vendor-health-badge",
                        `vendor-health-badge--${health}`,
                      ].join(" ")}
                    >
                      {health === "critical"
                        ? "Action needed"
                        : health === "warning"
                          ? "Expiring soon"
                          : "Healthy"}
                    </span>
                  </div>

                  <strong>
                    {vendor.completionRate}%<span>Complete</span>
                  </strong>
                </header>

                <div className="vendor-intelligence-card__metrics">
                  <Metric
                    value={vendor.certifications}
                    label="Certifications"
                  />
                  <Metric value={vendor.people} label="People" />
                  <Metric value={vendor.expiring} label="Expiring" />
                  <Metric value={vendor.expired} label="Expired" />
                </div>

                <div className="vendor-intelligence-card__progress">
                  <div>
                    <span>Completion rate</span>
                    <strong>{vendor.completionRate}%</strong>
                  </div>

                  <div
                    className="vendor-progress"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={vendor.completionRate}
                  >
                    <span
                      style={{
                        width: `${vendor.completionRate}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="vendor-intelligence-card__toggle"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedVendor((current) =>
                      current === vendor.vendorName ? null : vendor.vendorName,
                    )
                  }
                >
                  {isExpanded ? "Hide records" : "View records"}

                  {isExpanded ? (
                    <ChevronUp size={16} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={16} aria-hidden="true" />
                  )}
                </button>

                {isExpanded && (
                  <div className="vendor-intelligence-card__records">
                    {vendor.records.map((record) => (
                      <div
                        key={record.id}
                        className="vendor-certification-record"
                      >
                        <div>
                          <strong>{record.certificationName}</strong>
                          <span>{record.personName}</span>
                        </div>

                        <div className="vendor-certification-record__meta">
                          <span>
                            {formatCertificationStatus(record.status)}
                          </span>
                          <span>Expiry: {formatDate(record.expiryDate)}</span>
                        </div>
                        {canManage && (
                          <button
                            type="button"
                            aria-label={`Edit ${record.certificationName}`}
                            onClick={() => onEdit(record)}
                          >
                            <Pencil size={14} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <div className="vendor-intelligence-empty">
          <Building2 size={30} aria-hidden="true" />
          <h3>No vendors found</h3>
          <p>Try changing the current search or filter.</p>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number | string;
  detail: string;
  modifier: string;
  icon: typeof Building2;
}

function SummaryCard({
  label,
  value,
  detail,
  modifier,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <article
      className={[
        "vendor-summary-card",
        `vendor-summary-card--${modifier}`,
      ].join(" ")}
    >
      <span className="vendor-summary-card__icon">
        <Icon size={18} aria-hidden="true" />
      </span>

      <span className="vendor-summary-card__label">{label}</span>

      <strong className="vendor-summary-card__value">{value}</strong>

      <span className="vendor-summary-card__detail">{detail}</span>
    </article>
  );
}

interface MetricProps {
  value: number;
  label: string;
}

function Metric({ value, label }: MetricProps) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
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
