import { AlertCircle, RefreshCw } from "lucide-react";
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
import EventHighlights from "../components/events/EventHighlights";
import EventPagination from "../components/events/EventPagination";
import EventPortfolioCharts from "../components/events/EventPortfolioCharts";
import EventStats from "../components/events/EventStats";
import EventTable from "../components/events/EventTable";
import EventVendorGroups from "../components/events/EventVendorGroups";
import EventsDashboardNav from "../components/events/dashboard/EventsDashboardNav";
import ConfirmDialog from "../components/feedback/ConfirmDialog";
import { useToast } from "../components/feedback/ToastProvider";
import type {
  EventDto,
  EventFormValues,
  EventSortField,
  EventStage,
  EventsSection,
  EventViewMode,
  SortDirection,
  VendorDto,
} from "../types/events";
import { mapFormToRequest } from "../utils/eventFormatting";
import EventCalendar from "../components/events/calendar/EventCalendar";

import { useAuth } from "../auth/AuthContext";

export default function EventsPage() {
  const { showToast } = useToast();

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

  const [viewMode, setViewMode] = useState<EventViewMode>("table");
  const [activeSection, setActiveSection] = useState<EventsSection>("overview");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventDto | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [eventPendingDelete, setEventPendingDelete] = useState<EventDto | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

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

  const { user } = useAuth();

  const canManageEvents = Boolean(
    user?.isGlobalAdministrator || user?.eventsAccess === "Admin",
  );

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
        (portfolioEvent.notes ?? "")
          .toLocaleLowerCase()
          .includes(normalizedSearch);

      const matchesStage = stage === "" || portfolioEvent.stage === stage;
      const matchesVendor =
        vendorId === "" || portfolioEvent.vendorId === vendorId;

      return matchesSearch && matchesStage && matchesVendor;
    });

    return sortEvents(filteredEvents, sortField, sortDirection);
  }, [events, search, sortDirection, sortField, stage, vendorId]);

  const upcomingEvents = useMemo(
    () =>
      sortEvents(
        events.filter((portfolioEvent) => portfolioEvent.stage !== "Completed"),
        sortField,
        sortDirection,
      ),
    [events, sortDirection, sortField],
  );

  const completedEvents = useMemo(
    () =>
      sortEvents(
        events.filter((portfolioEvent) => portfolioEvent.stage === "Completed"),
        sortField,
        sortDirection,
      ),
    [events, sortDirection, sortField],
  );

  const paginatedEvents = useMemo(() => {
    const startingIndex = (page - 1) * pageSize;

    return filteredAndSortedEvents.slice(
      startingIndex,
      startingIndex + pageSize,
    );
  }, [filteredAndSortedEvents, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, stage, vendorId, pageSize, viewMode]);

  useEffect(() => {
    const pageCount = Math.max(
      1,
      Math.ceil(filteredAndSortedEvents.length / pageSize),
    );

    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [filteredAndSortedEvents.length, page, pageSize]);

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
    if (!canManageEvents) {
      return;
    }

    setSelectedEvent(null);
    setFormError(null);
    setModalIsOpen(true);
  }

  function openEditModal(portfolioEvent: EventDto) {
    if (!canManageEvents) {
      return;
    }

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
    if (!canManageEvents) {
      return;
    }

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

        showToast(`"${updatedEvent.description}" was updated.`, "success");
      } else {
        const newEvent = await createEvent(request);

        setEvents((currentEvents) => [...currentEvents, newEvent]);

        showToast(`"${newEvent.description}" was added.`, "success");
      }

      setModalIsOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function requestDelete(portfolioEvent: EventDto) {
    if (!canManageEvents) {
      return;
    }

    setEventPendingDelete(portfolioEvent);
  }

  async function confirmDelete() {
    if (!canManageEvents || !eventPendingDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteEvent(eventPendingDelete.id);

      setEvents((currentEvents) =>
        currentEvents.filter(
          (portfolioEvent) => portfolioEvent.id !== eventPendingDelete.id,
        ),
      );

      showToast(`"${eventPendingDelete.description}" was deleted.`, "success");
      setEventPendingDelete(null);
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsDeleting(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setStage("");
    setVendorId("");
    setPage(1);
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  return (
    <section className="content-page events-page">
      <div className="events-workspace">
        <EventsDashboardNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onAddEvent={openCreateModal}
          canManageEvents={canManageEvents}
          addEventDisabled={isLoading || vendors.length === 0}
        />

        <main className="events-workspace__content">
          {/* <header className="page-header">
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
          </header> */}

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
              {activeSection === "overview" && (
                <div className="events-dashboard__section">
                  <SectionHeading title="Calendar & Overview" />

                  <EventCalendar events={events} onEventClick={openEditModal} />

                  <EventStats events={events} />
                  <EventPortfolioCharts events={events} />
                  <EventHighlights
                    events={events}
                    canManage={canManageEvents}
                    onEdit={openEditModal}
                  />
                </div>
              )}

              {activeSection === "events" && (
                <div className="events-dashboard__section">
                  <SectionHeading title="All Events" />

                  <section className="event-table-card">
                    <EventFilters
                      search={search}
                      stage={stage}
                      vendorId={vendorId}
                      vendors={vendors}
                      resultCount={filteredAndSortedEvents.length}
                      totalCount={events.length}
                      viewMode={viewMode}
                      onSearchChange={setSearch}
                      onStageChange={setStage}
                      onVendorChange={setVendorId}
                      onViewModeChange={setViewMode}
                      onReset={resetFilters}
                    />

                    {viewMode === "table" ? (
                      <>
                        <EventTable
                          events={paginatedEvents}
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                          canManage={canManageEvents}
                          onEdit={openEditModal}
                          onDelete={requestDelete}
                        />

                        <EventPagination
                          page={page}
                          pageSize={pageSize}
                          totalItems={filteredAndSortedEvents.length}
                          onPageChange={setPage}
                          onPageSizeChange={handlePageSizeChange}
                        />
                      </>
                    ) : (
                      <EventVendorGroups
                        events={filteredAndSortedEvents}
                        canManage={canManageEvents}
                        onEdit={openEditModal}
                      />
                    )}
                  </section>
                </div>
              )}

              {activeSection === "vendors" && (
                <div className="events-dashboard__section">
                  <SectionHeading title="Events by Vendor" />

                  <EventVendorGroups
                    events={events}
                    canManage={canManageEvents}
                    onEdit={openEditModal}
                  />
                </div>
              )}

              {activeSection === "upcoming" && (
                <div className="events-dashboard__section">
                  <SectionHeading title="Upcoming & Active Events" />

                  <section className="event-table-card">
                    <EventTable
                      events={upcomingEvents}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      canManage={canManageEvents}
                      onEdit={openEditModal}
                      onDelete={requestDelete}
                    />
                  </section>
                </div>
              )}

              {activeSection === "completed" && (
                <div className="events-dashboard__section">
                  <SectionHeading title="Completed Events" />

                  <section className="event-table-card">
                    <EventTable
                      events={completedEvents}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      canManage={canManageEvents}
                      onEdit={openEditModal}
                      onDelete={requestDelete}
                    />
                  </section>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {canManageEvents && (
        <EventFormModal
          isOpen={modalIsOpen}
          event={selectedEvent}
          vendors={vendors}
          isSaving={isSaving}
          serverError={formError}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
        />
      )}
      {canManageEvents && (
        <ConfirmDialog
          isOpen={eventPendingDelete !== null}
          title="Delete event?"
          description={
            eventPendingDelete
              ? `"${eventPendingDelete.description}" will be permanently removed from the Events portfolio.`
              : ""
          }
          confirmLabel="Delete event"
          isConfirming={isDeleting}
          onCancel={() => {
            if (!isDeleting) {
              setEventPendingDelete(null);
            }
          }}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </section>
  );
}

interface SectionHeadingProps {
  title: string;
}

function SectionHeading({ title }: SectionHeadingProps) {
  return (
    <div className="events-section-heading">
      <div>
        <p>
          <b>{title}</b>
        </p>
      </div>
    </div>
  );
}

function sortEvents(
  portfolioEvents: EventDto[],
  sortField: EventSortField,
  sortDirection: SortDirection,
): EventDto[] {
  return [...portfolioEvents].sort((firstEvent, secondEvent) => {
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
