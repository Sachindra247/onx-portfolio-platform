import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Palmtree,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";

import { getMyRegisteredEvents } from "../api/eventsApi";

import { getCertifications } from "../api/certificationsApi";

import { getLeaveRequests } from "../api/vacationsApi";

import type { EventDto } from "../types/events";

import type { CertificationDto } from "../types/certifications";

import type { LeaveRequestDto } from "../types/vacations";

import { formatEventDate } from "../utils/eventFormatting";

export default function ProfilePage() {
  const { user } = useAuth();

  // =========================================================
  // EVENTS
  // =========================================================

  const [registeredEvents, setRegisteredEvents] = useState<EventDto[]>([]);

  const [eventsLoading, setEventsLoading] = useState(true);

  const [eventsError, setEventsError] = useState<string | null>(null);

  // =========================================================
  // CERTIFICATIONS
  // =========================================================

  const [certifications, setCertifications] = useState<CertificationDto[]>([]);

  const [certificationsLoading, setCertificationsLoading] = useState(true);

  const [certificationsError, setCertificationsError] = useState<string | null>(
    null,
  );

  // =========================================================
  // VACATION
  // =========================================================

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);

  const [vacationLoading, setVacationLoading] = useState(true);

  const [vacationError, setVacationError] = useState<string | null>(null);

  // =========================================================
  // LOAD PROFILE DATA
  // =========================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    const controller = new AbortController();

    const fullName = normalizeName(`${user.firstName} ${user.lastName}`);

    async function loadProfileData() {
      setEventsLoading(true);
      setCertificationsLoading(true);
      setVacationLoading(true);

      setEventsError(null);
      setCertificationsError(null);
      setVacationError(null);

      // EVENTS
      try {
        const loadedEvents = await getMyRegisteredEvents(controller.signal);

        if (!controller.signal.aborted) {
          setRegisteredEvents(loadedEvents);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setEventsError(
            getErrorMessage(error, "Unable to load your registered events."),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setEventsLoading(false);
        }
      }

      // CERTIFICATIONS
      try {
        const loadedCertifications = await getCertifications(controller.signal);

        if (!controller.signal.aborted) {
          setCertifications(
            loadedCertifications.filter(
              (certification) =>
                normalizeName(certification.personName) === fullName,
            ),
          );
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setCertificationsError(
            getErrorMessage(error, "Unable to load your certifications."),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setCertificationsLoading(false);
        }
      }

      // VACATION
      try {
        const loadedLeaveRequests = await getLeaveRequests();

        if (!controller.signal.aborted) {
          setLeaveRequests(
            loadedLeaveRequests.filter(
              (leaveRequest) =>
                normalizeName(leaveRequest.employeeName) === fullName,
            ),
          );
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setVacationError(
            getErrorMessage(error, "Unable to load your vacation information."),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setVacationLoading(false);
        }
      }
    }

    void loadProfileData();

    return () => {
      controller.abort();
    };
  }, [user]);

  // =========================================================
  // PROFILE CALCULATIONS
  // =========================================================

  const upcomingLeave = useMemo(() => {
    const today = getTodayKey();

    return leaveRequests
      .filter(
        (leaveRequest) =>
          leaveRequest.status === "Approved" && leaveRequest.endDate >= today,
      )
      .sort((firstRequest, secondRequest) =>
        firstRequest.startDate.localeCompare(secondRequest.startDate),
      );
  }, [leaveRequests]);

  const pendingLeaveCount = useMemo(
    () =>
      leaveRequests.filter((leaveRequest) => leaveRequest.status === "Pending")
        .length,
    [leaveRequests],
  );

  const approvedLeaveCount = useMemo(
    () =>
      leaveRequests.filter((leaveRequest) => leaveRequest.status === "Approved")
        .length,
    [leaveRequests],
  );

  const activeCertifications = useMemo(
    () =>
      certifications
        .filter(
          (certification) =>
            certification.status !== "Expired" &&
            certification.status !== "Tbd",
        )
        .sort((firstCertification, secondCertification) =>
          compareNullableDates(
            firstCertification.expiryDate,
            secondCertification.expiryDate,
          ),
        ),
    [certifications],
  );

  const expiringCertificationCount = useMemo(() => {
    const now = new Date();

    const ninetyDaysFromNow = new Date();

    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    return certifications.filter((certification) => {
      if (!certification.expiryDate || certification.status === "Expired") {
        return false;
      }

      const expiryDate = parseDateOnly(certification.expiryDate);

      return expiryDate >= now && expiryDate <= ninetyDaysFromNow;
    }).length;
  }, [certifications]);

  if (!user) {
    return null;
  }

  const displayRole = user.isGlobalAdministrator
    ? "Global Administrator"
    : user.role;

  return (
    <main className="profile-page">
      {/* =====================================================
          PROFILE HEADER
         ===================================================== */}

      <section className="profile-hero">
        <div className="profile-hero__avatar">
          {user.firstName.charAt(0)}
          {user.lastName.charAt(0)}
        </div>

        <div className="profile-hero__identity">
          <span className="profile-hero__eyebrow">My Profile</span>

          <h1>
            {user.firstName} {user.lastName}
          </h1>

          <p>{user.email}</p>

          <div className="profile-hero__badges">
            <span>
              <BriefcaseBusiness size={13} />

              {displayRole}
            </span>

            <span>
              <UserRound size={13} />
              Group: {user.group}
            </span>

            {user.managerName && (
              <span>
                <BadgeCheck size={13} />
                Manager: {user.managerName}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="profile-grid">
        {/* =================================================
            MY VACATION
           ================================================= */}

        <article className="profile-card">
          <header>
            <div>
              <span className="profile-card__icon">
                <Palmtree size={18} />
              </span>

              <div>
                <h2>My Vacation</h2>

                <p>Personal leave requests and upcoming absences</p>
              </div>
            </div>
          </header>

          {vacationLoading ? (
            <ProfileLoading message="Loading vacation details..." />
          ) : vacationError ? (
            <ProfileError message={vacationError} />
          ) : (
            <>
              <div className="profile-summary-row">
                <ProfileSummary label="Pending" value={pendingLeaveCount} />

                <ProfileSummary label="Approved" value={approvedLeaveCount} />

                <ProfileSummary label="Upcoming" value={upcomingLeave.length} />
              </div>

              {upcomingLeave.length === 0 ? (
                <div className="profile-card__empty">
                  <strong>No upcoming leave.</strong>

                  <span>Approved future leave will appear here.</span>
                </div>
              ) : (
                <div className="profile-record-list">
                  {upcomingLeave.slice(0, 4).map((leaveRequest) => (
                    <div className="profile-record-item" key={leaveRequest.id}>
                      <div>
                        <strong>{leaveRequest.leaveType}</strong>

                        <span>
                          {formatDateRange(
                            leaveRequest.startDate,
                            leaveRequest.endDate,
                          )}
                        </span>
                      </div>

                      <span className="profile-status profile-status--approved">
                        Approved
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </article>

        {/* =================================================
            MY EVENTS
           ================================================= */}

        <article className="profile-card">
          <header>
            <div>
              <span className="profile-card__icon">
                <CalendarDays size={18} />
              </span>

              <div>
                <h2>My Events</h2>

                <p>Events you have registered or RSVP&apos;d for</p>
              </div>
            </div>
          </header>

          {eventsLoading ? (
            <ProfileLoading message="Loading registered events..." />
          ) : eventsError ? (
            <ProfileError message={eventsError} />
          ) : registeredEvents.length === 0 ? (
            <div className="profile-card__empty">
              <strong>No event registrations yet.</strong>

              <span>Events you register for will appear here.</span>
            </div>
          ) : (
            <div className="profile-record-list">
              {registeredEvents.slice(0, 5).map((portfolioEvent) => (
                <div className="profile-record-item" key={portfolioEvent.id}>
                  <div>
                    <strong>{portfolioEvent.description}</strong>

                    <span>
                      {formatEventDate(portfolioEvent.eventDate)}
                      {" · "}
                      {portfolioEvent.vendorName}
                    </span>
                  </div>

                  <span className="profile-status profile-status--registered">
                    Registered
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* =================================================
            MY CERTIFICATIONS
           ================================================= */}

        <article className="profile-card">
          <header>
            <div>
              <span className="profile-card__icon">
                <GraduationCap size={18} />
              </span>

              <div>
                <h2>My Certifications</h2>

                <p>Certifications associated with your profile</p>
              </div>
            </div>
          </header>

          {certificationsLoading ? (
            <ProfileLoading message="Loading certifications..." />
          ) : certificationsError ? (
            <ProfileError message={certificationsError} />
          ) : certifications.length === 0 ? (
            <div className="profile-card__empty">
              <strong>No certifications found.</strong>

              <span>
                Certifications recorded under your name will appear here.
              </span>
            </div>
          ) : (
            <>
              <div className="profile-summary-row">
                <ProfileSummary label="Total" value={certifications.length} />

                <ProfileSummary
                  label="Active"
                  value={activeCertifications.length}
                />

                <ProfileSummary
                  label="Expiring"
                  value={expiringCertificationCount}
                />
              </div>

              <div className="profile-record-list">
                {activeCertifications.slice(0, 5).map((certification) => (
                  <div className="profile-record-item" key={certification.id}>
                    <div>
                      <strong>{certification.certificationName}</strong>

                      <span>
                        {certification.vendorName}

                        {certification.expiryDate
                          ? ` · Expires ${formatProfileDate(
                              certification.expiryDate,
                            )}`
                          : ""}
                      </span>
                    </div>

                    <span
                      className={[
                        "profile-status",
                        getCertificationStatusClass(certification.status),
                      ].join(" ")}
                    >
                      {formatCertificationStatus(certification.status)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>

        {/* =================================================
            APPLICATION ACCESS
           ================================================= */}

        <article className="profile-card">
          <header>
            <div>
              <span className="profile-card__icon">
                <ShieldCheck size={18} />
              </span>

              <div>
                <h2>Application Access</h2>

                <p>Your current permissions in the platform</p>
              </div>
            </div>
          </header>

          <div className="profile-access-list">
            <AccessRow label="Events" value={user.eventsAccess} />

            <AccessRow
              label="Certifications"
              value={user.certificationsAccess}
            />

            <AccessRow label="Vacation" value={user.vacationAccess} />

            <AccessRow
              label="Global Administration"
              value={user.isGlobalAdministrator ? "Admin" : "No"}
            />
          </div>
        </article>
      </section>
    </main>
  );
}

// =========================================================
// SMALL PROFILE COMPONENTS
// =========================================================

interface AccessRowProps {
  label: string;
  value: string;
}

function AccessRow({ label, value }: AccessRowProps) {
  return (
    <div className="profile-access-row">
      <span>{label}</span>

      <strong className={value === "Admin" ? "profile-access-row__admin" : ""}>
        {value}
      </strong>
    </div>
  );
}

interface ProfileSummaryProps {
  label: string;
  value: number;
}

function ProfileSummary({ label, value }: ProfileSummaryProps) {
  return (
    <div className="profile-summary">
      <strong>{value}</strong>

      <span>{label}</span>
    </div>
  );
}

function ProfileLoading({ message }: { message: string }) {
  return (
    <div className="profile-card__empty">
      <strong>{message}</strong>
    </div>
  );
}

function ProfileError({ message }: { message: string }) {
  return (
    <div className="profile-card__empty">
      <strong>Unable to load this section.</strong>

      <span>{message}</span>
    </div>
  );
}

// =========================================================
// HELPERS
// =========================================================

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function formatProfileDate(value: string): string {
  return parseDateOnly(value).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatProfileDate(startDate);
  }

  return `${formatProfileDate(startDate)} – ${formatProfileDate(endDate)}`;
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function getTodayKey(): string {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function formatCertificationStatus(status: CertificationDto["status"]): string {
  if (status === "InProgress") {
    return "In Progress";
  }

  if (status === "Tbd") {
    return "TBD";
  }

  return status;
}

function getCertificationStatusClass(
  status: CertificationDto["status"],
): string {
  switch (status) {
    case "Complete":
      return "profile-status--approved";

    case "InProgress":
      return "profile-status--progress";

    case "Pending":
      return "profile-status--pending";

    case "Expired":
      return "profile-status--expired";

    default:
      return "profile-status--neutral";
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
