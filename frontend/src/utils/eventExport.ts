import type { EventAttendeeDto, EventDto } from "../types/events";

const csvHeaders = [
  "Vendor",
  "Event",
  "Event Date",
  "Stage",
  "Venue",
  "Approval Status",
  "Business Purpose",
  "Budget CAD",
  "Submitted By",
  "Reviewed By",
  "Reviewed At",
  "Review Notes",
  "Notes",
  "Created",
  "Last Updated",
];

export function exportEventsCsv(events: EventDto[]): void {
  if (events.length === 0) {
    return;
  }

  const rows = events.map((portfolioEvent) => [
    portfolioEvent.vendorName,
    portfolioEvent.description,
    portfolioEvent.eventDate ?? "",
    portfolioEvent.stage,
    portfolioEvent.venue ?? "",
    portfolioEvent.approvalStatus,
    portfolioEvent.businessPurpose ?? "",
    portfolioEvent.businessPurpose === null ? "" : portfolioEvent.budgetCad,
    portfolioEvent.submittedByUserName ?? "",
    portfolioEvent.reviewedByUserName ?? "",
    portfolioEvent.reviewedAtUtc ?? "",
    portfolioEvent.reviewNotes ?? "",
    portfolioEvent.notes ?? "",
    portfolioEvent.createdAtUtc,
    portfolioEvent.updatedAtUtc,
  ]);

  const csv = [
    csvHeaders.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });

  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  const currentDate = new Date().toISOString().slice(0, 10);

  downloadLink.href = downloadUrl;
  downloadLink.download = `OnX_Events_${currentDate}.csv`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  URL.revokeObjectURL(downloadUrl);
}

export function exportEventAttendeesCsv(
  event: EventDto,
  attendees: EventAttendeeDto[],
): void {
  if (attendees.length === 0) {
    return;
  }

  const csvHeaders = ["Name", "Email", "Registered At"];

  const rows = attendees.map((attendee) => [
    attendee.name,
    attendee.email,
    attendee.registeredAtUtc,
  ]);

  const csv = [
    csvHeaders.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });

  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  const currentDate = new Date().toISOString().slice(0, 10);
  const eventName = sanitizeFileName(event.description);

  downloadLink.href = downloadUrl;
  downloadLink.download = `OnX_Event_Attendees_${eventName}_${currentDate}.csv`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  URL.revokeObjectURL(downloadUrl);
}

function escapeCsvValue(value: unknown): string {
  const normalizedValue =
    value === null || value === undefined ? "" : String(value);

  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

function sanitizeFileName(value: string): string {
  const sanitizedValue = value
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitizedValue || "Event";
}
