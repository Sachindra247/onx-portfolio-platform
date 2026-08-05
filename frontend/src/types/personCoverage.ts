import type { CertificationDto } from "./certifications";

export type PersonHealth = "healthy" | "warning" | "critical";

export interface PersonCoverage {
  personName: string;
  certifications: CertificationDto[];
  certificationCount: number;
  currentCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  coveragePercent: number;
  vendorNames: string[];
  health: PersonHealth;
}
