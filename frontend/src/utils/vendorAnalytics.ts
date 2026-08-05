import type { CertificationDto } from "../types/certifications";
import type { VendorSummary } from "../types/vendorAnalytics";

function daysUntil(expiryDate: string | null): number {
  if (!expiryDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = expiryDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const expiry = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  const today = new Date();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return Math.ceil((expiry.getTime() - startOfToday.getTime()) / 86400000);
}

export function buildVendorAnalytics(
  certifications: CertificationDto[],
): VendorSummary[] {
  const vendors = new Map<string, CertificationDto[]>();

  certifications.forEach((certification) => {
    const existing = vendors.get(certification.vendorName) ?? [];

    existing.push(certification);

    vendors.set(certification.vendorName, existing);
  });

  return Array.from(vendors.entries())
    .map(([vendorName, records]) => {
      const uniquePeople = new Set(records.map((x) => x.personName));

      const expiring = records.filter((x) => {
        const days = daysUntil(x.expiryDate);

        return days >= 0 && days <= 90;
      }).length;

      const expired = records.filter((x) => daysUntil(x.expiryDate) < 0).length;

      const completed = records.filter((x) => x.status === "Complete").length;

      return {
        vendorName,
        certifications: records.length,
        people: uniquePeople.size,
        expiring,
        expired,
        completionRate:
          records.length === 0
            ? 0
            : Math.round((completed / records.length) * 100),
        records,
      };
    })
    .sort((a, b) => a.vendorName.localeCompare(b.vendorName));
}
