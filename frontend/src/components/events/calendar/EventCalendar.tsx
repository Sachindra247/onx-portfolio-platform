import { useMemo, useState } from "react";

import type { EventDto, EventStage } from "../../../types/events";

import CalendarToolbar from "./CalendarToolbar";

import {
  addDays,
  addMonths,
  buildMonthDays,
  buildWeekDays,
  formatLocalDateKey,
  groupEventsByDate,
  startOfDay,
  startOfWeek,
  weekDayLabels,
  type CalendarDay,
  type CalendarView,
} from "./calendarUtils";

interface EventCalendarProps {
  events: EventDto[];
  onEventClick: (portfolioEvent: EventDto) => void;
}

const calendarDateFormatter = new Intl.DateTimeFormat("en-CA", {
  month: "long",
  year: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-CA", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
});

export default function EventCalendar({
  events,
  onEventClick,
}: EventCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);

  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState<Date>(today);

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const title = getCalendarTitle(currentDate, view);

  function handlePrevious() {
    setCurrentDate((date) => navigateDate(date, view, -1));
  }

  function handleNext() {
    setCurrentDate((date) => navigateDate(date, view, 1));
  }

  function handleToday() {
    setCurrentDate(startOfDay(new Date()));
  }

  function handleViewChange(nextView: CalendarView) {
    setView(nextView);
  }

  return (
    <section className="event-calendar-card" aria-label="Events calendar">
      <CalendarToolbar
        title={title}
        view={view}
        onPrevious={handlePrevious}
        onToday={handleToday}
        onNext={handleNext}
        onViewChange={handleViewChange}
      />

      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          today={today}
          eventsByDate={eventsByDate}
          onEventClick={onEventClick}
        />
      )}

      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          today={today}
          eventsByDate={eventsByDate}
          onEventClick={onEventClick}
          onSelectDay={(date) => {
            setCurrentDate(date);
            setView("day");
          }}
        />
      )}

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          eventsByDate={eventsByDate}
          onEventClick={onEventClick}
        />
      )}

      <CalendarLegend />
    </section>
  );
}

interface CalendarViewProps {
  eventsByDate: Map<string, EventDto[]>;
  onEventClick: (portfolioEvent: EventDto) => void;
}

interface MonthViewProps extends CalendarViewProps {
  currentDate: Date;
  today: Date;
}

function MonthView({
  currentDate,
  today,
  eventsByDate,
  onEventClick,
}: MonthViewProps) {
  const calendarDays = useMemo(
    () => buildMonthDays(currentDate, today),
    [currentDate, today],
  );

  return (
    <div className="event-calendar__scroll">
      <div className="event-calendar event-calendar--month">
        <WeekdayHeader />

        <div className="event-calendar__grid">
          {calendarDays.map((calendarDay) => (
            <CalendarDayCell
              key={calendarDay.dateKey}
              calendarDay={calendarDay}
              events={eventsByDate.get(calendarDay.dateKey) ?? []}
              onEventClick={onEventClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface WeekViewProps extends CalendarViewProps {
  currentDate: Date;
  today: Date;
  onSelectDay: (date: Date) => void;
}

function WeekView({
  currentDate,
  today,
  eventsByDate,
  onEventClick,
  onSelectDay,
}: WeekViewProps) {
  const weekDays = useMemo(
    () => buildWeekDays(currentDate, today),
    [currentDate, today],
  );

  return (
    <div className="event-calendar__scroll">
      <div className="event-calendar event-calendar--week">
        <div className="event-calendar-week">
          {weekDays.map((calendarDay, index) => {
            const dayEvents = eventsByDate.get(calendarDay.dateKey) ?? [];

            return (
              <section
                key={calendarDay.dateKey}
                className={[
                  "event-calendar-week__day",
                  calendarDay.isToday ? "event-calendar-week__day--today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  type="button"
                  className="event-calendar-week__heading"
                  onClick={() => onSelectDay(calendarDay.date)}
                >
                  <span>{weekDayLabels[index]}</span>
                  <strong>{calendarDay.date.getDate()}</strong>
                </button>

                <div className="event-calendar-week__events">
                  {dayEvents.length === 0 ? (
                    <p className="event-calendar__empty-day">No events</p>
                  ) : (
                    dayEvents.map((portfolioEvent) => (
                      <CalendarEventButton
                        key={portfolioEvent.id}
                        portfolioEvent={portfolioEvent}
                        onClick={onEventClick}
                        showVendor
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface DayViewProps extends CalendarViewProps {
  currentDate: Date;
}

function DayView({ currentDate, eventsByDate, onEventClick }: DayViewProps) {
  const dateKey = formatLocalDateKey(currentDate);
  const dayEvents = eventsByDate.get(dateKey) ?? [];

  return (
    <div className="event-calendar-day">
      <div className="event-calendar-day__heading">
        <p>
          {currentDate.toLocaleDateString("en-CA", {
            weekday: "long",
          })}
        </p>

        <span>{currentDate.getDate()}</span>
      </div>

      <div className="event-calendar-day__content">
        {dayEvents.length === 0 ? (
          <div className="event-calendar-day__empty">
            <h4>No events scheduled</h4>
            <p>
              There are no portfolio events scheduled for{" "}
              {fullDateFormatter.format(currentDate)}.
            </p>
          </div>
        ) : (
          <div className="event-calendar-day__events">
            {dayEvents.map((portfolioEvent) => (
              <CalendarEventButton
                key={portfolioEvent.id}
                portfolioEvent={portfolioEvent}
                onClick={onEventClick}
                showVendor
                showStage
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WeekdayHeader() {
  return (
    <div className="event-calendar__weekdays" aria-hidden="true">
      {weekDayLabels.map((weekDay) => (
        <div key={weekDay} className="event-calendar__weekday">
          {weekDay}
        </div>
      ))}
    </div>
  );
}

interface CalendarDayCellProps {
  calendarDay: CalendarDay;
  events: EventDto[];
  onEventClick: (portfolioEvent: EventDto) => void;
}

function CalendarDayCell({
  calendarDay,
  events,
  onEventClick,
}: CalendarDayCellProps) {
  const visibleEvents = events.slice(0, 3);
  const hiddenEventCount = events.length - visibleEvents.length;

  return (
    <div
      className={[
        "event-calendar__day",
        !calendarDay.isCurrentMonth ? "event-calendar__day--outside" : "",
        calendarDay.isToday ? "event-calendar__day--today" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="event-calendar__day-heading">
        <time dateTime={calendarDay.dateKey}>{calendarDay.date.getDate()}</time>
      </div>

      <div className="event-calendar__day-events">
        {visibleEvents.map((portfolioEvent) => (
          <CalendarEventButton
            key={portfolioEvent.id}
            portfolioEvent={portfolioEvent}
            onClick={onEventClick}
          />
        ))}

        {hiddenEventCount > 0 && (
          <span className="event-calendar__more-events">
            +{hiddenEventCount} more
          </span>
        )}
      </div>
    </div>
  );
}

interface CalendarEventButtonProps {
  portfolioEvent: EventDto;
  onClick: (portfolioEvent: EventDto) => void;
  showVendor?: boolean;
  showStage?: boolean;
}

function CalendarEventButton({
  portfolioEvent,
  onClick,
  showVendor = false,
  showStage = false,
}: CalendarEventButtonProps) {
  const stageClassName = getStageClassName(portfolioEvent.stage);

  return (
    <button
      type="button"
      className={[
        "event-calendar-event",
        `event-calendar-event--${stageClassName}`,
      ].join(" ")}
      title={`${portfolioEvent.description} — ${portfolioEvent.vendorName}`}
      onClick={() => onClick(portfolioEvent)}
    >
      <span className="event-calendar-event__dot" aria-hidden="true" />

      <span className="event-calendar-event__content">
        <span className="event-calendar-event__name">
          {portfolioEvent.description}
        </span>

        {showVendor && (
          <span className="event-calendar-event__vendor">
            {portfolioEvent.vendorName}
          </span>
        )}

        {showStage && (
          <span className="event-calendar-event__stage">
            {formatStage(portfolioEvent.stage)}
          </span>
        )}
      </span>
    </button>
  );
}

function CalendarLegend() {
  const stages: EventStage[] = [
    "Exploring",
    "Planning",
    "Confirmed",
    "InProgress",
    "Completed",
  ];

  return (
    <footer className="event-calendar__legend">
      {stages.map((stage) => (
        <span key={stage} className="event-calendar__legend-item">
          <span
            className={[
              "event-calendar__legend-dot",
              `event-calendar__legend-dot--${getStageClassName(stage)}`,
            ].join(" ")}
            aria-hidden="true"
          />

          {formatStage(stage)}
        </span>
      ))}
    </footer>
  );
}

function navigateDate(date: Date, view: CalendarView, direction: -1 | 1): Date {
  if (view === "month") {
    return addMonths(date, direction);
  }

  if (view === "week") {
    return addDays(date, direction * 7);
  }

  return addDays(date, direction);
}

function getCalendarTitle(currentDate: Date, view: CalendarView): string {
  if (view === "month") {
    return calendarDateFormatter.format(currentDate);
  }

  if (view === "day") {
    return fullDateFormatter.format(currentDate);
  }

  const weekStart = startOfWeek(currentDate);
  const weekEnd = addDays(weekStart, 6);

  if (
    weekStart.getFullYear() === weekEnd.getFullYear() &&
    weekStart.getMonth() === weekEnd.getMonth()
  ) {
    return `${shortDateFormatter.format(
      weekStart,
    )} – ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
  }

  return `${shortDateFormatter.format(weekStart)} – ${shortDateFormatter.format(
    weekEnd,
  )}, ${weekEnd.getFullYear()}`;
}

function getStageClassName(stage: EventStage): string {
  return stage.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function formatStage(stage: EventStage): string {
  return stage.replace(/([a-z])([A-Z])/g, "$1 $2");
}
