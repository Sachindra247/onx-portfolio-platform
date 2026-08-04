import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

import type { CertificationDto } from "../../../types/certifications";

import {
  formatCertificationStatus,
  getCertificationStatusSummary,
  getCertificationVendorSummary,
} from "../../../utils/certificationAnalytics";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
);

interface CertificationChartsProps {
  certifications: CertificationDto[];
}

export default function CertificationCharts({
  certifications,
}: CertificationChartsProps) {
  const vendorSummary = getCertificationVendorSummary(certifications).slice(
    0,
    10,
  );

  const statusSummary = getCertificationStatusSummary(certifications).filter(
    (item) => item.count > 0,
  );

  const vendorChartData = {
    labels: vendorSummary.map((vendor) => vendor.vendorName),
    datasets: [
      {
        label: "Certifications",
        data: vendorSummary.map((vendor) => vendor.certificationCount),
        backgroundColor: "#006b55",
        borderRadius: 5,
      },
    ],
  };

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
      <article className="certification-chart-card">
        <header className="certification-chart-card__header">
          <div>
            <h2>Certifications by vendor</h2>
            <p>Top vendors by certification records</p>
          </div>
        </header>

        <div className="certification-chart-card__canvas">
          <Bar
            data={vendorChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: "y",
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                x: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                  },
                },
                y: {
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </div>
      </article>

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
