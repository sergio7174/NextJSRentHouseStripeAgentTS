// nexthouserenting/src/components/owner/ownermainpage/ownermainpagesecleft.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useAppSelector } from '@/store/hooks';

// ---- QUERY from the house API slice ----
import { useGetHousesByOwnerBfalseQuery } from '@/store/api/houseApi';

import styles from './ownermainpagesecleft.module.css';
import { environment } from '@/environments/environments';

/* ============================================================
   Local UI config (was: class properties in Angular)
   ============================================================ */
const CATALOG_TITLE = 'List Houses for renting';
const BASE_URL = (environment.endpointI || 'http://localhost:3001').replace(
  /\/+$/,
  ''
);
const DEFAULT_HOUSE_IMAGE = '/images/mainownerpage/background.jpg';
const ITEMS_PER_PAGE = 10;

function resolveHouseImage(house: any): string {
  const candidates: unknown[] = [
    house?.image,
    house?.images,
    house?.houseImage,
    house?.houseImages,
    house?.photos,
    house?.photo,
  ];

  let raw = '';
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      raw = candidate.trim();
      break;
    }
    if (Array.isArray(candidate)) {
      const firstValid = candidate.find(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0
      );
      if (firstValid) {
        raw = firstValid.trim();
        break;
      }
      const firstObj = candidate.find(
        (entry) =>
          entry &&
          typeof entry === 'object' &&
          typeof (entry as any).url === 'string'
      );
      if (firstObj) {
        raw = String((firstObj as any).url).trim();
        break;
      }
    }
    if (candidate && typeof candidate === 'object') {
      const obj = candidate as Record<string, unknown>;
      if (typeof obj.url === 'string' && obj.url.trim()) {
        raw = obj.url.trim();
        break;
      }
      if (typeof obj.path === 'string' && obj.path.trim()) {
        raw = obj.path.trim();
        break;
      }
    }
  }

  if (!raw) return DEFAULT_HOUSE_IMAGE;
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }

  const normalized = raw.replace(/\\/g, '/').replace(/^\/+/, '');
  //alert("Im at ownermainpagesecleft - line 80 - `${BASE_URL}/${normalized}`: "+`${BASE_URL}/${normalized}`)
  return `${BASE_URL}/${normalized}`;
}

function HouseCardImage({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const [imgSrc, setImgSrc] = useState<string>(src);
  //alert("Im at ownermainpagesecleft - line 94 - src: "+ src)

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    
    <Image
      src={imgSrc}
      alt={alt}
      fill
      unoptimized
      loading={priority ? 'eager' : 'lazy'}
      sizes="(max-width: 768px) 100vw, 33vw"
      style={{ objectFit: 'cover' }}
      onError={() => {
        if (imgSrc !== DEFAULT_HOUSE_IMAGE) {
          setImgSrc(DEFAULT_HOUSE_IMAGE);
        }
      }}
    />
  );
}

/* ============================================================
   Ownermainpagesecleft
   Left panel — catalog of owner's *available* (booked === false) houses.
   - Owner identity  : useAppSelector(state => state.user)
   - Data            : useGetHousesByOwnerBfalseQuery(ownerId)   [houseApi]
   ============================================================ */
export default function Ownermainpagesecleft() {
  /* ---------- Owner identity from the store ---------- */
  const owner: any = useAppSelector((state) => state.user);
  const ownerId: string = owner?.id ?? '';

  /* ---------- RTK Query: available houses (booked === false) ---------- */
  const {
    data: availableHouses = [],
    isLoading,
    isError,
  } = useGetHousesByOwnerBfalseQuery(ownerId, { skip: !ownerId });

  /* ---------- Search state (was: class properties) ---------- */
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [minRooms, setMinRooms] = useState<number>(0);

  /* ---------- Pagination ---------- */
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(ITEMS_PER_PAGE);

  /* ---------- Reset to page 1 whenever filters change ---------- */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, maxPrice, minRooms]);

  /* ---------- Derived: filteredHouses (was: get filteredHouses) ---------- */
  const filteredHouses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return availableHouses.filter((house: any) => {
      const matchesCity = (house.city ?? '').toLowerCase().includes(q);
      const matchesPrice = house.RentPrice <= maxPrice;
      const matchesRooms = house.totalRooms >= minRooms;
      return matchesCity && matchesPrice && matchesRooms;
    });
  }, [availableHouses, searchQuery, maxPrice, minRooms]);

  /* ---------- Derived: paginatedAvailableHouses ---------- */
  const paginatedAvailableHouses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHouses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHouses, currentPage, itemsPerPage]);

  /* ---------- Derived: totalPages (from filtered set, not raw set) ---------- */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredHouses.length / itemsPerPage)
  );

  /* ---------- Handlers ---------- */
  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  /* ---------- Render ---------- */
  return (
    <section className={`${styles.flexColumnContainer} ${styles.catalogCardPanel}`}>
      {/* Search toolbar */}
      <div className={styles.searchToolbar}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="City..."
          className={styles.searchInput}
        />
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          placeholder="Max Price"
          className={styles.searchInput}
        />
        <input
          type="number"
          value={minRooms}
          onChange={(e) => setMinRooms(Number(e.target.value))}
          placeholder="Min Rooms"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.containerTitleBar}>
        <h2 style={{ textAlign: 'center' }}>{CATALOG_TITLE}</h2>
      </div>

      <div className={styles.scrollableCardsViewport}>
        {/* Loading state */}
        {isLoading && (
          <div className={styles.emptyStateFallback}>
            <p>Loading available houses…</p>
          </div>
        )}

        {/* Empty / error state — mirrors original `isEmptyState === false` intent */}
        {!isLoading && (isError || availableHouses.length === 0) && (
          <div className={styles.emptyStateFallback}>
            <p>No active Available Houses under your account parameters yet.</p>
          </div>
        )}

        {/* Cards grid */}
        {availableHouses.length > 0 && (
          <div className={styles.cardsResponsiveGrid}>
            {paginatedAvailableHouses.map((house: any, index: number) => {
              const imageSrc = resolveHouseImage(house);

              return (
                <article
                  key={house._id}
                  className={styles.propertyItemCard}
                >
                  <div
                    className={styles.cardImageWrapper}
                    style={{ position: 'relative', minHeight: '180px' }}
                  >
                    <HouseCardImage
                      src={imageSrc}
                      alt={`House ${house.houseCode ?? ''} listing preview`}
                      priority={index < 4}
                    />
                    <span className={`${styles.badgeStatus} ${styles.statusVacant}`}>
                      Available
                    </span>
                  </div>

                  <div className={styles.cardBodyContent}>
                    <div className={styles.cardRowHeader}>
                      <h3 className={styles.houseIdentityCode}>{house.houseCode}</h3>
                      <span className={styles.rentPriceTag}>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(house.RentPrice)}
                        /mo
                      </span>
                    </div>

                    <p className={styles.locationGeography}>
                      {house.city}, {house.state}
                    </p>

                    <div className={styles.structuralAmenities}>
                      <span>
                        🏠 Total Rooms: <strong>{house.totalRooms}</strong>
                      </span>
                    </div>

                    <div className={styles.cardActionFooter}>
                      {/* "Rent a House" button was commented out in the Angular template — preserved as no-op. */}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <footer className={styles.paginationFooterWrapper}>
          <button
            className={styles.btnNavPage}
            disabled={currentPage === 1}
            onClick={() => changePage(currentPage - 1)}
          >
            Previous
          </button>
          <span className={styles.pageIndicatorCounter}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.btnNavPage}
            disabled={currentPage === totalPages}
            onClick={() => changePage(currentPage + 1)}
          >
            Next
          </button>
        </footer>
      )}
    </section>
  );
}