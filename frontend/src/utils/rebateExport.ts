import type { RebateDto } from "../types/rebates";

const csvHeaders = [
  "Vendor",
  "Rebate",
  "Program",
  "Status",
  "Estimated Amount",
  "Actual Amount",
  "Start Date",
  "Due Date",
  "Completed Date",
  "Owner",
  "Owner Email",
  "Description",
  "Notes",
  "Created",
  "Last Updated",
];

export function exportRebatesCsv(rebates: RebateDto[]): void {
  if (rebates.length === 0) {
    return;
  }

  const rows = rebates.map((rebate) => [
    rebate.vendorName,
    rebate.title,
    rebate.programName ?? "",
    rebate.status,
    rebate.estimatedAmount ?? "",
    rebate.actualAmount ?? "",
    rebate.startDate ?? "",
    rebate.dueDate ?? "",
    rebate.completedDate ?? "",
    rebate.ownerName ?? "",
    rebate.ownerEmail ?? "",
    rebate.description ?? "",
    rebate.notes ?? "",
    rebate.createdAtUtc,
    rebate.updatedAtUtc,
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
  downloadLink.download = `OnX_Rebates_${currentDate}.csv`;

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
