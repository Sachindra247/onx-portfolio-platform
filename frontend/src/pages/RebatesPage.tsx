import {
  BadgeDollarSign,
  CircleDollarSign,
  Clock3,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import RebateStatusOverview from "../components/rebates/dashboard/RebateStatusOverview";
import RebateValueOverview from "../components/rebates/dashboard/RebateValueOverview";
import UpcomingRebates from "../components/rebates/dashboard/UpcomingRebates";

import RebateVendorStats from "../components/rebates/vendors/RebateVendorStats";
import RebateVendorSummary from "../components/rebates/vendors/RebateVendorSummary";

import { useAuth } from "../auth/AuthContext";
import {
  createRebate,
  deleteRebate,
  getRebates,
  updateRebate,
} from "../api/rebatesApi";

import { getVendors } from "../api/vendorsApi";

import RebateFormModal from "../components/rebates/RebateFormModal";

import RebatesLayout from "../components/rebates/layout/RebatesLayout";
import RebateFilters from "../components/rebates/RebateFilters";
import RebateTable from "../components/rebates/RebateTable";

import type {
  RebateDto,
  RebateRequest,
  RebateSortDirection,
  RebateSortField,
  RebateStatus,
  RebatesSection,
} from "../types/rebates";

import type { CertificationVendorDto } from "../types/certifications";

import { formatRebateAmount, getRebateSummary } from "../utils/rebateAnalytics";

import "../styles/rebates.css";

export default function RebatesPage() {
  const { user } = useAuth();

  const [activeSection, setActiveSection] =
    useState<RebatesSection>("overview");

  const [rebates, setRebates] = useState<RebateDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /*
   * All Rebates filters
   */
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [vendorFilter, setVendorFilter] = useState("");

  /*
   * All Rebates sorting
   */
  const [sortField, setSortField] = useState<RebateSortField>("dueDate");

  const [sortDirection, setSortDirection] =
    useState<RebateSortDirection>("ascending");

  const [vendors, setVendors] = useState<CertificationVendorDto[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingRebate, setEditingRebate] = useState<RebateDto | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const [rebatePendingDelete, setRebatePendingDelete] =
    useState<RebateDto | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canManage = user?.isGlobalAdministrator === true;

  useEffect(() => {
    const controller = new AbortController();

    async function loadVendors() {
      try {
        const data = await getVendors(controller.signal);

        setVendors(data);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to load vendors.", loadError);
      }
    }

    void loadVendors();

    return () => {
      controller.abort();
    };
  }, []);

  /*
   * Load rebate records.
   */
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

  /*
   * Overview KPI calculations.
   */
  const summary = useMemo(() => getRebateSummary(rebates), [rebates]);

  /*
   * Filter and sort the records shown in
   * the All Rebates section.
   */
  const filteredRebates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = rebates.filter((rebate) => {
      const searchableValues = [
        rebate.title,
        rebate.programName,
        rebate.description,
        rebate.vendorName,
        rebate.ownerName,
        rebate.ownerEmail,
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesStatus = !statusFilter || rebate.status === statusFilter;

      const matchesVendor = !vendorFilter || rebate.vendorId === vendorFilter;

      return matchesSearch && matchesStatus && matchesVendor;
    });

    result.sort((first, second) => {
      let comparison = 0;

      switch (sortField) {
        case "estimatedAmount":
        case "actualAmount": {
          const firstValue = first[sortField] ?? Number.NEGATIVE_INFINITY;

          const secondValue = second[sortField] ?? Number.NEGATIVE_INFINITY;

          comparison = firstValue - secondValue;

          break;
        }

        case "dueDate": {
          const firstValue = first.dueDate ?? "9999-12-31";

          const secondValue = second.dueDate ?? "9999-12-31";

          comparison = firstValue.localeCompare(secondValue);

          break;
        }

        default: {
          const firstValue = first[sortField] ?? "";

          const secondValue = second[sortField] ?? "";

          comparison = String(firstValue).localeCompare(
            String(secondValue),
            undefined,
            {
              sensitivity: "base",
            },
          );

          break;
        }
      }

      return sortDirection === "ascending" ? comparison : -comparison;
    });

    return result;
  }, [rebates, search, statusFilter, vendorFilter, sortField, sortDirection]);

  /*
   * Sorting
   */
  function handleSort(field: RebateSortField) {
    if (field === sortField) {
      setSortDirection((current) =>
        current === "ascending" ? "descending" : "ascending",
      );

      return;
    }

    setSortField(field);
    setSortDirection("ascending");
  }

  /*
   * Reset all All Rebates filters.
   */
  function handleClearFilters() {
    setSearch("");
    setStatusFilter("");
    setVendorFilter("");
  }

  /*
   * Add will open the form modal in
   * Batch 3B. For now, move the user
   * to the All Rebates section.
   */
  function handleAddRebate() {
    setActiveSection("rebates");
    setEditingRebate(null);
    setFormError(null);
    setIsFormOpen(true);
  }

  /*
   * Batch 3B will replace this with
   * the Edit Rebate modal.
   */
  function handleEditRebate(rebate: RebateDto) {
    setEditingRebate(rebate);
    setFormError(null);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setEditingRebate(null);
    setFormError(null);
  }

  async function handleSaveRebate(request: RebateRequest) {
    try {
      setIsSaving(true);
      setFormError(null);

      const savedRebate = editingRebate
        ? await updateRebate(editingRebate.id, request)
        : await createRebate(request);

      setRebates((current) => {
        if (editingRebate) {
          return current.map((rebate) =>
            rebate.id === savedRebate.id ? savedRebate : rebate,
          );
        }

        return [savedRebate, ...current];
      });

      setIsFormOpen(false);
      setEditingRebate(null);
    } catch (saveError) {
      console.error("Failed to save rebate.", saveError);

      setFormError(
        "We couldn't save the rebate. Please review the information and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  /*
   * Batch 3B will replace this with
   * confirmation + DELETE API call.
   */
  function handleDeleteRebate(rebate: RebateDto) {
    setDeleteError(null);
    setRebatePendingDelete(rebate);
  }

  function handleCloseDelete() {
    if (isDeleting) {
      return;
    }

    setRebatePendingDelete(null);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!rebatePendingDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      await deleteRebate(rebatePendingDelete.id);

      setRebates((current) =>
        current.filter((rebate) => rebate.id !== rebatePendingDelete.id),
      );

      setRebatePendingDelete(null);
    } catch (deleteFailure) {
      console.error("Failed to delete rebate.", deleteFailure);

      setDeleteError("We couldn't delete this rebate. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleViewStatus(status: RebateStatus) {
    setStatusFilter(status);
    setVendorFilter("");
    setSearch("");
    setActiveSection("rebates");
  }

  function handleViewAllRebates() {
    setStatusFilter("");
    setVendorFilter("");
    setSearch("");
    setActiveSection("rebates");
  }

  function handleViewRebate(rebate: RebateDto) {
    setSearch(rebate.title);
    setStatusFilter("");
    setVendorFilter("");
    setActiveSection("rebates");
  }

  function handleViewVendor(vendorId: string) {
    setVendorFilter(vendorId);
    setStatusFilter("");
    setSearch("");
    setActiveSection("rebates");
  }

  return (
    <>
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
              Track vendor rebate opportunities, values, ownership and
              deadlines.
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
            {/* =========================================
              OVERVIEW
              ========================================= */}

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
                      <strong>
                        {formatRebateAmount(summary.actualAmount)}
                      </strong>

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

                <div className="rebates-dashboard-grid">
                  <RebateStatusOverview
                    rebates={rebates}
                    onViewStatus={handleViewStatus}
                  />

                  <RebateValueOverview rebates={rebates} />

                  <UpcomingRebates
                    rebates={rebates}
                    onViewRebate={handleViewRebate}
                    onViewAll={handleViewAllRebates}
                  />
                </div>
              </section>
            ) : null}

            {/* =========================================
              ALL REBATES
              ========================================= */}

            {activeSection === "rebates" ? (
              <section className="rebates-records">
                <div className="rebates-section-heading">
                  <div>
                    <h2>All Rebates</h2>

                    <p>Track and manage rebate opportunities across vendors.</p>
                  </div>

                  <span className="rebates-record-count">
                    {filteredRebates.length}{" "}
                    {filteredRebates.length === 1 ? "record" : "records"}
                  </span>
                </div>

                <RebateFilters
                  rebates={rebates}
                  search={search}
                  status={statusFilter}
                  vendorId={vendorFilter}
                  onSearchChange={setSearch}
                  onStatusChange={setStatusFilter}
                  onVendorChange={setVendorFilter}
                  onClear={handleClearFilters}
                />

                <RebateTable
                  rebates={filteredRebates}
                  canManage={canManage}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  onEdit={handleEditRebate}
                  onDelete={handleDeleteRebate}
                />
              </section>
            ) : null}

            {/* =========================================
              VENDORS
              ========================================= */}

            {activeSection === "vendors" ? (
              <section className="rebates-vendors">
                <div className="rebates-section-heading">
                  <div>
                    <h2>Vendor Rebates</h2>

                    <p>Compare rebate activity and value across vendors.</p>
                  </div>

                  <span className="rebates-record-count">
                    {new Set(rebates.map((rebate) => rebate.vendorId)).size}{" "}
                    vendors
                  </span>
                </div>

                <RebateVendorStats rebates={rebates} />

                <section className="rebates-vendor-list-card">
                  <div className="rebates-vendor-list-card__header">
                    <div>
                      <h3>Rebate Summary by Vendor</h3>

                      <p>
                        Current rebate counts and tracked value for each vendor.
                      </p>
                    </div>
                  </div>

                  <RebateVendorSummary
                    rebates={rebates}
                    onViewVendor={handleViewVendor}
                  />
                </section>
              </section>
            ) : null}
          </>
        )}
      </RebatesLayout>

      <RebateFormModal
        isOpen={isFormOpen}
        rebate={editingRebate}
        vendors={vendors}
        isSaving={isSaving}
        error={formError}
        onClose={handleCloseForm}
        onSubmit={handleSaveRebate}
      />
      {rebatePendingDelete ? (
        <div
          className="rebate-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              handleCloseDelete();
            }
          }}
        >
          <section
            className="rebate-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rebate-delete-title"
          >
            <div className="rebate-delete-modal__body">
              <div className="rebate-delete-modal__icon">
                <Trash2 size={22} aria-hidden="true" />
              </div>

              <div>
                <h2 id="rebate-delete-title">Delete Rebate?</h2>

                <p>
                  You're about to delete{" "}
                  <strong>{rebatePendingDelete.title}</strong>. This action
                  cannot be undone.
                </p>
              </div>
            </div>

            {deleteError ? (
              <div className="rebate-delete-modal__error" role="alert">
                {deleteError}
              </div>
            ) : null}

            <footer className="rebate-delete-modal__footer">
              <button
                type="button"
                className="rebate-form__cancel"
                disabled={isDeleting}
                onClick={handleCloseDelete}
              >
                Cancel
              </button>

              <button
                type="button"
                className="rebate-delete-modal__confirm"
                disabled={isDeleting}
                onClick={() => void handleConfirmDelete()}
              >
                <Trash2 size={15} aria-hidden="true" />

                {isDeleting ? "Deleting..." : "Delete Rebate"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
