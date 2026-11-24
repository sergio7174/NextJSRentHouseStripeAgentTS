// nexthouserenting/src/components/admin/mainpageadmin/recently-added-bookings.tsx
// nexthouserenting/src/components/admin/mainpageadmin/recently-added-bookings.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGetLatestBookedQuery } from '@/store/api/dashboardApi';
import { environment } from '@/environments/environments';
import styles from './recently-added-bookings.module.css';

/* ============================================================
   Local config
   ============================================================ */
const BASE_URL = (environment.endpointI || 'http://localhost:3001').replace(
  /\/+$/,
  ''
);
const PLACEHOLDER = '/assets/images/house-placeholder.jpg';
const ITEMS_PER_PAGE = 9; // 3 items/line * 3 rows = 9 items max per page view

function resolveBookingImageSrc(item: any): string {
  const candidates: unknown[] = [
    item?.image,
    item?.images,
    item?.houseId?.image,
    item?.houseId?.images,
    item?.house?.image,
    item?.house?.images,
  ];

  let raw = '';
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      raw = candidate.trim();
      break;
    }
    if (Array.isArray(candidate)) {
      const firstString = candidate.find(
        (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0
      );
      if (firstString) {
        raw = firstString.trim();
        break;
      }
    }
  }

  if (!raw) return PLACEHOLDER;
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }

  const normalizedPath = raw
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^uploads\//i, '');

  return `${BASE_URL}/uploads/${normalizedPath}`;
}

/* ============================================================
   RecentlyAddedBookings
   Left panel — most recently created bookings for the admin
   dashboard, with pagination.
   ============================================================ */
export default function RecentlyAddedBookings() {
  /* ---------- RTK Query: latest booked houses ---------- */
  const {
    data: bookedHousesRaw = [],
    isLoading,
    isError,
  } = useGetLatestBookedQuery();

  const bookedHouses: any[] = useMemo(() => {
    if (!Array.isArray(bookedHousesRaw)) return [];
    return bookedHousesRaw as any[];
  }, [bookedHousesRaw]);

  /* ---------- Pagination ---------- */
  const [housePage, setHousePage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(ITEMS_PER_PAGE);

  const totalHousePages = Math.max(
    1,
    Math.ceil(bookedHouses.length / itemsPerPage)
  );

  const paginatedHouses = useMemo(() => {
    const start = (housePage - 1) * itemsPerPage;
    return bookedHouses.slice(start, start + itemsPerPage);
  }, [bookedHouses, housePage, itemsPerPage]);

  useEffect(() => {
    if (housePage > totalHousePages) setHousePage(totalHousePages);
  }, [housePage, totalHousePages]);

  const changeHousePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalHousePages) {
      setHousePage(newPage);
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className={`${styles.splitColumn} ${styles.housesColumn}`}>
      <div className={styles.columnHeaderSticky}>
        <h2 className={styles.columnTitle}>
          <i className="bi bi-building-add me-2" />
          Recently Added Bookings
        </h2>
      </div>

      <div className={`${styles.scrollContainerVertical} ${styles.housesScrollBox}`}>
        {isLoading && (
          <p style={{ color: '#94a3b8', padding: '20px 0' }}>
            Loading latest bookings…
          </p>
        )}

        {isError && (
          <p style={{ color: '#f87171', padding: '20px 0' }}>
            Failed to load bookings.
          </p>
        )}

        {!isLoading && !isError && paginatedHouses.length === 0 && (
          <p style={{ color: '#94a3b8', padding: '20px 0' }}>
            No bookings yet.
          </p>
        )}

        {paginatedHouses.length > 0 && (
          <div className={styles.housesFlexGrid}>
            {paginatedHouses.map((house: any) => {
              const imageSrc = resolveBookingImageSrc(house);

              return (
                <div
                  key={house._id ?? house.houseCode}
                  className={`${styles.housePremiumCard} ${styles.animateFadeIn}`}
                >
                  <div className={styles.houseImgContainer}>
                    <img
                      src={imageSrc}
                      alt={`House Code ${house.houseCode}`}
                      className={styles.houseImg}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.currentSrc.endsWith(PLACEHOLDER)) {
                          target.src = PLACEHOLDER;
                        }
                      }}
                    />
                    <span
                      className={`${styles.badgeBookingStatus} ${
                        house.bookedAt ? styles.statusBooked : styles.statusAvailable
                      }`}
                    >
                      {house.bookedAt ? 'Booked' : 'Available'}
                    </span>
                  </div>

                  <div className={styles.houseCardBody}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className={`${styles.houseCode} font-monospace`}>
                        {house.houseCode}
                      </span>
                      <span className={styles.housePrice}>
                        ${house.RentPrice}/mo
                      </span>
                    </div>
                    <p className={`${styles.houseLocation} mb-0 text-muted`}>
                      <i className="bi bi-geo-alt-fill text-danger me-1" />
                      {house.city}, {house.state}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className={`${styles.customPagination} mt-3`}>
        <button
          type="button"
          className={styles.btnPag}
          disabled={housePage === 1}
          onClick={() => changeHousePage(housePage - 1)}
        >
          <i className="bi bi-chevron-left" /> Previous
        </button>
        <span className={styles.pagText}>
          Page {housePage} of {totalHousePages}
        </span>
        <button
          type="button"
          className={styles.btnPag}
          disabled={housePage === totalHousePages}
          onClick={() => changeHousePage(housePage + 1)}
        >
          Next <i className="bi bi-chevron-right" />
        </button>
      </div>
    </div>
  );
}