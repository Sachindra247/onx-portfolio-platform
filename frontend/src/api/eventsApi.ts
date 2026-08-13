import axios from "axios";

import type {
  EventAttendeeDto,
  EventDto,
  EventRegistrationDto,
  EventRequest,
  VendorDto,
} from "../types/events";

import { httpClient } from "./httpClient";

export async function getEvents(signal?: AbortSignal): Promise<EventDto[]> {
  const response = await httpClient.get<EventDto[]>("/api/events", {
    signal,
  });

  return response.data;
}

export async function getVendors(signal?: AbortSignal): Promise<VendorDto[]> {
  const response = await httpClient.get<VendorDto[]>("/api/vendors", {
    signal,
  });

  return response.data;
}

export async function createEvent(request: EventRequest): Promise<EventDto> {
  const response = await httpClient.post<EventDto>("/api/events", request);

  return response.data;
}

export async function updateEvent(
  id: string,
  request: EventRequest,
): Promise<EventDto> {
  const response = await httpClient.put<EventDto>(`/api/events/${id}`, request);

  return response.data;
}

export async function deleteEvent(id: string): Promise<void> {
  await httpClient.delete(`/api/events/${id}`);
}

export async function approveEvent(id: string): Promise<EventDto> {
  const response = await httpClient.post<EventDto>(`/api/events/${id}/approve`);

  return response.data;
}

export async function rejectEvent(id: string): Promise<EventDto> {
  const response = await httpClient.post<EventDto>(`/api/events/${id}/reject`);

  return response.data;
}

export async function registerForEvent(
  id: string,
): Promise<EventRegistrationDto> {
  const response = await httpClient.post<EventRegistrationDto>(
    `/api/events/${id}/register`,
  );

  return response.data;
}

export async function cancelEventRegistration(id: string): Promise<void> {
  await httpClient.delete(`/api/events/${id}/register`);
}

export async function getMyEventRegistration(
  id: string,
): Promise<EventRegistrationDto | null> {
  try {
    const response = await httpClient.get<EventRegistrationDto>(
      `/api/events/${id}/registration`,
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getEventRegistrations(
  id: string,
): Promise<EventAttendeeDto[]> {
  const response = await httpClient.get<EventAttendeeDto[]>(
    `/api/events/${id}/registrations`,
  );

  return response.data;
}

interface ProblemDetails {
  message?: string;
  title?: string;
  detail?: string;

  errors?: Record<string, string[]>;
}

export async function getMyRegisteredEvents(
  signal?: AbortSignal,
): Promise<EventDto[]> {
  const response = await httpClient.get<EventDto[]>(
    "/api/events/my-registrations",
    {
      signal,
    },
  );

  return response.data;
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "An unexpected error occurred.";
  }

  if (error.code === "ECONNABORTED") {
    return "The request took too long. " + "Confirm that the API is running.";
  }

  if (!error.response) {
    return (
      "The Events API could not be reached. " +
      "Confirm that the backend is running " +
      "and that VITE_API_BASE_URL is correct."
    );
  }

  const problem = error.response.data as ProblemDetails;

  if (problem?.errors) {
    const validationMessages = Object.values(problem.errors).flat();

    if (validationMessages.length > 0) {
      return validationMessages.join(" ");
    }
  }

  return (
    problem?.message ??
    problem?.detail ??
    problem?.title ??
    `The server returned status ${error.response.status}.`
  );
}
