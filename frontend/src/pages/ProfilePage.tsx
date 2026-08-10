import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Palmtree,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const displayRole = user.isGlobalAdministrator
    ? "Global Administrator"
    : user.role;

  return (
    <main className="profile-page">
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

          <div className="profile-card__empty">
            <strong>Vacation details will appear here.</strong>

            <span>
              Upcoming leave, pending requests, and balance information will be
              connected next.
            </span>
          </div>
        </article>

        <article className="profile-card">
          <header>
            <div>
              <span className="profile-card__icon">
                <CalendarDays size={18} />
              </span>

              <div>
                <h2>My Events</h2>
                <p>Events you have registered or RSVP'd for</p>
              </div>
            </div>
          </header>

          <div className="profile-card__empty">
            <strong>No event registrations yet.</strong>

            <span>
              Registered events will appear here once RSVP tracking is
              connected.
            </span>
          </div>
        </article>

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

          <div className="profile-card__empty">
            <strong>Certification details will appear here.</strong>

            <span>
              Active certifications and upcoming expirations will be connected
              next.
            </span>
          </div>
        </article>

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
