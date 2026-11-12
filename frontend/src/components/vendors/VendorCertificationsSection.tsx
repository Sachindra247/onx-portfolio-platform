import { useEffect, useState } from "react";
import { Award } from "lucide-react";

import { getCertifications } from "../../api/certificationsApi";
import type { CertificationDto } from "../../types/certifications";

interface VendorCertificationsSectionProps {
  vendorId: string;
}

export default function VendorCertificationsSection({
  vendorId,
}: VendorCertificationsSectionProps) {
  const [certifications, setCertifications] = useState<CertificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCertifications() {
      setLoading(true);
      setError(null);

      try {
        const records = await getCertifications(controller.signal);

        if (!controller.signal.aborted) {
          setCertifications(
            records.filter((record) => record.vendorId === vendorId),
          );
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load vendor certifications.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCertifications();

    return () => controller.abort();
  }, [vendorId]);

  if (loading) {
    return <p>Loading certifications...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <section>
      <h4 style={{ marginBottom: "16px" }}>
        Related Certifications ({certifications.length})
      </h4>

      {certifications.length === 0 ? (
        <p>No certifications found for this vendor.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {certifications.map((certification) => (
            <article
              key={certification.id}
              style={{
                padding: "16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <Award size={18} color="#28785d" />
                <strong>{certification.certificationName}</strong>
              </div>

              <p>Person: {certification.personName}</p>
              <p>Status: {certification.status}</p>

              {certification.expiryDate && (
                <p>
                  Expiry:{" "}
                  {new Date(certification.expiryDate).toLocaleDateString()}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
