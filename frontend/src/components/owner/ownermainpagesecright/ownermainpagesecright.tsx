'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';

// ---- QUERIES / MUTATIONS from the API slice (bookingApi.ts) ----
import {
  useGetRentedHousesByOwnerIdQuery,
  useChangeHouseCheckedStatusMutation,
  usePutchangeMaintReqStatusMutation,
} from '@/store/api/bookingApi';

import styles from './ownermainpagesecright.module.css';
import { environment } from '@/environments/environments';


/* ============================================================
   Local config (was: class properties + environment.endpointI)
   ============================================================ */
const BASE_URL = environment.endpointI;
const DEFAULT_HOUSE_IMAGE = '/images/mainownerpage/background.jpg';
const ITEMS_PER_PAGE = 10;
const RENTED_TITLE = 'List of rented houses';

/* ============================================================
   Ownermainpagesecright
   Right panel — list of houses booked/approved for this owner,
   with "Change Status" and maintenance-request status controls.
   ============================================================ */
export default function Ownermainpagesecright() {
  /* ---------- Owner identity from the store ---------- */
  const tenant = useAppSelector((state) => state.user);
  const ownerId: string = tenant?.id ?? '';

  /* ---------- RTK Query: rented houses for this owner ---------- */
  const {
    data: bookedtruehouses = [],
    isLoading,
    isError,
    error,
  } = useGetRentedHousesByOwnerIdQuery(ownerId, { skip: !ownerId });

  /* ---------- Mutations ---------- */
  const [changeHouseCheckedStatus, { isLoading: isChangingStatus }] =
    useChangeHouseCheckedStatusMutation();
  const [changeMaintReqStatusMutation] = usePutchangeMaintReqStatusMutation();

  /* ---------- Search / pagination state ---------- */
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(ITEMS_PER_PAGE);

  /* ---------- Local toast (was ToastrService) ---------- */
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- Reset page on filter change ---------- */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, maxPrice]);

  /* ---------- Surface query errors ---------- */
  useEffect(() => {
    if (isError && error) {
      const msg =
        (error as any)?.data?.message ??
        (error as any)?.error ??
        'Failed to load rented houses';
      setToast({ type: 'error', text: String(msg) });
    }
  }, [isError, error]);

  /* ---------- Derived: filteredHouses ---------- */
  const filteredHouses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return bookedtruehouses.filter((house: any) => {
      const matchesCity = (house.city ?? '').toLowerCase().includes(q);
      const matchesPrice = house.RentPrice <= maxPrice;
      return matchesCity && matchesPrice;
    });
  }, [bookedtruehouses, searchQuery, maxPrice]);

  /* ---------- Derived: paginatedRentedHousesByOwnerId ---------- */
  const paginatedRentedHousesByOwnerId = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHouses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHouses, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredHouses.length / itemsPerPage));

  /* ---------- Handlers ---------- */
  const handleChangeHouseCheckedStatus = async (
    houseId: string,
    rentPrice: number
  ) => {
    try {
      await changeHouseCheckedStatus({
        houseId,
        OwnerChecked: true,
        approvalStatus: 'Approved',
        RentPrice: rentPrice,
      }).unwrap();

      setToast({ type: 'success', text: 'House status updated' });
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.data?.message ?? err?.error ?? 'Failed to change status',
      });
    }
  };

  const handleChangeMaintReqStatus = async (
    houseId: string,
    status: string
  ) => {
    try {
      // Original Angular stub built houseData and returned — no backend call.
      // We now route it through the real mutation.
      await changeMaintReqStatusMutation({
        houseId,
        approvalStatus: status,
      }).unwrap();

      setToast({ type: 'success', text: `Maintenance status → ${status}` });
    } catch (err: any) {
      setToast({
        type: 'error',
        text:
          err?.data?.message ??
          err?.error ??
          'Failed to update maintenance status',
      });
    }
  };

/****** block to handle images ********** */

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
  return `${BASE_URL.replace(/\/+$/, '')}/${normalized}`;
}


/******** end of block to handle images ***/


  /* ---------- Render ---------- */
  return (
    <section className={`${styles.flexColumnContainer} ${styles.rentedCardPanel}`}>
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

      {/* Search toolbar */}
      <div className={styles.searchToolbar}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="City..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.containerTitleBar}>
        <h2 style={{ textAlign: 'center' }}>{RENTED_TITLE}</h2>
      </div>

      <div className={styles.scrollableCardsViewport}>
        {/* Loading state */}
        {isLoading && (
          <div className={styles.emptyStateFallback}>
            <p>Loading rented houses…</p>
          </div>
        )}

        {/* Empty / error state — mirrors `isEmptyState === false` intent */}
        {!isLoading && (isError || bookedtruehouses.length === 0) && (
          <div className={styles.emptyStateFallback}>
            <p>No active rental contracts signed under your account parameters yet.</p>
          </div>
        )}
         
        {/* Cards — mirrors *ngIf="bookedtruehouses.length > 0" */}
        {bookedtruehouses.length > 0 && (
          <div className={`${styles.cardsResponsiveGrid} ${styles.singlesColumn}`}>
            {paginatedRentedHousesByOwnerId.map((asset: any) => {
              const imageSrc = resolveHouseImage(asset);
              const isApproved = asset.approvalStatus === 'Approved';
              const isNotApproved = asset.approvalStatus !== 'Approved';

              return (
                
                <article
                  key={asset._id}
                  className={`${styles.propertyItemCard} ${styles.leaseActive}`}
                >
                  <div className={styles.cardImageWrapper}>
                    <img src={imageSrc} alt="Leased House Element Snapshot" />
                    {isApproved && (
                      <span className={`${styles.badgeStatus} ${styles.statusBooked}`}>
                        Rented
                      </span>
                    )}
                    {asset.approvalStatus === 'notApplied' && (
                      <span className={`${styles.badgeStatus} ${styles.statusBooked}`}>
                        Not Applied
                      </span>
                    )}
                  </div>

                  <div className={styles.cardBodyContent}>
                    <div className={styles.cardRowHeader}>
                      <h3 className={styles.houseIdentityCode}>
                        House Code: {asset.houseCode}
                      </h3>
                    </div>

                    <span className={`${styles.rentPriceTag} ${styles.paymentHighlight}`}>
                      House Rent price:{' '}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(asset.RentPrice)}
                    </span>

                    <p className={styles.locationGeography}>
                      {asset.city}, {asset.state}
                    </p>

                    {/* OwnerChecked + Change Status — only when NOT approved */}
                    {isNotApproved && (
                      <div className={styles.movetoleftdirection}>
                        <div className={styles.structuralAmenities}>
                          <span>OwnerChecked: {String(asset.ownerChecked)}</span>
                        </div>
                        <div>
                          <button
                            type="button"
                            className={`${styles.btnGeneral} ${styles.btnMaintenance}`}
                            onClick={() =>
                              handleChangeHouseCheckedStatus(
                                asset._id,
                                asset.RentPrice
                              )
                            }
                            disabled={isChangingStatus}
                          >
                            ⚙ Change Status
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Maintenance request block */}
                    {asset.maintenaceRequest ? (
                      <div className={styles.cardActionFooter}>
                        <h6 className={styles.locationGeography}>
                          Maintenance Request: {asset.maintenaceRequest}
                        </h6>
                        <div>
                          <h6
                            style={{
                              color: 'white',
                              marginBottom: '4em',
                            }}
                          >
                            Change Maintenance Request Status for:{' '}
                          </h6>
                        </div>
                        <div
                          className={styles.sectionButtonsChangeMaintReqStatus}
                        >
                          <button
                            type="button"
                            className={styles.btnMantRequest}
                            onClick={() =>
                              handleChangeMaintReqStatus(asset._id, 'In Progress')
                            }
                          >
                            ⚙ 'In Progress'
                          </button>
                          <button
                            type="button"
                            className={styles.btnMantRequest}
                            onClick={() =>
                              handleChangeMaintReqStatus(asset._id, 'Resolved')
                            }
                          >
                            ⚙ 'Resolved'
                          </button>
                          <button
                            type="button"
                            className={styles.btnMantRequest}
                            onClick={() =>
                              handleChangeMaintReqStatus(asset._id, 'Rejected')
                            }
                          >
                            ⚙ 'Rejected'
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={styles.locationGeography}>
                        No maintenance request submitted.
                      </p>
                    )}

                    {/* Conditional metadata blocks */}
                    {asset.leftdays != null && asset.leftdays !== '' && (
                      <div className={styles.cardActionFooter}>
                        <h6 className={styles.locationGeography}>
                          Left Days: {asset.leftdays}
                        </h6>
                      </div>
                    )}

                    {asset.initialAmountToPay != null &&
                      asset.initialAmountToPay !== '' && (
                        <div className={styles.cardActionFooter}>
                          <h6 className={styles.locationGeography}>
                            Amnount to pay: {asset.initialAmountToPay} , This
                            Month
                          </h6>
                        </div>
                      )}

                    {asset.lastPaymentDate && (
                      <div className={styles.cardActionFooter}>
                        <h6 className={styles.locationGeography}>
                          Last Payment Date:{' '}
                          {new Date(asset.lastPaymentDate).toLocaleDateString(
                            'en-US',
                            { year: 'numeric', month: 'numeric', day: 'numeric' }
                          )}
                        </h6>
                      </div>
                    )}

                    {asset.lastPaymentStatus && (
                      <div className={styles.cardActionFooter}>
                        <h6 className={styles.locationGeography}>
                          Last Payment Status: {asset.lastPaymentStatus}
                        </h6>
                      </div>
                    )}

                    {asset.bookedAt && (
                      <div className={styles.cardActionFooter}>
                        <h6 className={styles.locationGeography}>
                          Booked At:{' '}
                          {new Date(asset.bookedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </h6>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination footer — added so filtered lists remain navigable */}
        {filteredHouses.length > itemsPerPage && (
          <div className={styles.paginationFooterWrapper}>
            <button
              className={styles.btnNavPage}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className={styles.pageIndicatorCounter}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className={styles.btnNavPage}
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}