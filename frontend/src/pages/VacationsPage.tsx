import VacationsLayout from "../components/vacations/layout/VacationsLayout";

import VacationOverview from "../components/vacations/overview/VacationOverview";

import TeamVacationCalendar from "../components/vacations/calendar/TeamVacationCalendar";

import PeopleBalancesView from "../components/vacations/people/PeopleBalancesView";

import CoverageWarningsView from "../components/vacations/coverage/CoverageWarningsView";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSearchParams } from "react-router-dom";

import LeaveRequestsView from "../components/vacations/requests/LeaveRequestsView";

import LeaveRequestFormModal from "../components/vacations/requests/LeaveRequestFormModal";

import LeaveRequestDeleteModal from "../components/vacations/requests/LeaveRequestDeleteModal";

import {
  approveLeaveRequest,
  createLeaveRequest,
  deleteLeaveRequest,
  getLeaveRequests,
  rejectLeaveRequest,
  updateLeaveRequest,
} from "../api/vacationsApi";

import { useAuth } from "../auth/AuthContext";

import type { LeaveRequestDto, LeaveRequestPayload } from "../types/vacations";

import type { VacationSection } from "../components/vacations/dashboard/VacationsDashboardNav";

export default function VacationsPage() {
  const { user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const requestedSection = searchParams.get("section");

  const requestedStatus = searchParams.get("status");

  const requestedEmployee = searchParams.get("employee");

  const canReviewVacation = Boolean(
    user?.isGlobalAdministrator ||
    (user?.role === "Manager" && user?.vacationAccess === "Admin"),
  );

  // =========================================================
  // PAGE DATA
  // =========================================================

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  // =========================================================
  // ACTIVE SECTION
  // =========================================================

  const [activeSection, setActiveSection] = useState<VacationSection>(
    isVacationSection(requestedSection) ? requestedSection : "overview",
  );

  // =========================================================
  // CREATE / EDIT
  // =========================================================

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [selectedLeaveRequest, setSelectedLeaveRequest] =
    useState<LeaveRequestDto | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  // =========================================================
  // DELETE
  // =========================================================

  const [leaveRequestPendingDelete, setLeaveRequestPendingDelete] =
    useState<LeaveRequestDto | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadLeaveRequests = useCallback(async () => {
    setIsLoading(true);

    setLoadError(null);

    try {
      const result = await getLeaveRequests();

      setLeaveRequests(result);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load leave requests.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeaveRequests();
  }, [loadLeaveRequests]);

  // =========================================================
  // RESPOND TO URL SECTION CHANGES
  // =========================================================

  useEffect(() => {
    if (isVacationSection(requestedSection)) {
      setActiveSection(requestedSection);
    }
  }, [requestedSection]);

  // =========================================================
  // PROFILE / DEEP-LINK FILTERING
  // =========================================================

  const profileFilteredRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const matchesEmployee =
        !requestedEmployee ||
        normalizeName(request.employeeName) ===
          normalizeName(requestedEmployee);

      const matchesStatus =
        !requestedStatus || request.status === requestedStatus;

      return matchesEmployee && matchesStatus;
    });
  }, [leaveRequests, requestedEmployee, requestedStatus]);

  const hasProfileFilters = Boolean(requestedEmployee || requestedStatus);

  const requestsForCurrentView = hasProfileFilters
    ? profileFilteredRequests
    : leaveRequests;

  // =========================================================
  // SECTION NAVIGATION
  // =========================================================

  function handleSectionChange(section: VacationSection) {
    setActiveSection(section);

    /*
     * Once the user manually changes sections,
     * clear Profile-specific employee/status
     * filters and retain only the destination.
     */
    setSearchParams({
      section,
    });
  }

  // =========================================================
  // CREATE
  // =========================================================

  function handleAddLeaveRequest() {
    setSelectedLeaveRequest(null);

    setFormError(null);

    setModalIsOpen(true);
  }

  // =========================================================
  // EDIT
  // =========================================================

  function handleEditLeaveRequest(request: LeaveRequestDto) {
    setSelectedLeaveRequest(request);

    setFormError(null);

    setModalIsOpen(true);
  }

  // =========================================================
  // SAVE
  // =========================================================

  async function handleLeaveRequestSubmit(payload: LeaveRequestPayload) {
    setIsSaving(true);

    setFormError(null);

    try {
      if (selectedLeaveRequest) {
        const updated = await updateLeaveRequest(
          selectedLeaveRequest.id,
          payload,
        );

        setLeaveRequests((current) =>
          current.map((request) =>
            request.id === updated.id ? updated : request,
          ),
        );
      } else {
        const created = await createLeaveRequest(payload);

        setLeaveRequests((current) =>
          [...current, created].sort((first, second) =>
            first.startDate.localeCompare(second.startDate),
          ),
        );
      }

      setModalIsOpen(false);

      setSelectedLeaveRequest(null);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to save the leave request.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  async function handleDeleteLeaveRequest() {
    if (!leaveRequestPendingDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteLeaveRequest(leaveRequestPendingDelete.id);

      setLeaveRequests((current) =>
        current.filter(
          (request) => request.id !== leaveRequestPendingDelete.id,
        ),
      );

      setLeaveRequestPendingDelete(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to delete the leave request.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  // =========================================================
  // APPROVE / REJECT
  // =========================================================

  async function handleApproveLeaveRequest(request: LeaveRequestDto) {
    await approveLeaveRequest(request.id);

    await loadLeaveRequests();
  }

  async function handleRejectLeaveRequest(request: LeaveRequestDto) {
    await rejectLeaveRequest(request.id);

    await loadLeaveRequests();
  }

  // =========================================================
  // EXPORT
  // =========================================================

  function handleExportCsv() {
    console.log("Export vacation CSV");
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <VacationsLayout
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onAddLeaveRequest={handleAddLeaveRequest}
        onExportCsv={handleExportCsv}
      >
        {/* =================================================
            OVERVIEW
           ================================================= */}

        {activeSection === "overview" && (
          <section className="vacations-section">
            <VacationOverview leaveRequests={leaveRequests} />
          </section>
        )}

        {/* =================================================
            TEAM CALENDAR
           ================================================= */}

        {activeSection === "calendar" && (
          <section className="vacations-section">
            <TeamVacationCalendar
              requests={leaveRequests}
              onEdit={handleEditLeaveRequest}
            />
          </section>
        )}

        {/* =================================================
            LEAVE REQUESTS
           ================================================= */}

        {activeSection === "requests" && (
          <section className="vacations-section">
            <LeaveRequestsView
              requests={requestsForCurrentView}
              isLoading={isLoading}
              error={loadError}
              onRetry={() => void loadLeaveRequests()}
              onEdit={handleEditLeaveRequest}
              onDelete={setLeaveRequestPendingDelete}
              canReview={canReviewVacation}
              onApprove={handleApproveLeaveRequest}
              onReject={handleRejectLeaveRequest}
            />
          </section>
        )}

        {/* =================================================
            PEOPLE & BALANCES
           ================================================= */}

        {activeSection === "people" && (
          <section className="vacations-section">
            <PeopleBalancesView requests={leaveRequests} />
          </section>
        )}

        {/* =================================================
            COVERAGE WARNINGS
           ================================================= */}

        {activeSection === "coverage" && (
          <section className="vacations-section">
            <CoverageWarningsView requests={leaveRequests} />
          </section>
        )}
      </VacationsLayout>

      {/* =====================================================
          CREATE / EDIT MODAL
         ===================================================== */}

      <LeaveRequestFormModal
        isOpen={modalIsOpen}
        request={selectedLeaveRequest}
        isSaving={isSaving}
        error={formError}
        onClose={() => {
          if (isSaving) {
            return;
          }

          setModalIsOpen(false);

          setSelectedLeaveRequest(null);

          setFormError(null);
        }}
        onSubmit={handleLeaveRequestSubmit}
      />

      {/* =====================================================
          DELETE MODAL
         ===================================================== */}

      <LeaveRequestDeleteModal
        request={leaveRequestPendingDelete}
        isDeleting={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setLeaveRequestPendingDelete(null);
          }
        }}
        onConfirm={handleDeleteLeaveRequest}
      />
    </>
  );
}

// =========================================================
// HELPERS
// =========================================================

function isVacationSection(value: string | null): value is VacationSection {
  return (
    value === "overview" ||
    value === "calendar" ||
    value === "requests" ||
    value === "people" ||
    value === "coverage"
  );
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
