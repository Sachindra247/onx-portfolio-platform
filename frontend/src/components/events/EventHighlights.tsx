import { CalendarClock, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

import type { EventDto } from "../../types/events";

import { formatBudget, formatEventDate } from "../../utils/eventFormatting";

import {
  getRecentlyCompletedEvents,
  getUpcomingEvents,
} from "../../utils/eventAnalytics";

interface EventHighlightsProps {
  events: EventDto[];
  canManage: boolean;
  onEdit: (event: EventDto) => void;
}

export default function EventHighlights({
  events,
  canManage,
  onEdit,
}: EventHighlightsProps) {
  const upcomingEvents = getUpcomingEvents(events);

  const completedEvents = getRecentlyCompletedEvents(events);

  return (
    <section className="event-highlights">
      <HighlightCard
        title="Upcoming events"
        subtitle="Next scheduled portfolio activities"
        icon={<CalendarClock size={18} aria-hidden="true" />}
        events={upcomingEvents}
        emptyMessage="No upcoming events are currently scheduled."
        canManage={canManage}
        onEdit={onEdit}
      />

      <HighlightCard
        title="Recently completed"
        subtitle="Latest completed portfolio events"
        icon={<CheckCircle2 size={18} aria-hidden="true" />}
        events={completedEvents}
        emptyMessage="No completed events are available."
        canManage={canManage}
        onEdit={onEdit}
      />
    </section>
  );
}

interface HighlightCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  events: EventDto[];
  emptyMessage: string;
  canManage: boolean;

  onEdit: (event: EventDto) => void;
}

function HighlightCard({
  title,
  subtitle,
  icon,
  events,
  emptyMessage,
  canManage,
  onEdit,
}: HighlightCardProps) {
  return (
    <article className="event-highlight-card">
      <header className="event-highlight-card__header">
        <span className="event-highlight-card__icon">{icon}</span>

        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>

      {events.length === 0 ? (
        <p className="event-highlight-card__empty">{emptyMessage}</p>
      ) : (
        <div className="event-highlight-list">
          {events.map((event) =>
            canManage ? (
              <button
                type="button"
                className="event-highlight-item"
                key={event.id}
                onClick={() => onEdit(event)}
              >
                <HighlightContent event={event} />
              </button>
            ) : (
              <div
                className="event-highlight-item event-highlight-item--readonly"
                key={event.id}
              >
                <HighlightContent event={event} />
              </div>
            ),
          )}
        </div>
      )}
    </article>
  );
}

interface HighlightContentProps {
  event: EventDto;
}

function HighlightContent({ event }: HighlightContentProps) {
  return (
    <>
      <span className="event-highlight-item__date">
        {formatEventDate(event.eventDate)}
      </span>

      <strong>{event.description}</strong>

      <span>
        {event.vendorName} · {formatBudget(event.budgetCad)}
      </span>
    </>
  );
}
