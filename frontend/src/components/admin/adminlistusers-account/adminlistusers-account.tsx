'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useGetAllBookingsDocumentsQuery } from '@/store/api/bookingApi';
import { environment } from '@/environments/environments';
import styles from './adminlistusers-account.module.css';
import TopAdminMenu from "../../layouts/topmenu/admin/TopAdminMenu";
import Footer from "../../layouts/footer/footer";

/* ============================================================
   Types
   ============================================================ */
interface UserAccountSummary {
  userId: string;
  fullName: string;
  email: string;
  role: 'Tenant' | 'Owner';
  houseCode: string;
  userImage: string;
  rentPrice: number;
  totalPropertiesCount: number;
  totalAccountAmount: number;
  rawBookingId: string;
}

/* ============================================================
   Local config
   ============================================================ */
const BASE_URL = environment.endpointI;
const FALLBACK_AVATAR = 'assets/fallback-avatar.png';
const ITEMS_PER_PAGE = 10;

/* ============================================================
   AdminlistusersAccount
   ============================================================ */
export default function AdminlistusersAccount() {
  /* ---------- RTK Query ---------- */
  const { data: bookingsRawData = [], isLoading, isError } =
    useGetAllBookingsDocumentsQuery();

  const bookingsRaw: any[] = useMemo(() => {
    if (!Array.isArray(bookingsRawData)) return [];
    return bookingsRawData as any[];
  }, [bookingsRawData]);

  /* ---------- Search + pagination state ---------- */
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole]);

  /* ---------- Derived: aggregate bookings → per-user accounts ---------- */
  const aggregatedUserAccounts = useMemo<UserAccountSummary[]>(() => {
    const summaryByUser = new Map<string, UserAccountSummary>();

    bookingsRaw.forEach((booking) => {
      // --- Tenant side ---
      if (booking?.tenantId) {
        const userId = booking.tenantId?._id || booking.tenantId;
        const key = `${userId}|Tenant`;
        const rentPrice = Number(booking?.RentPrice || 0);

        const existing = summaryByUser.get(key);
        if (!existing) {
          summaryByUser.set(key, {
            userId,
            fullName: booking.tenantfullname || 'Active Tenant',
            email: booking.tenantemail || 'tenant@rentcontrol.com',
            role: 'Tenant',
            houseCode: booking?.houseCode || 'N/A',
            userImage: booking.tenantId?.image || booking?.image || '',
            rentPrice,
            totalPropertiesCount: 1,
            totalAccountAmount: rentPrice,
            rawBookingId: booking._id,
          });
        } else {
          existing.totalPropertiesCount += 1;
          existing.totalAccountAmount += rentPrice;
          existing.rentPrice = rentPrice;
        }
      }

      // --- Owner side ---
      if (booking?.ownerId) {
        const userId = booking.ownerId?._id || booking.ownerId;
        const key = `${userId}|Owner`;
        const rentPrice = Number(booking?.RentPrice || 0);

        const existing = summaryByUser.get(key);
        if (!existing) {
          summaryByUser.set(key, {
            userId,
            fullName: booking.ownerfullname || 'Property Owner',
            email: booking.owneremail || 'owner@rentcontrol.com',
            role: 'Owner',
            houseCode: booking?.houseCode || 'N/A',
            userImage: booking.ownerId?.image || booking?.image || '',
            rentPrice,
            totalPropertiesCount: 1,
            totalAccountAmount: rentPrice,
            rawBookingId: booking._id,
          });
        } else {
          existing.totalPropertiesCount += 1;
          existing.totalAccountAmount += rentPrice;
          existing.rentPrice = rentPrice;
        }
      }
    });

    return Array.from(summaryByUser.values());
  }, [bookingsRaw]);

  /* ---------- Derived: filtered ---------- */
  const filteredUserAccounts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return aggregatedUserAccounts.filter((acc) => {
      const matchQuery =
        acc.fullName.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.houseCode.toLowerCase().includes(q);
      const matchRole =
        filterRole === 'all' ||
        acc.role.toLowerCase() === filterRole.toLowerCase();
      return matchQuery && matchRole;
    });
  }, [aggregatedUserAccounts, searchQuery, filterRole]);

  /* ---------- Derived: pagination ---------- */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUserAccounts.length / itemsPerPage)
  );

  const paginatedUserAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUserAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUserAccounts, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  /* ---------- Handlers ---------- */
  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const fmtUSD2 = (n: number) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n || 0);

  /* ---------- Render ---------- */
  return (
    <>
    <TopAdminMenu/>
    <div className={styles.adminDashboardWrapper}>
      <div className={styles.overlay} />

      <div className={styles.mainContainer}>
        <header className={styles.dashboardHeader}>
          <h1>List Admin Users Account</h1>
        </header>

        {/* Search panel */}
        <section className={styles.searchPanel}>
          <div className={styles.searchGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="searchQuery">Global Live Search</label>
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or house code..."
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="filterRole">Account Role Filter</label>
              <select
                id="filterRole"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Account Roles</option>
                <option value="owner">Owners (Leasing Agents)</option>
                <option value="tenant">Tenants (Occupants)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className={styles.tableScrollContainer}>
          <table className={styles.modernFlexTable}>
            <thead>
              <tr>
                <th>House Image</th>
                <th>Full Name</th>
                <th>Email Coordinates</th>
                <th>Account Status Type</th>
                <th>Assigned House Code</th>
                <th>Monthly Rent Price</th>
                <th>Volume Leased/Booked</th>
                <th>Total Balance Gross</th>
                <th>System Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className={styles.noRecords}>
                    Aggregating user account matrices…
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td
                    colSpan={9}
                    className={styles.noRecords}
                    style={{ color: '#ef4444' }}
                  >
                    Failed to aggregate structural financial records from the database.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                paginatedUserAccounts.map((acc, idx) => {
                  const imageSrc = acc.userImage
                    ? BASE_URL + acc.userImage
                    : FALLBACK_AVATAR;

                  return (
                    <tr key={`${acc.userId}-${acc.role}-${idx}`}>
                      <td data-label="User Image">
                        <div className={styles.cellAvatarWrapper}>
                          <img
                            src={imageSrc}
                            alt="User Profile"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.endsWith(FALLBACK_AVATAR)) {
                                target.src = FALLBACK_AVATAR;
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td data-label="Full Name" className={styles.boldTextCell}>
                        {acc.fullName}
                      </td>
                      <td data-label="Email Coordinates">{acc.email}</td>
                      <td data-label="Account Status Type">
                        <span
                          className={`${styles.roleBadge} ${
                            acc.role.toLowerCase() === 'owner'
                              ? styles.owner
                              : styles.tenant
                          }`}
                        >
                          {acc.role}
                        </span>
                      </td>
                      <td
                        data-label="Assigned House Code"
                        className={styles.highlightCodeCell}
                      >
                        {acc.houseCode}
                      </td>
                      <td
                        data-label="Monthly Rent Price"
                        className={styles.numericCell}
                      >
                        ${fmtUSD2(acc.rentPrice)}
                      </td>
                      <td
                        data-label="Volume Leased/Booked"
                        className={styles.boldTextCell}
                      >
                        {acc.totalPropertiesCount} Properties
                      </td>
                      <td
                        data-label="Total Balance Gross"
                        className={`${styles.numericCell} ${styles.totalAmountHighlight}`}
                      >
                        ${fmtUSD2(acc.totalAccountAmount)}
                      </td>
                      <td data-label="System Actions">
                        <div className={styles.actionBtnGroup}>
                          <Link
                            href={`/admin/owneredithouse/${acc.houseCode}`}
                            className={`${styles.btnAction} ${styles.btnEdit}`}
                          >
                            Edit
                          </Link>
                          {/* Delete button — commented out in Angular source.
                              Uncomment when a backend delete endpoint is available:
                          <button
                            type="button"
                            className={`${styles.btnAction} ${styles.btnDelete}`}
                            onClick={() => deleteUserAccountRecord(acc.rawBookingId)}
                          >
                            Delete
                          </button>
                          */}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!isLoading &&
                !isError &&
                paginatedUserAccounts.length === 0 && (
                  <tr>
                    <td colSpan={9} className={styles.noRecords}>
                      No compiled financial user account matrices found matching specifications.
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