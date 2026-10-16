import type { PublicEventRegistrationDto } from "../types/events";

function escapeCalendarText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function getTimeZoneOffsetMs(date: Date, timeZoneId: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZoneId,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  const localAsUtc = Date.UTC(
    getPart("year"),
    getPart("month") - 1,
    getPart("day"),
    getPart("hour"),
    getPart("minute"),
    getPart("second"),
  );

  return localAsUtc - date.getTime();
}

function eventLocalTimeToUtc(
  eventDate: string,
  eventTime: string,
  timeZoneId: string,
): Date {
  const [year, month, day] = eventDate.split("-").map(Number);
  const [hour, minute, second = 0] = eventTime.split(":").map(Number);

  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);

  let utcMs = localAsUtc;

  for (let attempt = 0; attempt < 3; attempt++) {
    const offset = getTimeZoneOffsetMs(new Date(utcMs), timeZoneId);

    const correctedUtcMs = localAsUtc - offset;

    if (correctedUtcMs === utcMs) {
      break;
    }

    utcMs = correctedUtcMs;
  }

  return new Date(utcMs);
}

function isValidEventLocalTime(
  utcDate: Date,
  eventDate: string,
  eventTime: string,
  timeZoneId: string,
): boolean {
  if (Number.isNaN(utcDate.getTime())) {
    return false;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZoneId,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(utcDate);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const convertedDate = [
    getPart("year"),
    getPart("month"),
    getPart("day"),
  ].join("-");

  const convertedTime = [
    getPart("hour"),
    getPart("minute"),
    getPart("second"),
  ].join(":");

  const [hour, minute, second = "00"] = eventTime.split(":");

  const expectedTime = [
    hour.padStart(2, "0"),
    minute.padStart(2, "0"),
    second.padStart(2, "0"),
  ].join(":");

  return convertedDate === eventDate && convertedTime === expectedTime;
}

function isAmbiguousEventLocalTime(
  utcDate: Date,
  eventDate: string,
  eventTime: string,
  timeZoneId: string,
): boolean {
  const oneHourMs = 60 * 60 * 1000;

  return [-2, -1, 1, 2].some((hours) => {
    const alternativeDate = new Date(utcDate.getTime() + hours * oneHourMs);

    return isValidEventLocalTime(
      alternativeDate,
      eventDate,
      eventTime,
      timeZoneId,
    );
  });
}

function formatCalendarUtcDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function canAddEventToCalendar(
  event: PublicEventRegistrationDto,
): boolean {
  return Boolean(
    event.eventDate && event.startTime && event.endTime && event.timeZoneId,
  );
}

export function createEventCalendarFile(
  event: PublicEventRegistrationDto,
): string | null {
  if (!canAddEventToCalendar(event)) {
    return null;
  }

  const { eventDate, startTime, endTime, timeZoneId } = event;

  if (!eventDate || !startTime || !endTime || !timeZoneId) {
    return null;
  }

  try {
    const startUtc = eventLocalTimeToUtc(eventDate, startTime, timeZoneId);

    const endUtc = eventLocalTimeToUtc(eventDate, endTime, timeZoneId);

    for (const [utcDate, localTime] of [
      [startUtc, startTime],
      [endUtc, endTime],
    ] as const) {
      if (
        !isValidEventLocalTime(utcDate, eventDate, localTime, timeZoneId) ||
        isAmbiguousEventLocalTime(utcDate, eventDate, localTime, timeZoneId)
      ) {
        return null;
      }
    }

    if (endUtc.getTime() <= startUtc.getTime()) {
      return null;
    }

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//OnX Portfolio Platform//Events//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${event.id}@onx-portfolio-platform`,
      `DTSTAMP:${formatCalendarUtcDate(new Date())}`,
      `DTSTART:${formatCalendarUtcDate(startUtc)}`,
      `DTEND:${formatCalendarUtcDate(endUtc)}`,
      `SUMMARY:${escapeCalendarText(event.description)}`,
      `LOCATION:${escapeCalendarText(event.venue ?? "")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];

    return lines.join("\r\n") + "\r\n";
  } catch {
    return null;
  }
}

export function downloadEventCalendar(
  event: PublicEventRegistrationDto,
): boolean {
  const calendarContent = createEventCalendarFile(event);

  if (!calendarContent) {
    return false;
  }

  const blob = new Blob([calendarContent], {
    type: "text/calendar;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `onx-event-${event.id}.ics`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  return true;
}
