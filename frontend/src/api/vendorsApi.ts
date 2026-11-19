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

export interface VendorPartnership {
  partnershipTier: string | null;
  partnershipStatus: string | null;
  primaryPartnerManagerId: string | null;
  partnershipBenefits: string | null;
  partnerPrograms: string | null;
}

export interface VendorPartnerManager {
  id: string;
  name: string;
  email: string;
}

export async function getVendorPartnerManagers(
  signal?: AbortSignal,
): Promise<VendorPartnerManager[]> {
  const response = await httpClient.get<VendorPartnerManager[]>(
    "/api/vendors/partner-managers",
    { signal },
  );

  return response.data;
}

export async function updateVendorPartnership(
  vendorId: string,
  partnership: VendorPartnership,
): Promise<CertificationVendorDto & VendorPartnership> {
  const response = await httpClient.put<
    CertificationVendorDto & VendorPartnership
  >(`/api/vendors/${vendorId}/partnership`, partnership);

  return response.data;
}

// Structured vendor benefits

export interface VendorBenefits {
  discountPercentage: number | null;
  rebatePercentage: number | null;
  dealRegistrationAvailable: boolean | null;
  dealRegistrationConditions: string | null;
  spiffAvailable: boolean | null;
}

export async function updateVendorBenefits(
  vendorId: string,
  benefits: VendorBenefits,
): Promise<CertificationVendorDto & VendorBenefits> {
  const response = await httpClient.put<
    CertificationVendorDto & VendorBenefits
  >(`/api/vendors/${vendorId}/benefits`, benefits);

  return response.data;
}
