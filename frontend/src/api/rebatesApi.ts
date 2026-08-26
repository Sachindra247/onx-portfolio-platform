import { httpClient } from "./httpClient";

import type { RebateDto, RebateRequest } from "../types/rebates";

export interface GetRebatesOptions {
  search?: string;
  status?: string;
  vendorId?: string;
  dueBefore?: string;
  signal?: AbortSignal;
}

export async function getRebates(
  options: GetRebatesOptions = {},
): Promise<RebateDto[]> {
  const { search, status, vendorId, dueBefore, signal } = options;

  const response = await httpClient.get<RebateDto[]>("/api/rebates", {
    signal,
    params: {
      search: search || undefined,
      status: status || undefined,
      vendorId: vendorId || undefined,
      dueBefore: dueBefore || undefined,
    },
  });

  return response.data;
}

export async function getRebate(
  id: string,
  signal?: AbortSignal,
): Promise<RebateDto> {
  const response = await httpClient.get<RebateDto>(`/api/rebates/${id}`, {
    signal,
  });

  return response.data;
}

export async function createRebate(request: RebateRequest): Promise<RebateDto> {
  const response = await httpClient.post<RebateDto>("/api/rebates", request);

  return response.data;
}

export async function updateRebate(
  id: string,
  request: RebateRequest,
): Promise<RebateDto> {
  const response = await httpClient.put<RebateDto>(
    `/api/rebates/${id}`,
    request,
  );

  return response.data;
}

export async function deleteRebate(id: string): Promise<void> {
  await httpClient.delete(`/api/rebates/${id}`);
}
