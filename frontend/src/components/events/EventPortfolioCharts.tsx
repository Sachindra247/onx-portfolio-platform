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
import type { EventDto } from "../../types/events";
import { formatEventStage } from "../../utils/eventFormatting";
import { getStageSummary, getVendorSummary } from "../../utils/eventAnalytics";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
);

interface EventPortfolioChartsProps {
  events: EventDto[];
  canManage: boolean;
}

export default function EventPortfolioCharts({
  events,
  canManage,
}: EventPortfolioChartsProps) {
  const stageSummary = getStageSummary(events);
  const vendorSummary = getVendorSummary(events).slice(0, 6);

  const stageChartData = {
    labels: stageSummary.map((item) => formatEventStage(item.stage)),
    datasets: [
      {
        label: "Events",
        data: stageSummary.map((item) => item.count),
        backgroundColor: [
          "#87918d",
          "#d69e2e",
          "#3182ce",
          "#805ad5",
          "#2f855a",
        ],
        borderWidth: 0,
      },
    ],
  };

  const vendorChartData = {
    labels: vendorSummary.map((vendor) => vendor.vendorName),
    datasets: [
      {
        label: "Budget CAD",
        data: vendorSummary.map((vendor) => vendor.totalBudgetCad),
        backgroundColor: "#006b55",
        borderRadius: 5,
      },
    ],
  };

  return (
    <section className="event-charts" aria-label="Event portfolio charts">
      <article className="event-chart-card">
        <header>
          <div>
            <h2>Events by stage</h2>
            <p>Current portfolio distribution</p>
          </div>
        </header>

        <div className="event-chart-card__canvas">
          <Doughnut
            data={stageChartData}
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
      {canManage && (
        <article className="event-chart-card">
          <header>
            <div>
              <h2>Budget by vendor</h2>
              <p>Top six vendors by portfolio budget</p>
            </div>
          </header>

          <div className="event-chart-card__canvas">
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
                  tooltip: {
                    callbacks: {
                      label(context) {
                        const value =
                          typeof context.raw === "number" ? context.raw : 0;

                        return new Intl.NumberFormat("en-CA", {
                          style: "currency",
                          currency: "CAD",
                          maximumFractionDigits: 0,
                        }).format(value);
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    ticks: {
                      callback(value) {
                        return new Intl.NumberFormat("en-CA", {
                          notation: "compact",
                          compactDisplay: "short",
                        }).format(Number(value));
                      },
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
      )}
    </section>
  );
}
