export type LeaveType =
  | "Vacation"
  | "Sick"
  | "Parental"
  | "Personal"
  | "Bereavement"
  | "Unpaid"
  | "Other";

export type LeaveRequestStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

export interface LeaveRequestDto {
  id: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveRequestStatus;
  reason: string | null;
  approverName: string | null;
  notes: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface LeaveRequestPayload {
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveRequestStatus;
  reason: string | null;
  approverName: string | null;
  notes: string | null;
}
