import VacationsLayout from "../components/vacations/layout/VacationsLayout";

import VacationOverview from "../components/vacations/overview/VacationOverview";

import TeamVacationCalendar from "../components/vacations/calendar/TeamVacationCalendar";

import PeopleBalancesView from "../components/vacations/people/PeopleBalancesView";
import CoverageWarningsView from "../components/vacations/coverage/CoverageWarningsView";

import { useCallback, useEffect, useState } from "react";

import LeaveRequestsView from "../components/vacations/requests/LeaveRequestsView";

import LeaveRequestFormModal from "../components/vacations/requests/LeaveRequestFormModal";
import LeaveRequestDeleteModal from "../components/vacations/requests/LeaveRequestDeleteModal";

import {
  createLeaveRequest,
  deleteLeaveRequest,
  getLeaveRequests,
  updateLeaveRequest,
} from "../api/vacationsApi";

import type { LeaveRequestDto, LeaveRequestPayload } from "../types/vacations";

import type { VacationSection } from "../components/vacations/dashboard/VacationsDashboardNav";

export default function VacationsPage() {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [selectedLeaveRequest, setSelectedLeaveRequest] =
    useState<LeaveRequestDto | null>(null);

  const [leaveRequestPendingDelete, setLeaveRequestPendingDelete] =
    useState<LeaveRequestDto | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

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
  const [activeSection, setActiveSection] =
    useState<VacationSection>("overview");

  function handleAddLeaveRequest() {
    setSelectedLeaveRequest(null);
    setFormError(null);
    setModalIsOpen(true);
  }

  function handleEditLeaveRequest(request: LeaveRequestDto) {
    setSelectedLeaveRequest(request);
    setFormError(null);
    setModalIsOpen(true);
  }

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

  function handleExportCsv() {
    console.log("Export vacation CSV");
  }

  return (
    <>
      <VacationsLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onAddLeaveRequest={handleAddLeaveRequest}
        onExportCsv={handleExportCsv}
      >
        {activeSection === "overview" && (
          <section className="vacations-section">
            <VacationOverview leaveRequests={leaveRequests} />
          </section>
        )}

        {activeSection === "calendar" && (
          <section className="vacations-section">
            <TeamVacationCalendar
              requests={leaveRequests}
              onEdit={handleEditLeaveRequest}
            />
          </section>
        )}

        {activeSection === "requests" && (
          <section className="vacations-section">
            <LeaveRequestsView
              requests={leaveRequests}
              isLoading={isLoading}
              error={loadError}
              onRetry={() => void loadLeaveRequests()}
              onEdit={handleEditLeaveRequest}
              onDelete={setLeaveRequestPendingDelete}
            />
          </section>
        )}

        {activeSection === "people" && (
          <section className="vacations-section">
            <PeopleBalancesView requests={leaveRequests} />
          </section>
        )}

        {activeSection === "coverage" && (
          <section className="vacations-section">
            <CoverageWarningsView requests={leaveRequests} />
          </section>
        )}
      </VacationsLayout>

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
