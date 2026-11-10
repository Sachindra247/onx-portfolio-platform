import { httpClient } from "./httpClient";

import type { CertificationVendorDto } from "../types/certifications";

export async function getVendors(
  signal?: AbortSignal,
  activeOnly = true,
): Promise<CertificationVendorDto[]> {
  const response = await httpClient.get<CertificationVendorDto[]>(
    "/api/vendors",
    {
      params: { activeOnly },
      signal,
    },
  );

  return response.data;
}

export async function createVendor(
  name: string,
): Promise<CertificationVendorDto> {
  const response = await httpClient.post<CertificationVendorDto>(
    "/api/vendors",
    {
      name,
    },
  );

  return response.data;
}

export async function updateVendor(
  id: string,
  name: string,
): Promise<CertificationVendorDto> {
  const response = await httpClient.put<CertificationVendorDto>(
    `/api/vendors/${id}`,
    {
      name,
    },
  );

  return response.data;
}
