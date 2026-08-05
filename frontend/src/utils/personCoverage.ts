import type { CertificationDto } from "../types/certifications";
import type { PersonCoverage, PersonHealth } from "../types/personCoverage";

const millisecondsPerDay = 86_400_000;
const expiringSoonDays = 90;

export function buildPeopleCoverage(
  certifications: CertificationDto[],
): PersonCoverage[] {
  const groupedCertifications = new Map<
    string,
    {
      displayName: string;
      certifications: CertificationDto[];
    }
  >();

  certifications.forEach((certification) => {
    const displayName = certification.personName.trim();

    if (!displayName) {
      return;
    }

    const normalizedName = displayName.toLocaleLowerCase();

    const existing = groupedCertifications.get(normalizedName);

    if (existing) {
      existing.certifications.push(certification);
      return;
    }

    groupedCertifications.set(normalizedName, {
      displayName,
      certifications: [certification],
    });
  });

  return Array.from(groupedCertifications.values())
    .map(({ displayName, certifications: records }) => {
      const expiredCount = records.filter(isCertificationExpired).length;

      const expiringSoonCount = records.filter(
        isCertificationExpiringSoon,
      ).length;

      const currentCount = records.filter(
        (certification) => !isCertificationExpired(certification),
      ).length;

      const vendorNames = Array.from(
        new Set(
          records
            .map((certification) => certification.vendorName.trim())
            .filter(Boolean),
        ),
      ).sort((first, second) => first.localeCompare(second));

      return {
        personName: displayName,
        certifications: [...records].sort(compareCertifications),
        certificationCount: records.length,
        currentCount,
        expiredCount,
        expiringSoonCount,
        coveragePercent: calculateCoveragePercent(currentCount, records.length),
        vendorNames,
        health: determinePersonHealth(expiredCount, expiringSoonCount),
      };
    })
    .sort((first, second) => first.personName.localeCompare(second.personName));
}

export function isCertificationExpired(
  certification: CertificationDto,
): boolean {
  if (certification.status === "Expired") {
    return true;
  }

  const expiryDate = parseDateOnly(certification.expiryDate);

  if (!expiryDate) {
    return false;
  }

  return expiryDate < startOfToday();
}

export function isCertificationExpiringSoon(
  certification: CertificationDto,
): boolean {
  if (isCertificationExpired(certification)) {
    return false;
  }

  const expiryDate = parseDateOnly(certification.expiryDate);

  if (!expiryDate) {
    return false;
  }

  const daysRemaining = Math.ceil(
    (expiryDate.getTime() - startOfToday().getTime()) / millisecondsPerDay,
  );

  return daysRemaining >= 0 && daysRemaining <= expiringSoonDays;
}

function determinePersonHealth(
  expiredCount: number,
  expiringSoonCount: number,
): PersonHealth {
  if (expiredCount > 0) {
    return "critical";
  }

  if (expiringSoonCount > 0) {
    return "warning";
  }

  return "healthy";
}

function calculateCoveragePercent(
  currentCount: number,
  totalCount: number,
): number {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((currentCount / totalCount) * 100);
}

function compareCertifications(
  first: CertificationDto,
  second: CertificationDto,
): number {
  const firstExpiry = first.expiryDate ?? "9999-12-31";

  const secondExpiry = second.expiryDate ?? "9999-12-31";

  const expiryComparison = firstExpiry.localeCompare(secondExpiry);

  if (expiryComparison !== 0) {
    return expiryComparison;
  }

  return first.certificationName.localeCompare(second.certificationName);
}

function parseDateOnly(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function startOfToday(): Date {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}
