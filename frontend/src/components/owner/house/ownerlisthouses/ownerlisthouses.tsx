'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

// ---- API slice (houseApi.ts) ----
import {
  useGetHousesByOwnerIdQuery,
  useDeleteImageMutation,
  useDeleteHouseMutation,
} from '@/store/api/houseApi';

import { environment } from '@/environments/environments';
import styles from './ownerlisthouses.module.css';
import TopOwnerMenu from "../../../layouts/topmenu/owner/TopOwnerMenu";
import Footer from "../../../layouts/footer/footer";

/* ============================================================
   Local config
   ============================================================ */
const BASE_URL = environment.endpointI;
const SECTION_TITLE = 'List Owner Houses';
const ITEMS_PER_PAGE = 6; // Balances grids in clean multiples of 3 across lines
const FALLBACK_IMG ='/images/owneredithouse/owneredithouse.avif';

/* ============================================================
   Type (mirrors Angular HouseDocument)
   ============================================================ */
interface HouseDocument {
  _id: string;
  houseCode: string;
  booked?: boolean;
  state?: string;
  city?: string;
  totalRooms?: number;
  image?: string;
  RentPrice?: number;
}

/* ============================================================
   Ownerlisthouses
   ============================================================ */
export default function Ownerlisthouses() {
  const router = useRouter();

  /* ---------- Owner identity from the store ---------- */
  const owner = useAppSelector((state) => state.user);
  const ownerId: string = owner?.id ?? '';

  /* ---------- RTK Query: owner's houses ---------- */
  const {
    data: allHousesRaw,
    isLoading,
    isError,
    error,
  } = useGetHousesByOwnerIdQuery(ownerId, { skip: !ownerId });

  // Normalize response — backend may return `{ houses: [] }` or a raw array
  const allHouses: HouseDocument[] = useMemo(() => {
    if (!allHousesRaw) return [];
    if (Array.isArray(allHousesRaw)) return allHousesRaw as HouseDocument[];
    const payload = (allHousesRaw as any)?.houses;
    return Array.isArray(payload) ? payload : [];
  }, [allHousesRaw]);

  /* ---------- Delete mutations ---------- */
  const [deleteImage] = useDeleteImageMutation();
  const [deleteHouse, { isLoading: isDeleting }] = useDeleteHouseMutation();

  /* ---------- Search + pagination state ---------- */
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(ITEMS_PER_PAGE);

  /* ---------- Reset page when search term changes ---------- */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  /* ---------- Local toast ---------- */
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
        'Failed to load houses.';
      setToast({ type: 'error', text: String(msg) });
    }
  }, [isError, error]);

  /* ---------- Derived: filtered list ---------- */
  const filteredHouses = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return allHouses;
    return allHouses.filter((h) =>
      (h.houseCode ?? '').toLowerCase().includes(q)
    );
  }, [allHouses, searchTerm]);

  /* ---------- Derived: paginated slice ---------- */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredHouses.length / itemsPerPage)
  );

  // Clamp currentPage if the list shrank (e.g., after a delete)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const displayedHouses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHouses.slice(start, start + itemsPerPage);
  }, [filteredHouses, currentPage, itemsPerPage]);

  /* ---------- Handlers ---------- */
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const onEditHouse = (houseId: string) => {
    router.push(`/owner/owneredithouse/${houseId}`);
  };

  const onDeleteHouse = async (house: HouseDocument) => {
    if (
      !window.confirm(
        'Are you certain you wish to delete this house entry from the database?'
      )
    ) {
      return;
    }

    try {
      // 1) Delete image (if any)
      if (house.image) {
        try {
          await deleteImage({ image: house.image }).unwrap();
        } catch (imgErr: any) {
          // Non-fatal — log and continue with document deletion
          console.warn('Image delete failed:', imgErr);
        }
      }

      // 2) Delete the house document
      await deleteHouse(house._id).unwrap();

      setToast({ type: 'success', text: 'House deleted successfully' });
      // RTK Query invalidatesTags auto-refetches the list.
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.data?.message ?? err?.error ?? 'Failed to delete house.',
      });
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
    <TopOwnerMenu/>
    <div className={styles.listHousesWrapper}>
        
      <div className={styles.backgroundBlurOverlay} />
      
       
      <main className={styles.workspaceContainer}>

        {/* Back to Owner Dashboard — styled like the "Edit House" button */}
  {/*<button
    type="button"
    className={`${styles.btnAction} ${styles.edit} ${styles.btnBack}`}
    onClick={() => router.push('/owner/ownerdashboard')}
    aria-label="Back to Owner Dashboard"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
    Back to Owner Dashboard
  </button>*/}

        {/* ---------- Header ---------- */}
        <header className={styles.headerBlock}>
          <h2>{SECTION_TITLE}</h2>
          <div className={styles.metaOwnerTag}>
            Current Workspace Identity: <span>{ownerId}</span>
          </div>
        </header>

        {/* ---------- Toast ---------- */}
        {toast && (
          <div
            className={`${styles.toastBanner} ${
              toast.type === 'success' ? styles.toastSuccess : styles.toastError
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* ---------- Loading ---------- */}
        {isLoading && (
          <div className={styles.loadingState}>
            <p>Querying Mongoose cluster and filtering target data documents...</p>
          </div>
        )}

        {/* ---------- Search bar ---------- */}
        {!isLoading && (
          <div className={styles.wrapper}>
            <div className={styles.searchGroup}>
              <input
                type="search"
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Code or Category"
              />
              <div className={`${styles.searchIconWrapper} ${styles.link}`}>
                <img
                  src="/images/icons/search.png"
                  alt="Search"
                  className={styles.searchIcon}
                />
              </div>
            </div>
          </div>
        )}
        <br />

        {/* ---------- Houses grid ---------- */}
        {!isLoading && (
          <div className={styles.tableScrollViewport}>
            <div className={styles.housesFlexGrid}>
              {displayedHouses.map((house) => {
                const imageSrc = house.image
                  ? BASE_URL + house.image
                  : FALLBACK_IMG;

                return (
                  <article key={house._id} className={styles.houseCard}>
                    <h6>House Code: {house.houseCode}</h6>

                    <div className={styles.cardThumbnail}>
                      <img
                        src={imageSrc}
                        alt="House Architectural Preview"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== FALLBACK_IMG) {
                            target.src = FALLBACK_IMG;
                          }
                        }}
                      />
                    </div>

                    <div className={styles.cardContent}>
                      <div className={styles.priceTag}>
                        ${house.RentPrice}
                        <span>/month</span>
                      </div>
                      <h3 className={styles.codeTitle}>{house.houseCode}</h3>

                      <div className={styles.locationInfo}>
                        <span>📍</span> {house.city}, {house.state}
                        <br />
                        <br />
                        <span
                          className={`${styles.statusBadge} ${
                            house.booked ? styles.booked : styles.vacant
                          }`}
                        >
                          house.booked: {house.booked ? 'Booked' : 'Vacant'}
                        </span>
                      </div>

                      <div className={styles.roomsCounter}>
                        Total Inside Rooms: <strong>{house.totalRooms}</strong>
                      </div>
                    </div>

                    <footer className={styles.cardActionsFooter}>
                      <button
                        type="button"
                        className={`${styles.btnAction} ${styles.edit}`}
                        onClick={() => onEditHouse(house._id)}
                      >
                        ✏️ Edit House
                      </button>
                      <button
                        type="button"
                        className={`${styles.btnAction} ${styles.delete}`}
                        onClick={() => onDeleteHouse(house)}
                        disabled={isDeleting}
                      >
                        🗑️ Delete
                      </button>
                    </footer>
                  </article>
                );
              })}

              {displayedHouses.length === 0 && !isLoading && (
                <div className={styles.emptyState}>
                  No active house elements detected inside the database for this
                  owner.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- Pagination ---------- */}
        {!isLoading && allHouses.length > 0 && (
          <nav
            className={styles.paginationContainer}
            aria-label="Houses pagination grid"
          >
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
          </nav>
        )}
      </main>
    </div>
    <Footer/>
    </>
  );
}