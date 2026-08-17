import type {
  EventFormValues,
  EventRequest,
  EventStage,
} from "../types/events";

const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatBudget(value: number): string {
  return currencyFormatter.format(value);
}

export function formatEventDate(value: string | null): string {
  if (!value) {
    return "Not scheduled";
  }

  const parsedDate = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return dateFormatter.format(parsedDate);
}

export function getStageClassName(stage: EventStage): string {
  switch (stage) {
    case "Exploring":
      return "stage-chip--gray";

    case "Planning":
      return "stage-chip--amber";

    case "Confirmed":
      return "stage-chip--blue";

    case "InProgress":
      return "stage-chip--purple";

    case "Completed":
      return "stage-chip--green";
  }
}

export function createEmptyEventForm(): EventFormValues {
  return {
    description: "",
    eventDate: "",
    stage: "Exploring",
    venue: "",
    businessPurpose: "",
    budgetCad: "",
    notes: "",
    vendorId: "",
  };
}

export function mapFormToRequest(values: EventFormValues): EventRequest {
  return {
    description: values.description.trim(),

    eventDate: values.eventDate || null,

    stage: values.stage,

    venue: values.venue.trim() || null,

    businessPurpose: values.businessPurpose.trim(),

    budgetCad: Number(values.budgetCad),

    notes: values.notes.trim() || null,

    vendorId: values.vendorId,
  };
}

export function formatEventStage(stage: EventStage): string {
  return stage === "InProgress" ? "In Progress" : stage;
}
