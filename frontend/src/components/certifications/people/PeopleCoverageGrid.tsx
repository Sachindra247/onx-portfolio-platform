import {
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";

import type { PersonCoverage } from "../../../types/personCoverage";

import PeopleCoverageSummary from "./PeopleCoverageSummary";

interface PeopleCoverageGridProps {
  people: PersonCoverage[];
}

type PeopleSort =
  | "name"
  | "certifications"
  | "coverage"
  | "expiring"
  | "expired";

export default function PeopleCoverageGrid({
  people,
}: PeopleCoverageGridProps) {
  const [search, setSearch] = useState("");

  const [healthFilter, setHealthFilter] = useState("");

  const [vendorFilter, setVendorFilter] = useState("");

  const [sortBy, setSortBy] = useState<PeopleSort>("name");

  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

  const vendorOptions = useMemo(
    () =>
      Array.from(new Set(people.flatMap((person) => person.vendorNames))).sort(
        (first, second) => first.localeCompare(second),
      ),
    [people],
  );

  const filteredPeople = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    const filtered = people.filter((person) => {
      const matchesSearch =
        !normalizedSearch ||
        person.personName.toLocaleLowerCase().includes(normalizedSearch) ||
        person.vendorNames.some((vendorName) =>
          vendorName.toLocaleLowerCase().includes(normalizedSearch),
        ) ||
        person.certifications.some((certification) =>
          certification.certificationName
            .toLocaleLowerCase()
            .includes(normalizedSearch),
        );

      const matchesHealth = !healthFilter || person.health === healthFilter;

      const matchesVendor =
        !vendorFilter || person.vendorNames.includes(vendorFilter);

      return matchesSearch && matchesHealth && matchesVendor;
    });

    return [...filtered].sort((first, second) => {
      switch (sortBy) {
        case "certifications":
          return second.certificationCount - first.certificationCount;

        case "coverage":
          return second.coveragePercent - first.coveragePercent;

        case "expiring":
          return second.expiringSoonCount - first.expiringSoonCount;

        case "expired":
          return second.expiredCount - first.expiredCount;

        default:
          return first.personName.localeCompare(second.personName);
      }
    });
  }, [healthFilter, people, search, sortBy, vendorFilter]);

  return (
    <div className="people-coverage">
      <PeopleCoverageSummary people={people} />

      <section className="people-coverage-toolbar">
        <div className="people-coverage-search">
          <Search size={16} aria-hidden="true" />

          <input
            type="search"
            value={search}
            placeholder="Search people, vendors, or certifications..."
            aria-label="Search people and certification coverage"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="people-coverage-toolbar__filters">
          <span>
            <SlidersHorizontal size={14} aria-hidden="true" />
            Filters
          </span>

          <select
            value={healthFilter}
            onChange={(event) => setHealthFilter(event.target.value)}
          >
            <option value="">All health statuses</option>

            <option value="healthy">Healthy</option>

            <option value="warning">Expiring soon</option>

            <option value="critical">Action needed</option>
          </select>

          <select
            value={vendorFilter}
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
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as PeopleSort)}
          >
            <option value="name">Name</option>

            <option value="certifications">Most certifications</option>

            <option value="coverage">Highest coverage</option>

            <option value="expiring">Most expiring</option>

            <option value="expired">Most expired</option>
          </select>
        </div>

        <div className="people-coverage-toolbar__count">
          {filteredPeople.length} of {people.length} people
        </div>
      </section>

      {filteredPeople.length > 0 ? (
        <div className="people-coverage-table-wrap">
          <table className="people-coverage-table">
            <thead>
              <tr>
                <th>Person</th>

                <th>Vendors</th>

                <th>Certifications</th>

                <th>Current</th>

                <th>Expiring</th>

                <th>Expired</th>

                <th>Coverage</th>

                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPeople.map((person) => {
                const key = person.personName.toLocaleLowerCase();

                const isExpanded = expandedPerson === key;

                return (
                  <Fragment key={key}>
                    <tr>
                      <td>
                        <strong>{person.personName}</strong>
                      </td>

                      <td>{person.vendorNames.join(", ")}</td>

                      <td>{person.certificationCount}</td>

                      <td>{person.currentCount}</td>

                      <td>{person.expiringSoonCount}</td>

                      <td>{person.expiredCount}</td>

                      <td>
                        <span
                          className={[
                            "people-coverage-health",
                            `people-coverage-health--${person.health}`,
                          ].join(" ")}
                        >
                          {person.coveragePercent}%
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="people-coverage-view-button"
                          onClick={() =>
                            setExpandedPerson(isExpanded ? null : key)
                          }
                        >
                          <Eye size={14} aria-hidden="true" />
                          View
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr
                        key={`${key}-details`}
                        className="people-coverage-details-row"
                      >
                        <td colSpan={8}>
                          <div className="people-coverage-details">
                            {person.certifications.map((certification) => (
                              <div
                                className="people-coverage-certification"
                                key={certification.id}
                              >
                                <div>
                                  <strong>
                                    {certification.certificationName}
                                  </strong>

                                  <span>{certification.vendorName}</span>
                                </div>

                                <span>
                                  {formatStatus(certification.status)}
                                </span>

                                <span>
                                  {certification.expiryDate
                                    ? `Expires ${formatDate(
                                        certification.expiryDate,
                                      )}`
                                    : "No expiry date"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="people-coverage-empty">
          <h3>No people found</h3>

          <p>Try changing the search or filter selections.</p>
        </div>
      )}
    </div>
  );
}

function formatStatus(status: string): string {
  switch (status) {
    case "InProgress":
      return "In Progress";

    case "Tbd":
      return "TBD";

    default:
      return status;
  }
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
