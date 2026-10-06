import axios from "axios";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import "../styles/public-event-registration.css";

import {
  getPublicEventRegistration,
  registerForEventPublicly,
} from "../api/eventsApi";

import type { PublicEventRegistrationDto } from "../types/events";

export default function PublicEventRegistrationPage() {
  const { token } = useParams<{ token: string }>();

  const [event, setEvent] = useState<PublicEventRegistrationDto | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      if (!token) {
        setLoadError(
          "This registration link is invalid or is no longer available.",
        );
        setIsLoading(false);
        return;
      }

      try {
        const result = await getPublicEventRegistration(token);

        if (!cancelled) {
          setEvent(result);
        }
      } catch (error) {
        if (!cancelled) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            setLoadError(
              "This registration link is invalid or is no longer available.",
            );
          } else {
            setLoadError(
              "We could not load this event. Please try again later.",
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadEvent();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || isSubmitting) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setSubmitError("Please enter your name and email address.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await registerForEventPublicly(token, {
        name: trimmedName,
        email: trimmedEmail,
      });

      setIsRegistered(true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          typeof error.response?.data?.message === "string"
            ? error.response.data.message
            : null;

        setSubmitError(
          message ??
            "We could not complete your registration. Please try again.",
        );
      } else {
        setSubmitError(
          "We could not complete your registration. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="public-event-registration">
        <div className="public-event-registration__card">
          <p>Loading event...</p>
        </div>
      </main>
    );
  }

  if (loadError || !event) {
    return (
      <main className="public-event-registration">
        <div className="public-event-registration__card">
          <h1>Event registration</h1>
          <p>{loadError ?? "This event could not be found."}</p>
        </div>
      </main>
    );
  }

  if (isRegistered) {
    return (
      <main className="public-event-registration">
        <div className="public-event-registration__card">
          <p className="public-event-registration__eyebrow">
            Registration confirmed
          </p>

          <h1>You're registered</h1>

          <p>
            Thank you, {name.trim()}. Your registration for{" "}
            <strong>{event.description}</strong> has been received.
          </p>

          <div className="public-event-registration__details">
            <EventDetails event={event} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="public-event-registration">
      <div className="public-event-registration__card">
        <p className="public-event-registration__eyebrow">
          OnX Event Registration
        </p>

        <h1>{event.description}</h1>

        <div className="public-event-registration__details">
          <EventDetails event={event} />
        </div>

        <form
          className="public-event-registration__form"
          onSubmit={handleSubmit}
        >
          <div className="public-event-registration__field">
            <label htmlFor="registration-name">Name</label>

            <input
              id="registration-name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={200}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="public-event-registration__field">
            <label htmlFor="registration-email">Email</label>

            <input
              id="registration-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={320}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {submitError ? (
            <p className="public-event-registration__error" role="alert">
              {submitError}
            </p>
          ) : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </main>
  );
}

function EventDetails({ event }: { event: PublicEventRegistrationDto }) {
  return (
    <>
      <div>
        <span>Vendor</span>
        <strong>{event.vendorName}</strong>
      </div>

      {event.eventDate ? (
        <div>
          <span>Date</span>
          <strong>{formatEventDate(event.eventDate)}</strong>
        </div>
      ) : null}

      {event.venue ? (
        <div>
          <span>Venue</span>
          <strong>{event.venue}</strong>
        </div>
      ) : null}
    </>
  );
}

function formatEventDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}
