import { useEffect, useState } from "react";
import axios from "axios";

import {
  getVendorActivities,
  createVendorActivity,
  updateVendorActivity,
} from "../../api/vendorActivitiesApi";

import type {
  VendorActivityDto,
  VendorActivityInput,
} from "../../api/vendorActivitiesApi";

interface VendorActivitiesSectionProps {
  vendorId: string;
  canManageVendors: boolean;
}

function todayDate(): string {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatActivityDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sortActivities(activities: VendorActivityDto[]): VendorActivityDto[] {
  return [...activities].sort(
    (a, b) =>
      b.activityDate.localeCompare(a.activityDate) ||
      Date.parse(b.createdAtUtc) - Date.parse(a.createdAtUtc) ||
      b.id.localeCompare(a.id),
  );
}

export default function VendorActivitiesSection({
  vendorId,
  canManageVendors,
}: VendorActivitiesSectionProps) {
  const [activities, setActivities] = useState<VendorActivityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [activityDate, setActivityDate] = useState(todayDate);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadActivities() {
      setLoading(true);
      setLoadError("");
      setActivities([]);

      try {
        const data = await getVendorActivities(vendorId, controller.signal);

        if (!controller.signal.aborted) {
          setActivities(sortActivities(data));
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoadError("Unable to load vendor activities.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadActivities();

    return () => controller.abort();
  }, [vendorId]);

  function handleAdd() {
    setEditingId(null);
    setTitle("");
    setActivityDate(todayDate());
    setNotes("");
    setError("");
    setEditing(true);
  }

  function handleEdit(activity: VendorActivityDto) {
    setEditingId(activity.id);
    setTitle(activity.title);
    setActivityDate(activity.activityDate);
    setNotes(activity.notes);
    setError("");
    setEditing(true);
  }

  function handleCancel() {
    if (saving) return;

    setEditing(false);
    setEditingId(null);
    setError("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageVendors || saving) return;

    setError("");

    const input: VendorActivityInput = {
      title: title.trim(),
      activityDate,
      notes: notes.trim(),
    };

    if (!input.title || input.title.length > 200) {
      setError("Activity title must be between 1 and 200 characters.");
      return;
    }

    if (!input.activityDate) {
      setError("Activity date is required.");
      return;
    }

    if (!input.notes || input.notes.length > 10000) {
      setError("Activity notes must be between 1 and 10,000 characters.");
      return;
    }

    setSaving(true);

    try {
      const savedActivity = editingId
        ? await updateVendorActivity(vendorId, editingId, input)
        : await createVendorActivity(vendorId, input);

      setActivities((current) =>
        sortActivities([
          ...current.filter((activity) => activity.id !== savedActivity.id),
          savedActivity,
        ]),
      );

      setEditing(false);
      setEditingId(null);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        if (requestError.response?.status === 403) {
          setError("You do not have permission to manage activities.");
        } else if (requestError.response?.status === 400) {
          setError("Please check the activity details and try again.");
        } else if (requestError.response?.status === 404) {
          setError("The vendor or activity could not be found.");
        } else {
          setError("Unable to save activity. Please try again.");
        }
      } else {
        setError("Unable to save activity. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="vendor-partnership vendor-activities">
      <div className="vendor-partnership__header">
        <h4>Vendor Activity History</h4>

        {canManageVendors && !editing && !loading && !loadError && (
          <button type="button" onClick={handleAdd}>
            + Add Activity
          </button>
        )}
      </div>

      {editing && canManageVendors && (
        <form
          className="vendor-partnership__form"
          onSubmit={handleSave}
          noValidate
        >
          <div className="vendor-partnership__grid">
            <label>
              Activity Title
              <input
                type="text"
                value={title}
                maxLength={200}
                placeholder="e.g. Quarterly partnership review"
                disabled={saving}
                required
                onChange={(event) => {
                  setTitle(event.target.value);
                  setError("");
                }}
              />
            </label>

            <label>
              Activity Date
              <input
                type="date"
                value={activityDate}
                disabled={saving}
                required
                onChange={(event) => {
                  setActivityDate(event.target.value);
                  setError("");
                }}
              />
            </label>

            <label className="vendor-partnership__full">
              Activity Notes
              <textarea
                value={notes}
                rows={5}
                maxLength={10000}
                placeholder="Record meeting notes, promotions, plans or follow-up actions..."
                disabled={saving}
                required
                onChange={(event) => {
                  setNotes(event.target.value);
                  setError("");
                }}
              />
            </label>
          </div>

          {error && <p role="alert">{error}</p>}

          <div className="vendor-partnership__actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Activity"}
            </button>

            <button type="button" disabled={saving} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p>Loading vendor activities...</p>}

      {loadError && <p role="alert">{loadError}</p>}

      {!loading && !loadError && activities.length === 0 && (
        <p className="vendor-activities__empty">
          No activities recorded for this vendor yet.
        </p>
      )}

      {!loading && !loadError && activities.length > 0 && (
        <>
          <div className="vendor-activities__list">
            {activities.map((activity) => (
              <article key={activity.id} className="vendor-activities__item">
                <div className="vendor-activities__item-header">
                  <div>
                    <span className="vendor-activities__date">
                      {formatActivityDate(activity.activityDate)}
                    </span>

                    <h5>{activity.title}</h5>
                  </div>

                  {canManageVendors && !editing && (
                    <button
                      type="button"
                      className="vendor-activities__edit"
                      onClick={() => handleEdit(activity)}
                    >
                      Edit
                    </button>
                  )}
                </div>

                <p className="vendor-activities__notes">{activity.notes}</p>

                <div className="vendor-activities__metadata">
                  <span>Created by: {activity.createdByName}</span>

                  <span>Created: {formatTimestamp(activity.createdAtUtc)}</span>

                  <span>
                    Last updated: {formatTimestamp(activity.updatedAtUtc)}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <p className="vendor-activities__count">
            Showing {activities.length}{" "}
            {activities.length === 1 ? "activity" : "activities"}
          </p>
        </>
      )}
    </section>
  );
}
