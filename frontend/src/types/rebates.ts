export const rebateStatuses = [
  "Draft",
  "Active",
  "Pending",
  "Completed",
  "Cancelled",
] as const;

export type RebateStatus = (typeof rebateStatuses)[number];

export type RebatesSection = "overview" | "rebates" | "vendors";

export interface RebateDto {
  id: string;

  title: string;

  programName: string | null;

  description: string | null;

  status: RebateStatus;

  estimatedAmount: number | null;

  actualAmount: number | null;

  startDate: string | null;

  dueDate: string | null;

  completedDate: string | null;

  ownerName: string | null;

  ownerEmail: string | null;

  notes: string | null;

  vendorId: string;

  vendorName: string;

  createdAtUtc: string;

  updatedAtUtc: string;
}

export interface RebateRequest {
  title: string;

  programName: string | null;

  description: string | null;

  status: RebateStatus;

  estimatedAmount: number | null;

  actualAmount: number | null;

  startDate: string | null;

  dueDate: string | null;

  completedDate: string | null;

  ownerName: string | null;

  ownerEmail: string | null;

  notes: string | null;

  vendorId: string;
}

export interface RebateFormValues {
  title: string;

  programName: string;

  description: string;

  status: RebateStatus;

  estimatedAmount: string;

  actualAmount: string;

  startDate: string;

  dueDate: string;

  completedDate: string;

  ownerName: string;

  ownerEmail: string;

  notes: string;

  vendorId: string;
}

export interface RebateVendorDto {
  id: string;

  name: string;

  isActive: boolean;
}

export interface RebateSummary {
  rebateCount: number;

  activeCount: number;

  pendingCount: number;

  completedCount: number;

  dueSoonCount: number;

  estimatedAmount: number;

  actualAmount: number;
}

export interface RebateVendorSummary {
  vendorId: string;

  vendorName: string;

  rebateCount: number;

  activeCount: number;

  pendingCount: number;

  completedCount: number;

  estimatedAmount: number;

  actualAmount: number;
}

export interface RebateStatusSummary {
  status: RebateStatus;

  count: number;
}

export type RebateSortField =
  | "title"
  | "vendorName"
  | "programName"
  | "status"
  | "estimatedAmount"
  | "actualAmount"
  | "dueDate"
  | "ownerName";

export type RebateSortDirection = "ascending" | "descending";
