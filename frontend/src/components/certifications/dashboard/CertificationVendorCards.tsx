import type { CertificationDto } from "../../../types/certifications";

import { getCertificationVendorSummary } from "../../../utils/certificationAnalytics";

interface CertificationVendorCardsProps {
  certifications: CertificationDto[];
}

export default function CertificationVendorCards({
  certifications,
}: CertificationVendorCardsProps) {
  const vendors = getCertificationVendorSummary(certifications);

  return (
    <section className="certification-vendors-card">
      <header className="certification-vendors-card__header">
        <h2>Vendor partner status</h2>
      </header>

      <div className="certification-vendor-grid">
        {vendors.map((vendor) => (
          <article key={vendor.vendorId} className="certification-vendor-card">
            <div className="certification-vendor-card__strip" />

            <div className="certification-vendor-card__body">
              <h3>{vendor.vendorName}</h3>

              <p>
                {vendor.inProgressCount > 0
                  ? `${vendor.inProgressCount} in progress or pending`
                  : "No outstanding records"}
              </p>
            </div>

            <div className="certification-vendor-card__stats">
              <div>
                <strong>{vendor.certificationCount}</strong>
                <span>Certs</span>
              </div>

              <div>
                <strong>{vendor.peopleCount}</strong>
                <span>People</span>
              </div>

              <div>
                <strong>{vendor.completedCount}</strong>
                <span>Complete</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
