import { httpClient } from "./httpClient";

export interface VendorActivityDto {
  id: string;
  vendorId: string;
  title: string;
  activityDate: string;
  notes: string;
  createdByUserId: string;
  createdByName: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface VendorActivityInput {
  title: string;
  activityDate: string;
  notes: string;
}

export async function getVendorActivities(
  vendorId: string,
  signal?: AbortSignal,
): Promise<VendorActivityDto[]> {
  const response = await httpClient.get<VendorActivityDto[]>(
    `/api/vendors/${encodeURIComponent(vendorId)}/activities`,
    { signal },
  );

  return response.data;
}

export async function createVendorActivity(
  vendorId: string,
  input: VendorActivityInput,
): Promise<VendorActivityDto> {
  const response = await httpClient.post<VendorActivityDto>(
    `/api/vendors/${encodeURIComponent(vendorId)}/activities`,
    input,
  );

  return response.data;
}

export async function updateVendorActivity(
  vendorId: string,
  activityId: string,
  input: VendorActivityInput,
): Promise<VendorActivityDto> {
  const response = await httpClient.put<VendorActivityDto>(
    `/api/vendors/${encodeURIComponent(vendorId)}/activities/${encodeURIComponent(activityId)}`,
    input,
  );

  return response.data;
}
