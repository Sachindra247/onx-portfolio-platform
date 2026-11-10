import { httpClient } from "./httpClient";

export interface VendorContactDto {
  id: string;
  vendorId: string;
  name: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
}

export interface VendorContactInput {
  name: string;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
}

export async function getVendorContacts(
  vendorId: string,
): Promise<VendorContactDto[]> {
  const response = await httpClient.get<VendorContactDto[]>(
    `/api/vendors/${encodeURIComponent(vendorId)}/contacts`,
  );

  return response.data;
}

export async function createVendorContact(
  vendorId: string,
  input: VendorContactInput,
): Promise<VendorContactDto> {
  const response = await httpClient.post<VendorContactDto>(
    `/api/vendors/${encodeURIComponent(vendorId)}/contacts`,
    input,
  );

  return response.data;
}

export async function updateVendorContact(
  vendorId: string,
  contactId: string,
  input: VendorContactInput,
): Promise<VendorContactDto> {
  const response = await httpClient.put<VendorContactDto>(
    `/api/vendors/${encodeURIComponent(vendorId)}/contacts/${encodeURIComponent(contactId)}`,
    input,
  );

  return response.data;
}

export async function deleteVendorContact(
  vendorId: string,
  contactId: string,
): Promise<void> {
  await httpClient.delete(
    `/api/vendors/${encodeURIComponent(vendorId)}/contacts/${encodeURIComponent(contactId)}`,
  );
}
