import { CalendarCheck2, CircleDollarSign, Layers3, Timer } from "lucide-react";
import type { EventDto } from "../../types/events";
import { formatBudget } from "../../utils/eventFormatting";

interface EventStatsProps {
  events: EventDto[];
}

export default function EventStats({ events }: EventStatsProps) {
  const totalBudget = events.reduce(
    (total, event) => total + event.budgetCad,
    0,
  );

  const activeEvents = events.filter(
    (event) => event.stage !== "Completed",
  ).length;

  const completedEvents = events.filter(
    (event) => event.stage === "Completed",
  ).length;

  const upcomingEvents = events.filter((event) => {
    if (!event.eventDate || event.stage === "Completed") {
      return false;
    }

    return new Date(`${event.eventDate}T23:59:59`) >= new Date();
  }).length;

  const stats = [
    {
      label: "Total events",
      value: events.length.toString(),
      detail: "Across all vendors",
      icon: Layers3,
    },
    {
      label: "Active portfolio",
      value: activeEvents.toString(),
      detail: "Not yet completed",
      icon: Timer,
    },
    {
      label: "Upcoming",
      value: upcomingEvents.toString(),
      detail: "Scheduled future events",
      icon: CalendarCheck2,
    },
    {
      label: "Total budget",
      value: formatBudget(totalBudget),
      detail: `${completedEvents} completed`,
      icon: CircleDollarSign,
    },
  ];

  return (
    <div className="event-stats" aria-label="Event portfolio summary">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article className="event-stat-card" key={stat.label}>
            <div className="event-stat-card__top">
              <span className="event-stat-card__label">{stat.label}</span>

              <span className="event-stat-card__icon">
                <Icon size={17} aria-hidden="true" />
              </span>
            </div>

            <strong className="event-stat-card__value">{stat.value}</strong>

            <span className="event-stat-card__detail">{stat.detail}</span>
          </article>
        );
      })}
    </div>
  );
}
