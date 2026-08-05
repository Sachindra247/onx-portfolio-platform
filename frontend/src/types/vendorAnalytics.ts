import type { CertificationDto } from "./certifications";

export interface VendorSummary {
  vendorName: string;
  certifications: number;
  people: number;
  expiring: number;
  expired: number;
  completionRate: number;
  records: CertificationDto[];
}
