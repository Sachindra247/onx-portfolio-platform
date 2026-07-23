export const eventStages = [
  "Exploring",
  "Planning",
  "Confirmed",
  "InProgress",
  "Completed",
] as const;

export type EventStage = (typeof eventStages)[number];

export interface EventDto {
  id: string;
  description: string;
  eventDate: string | null;
  stage: EventStage;
  budgetCad: number;
  notes: string | null;
  vendorId: string;
  vendorName: string;
  createdAtUtc: string;
  updatedAtUtc: string;
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
  budgetCad: number;
  notes: string | null;
  vendorId: string;
}

export interface EventFormValues {
  description: string;
  eventDate: string;
  stage: EventStage;
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

export interface PaginationState {
  page: number;
  pageSize: number;
}
