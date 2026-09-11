import { httpClient } from "./httpClient";

import type { CertificationVendorDto } from "../types/certifications";

export async function getVendors(
  signal?: AbortSignal,
): Promise<CertificationVendorDto[]> {
  const response = await httpClient.get<CertificationVendorDto[]>(
    "/api/vendors",
    {
      signal,
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
