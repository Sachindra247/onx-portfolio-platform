import { httpClient } from "./httpClient";

export type VendorComplianceRequirementType =
  | "Sales"
  | "TechnicalSales"
  | "CertifiedEngineers"
  | "Competencies"
  | "Bootcamp"
  | "Other";

export const VENDOR_COMPLIANCE_REQUIREMENT_TYPES: {
  value: VendorComplianceRequirementType;
  label: string;
}[] = [
  { value: "Sales", label: "Sales" },
  { value: "TechnicalSales", label: "Technical Sales" },
  { value: "CertifiedEngineers", label: "Certified Engineers" },
  { value: "Competencies", label: "Competencies" },
  { value: "Bootcamp", label: "Bootcamp" },
  { value: "Other", label: "Other" },
];

export interface VendorComplianceRequirementDto {
  id: string;
  vendorId: string;
  name: string;
  requirementType: VendorComplianceRequirementType;
  targetValue: number;
  actualValue: number | null;
  unit: string;
  periodStart: string;
  periodEnd: string;
  notes: string | null;
  achievementPercentage: number | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface VendorComplianceRequirementInput {
  name: string;
  requirementType: VendorComplianceRequirementType;
  targetValue: number;
  actualValue: number | null;
  unit: string;
  periodStart: string;
  periodEnd: string;
  notes: string | null;
}

export async function getVendorComplianceRequirements(
  vendorId: string,
  signal?: AbortSignal,
): Promise<VendorComplianceRequirementDto[]> {
  const response = await httpClient.get<VendorComplianceRequirementDto[]>(
    `/api/vendors/${encodeURIComponent(vendorId)}/compliance-requirements`,
    { signal },
  );

  return response.data;
}

export async function createVendorComplianceRequirement(
  vendorId: string,
  input: VendorComplianceRequirementInput,
): Promise<VendorComplianceRequirementDto> {
  const response = await httpClient.post<VendorComplianceRequirementDto>(
    `/api/vendors/${encodeURIComponent(vendorId)}/compliance-requirements`,
    input,
  );

  return response.data;
}

export async function updateVendorComplianceRequirement(
  vendorId: string,
  requirementId: string,
  input: VendorComplianceRequirementInput,
): Promise<VendorComplianceRequirementDto> {
  const response = await httpClient.put<VendorComplianceRequirementDto>(
    `/api/vendors/${encodeURIComponent(vendorId)}/compliance-requirements/${encodeURIComponent(requirementId)}`,
    input,
  );

  return response.data;
}
