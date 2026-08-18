import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Archive, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { exportCertificationsCsv } from "../utils/certificationExport";

import VendorIntelligenceView from "../components/certifications/vendors/VendorIntelligenceView";

import CertificationGapsView from "../components/certifications/gaps/CertificationGapsView";

import ExpiringCertificationsView from "../components/certifications/expiring/ExpiringCertificationsView";

import PeopleCoverageGrid from "../components/certifications/people/PeopleCoverageGrid";
import { buildPeopleCoverage } from "../utils/personCoverage";

import CertificationFilters from "../components/certifications/CertificationFilters";
import CertificationPagination from "../components/certifications/CertificationPagination";
import CertificationTable from "../components/certifications/CertificationTable";

import { useToast } from "../components/feedback/ToastProvider";

import CertificationFormModal from "../components/certifications/CertificationFormModal";
import ConfirmDialog from "../components/feedback/ConfirmDialog";

import {
  createCertification,
  deleteCertification,
  getCertifications,
  updateCertification,
} from "../api/certificationsApi";

import { getVendors } from "../api/vendorsApi";

import { useAuth } from "../auth/AuthContext";

import CertificationCharts from "../components/certifications/dashboard/CertificationCharts";
import CertificationStats from "../components/certifications/dashboard/CertificationStats";
import CertificationVendorCards from "../components/certifications/dashboard/CertificationVendorCards";
import CertificationsLayout from "../components/certifications/layout/CertificationsLayout";

import type {
  CertificationDto,
  CertificationFormValues,
  CertificationRequest,
  CertificationSortField,
  CertificationStatus,
  CertificationVendorDto,
  CertificationsSection,
  SortDirection,
} from "../types/certifications";

import { getCertificationSummary } from "../utils/certificationAnalytics";

export default function CertificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedSection = searchParams.get("section");

  const requestedCertificationId = searchParams.get("certificationId");

  const { user } = useAuth();

  const { showToast } = useToast();

  const canManageCertifications = Boolean(
    user?.isGlobalAdministrator || user?.certificationsAccess === "Admin",
  );

  // =========================================================
  // NAVIGATION
  // =========================================================

  const [activeSection, setActiveSection] = useState<CertificationsSection>(
    isCertificationsSection(requestedSection) ? requestedSection : "overview",
  );

  // =========================================================
  // DATA
  // =========================================================

  const [certifications, setCertifications] = useState<CertificationDto[]>([]);

  const [vendors, setVendors] = useState<CertificationVendorDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  // =========================================================
  // FILTERS
  // =========================================================

  const [search, setSearch] = useState("");

  const [vendorFilter, setVendorFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState<CertificationStatus | "">(
    "",
  );

  const [practiceLeadFilter, setPracticeLeadFilter] = useState("");

  /*
   * Archived records remain hidden
   * by default.
   *
   * Only Global Administrators and
   * Certification Admins can enable
   * this mode.
   */
  const [showArchived, setShowArchived] = useState(false);

  // =========================================================
  // SORTING / PAGINATION
  // =========================================================

  const [sortField, setSortField] =
    useState<CertificationSortField>("personName");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("ascending");

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(25);

  // =========================================================
  // FORM / DELETE STATE
  // =========================================================

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [selectedCertification, setSelectedCertification] =
    useState<CertificationDto | null>(null);

  const [certificationPendingDelete, setCertificationPendingDelete] =
    useState<CertificationDto | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  // =========================================================
  // LOAD CERTIFICATIONS
  // =========================================================

  useEffect(() => {
    const controller = new AbortController();

    void loadCertifications(controller.signal);

    return () => {
      controller.abort();
    };
  }, [showArchived, canManageCertifications]);

  // =========================================================
  // PROFILE / DEEP-LINK SUPPORT
  // =========================================================

  useEffect(() => {
    if (!requestedCertificationId || certifications.length === 0) {
      return;
    }

    const certification = certifications.find(
      (record) => record.id === requestedCertificationId,
    );

    if (!certification) {
      return;
    }

    setActiveSection("certifications");

    setSearch(certification.certificationName);

    setPage(1);
  }, [certifications, requestedCertificationId]);

  // =========================================================
  // NON-ARCHIVED DATA
  //
  // Archived certifications must not
  // affect dashboards, people coverage,
  // gaps, expiry views or vendor stats.
  // =========================================================

  const activeCertificationRecords = useMemo(
    () =>
      certifications.filter(
        (certification) => certification.status !== "Archived",
      ),
    [certifications],
  );

  // =========================================================
  // SUMMARY
  // =========================================================

  const prototypeGapCount = useMemo(
    () => getCertificationActionCount(activeCertificationRecords),
    [activeCertificationRecords],
  );

  const summary = useMemo(
    () =>
      getCertificationSummary(activeCertificationRecords, prototypeGapCount),
    [activeCertificationRecords, prototypeGapCount],
  );

  // =========================================================
  // FILTER OPTIONS
  // =========================================================

  const vendorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          certifications.map((certification) => certification.vendorName),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [certifications],
  );

  const practiceLeadOptions = useMemo(
    () =>
      Array.from(
        new Set(
          certifications
            .map((certification) => certification.practiceLead)
            .filter((lead): lead is string => Boolean(lead)),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [certifications],
  );

  // =========================================================
  // FILTERED CERTIFICATION TABLE
  // =========================================================

  const filteredAndSortedCertifications = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    const filtered = certifications.filter((certification) => {
      const isArchived = certification.status === "Archived";

      /*
       * Archived certifications
       * are only shown when an
       * authorized administrator
       * explicitly enables the
       * archived view.
       */
      if (isArchived && (!canManageCertifications || !showArchived)) {
        return false;
      }

      const matchesSearch =
        normalizedSearch.length === 0 ||
        certification.personName
          .toLocaleLowerCase()
          .includes(normalizedSearch) ||
        certification.vendorName
          .toLocaleLowerCase()
          .includes(normalizedSearch) ||
        certification.certificationName
          .toLocaleLowerCase()
          .includes(normalizedSearch) ||
        certification.practiceLead
          ?.toLocaleLowerCase()
          .includes(normalizedSearch) ||
        certification.notes?.toLocaleLowerCase().includes(normalizedSearch);

      const matchesVendor =
        vendorFilter.length === 0 || certification.vendorName === vendorFilter;

      const matchesStatus =
        statusFilter.length === 0 || certification.status === statusFilter;

      const matchesLead =
        practiceLeadFilter.length === 0 ||
        certification.practiceLead === practiceLeadFilter;

      return matchesSearch && matchesVendor && matchesStatus && matchesLead;
    });

    return sortCertifications(filtered, sortField, sortDirection);
  }, [
    certifications,
    search,
    vendorFilter,
    statusFilter,
    practiceLeadFilter,
    sortField,
    sortDirection,
    canManageCertifications,
    showArchived,
  ]);

  // =========================================================
  // PAGE VALIDATION
  // =========================================================

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredAndSortedCertifications.length / pageSize),
    );

    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filteredAndSortedCertifications.length, page, pageSize]);

  const paginatedCertifications = useMemo(() => {
    const startIndex = (page - 1) * pageSize;

    return filteredAndSortedCertifications.slice(
      startIndex,
      startIndex + pageSize,
    );
  }, [filteredAndSortedCertifications, page, pageSize]);

  // =========================================================
  // PEOPLE
  // =========================================================

  const peopleCoverage = useMemo(
    () => buildPeopleCoverage(activeCertificationRecords),
    [activeCertificationRecords],
  );

  // =========================================================
  // LOAD DATA
  // =========================================================

  async function loadCertifications(signal?: AbortSignal) {
    setIsLoading(true);
    setLoadError(null);

    try {
      /*
       * Only admins are allowed to ask
       * the API for archived records.
       */
      const includeArchived = canManageCertifications && showArchived;

      const [records, vendorRecords] = await Promise.all([
        getCertifications(signal, includeArchived),

        getVendors(signal),
      ]);

      setCertifications(records);

      setVendors(
        vendorRecords
          .filter((vendor) => vendor.isActive)
          .sort((first, second) => first.name.localeCompare(second.name)),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setLoadError("Unable to load certification records from the API.");
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }

  // =========================================================
  // ADD
  // =========================================================

  function openAddCertificationModal() {
    if (!canManageCertifications) {
      return;
    }

    setFormError(null);

    setSelectedCertification(null);

    setModalIsOpen(true);
  }

  // =========================================================
  // CLOSE FORM
  // =========================================================

  function closeCertificationModal() {
    if (isSaving) {
      return;
    }

    setModalIsOpen(false);

    setSelectedCertification(null);

    setFormError(null);
  }

  // =========================================================
  // EXPORT
  // =========================================================

  function handleExportCsv() {
    exportCertificationsCsv(filteredAndSortedCertifications);
  }

  // =========================================================
  // SORT
  // =========================================================

  function handleSort(field: CertificationSortField) {
    if (sortField === field) {
      setSortDirection((current) =>
        current === "ascending" ? "descending" : "ascending",
      );
    } else {
      setSortField(field);
      setSortDirection("ascending");
    }

    setPage(1);
  }

  // =========================================================
  // RESET FILTERS
  // =========================================================

  function resetCertificationFilters() {
    setSearch("");

    setVendorFilter("");

    setStatusFilter("");

    setPracticeLeadFilter("");

    setShowArchived(false);

    setPage(1);
  }

  // =========================================================
  // PAGINATION
  // =========================================================

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize);

    setPage(1);
  }

  // =========================================================
  // EDIT
  // =========================================================

  function openEditCertification(certification: CertificationDto) {
    if (!canManageCertifications) {
      return;
    }

    setSelectedCertification(certification);

    setFormError(null);

    setModalIsOpen(true);
  }

  // =========================================================
  // DELETE
  // =========================================================

  function requestDeleteCertification(certification: CertificationDto) {
    if (!canManageCertifications) {
      return;
    }

    setCertificationPendingDelete(certification);
  }

  // =========================================================
  // SAVE
  // =========================================================

  async function handleCertificationSubmit(values: CertificationFormValues) {
    setIsSaving(true);

    setFormError(null);

    const request: CertificationRequest = {
      personName: values.personName.trim(),

      certificationName: values.certificationName.trim(),

      status: values.status,

      dateCompleted: values.dateCompleted || null,

      expiryDate: values.expiryDate || null,

      practiceLead: values.practiceLead.trim() || null,

      rebateImpact: values.rebateImpact.trim() || null,

      notes: values.notes.trim() || null,

      vendorId: values.vendorId,
    };

    try {
      if (selectedCertification) {
        const updated = await updateCertification(
          selectedCertification.id,
          request,
        );

        /*
         * If a certification is archived
         * while the archived view is not
         * enabled, remove it immediately
         * from the visible local dataset.
         */
        if (updated.status === "Archived" && !showArchived) {
          setCertifications((current) =>
            current.filter((certification) => certification.id !== updated.id),
          );
        } else {
          setCertifications((current) =>
            current.map((certification) =>
              certification.id === updated.id ? updated : certification,
            ),
          );
        }

        showToast(
          updated.status === "Archived"
            ? `"${updated.certificationName}" was archived.`
            : `"${updated.certificationName}" was updated.`,
          "success",
        );
      } else {
        const created = await createCertification(request);

        setCertifications((current) => [created, ...current]);

        showToast(`"${created.certificationName}" was added.`, "success");
      }

      setModalIsOpen(false);

      setSelectedCertification(null);

      setFormError(null);
    } catch (error) {
      setFormError(getCertificationErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteCertification() {
    if (!canManageCertifications || !certificationPendingDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteCertification(certificationPendingDelete.id);

      setCertifications((current) =>
        current.filter(
          (certification) => certification.id !== certificationPendingDelete.id,
        ),
      );

      showToast(
        `"${certificationPendingDelete.certificationName}" was deleted.`,
        "success",
      );

      setCertificationPendingDelete(null);
    } catch (error) {
      showToast(getCertificationErrorMessage(error), "error");
    } finally {
      setIsDeleting(false);
    }
  }

  // =========================================================
  // ARCHIVED TOGGLE
  // =========================================================

  function handleArchivedToggle(checked: boolean) {
    if (!canManageCertifications) {
      return;
    }

    setShowArchived(checked);

    /*
     * If archived mode is turned off
     * while Status = Archived, clear
     * that filter so the table doesn't
     * appear unexpectedly empty.
     */
    if (!checked && statusFilter === "Archived") {
      setStatusFilter("");
    }

    setPage(1);
  }

  // =========================================================
  // SECTION CHANGE
  // =========================================================

  function handleSectionChange(section: CertificationsSection) {
    setActiveSection(section);

    setSearchParams({
      section,
    });
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <CertificationsLayout
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      onAddCertification={openAddCertificationModal}
      onExportCsv={handleExportCsv}
      canManageCertifications={canManageCertifications}
      exportDisabled={certifications.length === 0}
      gapCount={summary.gapCount}
      expiringCount={summary.expiringWithin90Days}
    >
      {/* =====================================================
          LOADING
         ===================================================== */}

      {isLoading && (
        <div className="page-state" aria-live="polite">
          <RefreshCw
            className="page-state__spinner"
            size={29}
            aria-hidden="true"
          />

          <h2>Loading certifications</h2>

          <p>Retrieving certification records from the API...</p>
        </div>
      )}

      {/* =====================================================
          ERROR
         ===================================================== */}

      {!isLoading && loadError && (
        <div className="page-state page-state--error" role="alert">
          <AlertCircle size={31} aria-hidden="true" />

          <h2>Unable to load certifications</h2>

          <p>{loadError}</p>

          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadCertifications()}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      {!isLoading && !loadError && (
        <>
          {/* =================================================
                OVERVIEW
               ================================================= */}

          {activeSection === "overview" && (
            <section className="certifications-section">
              <CertificationStats
                summary={summary}
                onSectionChange={handleSectionChange}
              />

              <CertificationCharts
                certifications={activeCertificationRecords}
              />

              <CertificationVendorCards
                certifications={activeCertificationRecords}
              />
            </section>
          )}

          {/* =================================================
                ALL CERTIFICATIONS
               ================================================= */}

          {activeSection === "certifications" && (
            <section className="certifications-section">
              <div className="certification-table-card">
                <header className="certification-table-card__header">
                  <div>
                    <h2>
                      {showArchived
                        ? "All certifications including archived"
                        : "All certifications"}
                    </h2>

                    {showArchived && (
                      <p>Archived records are included in this view.</p>
                    )}
                  </div>

                  {canManageCertifications && (
                    <label className="certification-archived-toggle">
                      <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(event) =>
                          handleArchivedToggle(event.target.checked)
                        }
                      />

                      <span className="certification-archived-toggle__content">
                        <Archive size={15} aria-hidden="true" />
                        Show archived
                      </span>
                    </label>
                  )}
                </header>

                <CertificationFilters
                  search={search}
                  vendor={vendorFilter}
                  status={statusFilter}
                  practiceLead={practiceLeadFilter}
                  vendors={vendorOptions}
                  practiceLeads={practiceLeadOptions}
                  resultCount={filteredAndSortedCertifications.length}
                  totalCount={
                    certifications.filter(
                      (certification) =>
                        showArchived || certification.status !== "Archived",
                    ).length
                  }
                  onSearchChange={(value) => {
                    setSearch(value);

                    setPage(1);
                  }}
                  onVendorChange={(value) => {
                    setVendorFilter(value);

                    setPage(1);
                  }}
                  onStatusChange={(value) => {
                    /*
                     * If an admin
                     * selects Archived,
                     * automatically make
                     * sure archived
                     * records are loaded.
                     */
                    if (value === "Archived" && canManageCertifications) {
                      setShowArchived(true);
                    }

                    setStatusFilter(value);

                    setPage(1);
                  }}
                  onPracticeLeadChange={(value) => {
                    setPracticeLeadFilter(value);

                    setPage(1);
                  }}
                  onReset={resetCertificationFilters}
                />

                <CertificationTable
                  certifications={paginatedCertifications}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  canManage={canManageCertifications}
                  onEdit={openEditCertification}
                  onDelete={requestDeleteCertification}
                />

                <CertificationPagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={filteredAndSortedCertifications.length}
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </section>
          )}

          {/* =================================================
                PEOPLE
               ================================================= */}

          {activeSection === "people" && (
            <section className="certifications-section">
              <PeopleCoverageGrid people={peopleCoverage} />
            </section>
          )}

          {/* =================================================
                GAPS
               ================================================= */}

          {activeSection === "gaps" && (
            <section className="certifications-section">
              <CertificationGapsView
                certifications={activeCertificationRecords}
                canManage={canManageCertifications}
                onEdit={openEditCertification}
              />
            </section>
          )}

          {/* =================================================
                EXPIRING
               ================================================= */}

          {activeSection === "expiring" && (
            <section className="certifications-section">
              <ExpiringCertificationsView
                certifications={activeCertificationRecords}
                canManage={canManageCertifications}
                onEdit={openEditCertification}
              />
            </section>
          )}

          {/* =================================================
                VENDORS
               ================================================= */}

          {activeSection === "vendors" && (
            <section className="certifications-section">
              <VendorIntelligenceView
                certifications={activeCertificationRecords}
                canManage={canManageCertifications}
                onEdit={openEditCertification}
              />
            </section>
          )}
        </>
      )}

      {/* =====================================================
          ADD / EDIT
         ===================================================== */}

      {canManageCertifications && modalIsOpen && (
        <CertificationFormModal
          isOpen={modalIsOpen}
          certification={selectedCertification}
          vendors={vendors}
          isSaving={isSaving}
          serverError={formError}
          onClose={closeCertificationModal}
          onSubmit={handleCertificationSubmit}
        />
      )}

      {/* =====================================================
          DELETE
         ===================================================== */}

      {canManageCertifications && (
        <ConfirmDialog
          isOpen={certificationPendingDelete !== null}
          title="Delete certification?"
          description={
            certificationPendingDelete
              ? `"${certificationPendingDelete.certificationName}" for ${certificationPendingDelete.personName} will be permanently removed.`
              : ""
          }
          confirmLabel="Delete certification"
          isConfirming={isDeleting}
          onCancel={() => {
            if (!isDeleting) {
              setCertificationPendingDelete(null);
            }
          }}
          onConfirm={() => void confirmDeleteCertification()}
        />
      )}
    </CertificationsLayout>
  );
}

// =========================================================
// ACTION / GAP COUNT
// =========================================================

function getCertificationActionCount(
  certifications: CertificationDto[],
): number {
  const actionGroups = new Set<string>();

  certifications.forEach((certification) => {
    /*
     * Archived certifications
     * should never contribute to
     * action/gap counts.
     */
    if (certification.status === "Archived") {
      return;
    }

    const isActionable =
      certification.status === "Expired" ||
      certification.status === "Pending" ||
      certification.status === "Tbd" ||
      isCertificationPastExpiry(certification.expiryDate) ||
      isCertificationExpiringWithin30Days(certification.expiryDate);

    if (!isActionable) {
      return;
    }

    const key = [
      certification.vendorName.trim().toLocaleLowerCase(),

      certification.certificationName.trim().toLocaleLowerCase(),
    ].join("|");

    actionGroups.add(key);
  });

  return actionGroups.size;
}

// =========================================================
// EXPIRY HELPERS
// =========================================================

function isCertificationPastExpiry(value: string | null): boolean {
  const daysRemaining = getCertificationDaysRemaining(value);

  return daysRemaining < 0;
}

function isCertificationExpiringWithin30Days(value: string | null): boolean {
  const daysRemaining = getCertificationDaysRemaining(value);

  return daysRemaining >= 0 && daysRemaining <= 30;
}

function getCertificationDaysRemaining(value: string | null): number {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const expiryDate = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  const today = new Date();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return Math.ceil(
    (expiryDate.getTime() - startOfToday.getTime()) / 86_400_000,
  );
}

// =========================================================
// SORTING
// =========================================================

function sortCertifications(
  certifications: CertificationDto[],
  sortField: CertificationSortField,
  sortDirection: SortDirection,
): CertificationDto[] {
  return [...certifications].sort((first, second) => {
    const firstValue = first[sortField] ?? "";

    const secondValue = second[sortField] ?? "";

    const comparison = String(firstValue).localeCompare(
      String(secondValue),
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      },
    );

    return sortDirection === "ascending" ? comparison : comparison * -1;
  });
}

// =========================================================
// API ERROR
// =========================================================

function getCertificationErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            title?: string;
            detail?: string;
            errors?: Record<string, string[]>;
          };
        };
      }
    ).response;

    const validationMessage =
      response?.data?.errors &&
      Object.values(response.data.errors).flat().find(Boolean);

    return (
      validationMessage ??
      response?.data?.detail ??
      response?.data?.title ??
      "The certification could not be saved."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

// =========================================================
// ROUTE HELPERS
// =========================================================

function isCertificationsSection(
  value: string | null,
): value is CertificationsSection {
  return (
    value === "overview" ||
    value === "certifications" ||
    value === "people" ||
    value === "gaps" ||
    value === "expiring" ||
    value === "vendors"
  );
}
