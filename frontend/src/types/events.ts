export const eventStages = [
  "Exploring",
  "Planning",
  "Confirmed",
  "InProgress",
  "Completed",
] as const;

export type EventStage = (typeof eventStages)[number];

export const eventApprovalStatuses = [
  "Pending",
  "Approved",
  "Rejected",
] as const;

export type EventApprovalStatus = (typeof eventApprovalStatuses)[number];

export interface EventDto {
  id: string;
  description: string;
  eventDate: string | null;
  stage: EventStage;

  venue: string | null;

  /*
   * These are null for users who do not have
   * Events management access.
   */
  businessPurpose: string | null;
  budgetCad: number;

  notes: string | null;

  vendorId: string;
  vendorName: string;

  approvalStatus: EventApprovalStatus;

  submittedByUserId: string | null;
  submittedByUserName: string | null;

  reviewedByUserId: string | null;
  reviewedByUserName: string | null;

  reviewedAtUtc: string | null;
  reviewNotes: string | null;

  createdAtUtc: string;
  updatedAtUtc: string;
}

export const eventRegistrationStatuses = ["Registered", "Cancelled"] as const;

export type EventRegistrationStatus =
  (typeof eventRegistrationStatuses)[number];

export interface EventRegistrationDto {
  eventId: string;
  userId: string;
  status: EventRegistrationStatus;
  isRegistered: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface EventAttendeeDto {
  userId: string;
  name: string;
  email: string;
  registeredAtUtc: string;
}

export interface VendorDto {
  id: string;
  name: string;
  isActive: boolean;
}

export interface EventRequest {
  description: string;
  eventDate: string | null;
  stage: EventStage;
  venue: string | null;
  businessPurpose: string;
  budgetCad: number;
  notes: string | null;
  vendorId: string;
}

export interface EventFormValues {
  description: string;
  eventDate: string;
  stage: EventStage;
  venue: string;
  businessPurpose: string;
  budgetCad: string;
  notes: string;
  vendorId: string;
}

export type EventSortField =
  | "vendorName"
  | "description"
  | "eventDate"
  | "stage"
  | "budgetCad";

export type SortDirection = "ascending" | "descending";

export type EventViewMode = "table" | "vendor";

export type EventsSection =
  | "overview"
  | "events"
  | "vendors"
  | "upcoming"
  | "completed";

export interface PaginationState {
  page: number;
  pageSize: number;
}
