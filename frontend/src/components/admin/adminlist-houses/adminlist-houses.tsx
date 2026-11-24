'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useGetAllHousesQuery,
  useDeleteHouseMutation,
} from '@/store/api/houseApi';
import { environment } from '@/environments/environments';
import styles from './adminlist-houses.module.css';
import TopAdminMenu from "../../layouts/topmenu/admin/TopAdminMenu";
import Footer from "../../layouts/footer/footer";


/* ============================================================
   Local config
   ============================================================ */
const BASE_URL = environment.endpointI;
const PLACEHOLDER = 'assets/fallback-house.jpg';
const ITEMS_PER_PAGE = 15;

/* ============================================================
   AdminlistHouses
   ============================================================ */
export default function AdminlistHouses() {
  /* ---------- RTK Query ---------- */
  const {
    data: housesRaw = [],
    isLoading,
    isError,
    refetch,
  } = useGetAllHousesQuery();

  const [deleteHouseMutation] = useDeleteHouseMutation();

  const houses: any[] = useMemo(() => {
    if (!Array.isArray(housesRaw)) return [];
    return housesRaw as any[];
  }, [housesRaw]);

  /* ---------- Search state ---------- */
  const [searchHouseCode, setSearchHouseCode] = useState<string>('');
  const [searchCity, setSearchCity] = useState<string>('');

  /* ---------- Pagination ---------- */
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(ITEMS_PER_PAGE);

  /* ---------- Reset page on filter change ---------- */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchHouseCode, searchCity]);

  /* ---------- Derived: filteredHouses (AND semantics, fixes Angular OR bug) ---------- */
  const filteredHouses = useMemo(() => {
    const codeQuery = searchHouseCode.toLowerCase().trim();
    const cityQuery = searchCity.toLowerCase().trim();

    const hasCodeFilter = codeQuery !== '';
    const hasCityFilter = cityQuery !== '';

    return houses.filter((house) => {
      const houseCode = String(house?.houseCode ?? '').toLowerCase();
      const city = String(house?.city ?? '').toLowerCase();

      const matchCode = !hasCodeFilter || houseCode.includes(codeQuery);
      const matchCity = !hasCityFilter || city.includes(cityQuery);

      return matchCode && matchCity;
    });
  }, [houses, searchHouseCode, searchCity]);

  /* ---------- Derived: pagination ---------- */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredHouses.length / itemsPerPage)
  );

  const paginatedHouses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHouses.slice(start, start + itemsPerPage);
  }, [filteredHouses, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  /* ---------- Handlers ---------- */
  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const deleteHouse = async (houseId: string, houseCode: string) => {
    if (
      typeof window === 'undefined' ||
      !window.confirm(
        `Are you sure you want to permanently delete house document ${houseCode} from MongoDB?`
      )
    ) {
      return;
    }

    try {
      await deleteHouseMutation(houseId).unwrap();
      // `invalidatesTags` on deleteHouse auto-refetches the list.
      if (paginatedHouses.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch {
      // Rollback: refetch authoritative data
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
          <div>
            <h2>List Houses - Administrator</h2>
          </div>
        </header>

        {/* Search panel */}
        <section className={styles.searchPanel}>
          <div className={styles.searchGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="searchHouseCode">Search by House Code</label>
              <input
                id="searchHouseCode"
                type="text"
                value={searchHouseCode}
                onChange={(e) => setSearchHouseCode(e.target.value)}
                placeholder="Ex: H101"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="searchCity">Search by City</label>
              <input
                id="searchCity"
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Ex: Los Angeles"
              />
            </div>
          </div>
        </section>

        {/* Table */}
        <section className={styles.tableScrollContainer}>
          <table
            className={styles.modernFlexTable}
            style={{ width: '100%', marginLeft: '2em' }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    paddingRight: '6em',
                    textAlign: 'center',
                    width: '10em',
                  }}
                >
                  Image
                </th>
                <th>House Code</th>
                <th>Status</th>
                <th>State</th>
                <th>City</th>
                <th>Total Rooms</th>
                <th>Rent Price</th>
                <th className={styles.actionsHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className={styles.noRecords}>
                    Loading houses…
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td
                    colSpan={8}
                    className={styles.noRecords}
                    style={{ color: '#ef4444' }}
                  >
                    Failed to load houses from database.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                paginatedHouses.map((house: any) => {
                  const imageSrc = house.image
                    ? BASE_URL + house.image
                    : PLACEHOLDER;

                  return (
                    <tr key={house._id ?? house.houseCode}>
                      <td data-label="Image">
                        <div className={styles.cardImgWrapper}>
                          <img
                            src={imageSrc}
                            alt="House preview"
                            width={100}
                            height={100}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.endsWith(PLACEHOLDER)) {
                                target.src = PLACEHOLDER;
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td data-label="House Code" className="font-weight-bold">
                        {house.houseCode}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`${styles.badge} ${
                            house.booked ? styles.booked : styles.available
                          }`}
                        >
                          {house.booked ? 'Booked' : 'Available'}
                        </span>
                      </td>
                      <td data-label="State">{house.state}</td>
                      <td data-label="City">{house.city}</td>
                      <td data-label="Total Rooms">{house.totalRooms}</td>
                      <td data-label="Rent Price" className={styles.priceCell}>
                        ${house.RentPrice} / mo
                      </td>
                      <td data-label="Actions" className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.btnDelete}
                          onClick={() =>
                            deleteHouse(house._id, house.houseCode)
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
                paginatedHouses.length === 0 && (
                  <tr>
                    <td colSpan={8} className={styles.noRecords}>
                      No house documents found matching your search criteria.
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