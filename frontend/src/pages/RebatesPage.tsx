import {
  BadgeDollarSign,
  Building2,
  CircleDollarSign,
  Clock3,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import RebatesLayout from "../components/rebates/layout/RebatesLayout";

import { getRebates } from "../api/rebatesApi";

import type { RebateDto, RebatesSection } from "../types/rebates";

import { formatRebateAmount, getRebateSummary } from "../utils/rebateAnalytics";

import "../styles/rebates.css";

export default function RebatesPage() {
  const { user } = useAuth();

  const [activeSection, setActiveSection] =
    useState<RebatesSection>("overview");

  const [rebates, setRebates] = useState<RebateDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const canManage = user?.isGlobalAdministrator === true;

  useEffect(() => {
    const controller = new AbortController();

    async function loadRebates() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getRebates({
          signal: controller.signal,
        });

        setRebates(data);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to load rebates.", loadError);

        setError("We couldn't load the rebate records.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadRebates();

    return () => {
      controller.abort();
    };
  }, []);

  const summary = useMemo(() => getRebateSummary(rebates), [rebates]);

  function handleAddRebate() {
    /*
     * The form modal will be introduced
     * in the next frontend batch.
     */
    setActiveSection("rebates");
  }

  return (
    <RebatesLayout
      activeSection={activeSection}
      canManage={canManage}
      onSectionChange={setActiveSection}
      onAddRebate={handleAddRebate}
    >
      <header className="rebates-page-header">
        <div>
          <div className="rebates-page-header__eyebrow">
            Portfolio Management
          </div>

          <div className="rebates-page-header__title-row">
            <h1>Rebates</h1>

            <span className="rebates-beta-badge">Beta</span>
          </div>

          <p>
            Track vendor rebate opportunities, values, ownership and deadlines.
          </p>
        </div>
      </header>

      {error ? (
        <div className="rebates-alert rebates-alert--error" role="alert">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <section className="rebates-loading">
          <div className="rebates-loading__spinner" aria-hidden="true" />

          <p>Loading rebates...</p>
        </section>
      ) : (
        <>
          {activeSection === "overview" ? (
            <section className="rebates-overview">
              <div className="rebates-stats">
                <article className="rebates-stat-card">
                  <span className="rebates-stat-card__icon">
                    <BadgeDollarSign size={20} aria-hidden="true" />
                  </span>

                  <div>
                    <strong>{summary.rebateCount}</strong>
                    <span>Total Rebates</span>
                  </div>
                </article>

                <article className="rebates-stat-card">
                  <span className="rebates-stat-card__icon">
                    <CircleDollarSign size={20} aria-hidden="true" />
                  </span>

                  <div>
                    <strong>
                      {formatRebateAmount(summary.estimatedAmount)}
                    </strong>
                    <span>Estimated Value</span>
                  </div>
                </article>

                <article className="rebates-stat-card">
                  <span className="rebates-stat-card__icon">
                    <CircleDollarSign size={20} aria-hidden="true" />
                  </span>

                  <div>
                    <strong>{formatRebateAmount(summary.actualAmount)}</strong>
                    <span>Actual Value</span>
                  </div>
                </article>

                <article className="rebates-stat-card">
                  <span className="rebates-stat-card__icon">
                    <Clock3 size={20} aria-hidden="true" />
                  </span>

                  <div>
                    <strong>{summary.dueSoonCount}</strong>
                    <span>Due Within 30 Days</span>
                  </div>
                </article>
              </div>

              <div className="rebates-placeholder-card">
                <BadgeDollarSign size={30} aria-hidden="true" />

                <h2>Rebates Overview</h2>

                <p>
                  Dashboard charts and activity insights will appear here as
                  rebate records are added.
                </p>
              </div>
            </section>
          ) : null}

          {activeSection === "rebates" ? (
            <section className="rebates-placeholder-card">
              <BadgeDollarSign size={30} aria-hidden="true" />

              <h2>All Rebates</h2>

              <p>
                {rebates.length === 0
                  ? "No rebate records have been created yet."
                  : `${rebates.length} rebate ${
                      rebates.length === 1 ? "record is" : "records are"
                    } currently available.`}
              </p>

              {canManage ? (
                <small>
                  Add, edit and delete functionality will be enabled in the next
                  implementation step.
                </small>
              ) : (
                <small>Your current access is read-only.</small>
              )}
            </section>
          ) : null}

          {activeSection === "vendors" ? (
            <section className="rebates-placeholder-card">
              <Building2 size={30} aria-hidden="true" />

              <h2>Vendor Rebates</h2>

              <p>Vendor-level rebate summaries will appear here.</p>
            </section>
          ) : null}
        </>
      )}
    </RebatesLayout>
  );
}
