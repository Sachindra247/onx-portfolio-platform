import type { LeaveRequestDto, LeaveRequestPayload } from "../types/vacations";

import { getStoredAccessToken } from "../auth/authStorage";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function buildUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

function getAuthHeaders(includeJson = false): HeadersInit {
  const token = getStoredAccessToken();

  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

export async function getLeaveRequests(): Promise<LeaveRequestDto[]> {
  const response = await fetch(buildUrl("/api/leave-requests"), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getApiError(response, "Unable to load leave requests."),
    );
  }

  return response.json() as Promise<LeaveRequestDto[]>;
}

export async function createLeaveRequest(
  payload: LeaveRequestPayload,
): Promise<LeaveRequestDto> {
  const response = await fetch(buildUrl("/api/leave-requests"), {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await getApiError(response, "Unable to create the leave request."),
    );
  }

  return response.json() as Promise<LeaveRequestDto>;
}

export async function updateLeaveRequest(
  id: string,
  payload: LeaveRequestPayload,
): Promise<LeaveRequestDto> {
  const response = await fetch(buildUrl(`/api/leave-requests/${id}`), {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      await getApiError(response, "Unable to update the leave request."),
    );
  }

  return response.json() as Promise<LeaveRequestDto>;
}

export async function deleteLeaveRequest(id: string): Promise<void> {
  const response = await fetch(buildUrl(`/api/leave-requests/${id}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getApiError(response, "Unable to delete the leave request."),
    );
  }
}

export async function approveLeaveRequest(id: string): Promise<void> {
  const response = await fetch(buildUrl(`/api/leave-requests/${id}/approve`), {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getApiError(response, "Unable to approve the leave request."),
    );
  }
}

export async function rejectLeaveRequest(id: string): Promise<void> {
  const response = await fetch(buildUrl(`/api/leave-requests/${id}/reject`), {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await getApiError(response, "Unable to reject the leave request."),
    );
  }
}

async function getApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const result = (await response.json()) as {
      message?: string;
      title?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    };

    const validationMessage = result.errors
      ? Object.values(result.errors).flat()[0]
      : null;

    return (
      validationMessage ??
      result.message ??
      result.detail ??
      result.title ??
      fallback
    );
  } catch {
    return fallback;
  }
}
