import { ChevronLeft, ChevronRight } from "lucide-react";

import type { CalendarView } from "./calendarUtils";

interface CalendarToolbarProps {
  title: string;
  view: CalendarView;
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
  onViewChange: (view: CalendarView) => void;
}

const views: CalendarView[] = ["month", "week", "day"];

export default function CalendarToolbar({
  title,
  view,
  onPrevious,
  onToday,
  onNext,
  onViewChange,
}: CalendarToolbarProps) {
  return (
    <header className="event-calendar__header">
      <div className="event-calendar__navigation">
        <div className="event-calendar__month-buttons">
          <button
            type="button"
            aria-label={`Show previous ${view}`}
            onClick={onPrevious}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label={`Show next ${view}`}
            onClick={onNext}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        <button
          className="event-calendar__today-button"
          type="button"
          onClick={onToday}
        >
          Today
        </button>

        <h3 className="event-calendar__period-title">{title}</h3>
      </div>

      <div className="event-calendar__view-switcher" aria-label="Calendar view">
        {views.map((calendarView) => (
          <button
            key={calendarView}
            type="button"
            className={
              view === calendarView
                ? "event-calendar__view-button event-calendar__view-button--active"
                : "event-calendar__view-button"
            }
            aria-pressed={view === calendarView}
            onClick={() => onViewChange(calendarView)}
          >
            {capitalise(calendarView)}
          </button>
        ))}
      </div>
    </header>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
