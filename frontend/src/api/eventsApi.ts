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

export async function createVendor(name: string): Promise<VendorDto> {
  const response = await httpClient.post<VendorDto>("/api/vendors", {
    name,
  });

  return response.data;
}
