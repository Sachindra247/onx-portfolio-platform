import type { CertificationDto } from "./certifications";

export type ExpiryUrgency = "expired" | "30" | "60" | "90" | "healthy";

export interface ExpiringCertification {
  certification: CertificationDto;
  daysRemaining: number;
  urgency: ExpiryUrgency;
}

export interface ExpirySummary {
  expired: number;
  under30: number;
  under60: number;
  under90: number;
  healthy: number;
  averageDaysRemaining: number;
}
