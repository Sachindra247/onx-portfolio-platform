import type { LeaveRequestDto } from "../types/vacations";

const csvHeaders = [
  "Employee",
  "Leave Type",
  "Start Date",
  "End Date",
  "Status",
  "Reason",
  "Approver",
  "Notes",
  "Created",
  "Last Updated",
];

export function exportVacationCsv(leaveRequests: LeaveRequestDto[]): void {
  if (leaveRequests.length === 0) {
    return;
  }

  const rows = leaveRequests.map((request) => [
    request.employeeName,
    request.leaveType,
    request.startDate,
    request.endDate,
    request.status,
    request.reason ?? "",
    request.approverName ?? "",
    request.notes ?? "",
    request.createdAtUtc,
    request.updatedAtUtc,
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
  downloadLink.download = `OnX_Vacation_Requests_${currentDate}.csv`;

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
