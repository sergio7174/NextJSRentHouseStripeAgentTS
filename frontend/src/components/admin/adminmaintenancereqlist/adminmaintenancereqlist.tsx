'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGetallMaintenanceRequestsQuery } from '@/store/api/dashboardApi';
import { useEditbookingdeletemaintreqMutation } from '@/store/api/bookingApi';
import styles from './adminmaintenancereqlist.module.css';
import TopAdminMenu from "../../layouts/topmenu/admin/TopAdminMenu";
import Footer from "../../layouts/footer/footer";

/* ============================================================
   Local config
   ============================================================ */
const ITEMS_PER_PAGE = 15;

/* ============================================================
   Status → CSS class slug
   Angular: (status || 'None').toLowerCase().replace(' ', '-')
   Fix: replace(/\s+/g, '-') handles multi-word statuses correctly
   ============================================================ */
function statusSlug(status: string | undefined | null): string {
  return (status || 'None').toLowerCase().replace(/\s+/g, '-');
}

/* ============================================================
   Adminmaintenancereqlist
   ============================================================ */
export default function Adminmaintenancereqlist() {
  /* ---------- RTK Query ---------- */
  const {
    data: requestsRaw = [],
    isLoading,
    isError,
    refetch,
  } = useGetallMaintenanceRequestsQuery();

  const [editbookingdeletemaintreq] = useEditbookingdeletemaintreqMutation();

  const requests: any[] = useMemo(() => {
    if (!Array.isArray(requestsRaw)) return [];
    return requestsRaw as any[];
  }, [requestsRaw]);

  /* ---------- Search + pagination state ---------- */
  const [searchhouseCode, setSearchhouseCode] = useState<string>('');
  const [searchCity, setSearchCity] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchhouseCode, searchCity]);

  /* ---------- Derived: filtered (AND semantics) ---------- */
  const filteredRequests = useMemo(() => {
    const codeQuery = searchhouseCode.toLowerCase().trim();
    const cityQuery = searchCity.toLowerCase().trim();

    return requests.filter((req) => {
      const houseCode = String(req?.houseCode ?? '').toLowerCase();
      const city = String(req?.city ?? '').toLowerCase();

      const matchCode = codeQuery === '' || houseCode.includes(codeQuery);
      const matchCity = cityQuery === '' || city.includes(cityQuery);

      return matchCode && matchCity;
    });
  }, [requests, searchhouseCode, searchCity]);

  /* ---------- Derived: pagination ---------- */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / itemsPerPage)
  );

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  /* ---------- Handlers ---------- */
  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const deleteRequest = async (bookingId: string, houseCode: string) => {
    if (
      typeof window === 'undefined' ||
      !window.confirm(
        `Are you sure you want to permanently delete maintenance request document for house code ${houseCode} from MongoDB?`
      )
    ) {
      return;
    }

    try {
      await editbookingdeletemaintreq(bookingId).unwrap();
      // invalidatesTags on editbookingdeletemaintreq auto-refetches.
      if (paginatedRequests.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch {
      // Rollback: force a refetch of the authoritative list
      refetch();
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
    <TopAdminMenu/>
    <div className={styles.adminDashboardWrapper}>
      <div className={styles.overlay} />

      <div className={styles.mainContainer}>
        <header className={styles.dashboardHeader}>
          <h1>Maintenance Requests List - Administrator</h1>
        </header>

        {/* Search panel */}
        <section className={styles.searchPanel}>
          <div className={styles.searchGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="searchhouseCode">Filter by House Code</label>
              <input
                id="searchhouseCode"
                type="text"
                value={searchhouseCode}
                onChange={(e) => setSearchhouseCode(e.target.value)}
                placeholder="Ex: H-402"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="searchCity">Filter by City Area</label>
              <input
                id="searchCity"
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Ex: San Francisco"
              />
            </div>
          </div>
        </section>

        {/* Table */}
        <section className={styles.tableScrollContainer}>
          <table className={styles.modernFlexTable}>
            <thead>
              <tr>
                <th>House Code</th>
                <th>State</th>
                <th>City</th>
                <th>Detailed Maintenance Request</th>
                <th>Execution Status</th>
                <th>Administrative Operations</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className={styles.noRecords}>
                    Loading maintenance requests…
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td
                    colSpan={6}
                    className={styles.noRecords}
                    style={{ color: '#ef4444' }}
                  >
                    Failed to communicate with MongoDB backend services.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                paginatedRequests.map((item: any) => {
                  const slug = statusSlug(item?.maintenaceRequestStatus);
                  const statusClass =
                    (styles as any)[slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] ??
                    styles.none;

                  return (
                    <tr key={item._id ?? item.houseCode}>
                      <td
                        data-label="House Code"
                        className={styles.highlightCodeCell}
                      >
                        {item?.houseCode}
                      </td>
                      <td data-label="State">{item?.state}</td>
                      <td data-label="City">{item?.city}</td>
                      <td
                        data-label="Request Description"
                        className={styles.textDescriptionCell}
                      >
                        {item?.maintenaceRequest}
                      </td>
                      <td data-label="Execution Status">
                        <span className={`${styles.badge} ${statusClass}`}>
                          {item?.maintenaceRequestStatus}
                        </span>
                      </td>
                      <td data-label="Administrative Operations">
                        <button
                          type="button"
                          className={styles.btnDelete}
                          onClick={() =>
                            deleteRequest(item._id, item.houseCode)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {!isLoading &&
                !isError &&
                paginatedRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.noRecords}>
                      No active maintenance request documents found matching criteria.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </section>

        {/* Pagination */}
        <footer className={styles.paginationContainer}>
          <button
            type="button"
            className={styles.btnPage}
            disabled={currentPage === 1}
            onClick={() => changePage(currentPage - 1)}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.btnPage}
            disabled={currentPage === totalPages}
            onClick={() => changePage(currentPage + 1)}
          >
            Next
          </button>
        </footer>
      </div>
    </div>
    <Footer/>
   </> 
  );
}