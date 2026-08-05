import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import type { PersonCoverage } from "../../../types/personCoverage";

import PeopleCoverageCard from "./PeopleCoverageCard";
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

        case "name":
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
            aria-label="Filter people by health"
            onChange={(event) => setHealthFilter(event.target.value)}
          >
            <option value="">All health statuses</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Expiring soon</option>
            <option value="critical">Action needed</option>
          </select>

          <select
            value={vendorFilter}
            aria-label="Filter people by vendor"
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
            aria-label="Sort people"
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
        <section className="people-coverage-grid">
          {filteredPeople.map((person) => (
            <PeopleCoverageCard
              key={person.personName.toLocaleLowerCase()}
              person={person}
            />
          ))}
        </section>
      ) : (
        <div className="people-coverage-empty">
          <h3>No people found</h3>
          <p>Try changing the search or filter selections.</p>
        </div>
      )}
    </div>
  );
}
