import axios from "axios";

interface ProblemDetails {
  message?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred.",
): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (error.code === "ECONNABORTED") {
    return "The request took too long. Please try again.";
  }

  if (!error.response) {
    return "The server could not be reached. Please try again.";
  }

  const problem = error.response.data as ProblemDetails | undefined;

  if (problem?.errors) {
    const validationMessages = Object.values(problem.errors).flat();

    if (validationMessages.length > 0) {
      return validationMessages.join(" ");
    }
  }

  if (error.response.status === 403) {
    return (
      problem?.message ??
      problem?.detail ??
      "You do not have permission to perform this action."
    );
  }

  if (error.response.status === 404) {
    return (
      problem?.message ??
      problem?.detail ??
      "The requested item could not be found."
    );
  }

  return problem?.message ?? problem?.detail ?? problem?.title ?? fallback;
}
