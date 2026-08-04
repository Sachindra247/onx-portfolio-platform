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
