import {
  AlertTriangle,
  CalendarClock,
  CircleAlert,
  Pencil,
  Users,
} from "lucide-react";
import { useMemo } from "react";

import type { CertificationDto } from "../../../types/certifications";

interface CertificationGapsViewProps {
  certifications: CertificationDto[];
  onEdit: (certification: CertificationDto) => void;
}

type ActionPriority = "critical" | "warning" | "planning";

interface CertificationAction {
  id: string;
  vendorName: string;
  certificationName: string;
  priority: ActionPriority;
  label: string;
  requirement: string;
  recommendation: string;
  people: string[];
  practiceLead: string | null;
  records: CertificationDto[];
}

export default function CertificationGapsView({
  certifications,
  onEdit,
}: CertificationGapsViewProps) {
  const actions = useMemo(
    () => buildCertificationActions(certifications),
    [certifications],
  );

  const priorityAlerts = actions
    .filter(
      (action) =>
        action.priority === "critical" || action.priority === "warning",
    )
    .slice(0, 2);

  const criticalCount = actions.filter(
    (action) => action.priority === "critical",
  ).length;

  const warningCount = actions.filter(
    (action) => action.priority === "warning",
  ).length;

  const planningCount = actions.filter(
    (action) => action.priority === "planning",
  ).length;

  return (
    <div className="certification-action-center">
      <section className="certification-action-summary">
        <article className="certification-action-summary__card certification-action-summary__card--critical">
          <CircleAlert size={18} aria-hidden="true" />

          <div>
            <strong>{criticalCount}</strong>
            <span>Critical</span>
          </div>
        </article>

        <article className="certification-action-summary__card certification-action-summary__card--warning">
          <AlertTriangle size={18} aria-hidden="true" />

          <div>
            <strong>{warningCount}</strong>
            <span>Warnings</span>
          </div>
        </article>

        <article className="certification-action-summary__card certification-action-summary__card--planning">
          <CalendarClock size={18} aria-hidden="true" />

          <div>
            <strong>{planningCount}</strong>
            <span>Planning</span>
          </div>
        </article>

        <article className="certification-action-summary__card certification-action-summary__card--total">
          <Users size={18} aria-hidden="true" />

          <div>
            <strong>{actions.length}</strong>
            <span>Open actions</span>
          </div>
        </article>
      </section>

      <section className="certification-priority-section">
        <header className="certification-action-section-heading">
          <div>
            <h2>Priority alerts</h2>
            <p>Immediate certification risks requiring management attention</p>
          </div>
        </header>

        {priorityAlerts.length > 0 ? (
          <div className="certification-priority-grid">
            {priorityAlerts.map((action) => (
              <PriorityAlert key={action.id} action={action} onEdit={onEdit} />
            ))}
          </div>
        ) : (
          <div className="certification-action-empty">
            <h3>No priority alerts</h3>
            <p>
              There are currently no critical or urgent certification actions.
            </p>
          </div>
        )}
      </section>

      <section className="certification-open-actions">
        <header className="certification-action-section-heading">
          <div>
            <h2>Open gaps</h2>
            <p>
              Certification actions generated from expired, expiring, pending,
              and TBD records
            </p>
          </div>

          <span>{actions.length} actions</span>
        </header>

        {actions.length > 0 ? (
          <div className="certification-open-actions__list">
            {actions.map((action) => (
              <OpenActionRow key={action.id} action={action} onEdit={onEdit} />
            ))}
          </div>
        ) : (
          <div className="certification-action-empty">
            <h3>No open gaps</h3>
            <p>All certification records are currently in good standing.</p>
          </div>
        )}
      </section>
    </div>
  );
}

interface ActionProps {
  action: CertificationAction;
  onEdit: (certification: CertificationDto) => void;
}

function PriorityAlert({ action, onEdit }: ActionProps) {
  const Icon = action.priority === "critical" ? CircleAlert : AlertTriangle;

  return (
    <article
      className={[
        "certification-priority-alert",
        `certification-priority-alert--${action.priority}`,
      ].join(" ")}
    >
      <div className="certification-priority-alert__top">
        <span className="certification-priority-alert__label">
          <Icon size={14} aria-hidden="true" />
          {action.label}
        </span>

        <span className="certification-priority-alert__vendor">
          {action.vendorName}
        </span>
      </div>

      <h3>{action.certificationName}</h3>

      <p className="certification-priority-alert__requirement">
        {action.requirement}
      </p>

      <div className="certification-priority-alert__people">
        <span>Affected people</span>

        <div>
          {action.people.slice(0, 5).map((person) => (
            <span key={person}>{person}</span>
          ))}

          {action.people.length > 5 && <span>+{action.people.length - 5}</span>}
        </div>
      </div>

      <div className="certification-priority-alert__footer">
        <span>Lead: {action.practiceLead ?? "Not assigned"}</span>

        <button type="button" onClick={() => onEdit(action.records[0])}>
          <Pencil size={14} aria-hidden="true" />
          Review
        </button>
      </div>
    </article>
  );
}

function OpenActionRow({ action, onEdit }: ActionProps) {
  return (
    <article
      className={[
        "certification-open-action",
        `certification-open-action--${action.priority}`,
      ].join(" ")}
    >
      <div className="certification-open-action__identity">
        <span>{action.vendorName}</span>
        <h3>{action.certificationName}</h3>
        <p>{action.requirement}</p>
      </div>

      <div className="certification-open-action__people">
        <span>People</span>

        <div>
          {action.people.slice(0, 4).map((person) => (
            <span key={person}>{person}</span>
          ))}

          {action.people.length > 4 && <span>+{action.people.length - 4}</span>}
        </div>
      </div>

      <div className="certification-open-action__recommendation">
        <span>Recommended action</span>
        <p>{action.recommendation}</p>

        <small>Lead: {action.practiceLead ?? "Not assigned"}</small>
      </div>

      <button
        type="button"
        className="certification-open-action__edit"
        aria-label={`Review ${action.certificationName}`}
        onClick={() => onEdit(action.records[0])}
      >
        <Pencil size={14} aria-hidden="true" />
        Edit
      </button>
    </article>
  );
}

function buildCertificationActions(
  certifications: CertificationDto[],
): CertificationAction[] {
  const groups = new Map<string, CertificationDto[]>();

  certifications.forEach((certification) => {
    const key = [
      certification.vendorName.trim().toLocaleLowerCase(),
      certification.certificationName.trim().toLocaleLowerCase(),
    ].join("|");

    const records = groups.get(key) ?? [];

    records.push(certification);
    groups.set(key, records);
  });

  return Array.from(groups.entries())
    .map(([id, records]) => createAction(id, records))
    .filter((action): action is CertificationAction => action !== null)
    .sort((first, second) => {
      const priorityDifference =
        getPriorityOrder(first.priority) - getPriorityOrder(second.priority);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return first.vendorName.localeCompare(second.vendorName);
    });
}

function createAction(
  id: string,
  records: CertificationDto[],
): CertificationAction | null {
  const expiredRecords = records.filter(isExpired);

  const urgentExpiryRecords = records.filter(
    (record) =>
      !isExpired(record) &&
      getDaysRemaining(record.expiryDate) >= 0 &&
      getDaysRemaining(record.expiryDate) <= 30,
  );

  const pendingRecords = records.filter(
    (record) => record.status === "Pending",
  );

  const tbdRecords = records.filter((record) => record.status === "Tbd");

  let priority: ActionPriority;
  let label: string;
  let requirement: string;
  let recommendation: string;
  let actionRecords: CertificationDto[];

  if (expiredRecords.length > 0) {
    priority = "critical";
    label = "Urgent — expired";
    requirement = `${expiredRecords.length} expired ${
      expiredRecords.length === 1
        ? "certification requires"
        : "certifications require"
    } renewal.`;
    recommendation =
      "Confirm the renewal plan and update the certification status and expiry date.";
    actionRecords = expiredRecords;
  } else if (urgentExpiryRecords.length > 0) {
    priority = "warning";
    label = "Deadline approaching";
    requirement = `${urgentExpiryRecords.length} ${
      urgentExpiryRecords.length === 1
        ? "certification expires"
        : "certifications expire"
    } within 30 days.`;
    recommendation =
      "Schedule the required renewal or examination before the current certification expires.";
    actionRecords = urgentExpiryRecords;
  } else if (pendingRecords.length > 0) {
    priority = "planning";
    label = "Completion outstanding";
    requirement = `${pendingRecords.length} ${
      pendingRecords.length === 1 ? "certification is" : "certifications are"
    } still pending.`;
    recommendation =
      "Confirm progress, expected completion dates, and any training support required.";
    actionRecords = pendingRecords;
  } else if (tbdRecords.length > 0) {
    priority = "planning";
    label = "Details require confirmation";
    requirement = `${tbdRecords.length} ${
      tbdRecords.length === 1 ? "record requires" : "records require"
    } status confirmation.`;
    recommendation =
      "Confirm the certification owner, current status, and next required action.";
    actionRecords = tbdRecords;
  } else {
    return null;
  }

  const people = Array.from(
    new Set(actionRecords.map((record) => record.personName.trim())),
  ).sort((first, second) => first.localeCompare(second));

  const practiceLead =
    actionRecords
      .find((record) => record.practiceLead?.trim())
      ?.practiceLead?.trim() ?? null;

  return {
    id,
    vendorName: records[0].vendorName,
    certificationName: records[0].certificationName,
    priority,
    label,
    requirement,
    recommendation,
    people,
    practiceLead,
    records: actionRecords,
  };
}

function isExpired(certification: CertificationDto): boolean {
  return (
    certification.status === "Expired" ||
    getDaysRemaining(certification.expiryDate) < 0
  );
}

function getDaysRemaining(value: string | null): number {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const expiryDate = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  const today = new Date();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return Math.ceil(
    (expiryDate.getTime() - startOfToday.getTime()) / 86_400_000,
  );
}

function getPriorityOrder(priority: ActionPriority): number {
  switch (priority) {
    case "critical":
      return 1;

    case "warning":
      return 2;

    case "planning":
      return 3;
  }
}
