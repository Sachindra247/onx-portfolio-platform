import type {
  RebateDto,
  RebateStatus,
  RebateStatusSummary,
  RebateSummary,
  RebateVendorSummary,
} from "../types/rebates";

export function getRebateSummary(rebates: RebateDto[]): RebateSummary {
  const today = startOfToday();
  const dueSoonLimit = addDays(today, 30);

  let activeCount = 0;
  let pendingCount = 0;
  let completedCount = 0;
  let dueSoonCount = 0;
  let estimatedAmount = 0;
  let actualAmount = 0;

  rebates.forEach((rebate) => {
    if (rebate.status === "Active") {
      activeCount += 1;
    }

    if (rebate.status === "Pending") {
      pendingCount += 1;
    }

    if (rebate.status === "Completed") {
      completedCount += 1;
    }

    estimatedAmount += rebate.estimatedAmount ?? 0;
    actualAmount += rebate.actualAmount ?? 0;

    if (
      rebate.status !== "Completed" &&
      rebate.status !== "Cancelled" &&
      rebate.dueDate
    ) {
      const dueDate = parseDate(rebate.dueDate);

      if (dueDate && dueDate >= today && dueDate <= dueSoonLimit) {
        dueSoonCount += 1;
      }
    }
  });

  return {
    rebateCount: rebates.length,
    activeCount,
    pendingCount,
    completedCount,
    dueSoonCount,
    estimatedAmount,
    actualAmount,
  };
}

export function getRebateStatusSummary(
  rebates: RebateDto[],
): RebateStatusSummary[] {
  const statuses: RebateStatus[] = [
    "Draft",
    "Active",
    "Pending",
    "Completed",
    "Cancelled",
  ];

  return statuses.map((status) => ({
    status,
    count: rebates.filter((rebate) => rebate.status === status).length,
  }));
}

export function getRebateVendorSummary(
  rebates: RebateDto[],
): RebateVendorSummary[] {
  const vendors = new Map<string, RebateVendorSummary>();

  rebates.forEach((rebate) => {
    const existing = vendors.get(rebate.vendorId);

    if (existing) {
      existing.rebateCount += 1;

      existing.estimatedAmount += rebate.estimatedAmount ?? 0;

      existing.actualAmount += rebate.actualAmount ?? 0;

      if (rebate.status === "Active") {
        existing.activeCount += 1;
      }

      if (rebate.status === "Pending") {
        existing.pendingCount += 1;
      }

      if (rebate.status === "Completed") {
        existing.completedCount += 1;
      }

      return;
    }

    vendors.set(rebate.vendorId, {
      vendorId: rebate.vendorId,
      vendorName: rebate.vendorName,
      rebateCount: 1,

      activeCount: rebate.status === "Active" ? 1 : 0,

      pendingCount: rebate.status === "Pending" ? 1 : 0,

      completedCount: rebate.status === "Completed" ? 1 : 0,

      estimatedAmount: rebate.estimatedAmount ?? 0,

      actualAmount: rebate.actualAmount ?? 0,
    });
  });

  return Array.from(vendors.values()).sort((first, second) => {
    if (second.rebateCount !== first.rebateCount) {
      return second.rebateCount - first.rebateCount;
    }

    return first.vendorName.localeCompare(second.vendorName);
  });
}

export function formatRebateStatus(status: RebateStatus): string {
  switch (status) {
    case "Draft":
      return "Draft";

    case "Active":
      return "Active";

    case "Pending":
      return "Pending";

    case "Completed":
      return "Completed";

    case "Cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

export function formatRebateAmount(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function isRebateOverdue(rebate: RebateDto): boolean {
  if (
    rebate.status === "Completed" ||
    rebate.status === "Cancelled" ||
    !rebate.dueDate
  ) {
    return false;
  }

  const dueDate = parseDate(rebate.dueDate);

  if (!dueDate) {
    return false;
  }

  return dueDate < startOfToday();
}

export function isRebateDueSoon(rebate: RebateDto, numberOfDays = 30): boolean {
  if (
    rebate.status === "Completed" ||
    rebate.status === "Cancelled" ||
    !rebate.dueDate
  ) {
    return false;
  }

  const dueDate = parseDate(rebate.dueDate);

  if (!dueDate) {
    return false;
  }

  const today = startOfToday();
  const limit = addDays(today, numberOfDays);

  return dueDate >= today && dueDate <= limit;
}

function startOfToday(): Date {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);

  result.setDate(result.getDate() + days);

  return result;
}

function parseDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
