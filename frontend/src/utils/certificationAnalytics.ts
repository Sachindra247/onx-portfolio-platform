import type {
  CertificationDto,
  CertificationStatus,
  CertificationStatusSummary,
  CertificationSummary,
  CertificationVendorSummary,
} from "../types/certifications";

export function getCertificationSummary(
  certifications: CertificationDto[],
  gapCount: number,
): CertificationSummary {
  const uniqueVendors = new Set(
    certifications.map((certification) => certification.vendorId),
  );

  const uniquePeople = new Set(
    certifications.map((certification) =>
      normalizeName(certification.personName),
    ),
  );

  return {
    vendorCount: uniqueVendors.size,
    certificationCount: certifications.length,
    peopleCount: uniquePeople.size,
    gapCount,
    expiringWithin90Days: certifications.filter(isExpiringWithin90Days).length,
  };
}

export function getCertificationStatusSummary(
  certifications: CertificationDto[],
): CertificationStatusSummary[] {
  const statuses: CertificationStatus[] = [
    "Complete",
    "InProgress",
    "Pending",
    "Tbd",
    "Expired",
  ];

  return statuses.map((status) => ({
    status,
    count: certifications.filter(
      (certification) => certification.status === status,
    ).length,
  }));
}

export function getCertificationVendorSummary(
  certifications: CertificationDto[],
): CertificationVendorSummary[] {
  const summaries = new Map<
    string,
    CertificationVendorSummary & {
      people: Set<string>;
    }
  >();

  certifications.forEach((certification) => {
    const current = summaries.get(certification.vendorId) ?? {
      vendorId: certification.vendorId,
      vendorName: certification.vendorName,
      certificationCount: 0,
      peopleCount: 0,
      completedCount: 0,
      inProgressCount: 0,
      people: new Set<string>(),
    };

    current.certificationCount += 1;
    current.people.add(normalizeName(certification.personName));

    if (certification.status === "Complete") {
      current.completedCount += 1;
    }

    if (
      certification.status === "InProgress" ||
      certification.status === "Pending"
    ) {
      current.inProgressCount += 1;
    }

    summaries.set(certification.vendorId, current);
  });

  return Array.from(summaries.values())
    .map(({ people, ...summary }) => ({
      ...summary,
      peopleCount: people.size,
    }))
    .sort(
      (first, second) => second.certificationCount - first.certificationCount,
    );
}

export function isExpiringWithin90Days(
  certification: CertificationDto,
): boolean {
  if (!certification.expiryDate) {
    return false;
  }

  const expiryDate = parseDateOnly(certification.expiryDate);

  if (!expiryDate) {
    return false;
  }

  const today = startOfDay(new Date());
  const ninetyDaysFromToday = new Date(today);

  ninetyDaysFromToday.setDate(ninetyDaysFromToday.getDate() + 90);

  return expiryDate >= today && expiryDate <= ninetyDaysFromToday;
}

export function formatCertificationStatus(status: CertificationStatus): string {
  switch (status) {
    case "InProgress":
      return "In Progress";

    case "Tbd":
      return "TBD";

    case "Archived":
      return "Archived";

    default:
      return status;
  }
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function parseDateOnly(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
