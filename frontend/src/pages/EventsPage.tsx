import { CalendarDays, Plus } from "lucide-react";

export default function EventsPage() {
  return (
    <section className="content-page">
      <header className="page-header">
        <div className="page-header__identity">
          <div className="page-header__icon module-accent module-accent--gold">
            <CalendarDays size={25} aria-hidden="true" />
          </div>

          <div>
            <p className="page-header__eyebrow">Portfolio management</p>
            <h1>Events Portfolio</h1>
            <p>All vendors · FY2026 · CAD</p>
          </div>
        </div>

        <button className="primary-button" type="button" disabled>
          <Plus size={17} aria-hidden="true" />
          Add event
        </button>
      </header>

      <div className="events-placeholder">
        <CalendarDays size={34} aria-hidden="true" />

        <h2>Events workspace ready</h2>

        <p>
          The application shell is complete. The next step will connect this
          page to the Events API and add live statistics, filtering, search,
          sorting and event management.
        </p>
      </div>
    </section>
  );
}
