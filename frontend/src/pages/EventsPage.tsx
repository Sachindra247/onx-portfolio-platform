import { AlertCircle, CalendarDays, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createEvent,
  deleteEvent,
  getApiErrorMessage,
  getEvents,
  getVendors,
  updateEvent,
} from "../api/eventsApi";
import EventFilters from "../components/events/EventFilters";
import EventFormModal from "../components/events/EventFormModal";
import EventStats from "../components/events/EventStats";
import EventTable from "../components/events/EventTable";
import type {
  EventDto,
  EventFormValues,
  EventSortField,
  EventStage,
  SortDirection,
  VendorDto,
} from "../types/events";
import { mapFormToRequest } from "../utils/eventFormatting";

export default function EventsPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<EventStage | "">("");
  const [vendorId, setVendorId] = useState("");

  const [sortField, setSortField] = useState<EventSortField>("eventDate");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("ascending");

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventDto | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [loadedEvents, loadedVendors] = await Promise.all([
        getEvents(),
        getVendors(),
      ]);

      setEvents(loadedEvents);
      setVendors(loadedVendors);
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const filteredAndSortedEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    const filteredEvents = events.filter((portfolioEvent) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        portfolioEvent.description
          .toLocaleLowerCase()
          .includes(normalizedSearch) ||
        portfolioEvent.vendorName
          .toLocaleLowerCase()
          .includes(normalizedSearch) ||
        portfolioEvent.notes?.toLocaleLowerCase().includes(normalizedSearch);

      const matchesStage = stage === "" || portfolioEvent.stage === stage;

      const matchesVendor =
        vendorId === "" || portfolioEvent.vendorId === vendorId;

      return matchesSearch && matchesStage && matchesVendor;
    });

    return [...filteredEvents].sort((firstEvent, secondEvent) => {
      let comparison = 0;

      switch (sortField) {
        case "budgetCad":
          comparison = firstEvent.budgetCad - secondEvent.budgetCad;
          break;

        case "eventDate":
          comparison = compareNullableDates(
            firstEvent.eventDate,
            secondEvent.eventDate,
          );
          break;

        case "vendorName":
          comparison = firstEvent.vendorName.localeCompare(
            secondEvent.vendorName,
          );
          break;

        case "description":
          comparison = firstEvent.description.localeCompare(
            secondEvent.description,
          );
          break;

        case "stage":
          comparison = firstEvent.stage.localeCompare(secondEvent.stage);
          break;
      }

      return sortDirection === "ascending" ? comparison : comparison * -1;
    });
  }, [events, search, sortDirection, sortField, stage, vendorId]);

  function handleSort(field: EventSortField) {
    if (field === sortField) {
      setSortDirection((currentDirection) =>
        currentDirection === "ascending" ? "descending" : "ascending",
      );

      return;
    }

    setSortField(field);
    setSortDirection("ascending");
  }

  function openCreateModal() {
    setSelectedEvent(null);
    setFormError(null);
    setModalIsOpen(true);
  }

  function openEditModal(portfolioEvent: EventDto) {
    setSelectedEvent(portfolioEvent);
    setFormError(null);
    setModalIsOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setModalIsOpen(false);
    setSelectedEvent(null);
    setFormError(null);
  }

  async function handleFormSubmit(values: EventFormValues) {
    setIsSaving(true);
    setFormError(null);

    try {
      const request = mapFormToRequest(values);

      if (selectedEvent) {
        const updatedEvent = await updateEvent(selectedEvent.id, request);

        setEvents((currentEvents) =>
          currentEvents.map((portfolioEvent) =>
            portfolioEvent.id === updatedEvent.id
              ? updatedEvent
              : portfolioEvent,
          ),
        );
      } else {
        const newEvent = await createEvent(request);

        setEvents((currentEvents) => [...currentEvents, newEvent]);
      }

      setModalIsOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(portfolioEvent: EventDto) {
    const confirmed = window.confirm(
      `Delete "${portfolioEvent.description}"?\n\n` +
        "This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteEvent(portfolioEvent.id);

      setEvents((currentEvents) =>
        currentEvents.filter((event) => event.id !== portfolioEvent.id),
      );
    } catch (error) {
      window.alert(getApiErrorMessage(error));
    }
  }

  function resetFilters() {
    setSearch("");
    setStage("");
    setVendorId("");
  }

  return (
    <section className="content-page events-page">
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

        <button
          className="primary-button"
          type="button"
          disabled={isLoading || vendors.length === 0}
          onClick={openCreateModal}
        >
          <Plus size={17} aria-hidden="true" />
          Add event
        </button>
      </header>

      {isLoading && (
        <div className="page-state" aria-live="polite">
          <RefreshCw
            className="page-state__spinner"
            size={29}
            aria-hidden="true"
          />

          <h2>Loading events</h2>
          <p>Retrieving the current portfolio from the API...</p>
        </div>
      )}

      {!isLoading && loadError && (
        <div className="page-state page-state--error" role="alert">
          <AlertCircle size={31} aria-hidden="true" />

          <h2>Unable to load events</h2>
          <p>{loadError}</p>

          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadPageData()}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      {!isLoading && !loadError && (
        <>
          <EventStats events={events} />

          <section className="event-table-card">
            <EventFilters
              search={search}
              stage={stage}
              vendorId={vendorId}
              vendors={vendors}
              resultCount={filteredAndSortedEvents.length}
              totalCount={events.length}
              onSearchChange={setSearch}
              onStageChange={setStage}
              onVendorChange={setVendorId}
              onReset={resetFilters}
            />

            <EventTable
              events={filteredAndSortedEvents}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onEdit={openEditModal}
              onDelete={(portfolioEvent) => void handleDelete(portfolioEvent)}
            />
          </section>
        </>
      )}

      <EventFormModal
        isOpen={modalIsOpen}
        event={selectedEvent}
        vendors={vendors}
        isSaving={isSaving}
        serverError={formError}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
      />
    </section>
  );
}

function compareNullableDates(
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
