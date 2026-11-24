'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGetAllBookingsDocumentsQuery } from '@/store/api/bookingApi';
import { environment } from '@/environments/environments';
import styles from './adminlistbookings.module.css';
import TopAdminMenu from "../../layouts/topmenu/admin/TopAdminMenu";
import Footer from "../../layouts/footer/footer";

/* ============================================================
   Local config
   ============================================================ */
const BASE_URL = environment.endpointI;
const PLACEHOLDER = 'assets/fallback-house.jpg';
const ITEMS_PER_PAGE = 15;

/* ============================================================
   Adminlistbookings
   ============================================================ */
export default function Adminlistbookings() {
  /* ---------- RTK Query ---------- */
  const {
    data: bookingsRaw = [],
    isLoading,
    isError,
  } = useGetAllBookingsDocumentsQuery();

  const bookings: any[] = useMemo(() => {
    if (!Array.isArray(bookingsRaw)) return [];
    return bookingsRaw as any[];
  }, [bookingsRaw]);

  /* ---------- Search state ---------- */
  const [searchHouseCode, setSearchHouseCode] = useState<string>('');
  const [searchCity, setSearchCity] = useState<string>('');
  const [searchOwnerChecked, setSearchOwnerChecked] = useState<string>('all');
  const [searchApprovalStatus, setSearchApprovalStatus] = useState<string>('all');

  /* ---------- Pagination ---------- */
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(ITEMS_PER_PAGE);

  /* ---------- Reset page on any filter change ---------- */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchHouseCode, searchCity, searchOwnerChecked, searchApprovalStatus]);

  /* ---------- Derived: filtered bookings (fixes OR vs AND bug) ---------- */
  const filteredBookings = useMemo(() => {
    const codeQuery = searchHouseCode.toLowerCase().trim();
    const cityQuery = searchCity.toLowerCase().trim();
    const checkedQuery = searchOwnerChecked.toLowerCase().trim();
    const statusQuery = searchApprovalStatus.toLowerCase().trim();

    const hasCodeFilter = codeQuery !== '';
    const hasCityFilter = cityQuery !== '';
    const hasCheckedFilter = checkedQuery !== 'all';
    const hasStatusFilter = statusQuery !== 'all';

    return bookings.filter((booking) => {
      const houseCode = String(booking?.houseCode ?? '').toLowerCase();
      const city = String(booking?.city ?? '').toLowerCase();
      const ownerChecked = String(booking?.ownerChecked ?? '').toLowerCase();
      const approvalStatus = String(booking?.approvalStatus ?? '').toLowerCase();

      // AND semantics — every active filter must match
      const matchCode = !hasCodeFilter || houseCode.includes(codeQuery);
      const matchCity = !hasCityFilter || city.includes(cityQuery);
      const matchChecked = !hasCheckedFilter || ownerChecked === checkedQuery;
      const matchStatus = !hasStatusFilter || approvalStatus === statusQuery;

      return matchCode && matchCity && matchChecked && matchStatus;
    });
  }, [
    bookings,
    searchHouseCode,
    searchCity,
    searchOwnerChecked,
    searchApprovalStatus,
  ]);

  /* ---------- Pagination derived ---------- */
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  /* ---------- Handlers ---------- */
  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const deleteBooking = (houseCode: string) => {
    if (
      typeof window !== 'undefined' &&
      window.confirm(`Are you sure you want to delete booking for ${houseCode}?`)
    ) {
      // Mirrors the Angular behavior — local-only removal, no backend call.
      // If you need a real delete, add a mutation to bookingApi.ts.
      console.log('Booking delete requested for:', houseCode);
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
          <h1>List Bookings - Administrator</h1>
        </header>

        {/* Search panel */}
        <section className={styles.searchPanel}>
          <div className={styles.searchGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="searchHouseCode">House Code</label>
              <input
                id="searchHouseCode"
                type="text"
                value={searchHouseCode}
                onChange={(e) => setSearchHouseCode(e.target.value)}
                placeholder="Ex: H101"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="searchCity">City</label>
              <input
                id="searchCity"
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Ex: Los Angeles"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="searchOwnerChecked">Owner Checked</label>
              <select
                id="searchOwnerChecked"
                value={searchOwnerChecked}
                onChange={(e) => setSearchOwnerChecked(e.target.value)}
              >
                <option value="all">All</option>
                <option value="true">Checked</option>
                <option value="false">Unchecked</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="searchApprovalStatus">Approval Status</label>
              <select
                id="searchApprovalStatus"
                value={searchApprovalStatus}
                onChange={(e) => setSearchApprovalStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className={styles.tableScrollContainer}>
          {isLoading && (
            <p className={styles.noRecords}>Loading bookings…</p>
          )}
          {isError && (
            <p className={styles.noRecords} style={{ color: '#ef233c' }}>
              Failed to load bookings.
            </p>
          )}

          <div className={styles.bookingFlexGrid}>
            {!isLoading &&
              !isError &&
              paginatedBookings.map((item: any, idx: number) => {
                const imageSrc = item.image
                  ? BASE_URL + item.image
                  : PLACEHOLDER;

                return (
                  <div
                    key={item._id ?? `${item.houseCode ?? 'row'}-${idx}`}
                    className={styles.bookingCard}
                  >
                    <div className={styles.cardImgWrapper}>
                      <img
                        src={imageSrc}
                        alt="House Image"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.endsWith(PLACEHOLDER)) {
                            target.src = PLACEHOLDER;
                          }
                        }}
                      />
                      <span className={styles.priceTag}>
                        ${item.RentPrice} / mo
                      </span>
                    </div>

                    <div className={styles.cardContent}>
                      <div className={styles.cardHeaderRow}>
                        <h3>Code: {item.houseCode}</h3>
                        <span
                          className={`${styles.badge} ${
                            item.booked ? styles.booked : styles.available
                          }`}
                        >
                          {item.booked ? 'Booked' : 'Available'}
                        </span>
                      </div>

                      <p>
                        <strong>Location:</strong> {item.city}, {item.state}
                      </p>
                      <p>
                        <strong>Rooms:</strong> {item.totalRooms}
                      </p>
                      <p>
                        <strong>Owner Status:</strong>{' '}
                        {item.ownerChecked ? 'Verified' : 'Unverified'}
                      </p>

                      <div className={styles.statusFooter}>
                        <span
                          className={`${styles.approvalText} font-weight-bold`}
                          data-status={item.approvalStatus}
                        >
                          Status: {item.approvalStatus}
                        </span>
                        <button
                          type="button"
                          className={styles.btnDelete}
                          onClick={() => deleteBooking(item.houseCode ?? '')}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {!isLoading && !isError && paginatedBookings.length === 0 && (
              <div className={styles.noRecords}>
                <p>No bookings found matching criteria.</p>
              </div>
            )}
          </div>
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