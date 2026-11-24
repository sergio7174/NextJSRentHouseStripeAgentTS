'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';

// ---- API slice (bookingApi.ts) ----
import { useGetRentedHousesByOwnerIdQuery } from '@/store/api/bookingApi';

import styles from './owneraccountmaintpage.module.css';
import TopOwnerMenu from "../../layouts/topmenu/owner/TopOwnerMenu";
import Footer from "../../layouts/footer/footer";

/* ============================================================
   Local config
   ============================================================ */
const MAIN_TITLE = 'Owner Dashboard / (Account / Maintenance)';
const ITEMS_PER_PAGE = 10;

const fmtUSD = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n || 0);

/* ============================================================
   Owneraccountmaintpage
   ============================================================ */
export default function Owneraccountmaintpage() {
  /* ---------- Owner identity ---------- */
  const owner = useAppSelector((state) => state.user);
  const ownerId: string = owner?.id ?? '';

  /* ---------- RTK Query: rented houses for this owner ---------- */
  const {
    data: rentedHousesRaw,
    isLoading,
    isError,
    error,
  } = useGetRentedHousesByOwnerIdQuery(ownerId, { skip: !ownerId });

  // bookingApi's normalizeBookingList already converts `{ ownerbooking: [...] }`
  // → BookingList[], so we can trust the array shape. Still guard defensively.
  const rentedHouses: any[] = useMemo(() => {
    if (!rentedHousesRaw) return [];
    if (Array.isArray(rentedHousesRaw)) return rentedHousesRaw;
    const payload =
      (rentedHousesRaw as any)?.ownerbooking ??
      (rentedHousesRaw as any)?.Bookings ??
      (rentedHousesRaw as any)?.bookings;
    return Array.isArray(payload) ? payload : [];
  }, [rentedHousesRaw]);

  /* ---------- Pagination ---------- */
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(ITEMS_PER_PAGE);

  /* ---------- Toast ---------- */
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- Surface query errors ---------- */
  useEffect(() => {
    if (isError && error) {
      const msg =
        (error as any)?.data?.message ??
        (error as any)?.error ??
        'Error fetching data from server';
      setToast({ type: 'error', text: String(msg) });
    }
  }, [isError, error]);

  /* ---------- Derived: financials (getters in Angular) ---------- */
  const totalHouses = rentedHouses.length;

  const totalMonthlyPayment = useMemo(
    () =>
      rentedHouses.reduce(
        (acc: number, house: any) => acc + (house.RentPrice || 0),
        0
      ),
    [rentedHouses]
  );

  /* ---------- Derived: paginated ---------- */
  const totalPages = Math.max(1, Math.ceil(totalHouses / itemsPerPage));

  const paginatedHouses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return rentedHouses.slice(start, start + itemsPerPage);
  }, [rentedHouses, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  /* ---------- Handlers ---------- */
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const generateReport = () => {
    // Original Angular implementation: window.print()
    if (typeof window !== 'undefined') window.print();
  };

  /* ---------- Render ---------- */
  return (
    <>
    <TopOwnerMenu/>
    <div className={styles.ownerDashboardWrapper}>
      <div className={styles.blurOverlayOuter}>
        <header className={styles.dashboardHeaderPanel}>
          <h1 style={{ textAlign: 'center' }}>{MAIN_TITLE}</h1>
          <p className={styles.panelMetaSubtitle} style={{ textAlign: 'center' }}>
            Browse premium vacancies or track active leases and operational
            support statuses.
          </p>
        </header>

        <main className={styles.workspaceFlexGrid}>
          <div className={styles.ownerAccountWrapper}>
            <div className={styles.blurOverlay}>
              {/* Toast */}
              {toast && (
                <div
                  className={`${styles.toastBanner} ${
                    toast.type === 'success' ? styles.toastSuccess : styles.toastError
                  }`}
                >
                  {toast.text}
                </div>
              )}

              <header className={styles.accountHeader}>
                <h2 style={{ textAlign: 'center', color: 'rgb(230, 161, 14)' }}>
                  Owner Account View
                </h2>
              </header>

              {/* Loading */}
              {isLoading && (
                <div className={styles.emptyState}>Loading account data…</div>
              )}

              {/* Financial summary */}
              {!isLoading && (
                <div className={styles.financialSummary}>
                  <div className={styles.statCard}>
                    <h3>Total Houses Rented: {totalHouses}</h3>
                  </div>
                  <div className={styles.statCard}>
                    <h3>Total Monthly Rent: {fmtUSD(totalMonthlyPayment)}</h3>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && rentedHouses.length < 1 && (
                <div className={styles.emptyState}>
                  Not data found by this user
                </div>
              )}

              {/* Houses table */}
              {rentedHouses.length > 0 && (
                <div className={styles.tableViewport}>
                  <table className={styles.accountTable}>
                    <thead>
                      <tr>
                        <th>House Code</th>
                        <th>Rent Price</th>
                        <th>Days Left</th>
                        <th>Total/Month</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHouses.map((house: any) => (
                        <tr key={house._id ?? house.houseCode}>
                          <td>{house.houseCode}</td>
                          <td>{fmtUSD(house.RentPrice)}</td>
                          <td>{house.leftdays}</td>
                          <td>{fmtUSD(house.RentPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <hr />

                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={generateReport}
                  >
                    Generate Report (PDF)
                  </button>

                  {/* Pagination (only shown when needed) */}
                  {totalPages > 1 && (
                    <div className={styles.paginationRow}>
                      <button
                        type="button"
                        className={styles.btnPage}
                        disabled={currentPage === 1}
                        onClick={() => goToPage(currentPage - 1)}
                      >
                        ← Previous
                      </button>
                      <span className={styles.paginationStatus}>
                        Page <strong>{currentPage}</strong> of {totalPages}
                      </span>
                      <button
                        type="button"
                        className={styles.btnPage}
                        disabled={currentPage === totalPages}
                        onClick={() => goToPage(currentPage + 1)}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Maintenance requests table */}
              {rentedHouses.length > 0 && (
                <div className={styles.tableViewport}>
                  <h2 style={{ textAlign: 'center', color: 'rgb(230, 161, 14)' }}>
                    Maintenance Requests
                  </h2>
                  <br />
                  <br />
                  <table className={styles.accountTable}>
                    <thead>
                      <tr>
                        <th>House Code</th>
                        <th>Request Details</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHouses.map((house: any) => (
                        <tr key={`maint-${house._id ?? house.houseCode}`}>
                          <td>{house.houseCode}</td>
                          <td>{house.maintenaceRequest || 'None'}</td>
                          <td>
                            <span className={styles.statusBadge}>
                              {house.maintenaceRequestStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
    <Footer/>
  </>  
  );
}