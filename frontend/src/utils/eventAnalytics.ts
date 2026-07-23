import type { EventDto, EventStage } from "../types/events";

export interface StageSummary {
  stage: EventStage;
  count: number;
}

export interface VendorSummary {
  vendorId: string;
  vendorName: string;
  eventCount: number;
  totalBudgetCad: number;
}

export function getUpcomingEvents(events: EventDto[], limit = 5): EventDto[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events
    .filter((event) => {
      if (!event.eventDate || event.stage === "Completed") {
        return false;
      }

      const eventDate = new Date(`${event.eventDate}T00:00:00`);

      return eventDate >= today;
    })
    .sort((firstEvent, secondEvent) =>
      compareDates(firstEvent.eventDate, secondEvent.eventDate),
    )
    .slice(0, limit);
}

export function getRecentlyCompletedEvents(
  events: EventDto[],
  limit = 5,
): EventDto[] {
  return events
    .filter((event) => event.stage === "Completed")
    .sort((firstEvent, secondEvent) =>
      compareDates(secondEvent.eventDate, firstEvent.eventDate),
    )
    .slice(0, limit);
}

export function getStageSummary(events: EventDto[]): StageSummary[] {
  const stages: EventStage[] = [
    "Exploring",
    "Planning",
    "Confirmed",
    "InProgress",
    "Completed",
  ];

  return stages.map((stage) => ({
    stage,
    count: events.filter((event) => event.stage === stage).length,
  }));
}

export function getVendorSummary(events: EventDto[]): VendorSummary[] {
  const summaries = new Map<string, VendorSummary>();

  for (const event of events) {
    const existingSummary = summaries.get(event.vendorId);

    if (existingSummary) {
      existingSummary.eventCount += 1;
      existingSummary.totalBudgetCad += event.budgetCad;
      continue;
    }

    summaries.set(event.vendorId, {
      vendorId: event.vendorId,
      vendorName: event.vendorName,
      eventCount: 1,
      totalBudgetCad: event.budgetCad,
    });
  }

  return [...summaries.values()].sort(
    (firstVendor, secondVendor) =>
      secondVendor.totalBudgetCad - firstVendor.totalBudgetCad,
  );
}

export function groupEventsByVendor(
  events: EventDto[],
): Map<string, EventDto[]> {
  const groups = new Map<string, EventDto[]>();

  for (const event of events) {
    const currentEvents = groups.get(event.vendorName) ?? [];
    currentEvents.push(event);
    groups.set(event.vendorName, currentEvents);
  }

  return new Map(
    [...groups.entries()].sort(([firstVendor], [secondVendor]) =>
      firstVendor.localeCompare(secondVendor),
    ),
  );
}

function compareDates(
  firstDate: string | null,
  secondDate: string | null,
): number {
  if (!firstDate && !secondDate) {
    return 0;
  }

  if (!firstDate) {
    return 1;
  }

  if (!secondDate) {
    return -1;
  }

  return firstDate.localeCompare(secondDate);
}
