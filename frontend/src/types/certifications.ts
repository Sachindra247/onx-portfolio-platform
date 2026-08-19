export const certificationStatuses = [
  "Complete",
  "InProgress",
  "Pending",
  "Tbd",
  "Expired",
  "Archived",
] as const;

export type CertificationStatus = (typeof certificationStatuses)[number];

export type CertificationsSection =
  | "overview"
  | "certifications"
  | "people"
  | "gaps"
  | "expiring"
  | "vendors";

export interface CertificationDto {
  id: string;

  certificationPersonId: string | null;
  personApplicationUserId: string | null;

  personName: string;
  personEmail: string | null;

  managerCertificationPersonId: string | null;
  managerApplicationUserId: string | null;
  managerName: string | null;
  managerEmail: string | null;

  certificationName: string;
  status: CertificationStatus;
  dateCompleted: string | null;
  expiryDate: string | null;
  practiceLead: string | null;
  rebateImpact: string | null;
  notes: string | null;
  vendorId: string;
  vendorName: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CertificationRequest {
  certificationPersonId: string | null;
  personApplicationUserId: string | null;

  personName: string;
  personEmail: string | null;

  managerCertificationPersonId: string | null;
  managerApplicationUserId: string | null;
  managerName: string | null;
  managerEmail: string | null;

  certificationName: string;
  status: CertificationStatus;
  dateCompleted: string | null;
  expiryDate: string | null;
  practiceLead: string | null;
  rebateImpact: string | null;
  notes: string | null;
  vendorId: string;
}

export interface CertificationFormValues {
  certificationPersonId: string;
  personApplicationUserId: string;

  personName: string;
  personEmail: string;

  managerCertificationPersonId: string;
  managerApplicationUserId: string;
  managerName: string;
  managerEmail: string;

  certificationName: string;
  status: CertificationStatus;
  dateCompleted: string;
  expiryDate: string;
  practiceLead: string;
  rebateImpact: string;
  notes: string;
  vendorId: string;
}

export interface CertificationPersonLookupDto {
  certificationPersonId: string | null;
  applicationUserId: string | null;

  name: string;
  email: string | null;

  managerCertificationPersonId: string | null;
  managerApplicationUserId: string | null;
  managerName: string | null;
  managerEmail: string | null;

  isApplicationUser: boolean;
}

export interface CertificationVendorDto {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CertificationSummary {
  vendorCount: number;
  certificationCount: number;
  peopleCount: number;
  gapCount: number;
  expiringWithin90Days: number;
}

export interface CertificationVendorSummary {
  vendorId: string;
  vendorName: string;
  certificationCount: number;
  peopleCount: number;
  completedCount: number;
  inProgressCount: number;
}

export interface CertificationStatusSummary {
  status: CertificationStatus;
  count: number;
}

export type CertificationSortField =
  | "personName"
  | "vendorName"
  | "certificationName"
  | "status"
  | "dateCompleted"
  | "expiryDate"
  | "practiceLead";

export type SortDirection = "ascending" | "descending";
