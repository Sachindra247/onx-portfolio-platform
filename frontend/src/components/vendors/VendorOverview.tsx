import { useEffect, useState } from "react";
import { Award, Building2, CalendarDays, Users } from "lucide-react";

import { getVendors } from "../../api/vendorsApi";
import { getCertifications } from "../../api/certificationsApi";
import { getEvents } from "../../api/eventsApi";
import type { VendorManagementSection } from "./VendorManagementNav";

interface VendorOverviewProps {
  onNavigate: (section: VendorManagementSection) => void;
}

interface OverviewStats {
  vendors: number;
  certifications: number;
  events: number;
}

export default function VendorOverview({ onNavigate }: VendorOverviewProps) {
  const [stats, setStats] = useState<OverviewStats>({
    vendors: 0,
    certifications: 0,
    events: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadOverview() {
      try {
        setLoading(true);
        setError("");

        const [vendors, certifications, events] = await Promise.all([
          getVendors(controller.signal),
          getCertifications(controller.signal),
          getEvents(controller.signal),
        ]);

        if (!controller.signal.aborted) {
          setStats({
            vendors: vendors.length,
            certifications: certifications.length,
            events: events.length,
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load vendor overview.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadOverview();

    return () => controller.abort();
  }, []);

  const cards = [
    {
      title: "Active Vendors",
      value: stats.vendors,
      icon: Building2,
      section: "vendors" as const,
    },
    {
      title: "Certifications",
      value: stats.certifications,
      icon: Award,
      section: "certifications" as const,
    },
    {
      title: "Events",
      value: stats.events,
      icon: CalendarDays,
      section: "events" as const,
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <header style={{ marginBottom: "28px" }}>
        <h1>Vendor Management</h1>
        <p>
          Overview of vendor relationships, events, certifications, and
          contacts.
        </p>
      </header>

      {loading && <p>Loading overview...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => onNavigate(card.section)}
                  style={{
                    padding: "24px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    background: "#ffffff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <Icon
                    size={26}
                    color="#28785d"
                    style={{ marginBottom: "14px" }}
                  />

                  <h2 style={{ fontSize: "28px" }}>{card.value}</h2>

                  <p>{card.title}</p>
                </button>
              );
            })}
          </div>

          <div
            style={{
              padding: "24px",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              background: "#ffffff",
            }}
          >
            <Users size={26} color="#28785d" />

            <h2>Vendor Relationships</h2>

            <p>
              Select a vendor to view its contacts, certifications, and related
              events.
            </p>

            <button type="button" onClick={() => onNavigate("vendors")}>
              Open Vendor Directory
            </button>

            <hr style={{ margin: "24px 0" }} />

            <h3>Partnership Information</h3>

            <p>
              Partnership level, relationship owner, and additional vendor
              details will be finalized after requirements are confirmed.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
