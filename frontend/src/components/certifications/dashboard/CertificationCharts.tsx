import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type Plugin,
} from "chart.js";

import { Bar, Doughnut } from "react-chartjs-2";

import type { CertificationDto } from "../../../types/certifications";

import {
  formatCertificationStatus,
  getCertificationStatusSummary,
} from "../../../utils/certificationAnalytics";

// =========================================================
// STACKED BAR VALUE LABEL PLUGIN
// =========================================================

const stackedValueLabels: Plugin<"bar"> = {
  id: "stackedValueLabels",

  afterDatasetsDraw(chart) {
    const context = chart.ctx;

    context.save();

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);

      meta.data.forEach((barElement, index) => {
        const rawValue = dataset.data[index];

        const value =
          typeof rawValue === "number" ? rawValue : Number(rawValue);

        /*
         * Don't display labels
         * for zero-value sections.
         */
        if (!Number.isFinite(value) || value <= 0) {
          return;
        }

        const properties = barElement.getProps(
          ["x", "y", "base", "width", "height"],
          true,
        );

        const centerY = (properties.y + properties.base) / 2;

        context.fillStyle = "#ffffff";

        context.font = "700 12px Inter, system-ui, sans-serif";

        context.textAlign = "center";

        context.textBaseline = "middle";

        context.fillText(value.toString(), properties.x, centerY);
      });
    });

    context.restore();
  },
};

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  stackedValueLabels,
);

// =========================================================
// TYPES
// =========================================================

interface CertificationChartsProps {
  certifications: CertificationDto[];
}

interface VendorChartSummary {
  vendorName: string;

  valid: number;

  expired: number;

  pending: number;

  total: number;
}

// =========================================================
// COMPONENT
// =========================================================

export default function CertificationCharts({
  certifications,
}: CertificationChartsProps) {
  /*
   * Archived certifications should
   * never participate in the normal
   * Overview reporting.
   */
  const visibleCertifications = certifications.filter(
    (certification) => certification.status !== "Archived",
  );

  const vendorSummary = buildVendorChartSummary(visibleCertifications).slice(
    0,
    10,
  );

  const statusSummary = getCertificationStatusSummary(
    visibleCertifications,
  ).filter((item) => item.count > 0);

  // =======================================================
  // STACKED VENDOR CHART
  // =======================================================

  const vendorChartData = {
    labels: vendorSummary.map((vendor) => vendor.vendorName),

    datasets: [
      {
        label: "Valid",

        data: vendorSummary.map((vendor) => vendor.valid),

        backgroundColor: "#356f9e",

        borderWidth: 0,

        stack: "certifications",

        /*
         * Rounded only where visible.
         * Keeps the look clean without
         * breaking the stacked bar.
         */
        borderRadius: 2,

        maxBarThickness: 70,
      },

      {
        label: "Expired",

        data: vendorSummary.map((vendor) => vendor.expired),

        backgroundColor: "#e58b48",

        borderWidth: 0,

        stack: "certifications",

        borderRadius: 2,

        maxBarThickness: 70,
      },

      {
        label: "Pending",

        data: vendorSummary.map((vendor) => vendor.pending),

        backgroundColor: "#3d7f3d",

        borderWidth: 0,

        stack: "certifications",

        borderRadius: 2,

        maxBarThickness: 70,
      },
    ],
  };

  // =======================================================
  // EXISTING STATUS DOUGHNUT
  // =======================================================

  const statusChartData = {
    labels: statusSummary.map((item) => formatCertificationStatus(item.status)),

    datasets: [
      {
        label: "Certifications",

        data: statusSummary.map((item) => item.count),

        backgroundColor: [
          "#28785d",
          "#c99024",
          "#2563a6",
          "#7c8491",
          "#c0392b",
        ],

        borderWidth: 0,
      },
    ],
  };

  return (
    <section
      className="certification-charts"
      aria-label="Certification portfolio charts"
    >
      {/* ===================================================
          CERTIFICATIONS BY VENDOR
         =================================================== */}

      <article className="certification-chart-card">
        <header className="certification-chart-card__header">
          <div>
            <h2>Certifications by vendor</h2>

            <p>Valid, expired and pending certification records by vendor</p>
          </div>
        </header>

        <div className="certification-chart-card__canvas certification-vendor-chart">
          <div
            className="certification-vendor-chart__inner"
            style={{
              minWidth: `${Math.max(620, vendorSummary.length * 115)}px`,
            }}
          >
            <Bar
              data={vendorChartData}
              options={{
                responsive: true,

                maintainAspectRatio: false,

                /*
                 * Vertical stacked
                 * columns like the
                 * supplied reference.
                 */
                indexAxis: "x",

                interaction: {
                  mode: "nearest",

                  intersect: true,
                },

                plugins: {
                  legend: {
                    display: true,

                    position: "top",

                    align: "center",

                    labels: {
                      boxWidth: 10,

                      boxHeight: 10,

                      usePointStyle: true,

                      pointStyle: "rect",

                      padding: 18,
                    },
                  },

                  tooltip: {
                    enabled: true,

                    callbacks: {
                      title(tooltipItems) {
                        return tooltipItems[0]?.label ?? "";
                      },

                      label(context) {
                        const value =
                          typeof context.raw === "number"
                            ? context.raw
                            : Number(context.raw);

                        /*
                         * A zero section has
                         * no visible bar, but
                         * this also prevents
                         * a useless zero
                         * tooltip.
                         */
                        if (!value) {
                          return "";
                        }

                        return `${context.dataset.label}: ${value}`;
                      },

                      afterBody(tooltipItems) {
                        const firstItem = tooltipItems[0];

                        if (!firstItem) {
                          return "";
                        }

                        const vendor = vendorSummary[firstItem.dataIndex];

                        if (!vendor) {
                          return "";
                        }

                        return `Total certifications: ${vendor.total}`;
                      },
                    },

                    filter(tooltipItem) {
                      const value =
                        typeof tooltipItem.raw === "number"
                          ? tooltipItem.raw
                          : Number(tooltipItem.raw);

                      return Number.isFinite(value) && value > 0;
                    },
                  },
                },

                scales: {
                  x: {
                    stacked: true,

                    grid: {
                      display: false,
                    },

                    border: {
                      display: false,
                    },

                    ticks: {
                      autoSkip: false,

                      maxRotation: 0,

                      minRotation: 0,

                      padding: 8,

                      font: {
                        size: 11,
                        weight: 600,
                      },

                      callback(_value, index) {
                        const vendorName =
                          vendorSummary[index]?.vendorName ?? "";

                        return wrapVendorName(vendorName);
                      },
                    },
                  },

                  y: {
                    stacked: true,

                    beginAtZero: true,

                    border: {
                      display: false,
                    },

                    ticks: {
                      precision: 0,
                    },

                    grid: {
                      color: "rgba(0, 0, 0, 0.06)",
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </article>

      {/* ===================================================
          STATUS BREAKDOWN
         =================================================== */}

      <article className="certification-chart-card">
        <header className="certification-chart-card__header">
          <div>
            <h2>Status breakdown</h2>

            <p>Current certification status mix</p>
          </div>
        </header>

        <div className="certification-chart-card__canvas">
          <Doughnut
            data={statusChartData}
            options={{
              responsive: true,

              maintainAspectRatio: false,

              cutout: "68%",

              plugins: {
                legend: {
                  position: "bottom",

                  labels: {
                    boxWidth: 10,

                    usePointStyle: true,
                  },
                },
              },
            }}
          />
        </div>
      </article>
    </section>
  );
}

// =========================================================
// VENDOR CLASSIFICATION
// =========================================================

function buildVendorChartSummary(
  certifications: CertificationDto[],
): VendorChartSummary[] {
  const vendorMap = new Map<string, VendorChartSummary>();

  certifications.forEach((certification) => {
    /*
     * Archived is never included
     * in this chart.
     */
    if (certification.status === "Archived") {
      return;
    }

    const vendorName = certification.vendorName.trim();

    if (!vendorName) {
      return;
    }

    const existing = vendorMap.get(vendorName) ?? {
      vendorName,

      valid: 0,

      expired: 0,

      pending: 0,

      total: 0,
    };

    const category = classifyCertification(certification);

    switch (category) {
      case "valid":
        existing.valid += 1;
        break;

      case "expired":
        existing.expired += 1;
        break;

      case "pending":
        existing.pending += 1;
        break;
    }

    existing.total += 1;

    vendorMap.set(vendorName, existing);
  });

  return Array.from(vendorMap.values()).sort((first, second) => {
    const totalDifference = second.total - first.total;

    if (totalDifference !== 0) {
      return totalDifference;
    }

    return first.vendorName.localeCompare(second.vendorName);
  });
}

// =========================================================
// VALID / EXPIRED / PENDING RULE
// =========================================================

function classifyCertification(
  certification: CertificationDto,
): "valid" | "expired" | "pending" {
  /*
   * Pending and TBD remain Pending
   * even if incomplete date fields
   * are present.
   */
  if (certification.status === "Pending" || certification.status === "Tbd") {
    return "pending";
  }

  /*
   * Explicitly expired or past its
   * expiry date = Expired.
   */
  if (
    certification.status === "Expired" ||
    isPastExpiryDate(certification.expiryDate)
  ) {
    return "expired";
  }

  /*
   * Complete and In Progress are
   * treated as currently valid for
   * this management chart.
   */
  return "valid";
}

// =========================================================
// DATE HELPER
// =========================================================

function isPastExpiryDate(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return false;
  }

  const expiryDate = new Date(
    Number(match[1]),

    Number(match[2]) - 1,

    Number(match[3]),
  );

  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return expiryDate < today;
}

function wrapVendorName(vendorName: string): string[] {
  const maxCharactersPerLine = 14;

  const words = vendorName.trim().split(/\s+/);

  const lines: string[] = [];

  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxCharactersPerLine) {
      currentLine = candidate;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    /*
     * If a single word itself is very
     * long, leave it intact rather than
     * chopping the vendor name.
     */
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
}
