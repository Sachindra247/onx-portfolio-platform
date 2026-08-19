import { httpClient } from "./httpClient";

import type {
  CertificationDto,
  CertificationPersonLookupDto,
  CertificationRequest,
} from "../types/certifications";

export async function getCertifications(
  signal?: AbortSignal,
  includeArchived = false,
): Promise<CertificationDto[]> {
  const response = await httpClient.get<CertificationDto[]>(
    "/api/certifications",
    {
      signal,
      params: {
        includeArchived,
      },
    },
  );

  return response.data;
}

export async function getCertification(
  id: string,
  signal?: AbortSignal,
): Promise<CertificationDto> {
  const response = await httpClient.get<CertificationDto>(
    `/api/certifications/${id}`,
    {
      signal,
    },
  );

  return response.data;
}

export async function createCertification(
  request: CertificationRequest,
): Promise<CertificationDto> {
  const response = await httpClient.post<CertificationDto>(
    "/api/certifications",
    request,
  );

  return response.data;
}

export async function updateCertification(
  id: string,
  request: CertificationRequest,
): Promise<CertificationDto> {
  const response = await httpClient.put<CertificationDto>(
    `/api/certifications/${id}`,
    request,
  );

  return response.data;
}

export async function deleteCertification(id: string): Promise<void> {
  await httpClient.delete(`/api/certifications/${id}`);
}

export async function searchCertificationPeople(
  query: string,
  signal?: AbortSignal,
): Promise<CertificationPersonLookupDto[]> {
  const response = await httpClient.get<CertificationPersonLookupDto[]>(
    "/api/certifications/people/search",
    {
      signal,
      params: {
        q: query,
      },
    },
  );

  return response.data;
}
