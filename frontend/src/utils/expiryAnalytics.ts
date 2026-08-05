import type { CertificationDto } from "../types/certifications";

import type {
  ExpiringCertification,
  ExpirySummary,
  ExpiryUrgency,
} from "../types/expiryAnalytics";

const millisecondsPerDay = 86_400_000;

interface ExpiryAnalyticsResult {
  summary: ExpirySummary;
  expiring: ExpiringCertification[];
}

export function buildExpiryAnalytics(
  certifications: CertificationDto[],
): ExpiryAnalyticsResult {
  const expiring = certifications
    .map((certification) => {
      const daysRemaining = getDaysRemaining(certification);

      return {
        certification,
        daysRemaining,
        urgency: determineUrgency(daysRemaining),
      };
    })
    .sort((first, second) => first.daysRemaining - second.daysRemaining);

  const recordsWithExpiry = expiring.filter(
    (item) => item.daysRemaining !== Number.MAX_SAFE_INTEGER,
  );

  const futureRecords = recordsWithExpiry.filter(
    (item) => item.daysRemaining >= 0,
  );

  const averageDaysRemaining =
    futureRecords.length === 0
      ? 0
      : Math.round(
          futureRecords.reduce((total, item) => total + item.daysRemaining, 0) /
            futureRecords.length,
        );

  const summary: ExpirySummary = {
    expired: expiring.filter((item) => item.urgency === "expired").length,

    under30: expiring.filter((item) => item.urgency === "30").length,

    under60: expiring.filter((item) => item.urgency === "60").length,

    under90: expiring.filter((item) => item.urgency === "90").length,

    healthy: expiring.filter((item) => item.urgency === "healthy").length,

    averageDaysRemaining,
  };

  return {
    summary,
    expiring,
  };
}

export function getDaysRemaining(certification: CertificationDto): number {
  const expiryDate = parseDateOnly(certification.expiryDate);

  if (!expiryDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.ceil(
    (expiryDate.getTime() - startOfToday().getTime()) / millisecondsPerDay,
  );
}

export function determineUrgency(daysRemaining: number): ExpiryUrgency {
  if (daysRemaining === Number.MAX_SAFE_INTEGER) {
    return "healthy";
  }

  if (daysRemaining < 0) {
    return "expired";
  }

  if (daysRemaining <= 30) {
    return "30";
  }

  if (daysRemaining <= 60) {
    return "60";
  }

  if (daysRemaining <= 90) {
    return "90";
  }

  return "healthy";
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
