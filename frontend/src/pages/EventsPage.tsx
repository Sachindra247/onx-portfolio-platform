import { AlertCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  approveEvent,
  cancelEventRegistration,
  createEvent,
  deleteEvent,
  getApiErrorMessage,
  getEventRegistrations,
  getEvents,
  getMyEventRegistration,
  getVendors,
  registerForEvent,
  rejectEvent,
  updateEvent,
  createVendor,
} from "../api/eventsApi";

import { useAuth } from "../auth/AuthContext";

import EventDetailsModal from "../components/events/EventDetailsModal";
import EventFilters from "../components/events/EventFilters";
import EventFormModal from "../components/events/EventFormModal";
import EventHighlights from "../components/events/EventHighlights";
import EventPagination from "../components/events/EventPagination";
import EventPortfolioCharts from "../components/events/EventPortfolioCharts";
import EventStats from "../components/events/EventStats";
import EventTable from "../components/events/EventTable";
import EventVendorGroups from "../components/events/EventVendorGroups";
import EventCalendar from "../components/events/calendar/EventCalendar";
import EventsDashboardNav from "../components/events/dashboard/EventsDashboardNav";

import ConfirmDialog from "../components/feedback/ConfirmDialog";
import { useToast } from "../components/feedback/ToastProvider";

import type {
  EventAttendeeDto,
  EventDto,
  EventFormValues,
  EventRegistrationDto,
  EventSortField,
  EventStage,
  EventsSection,
  EventViewMode,
  SortDirection,
  VendorDto,
} from "../types/events";

import { mapFormToRequest } from "../utils/eventFormatting";

export default function EventsPage() {
  const { showToast } = useToast();

  const { user } = useAuth();

  // =========================================================
  // MAIN EVENT DATA
  // =========================================================

  const [events, setEvents] = useState<EventDto[]>([]);

  const [vendors, setVendors] = useState<VendorDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  // =========================================================
  // FILTERING / SORTING
  // =========================================================

  const [search, setSearch] = useState("");

  const [stage, setStage] = useState<EventStage | "">("");

  const [vendorId, setVendorId] = useState("");

  const [sortField, setSortField] = useState<EventSortField>("eventDate");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("ascending");

  const [viewMode, setViewMode] = useState<EventViewMode>("table");

  const [activeSection, setActiveSection] = useState<EventsSection>("overview");

  // =========================================================
  // PAGINATION
  // =========================================================

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  // =========================================================
  // CREATE / EDIT MODAL
  // =========================================================

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<EventDto | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  // =========================================================
  // DELETE
  // =========================================================

  const [eventPendingDelete, setEventPendingDelete] = useState<EventDto | null>(
    null,
  );

  const [isDeleting, setIsDeleting] = useState(false);

  // =========================================================
  // EVENT DETAILS / RSVP
  // =========================================================

  const [detailsEvent, setDetailsEvent] = useState<EventDto | null>(null);

  const [eventRegistration, setEventRegistration] =
    useState<EventRegistrationDto | null>(null);

  const [attendees, setAttendees] = useState<EventAttendeeDto[]>([]);

  const [isRegistrationLoading, setIsRegistrationLoading] = useState(false);

  const [isRegistrationSaving, setIsRegistrationSaving] = useState(false);

  const [attendeesLoading, setAttendeesLoading] = useState(false);

  // =========================================================
  // PERMISSIONS
  // =========================================================

  const canManageEvents = Boolean(
    user?.isGlobalAdministrator || user?.eventsAccess === "Admin",
  );

  const canReviewEvents = Boolean(user?.isGlobalAdministrator);

  // =========================================================
  // LOAD PAGE
  // =========================================================

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

  // =========================================================
  // FILTERED / SORTED EVENTS
  // =========================================================

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

  // =========================================================
  // SORT
  // =========================================================

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

  // =========================================================
  // ADD EVENT
  // =========================================================

  function openCreateModal() {
    if (!canManageEvents) {
      return;
    }

    setSelectedEvent(null);
    setFormError(null);
    setModalIsOpen(true);
  }

  // =========================================================
  // EDIT EVENT
  // =========================================================

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

        showToast(
          `"${updatedEvent.description}" was updated and submitted for approval.`,
          "success",
        );
      } else {
        const newEvent = await createEvent(request);

        setEvents((currentEvents) => [...currentEvents, newEvent]);

        showToast(
          `"${newEvent.description}" was added and submitted for approval.`,
          "success",
        );
      }

      setModalIsOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  // =========================================================
  // APPROVAL
  // =========================================================

  async function handleApproveEvent(portfolioEvent: EventDto) {
    try {
      const updatedEvent = await approveEvent(portfolioEvent.id);

      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event,
        ),
      );

      if (detailsEvent?.id === updatedEvent.id) {
        setDetailsEvent(updatedEvent);
      }

      showToast(`"${updatedEvent.description}" was approved.`, "success");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  async function handleRejectEvent(portfolioEvent: EventDto) {
    try {
      const updatedEvent = await rejectEvent(portfolioEvent.id);

      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event,
        ),
      );

      if (detailsEvent?.id === updatedEvent.id) {
        setDetailsEvent(updatedEvent);
      }

      showToast(`"${updatedEvent.description}" was rejected.`, "success");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

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

      if (detailsEvent?.id === eventPendingDelete.id) {
        setDetailsEvent(null);
      }

      showToast(`"${eventPendingDelete.description}" was deleted.`, "success");

      setEventPendingDelete(null);
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsDeleting(false);
    }
  }

  // =========================================================
  // EVENT DETAILS
  // =========================================================

  async function openEventDetails(portfolioEvent: EventDto) {
    setDetailsEvent(portfolioEvent);

    setEventRegistration(null);

    setAttendees([]);

    // Only approved events
    // can actually have RSVP activity.
    if (portfolioEvent.approvalStatus === "Approved") {
      setIsRegistrationLoading(true);

      try {
        const registration = await getMyEventRegistration(portfolioEvent.id);

        setEventRegistration(registration);
      } catch (error) {
        showToast(getApiErrorMessage(error), "error");
      } finally {
        setIsRegistrationLoading(false);
      }
    } else {
      setIsRegistrationLoading(false);
    }

    if (canManageEvents) {
      setAttendeesLoading(true);

      try {
        const records = await getEventRegistrations(portfolioEvent.id);

        setAttendees(records);
      } catch (error) {
        showToast(getApiErrorMessage(error), "error");
      } finally {
        setAttendeesLoading(false);
      }
    }
  }

  function closeEventDetails() {
    if (isRegistrationSaving) {
      return;
    }

    setDetailsEvent(null);
    setEventRegistration(null);
    setAttendees([]);
    setIsRegistrationLoading(false);
    setAttendeesLoading(false);
  }

  // =========================================================
  // RSVP
  // =========================================================

  async function handleRegisterForEvent(portfolioEvent: EventDto) {
    setIsRegistrationSaving(true);

    try {
      const registration = await registerForEvent(portfolioEvent.id);

      setEventRegistration(registration);

      showToast(
        `You are registered for "${portfolioEvent.description}".`,
        "success",
      );

      if (canManageEvents) {
        const records = await getEventRegistrations(portfolioEvent.id);

        setAttendees(records);
      }
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsRegistrationSaving(false);
    }
  }

  async function handleCancelRegistration(portfolioEvent: EventDto) {
    setIsRegistrationSaving(true);

    try {
      await cancelEventRegistration(portfolioEvent.id);

      setEventRegistration(null);

      showToast(
        `Your registration for "${portfolioEvent.description}" was cancelled.`,
        "success",
      );

      if (canManageEvents) {
        const records = await getEventRegistrations(portfolioEvent.id);

        setAttendees(records);
      }
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsRegistrationSaving(false);
    }
  }

  async function handleCreateVendor(name: string): Promise<VendorDto> {
    try {
      const vendor = await createVendor(name);

      setVendors((currentVendors) =>
        [...currentVendors, vendor].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );

      showToast(`"${vendor.name}" was added to the vendor list.`, "success");

      return vendor;
    } catch (error) {
      const message = getApiErrorMessage(error);

      showToast(message, "error");

      throw new Error(message);
    }
  }

  // =========================================================
  // FILTER HELPERS
  // =========================================================

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

  // =========================================================
  // RENDER
  // =========================================================

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

                  <EventCalendar
                    events={events}
                    onEventClick={openEventDetails}
                  />

                  <EventStats events={events} canManage={canManageEvents} />

                  <EventPortfolioCharts
                    events={events}
                    canManage={canManageEvents}
                  />

                  <EventHighlights events={events} onView={openEventDetails} />
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
                          canReview={canReviewEvents}
                          onView={openEventDetails}
                          onApprove={handleApproveEvent}
                          onReject={handleRejectEvent}
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
                        onView={openEventDetails}
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
                    onView={openEventDetails}
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
                      canReview={canReviewEvents}
                      onView={openEventDetails}
                      onApprove={handleApproveEvent}
                      onReject={handleRejectEvent}
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
                      canReview={canReviewEvents}
                      onView={openEventDetails}
                      onApprove={handleApproveEvent}
                      onReject={handleRejectEvent}
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

      {/* =====================================================
          EVENT DETAILS / RSVP
          Available to every authenticated user who can see
          the event.
         ===================================================== */}

      <EventDetailsModal
        event={detailsEvent}
        isRegistered={eventRegistration?.isRegistered ?? false}
        isRegistrationLoading={isRegistrationLoading}
        isRegistrationSaving={isRegistrationSaving}
        attendees={attendees}
        attendeesLoading={attendeesLoading}
        canManage={canManageEvents}
        canViewAttendees={canManageEvents}
        onClose={closeEventDetails}
        onEdit={(portfolioEvent) => {
          setDetailsEvent(null);

          openEditModal(portfolioEvent);
        }}
        onRegister={handleRegisterForEvent}
        onCancelRegistration={handleCancelRegistration}
      />

      {/* =====================================================
          EVENT CREATE / EDIT
         ===================================================== */}

      {canManageEvents && (
        <EventFormModal
          isOpen={modalIsOpen}
          event={selectedEvent}
          vendors={vendors}
          isSaving={isSaving}
          serverError={formError}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
          onCreateVendor={handleCreateVendor}
        />
      )}

      {/* =====================================================
          EVENT DELETE
         ===================================================== */}

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
