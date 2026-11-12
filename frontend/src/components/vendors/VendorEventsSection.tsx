import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { getEvents } from "../../api/eventsApi";
import type { EventDto } from "../../types/events";

interface VendorEventsSectionProps {
  vendorId: string;
}

export default function VendorEventsSection({
  vendorId,
}: VendorEventsSectionProps) {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      setLoading(true);
      setError(null);

      try {
        const records = await getEvents(controller.signal);

        if (!controller.signal.aborted) {
          setEvents(records.filter((event) => event.vendorId === vendorId));
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load vendor events.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadEvents();

    return () => controller.abort();
  }, [vendorId]);

  if (loading) {
    return <p>Loading events...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <section>
      <h4 style={{ marginBottom: "16px" }}>Related Events ({events.length})</h4>

      {events.length === 0 ? (
        <p>No events found for this vendor.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {events.map((event) => (
            <article
              key={event.id}
              style={{
                padding: "16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <CalendarDays size={18} color="#28785d" />
                <strong>{event.description}</strong>
              </div>

              <p>
                Date:{" "}
                {event.eventDate
                  ? event.eventDate.slice(0, 10)
                  : "Not scheduled"}
              </p>

              <p>Stage: {event.stage}</p>
              <p>Approval: {event.approvalStatus}</p>

              {event.venue && <p>Venue: {event.venue}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
