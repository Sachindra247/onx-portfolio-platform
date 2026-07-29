import type { EventDto } from "../../../types/events";

export type CalendarView = "month" | "week" | "day";

export interface CalendarDay {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeek(date: Date): Date {
  const result = startOfDay(date);
  const daysSinceMonday = (result.getDay() + 6) % 7;

  result.setDate(result.getDate() - daysSinceMonday);

  return result;
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameDate(firstDate: Date, secondDate: Date): boolean {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function normaliseApiDate(value: string): string | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function groupEventsByDate(events: EventDto[]): Map<string, EventDto[]> {
  const groupedEvents = new Map<string, EventDto[]>();

  events.forEach((portfolioEvent) => {
    if (!portfolioEvent.eventDate) {
      return;
    }

    const dateKey = normaliseApiDate(portfolioEvent.eventDate);

    if (!dateKey) {
      return;
    }

    const eventsForDate = groupedEvents.get(dateKey) ?? [];

    eventsForDate.push(portfolioEvent);
    groupedEvents.set(dateKey, eventsForDate);
  });

  groupedEvents.forEach((eventsForDate) => {
    eventsForDate.sort((firstEvent, secondEvent) =>
      firstEvent.description.localeCompare(secondEvent.description),
    );
  });

  return groupedEvents;
}

export function buildMonthDays(currentDate: Date, today: Date): CalendarDay[] {
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );

  const calendarStart = addDays(
    firstDayOfMonth,
    -((firstDayOfMonth.getDay() + 6) % 7),
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(calendarStart, index);

    return {
      date,
      dateKey: formatLocalDateKey(date),
      isCurrentMonth:
        date.getFullYear() === currentDate.getFullYear() &&
        date.getMonth() === currentDate.getMonth(),
      isToday: isSameDate(date, today),
    };
  });
}

export function buildWeekDays(currentDate: Date, today: Date): CalendarDay[] {
  const weekStart = startOfWeek(currentDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);

    return {
      date,
      dateKey: formatLocalDateKey(date),
      isCurrentMonth: true,
      isToday: isSameDate(date, today),
    };
  });
}
