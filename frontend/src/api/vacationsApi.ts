import type { LeaveRequestDto, LeaveRequestPayload } from "../types/vacations";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function buildUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

export async function getLeaveRequests(): Promise<LeaveRequestDto[]> {
  const response = await fetch(buildUrl("/api/leave-requests"));

  if (!response.ok) {
    throw new Error("Unable to load leave requests.");
  }

  return response.json() as Promise<LeaveRequestDto[]>;
}

export async function createLeaveRequest(
  payload: LeaveRequestPayload,
): Promise<LeaveRequestDto> {
  const response = await fetch(buildUrl("/api/leave-requests"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
    headers: {
      "Content-Type": "application/json",
    },
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
  });

  if (!response.ok) {
    throw new Error(
      await getApiError(response, "Unable to delete the leave request."),
    );
  }
}

async function getApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const result = (await response.json()) as {
      title?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    };

    const validationMessage = result.errors
      ? Object.values(result.errors).flat()[0]
      : null;

    return validationMessage ?? result.detail ?? result.title ?? fallback;
  } catch {
    return fallback;
  }
}
