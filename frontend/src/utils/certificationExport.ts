import type { CertificationDto } from "../types/certifications";
import { formatCertificationStatus } from "./certificationAnalytics";

const csvHeaders = [
  "Person",
  "Vendor",
  "Certification",
  "Status",
  "Date Completed",
  "Expiry",
  "Lead",
  "Rebate",
  "Notes",
];

export function exportCertificationsCsv(
  certifications: CertificationDto[],
): void {
  if (certifications.length === 0) {
    return;
  }

  const rows = certifications.map((certification) => [
    certification.personName,
    certification.vendorName,
    certification.certificationName,
    formatCertificationStatus(certification.status),
    certification.dateCompleted ?? "",
    certification.expiryDate ?? "",
    certification.practiceLead ?? "",
    certification.rebateImpact ?? "",
    certification.notes ?? "",
  ]);

  const csv = [
    csvHeaders.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });

  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  const currentDate = new Date().toISOString().slice(0, 10);

  downloadLink.href = downloadUrl;
  downloadLink.download = `OnX_Certifications_${currentDate}.csv`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  URL.revokeObjectURL(downloadUrl);
}

function escapeCsvValue(value: unknown): string {
  const normalizedValue =
    value === null || value === undefined ? "" : String(value);

  return `"${normalizedValue.replace(/"/g, '""')}"`;
}
