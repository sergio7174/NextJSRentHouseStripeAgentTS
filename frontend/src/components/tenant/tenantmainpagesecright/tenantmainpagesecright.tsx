// src/components/tenant/tenantmainpagesecright/tenantmainpagesecright.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { environment } from "@/environments/environments";
import PayNowButton from "@/components/stripe/PayNowButton";

// ---- QUERIES / MUTATIONS from the API slice (bookingApi.ts) ----
import {
  useGetRentedHousesByTenantIdQuery,
  usePutMaintenanceReqCreateMutation,
} from '@/store/api/bookingApi';

import styles from './tenantmainpagesecright.module.css';

/* ============================================================
   Props — UI-only config (base URLs / labels / fallback image)
   ============================================================ */
interface Props {
  baseUrl?: string;
  defaultHouseImage?: string;
  rentedTitle?: string;
}

/* ============================================================
   Component
   ============================================================ */
export default function Tenantmainpagesecright({


  baseUrl = environment.endpointI,
  defaultHouseImage = 'images/mainownerpage/ownerimage01.png',
  rentedTitle = 'List of rented houses',
}: Props) {
  /* ---------- Redux: tenant from the store ---------- */
  const tenant = useAppSelector((state) => state.user);
  const tenantId: string = tenant?.id ?? tenant?.id ?? '';

  /* ---------- RTK Query: rented houses (from bookingApi.ts) ---------- */
  const {
    data: rentedHouses = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetRentedHousesByTenantIdQuery(tenantId, {
    skip: !tenantId,
  });

  /* ---------- RTK Query: create maintenance request (from bookingApi.ts) ---------- */
  const [putMaintenanceReqCreate, { isLoading: isSubmitting }] =
    usePutMaintenanceReqCreateMutation();

  /* ---------- Local UI state ---------- */
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  const [openRequestForHouse, setOpenRequestForHouse] = useState<string | null>(null);
  const [maintenanceRequestValue, setMaintenanceRequestValue] = useState<string>('');

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- Surface query error as toast ---------- */
  useEffect(() => {
    if (isError && error) {
      const msg =
        (error as any)?.data?.message ??
        (error as any)?.error ??
        'Failed to load rented houses';
      setToast({ type: 'error', text: String(msg) });
    }
  }, [isError, error]);

  /* ---------- Derived: filtered ---------- */
  const filteredHouses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return rentedHouses.filter((house: any) => {
      const matchesCity = (house.city ?? '').toLowerCase().includes(q);
      const matchesPrice = house.RentPrice <= maxPrice;
      return matchesCity && matchesPrice;
    });
  }, [rentedHouses, searchQuery, maxPrice]);

  /* ---------- Derived: paginated ---------- */
  const paginatedAvailableHouses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHouses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHouses, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredHouses.length / itemsPerPage));

  /* ---------- Handlers ---------- */
  const openMaintenanceRequest = (houseId: string) => {
    setOpenRequestForHouse(houseId);
    setMaintenanceRequestValue('');
  };

  const closeMaintenanceRequest = () => {
    setOpenRequestForHouse(null);
    setMaintenanceRequestValue('');
  };

  const onSubmit = async (houseId: string) => {
    if (!maintenanceRequestValue.trim()) return;

    try {
      const response = await putMaintenanceReqCreate({
        id: houseId,
        payload: { maintenaceRequest: maintenanceRequestValue },
      }).unwrap();

      const created = (response as any)?.maintenaceRequestCreated;
      const message = (response as any)?.message;

      if (!created) {
        if (message) setToast({ type: 'error', text: message });
      } else {
        setToast({ type: 'success', text: 'House Edited successfully' });
        setMaintenanceRequestValue('');
        setOpenRequestForHouse(null);
        // invalidatesTags on the mutation already refetches the list;
        // calling refetch() is a safety net if the tenant query is skipped.
        refetch();
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.data?.message ?? err?.error ?? 'Something went wrong',
      });
    }
  };

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
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="City..."
          className={styles.searchInput}
        />
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(Number(e.target.value));
            setCurrentPage(1);
          }}
          placeholder="Max Price"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.containerTitleBar}>
        <h2 style={{ textAlign: 'center' }}>{rentedTitle}</h2>
      </div>

      <div className={styles.scrollableCardsViewport}>
        {/* Loading state */}
        {isLoading && (
          <div className={styles.emptyStateFallback}>
            <p>Loading rented houses…</p>
          </div>
        )}

        {/* Empty / error state — mirrors original isEmptyState === false */}
        {!isLoading && (isError || rentedHouses.length === 0) && (
          <div className={styles.emptyStateFallback}>
            <p>No active rental contracts signed under your account parameters yet.</p>
          </div>
        )}

        {/* Cards — mirrors *ngIf="rentedHouses.length > 0" */}
        {rentedHouses.length > 0 && (
          <div className={`${styles.cardsResponsiveGrid} ${styles.singlesColumn}`}>
            {paginatedAvailableHouses.map((asset: any) => {
              const imageSrc = asset.image ? baseUrl + asset.image : defaultHouseImage;
              const isApproved = asset.approvalStatus === 'Approved';
              const isNotApplied = asset.approvalStatus === 'notApplied';
              const canCreateRequest = isApproved && !asset.maintenaceRequest;
              const isFormOpen = openRequestForHouse === asset._id;
              // Inside your booking card or booking details view:
              const isPaid =  asset.paymentstatus === "paid" || asset.paymentStatus === "paid";
              

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
                    {isNotApplied && (
                      <span className={`${styles.badgeStatus} ${styles.statusBooked}`}>
                        Not Applied
                      </span>
                    )}
                  </div>
                  <div style={{marginTop:'1em'}}>
                  {!isPaid && (
                   <PayNowButton tenantId={String(asset.tenantId || tenantId)} />)}
                   </div>

                  <div className={styles.cardBodyContent}>
                    <div className={styles.cardRowHeader}>
                      <h3 className={styles.houseIdentityCode}>{asset.houseCode}</h3>
                      &nbsp;&nbsp;
                      <span className={`${styles.rentPriceTag} ${styles.paymentHighlight}`}>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(asset.RentPrice)}
                      </span>
                    </div>

                    <p className={styles.locationGeography}>
                      {asset.city}, {asset.state}
                    </p>

                    <div className={styles.structuralAmenities}>
                      <span>OwnerChecked: {String(asset.ownerChecked)}</span>
                    </div>

                    {/* Maintenance request info — mirrors *ngIf */}
                    {isApproved && asset.maintenaceRequest && (
                      <>
                        <div>
                          <span className={styles.structuralAmenities}>
                            Maintenance Request: {asset.maintenaceRequest}
                          </span>
                        </div>
                        <br />
                        <div>
                          <span className={styles.structuralAmenities}>
                            Maintenance Request Status: {asset.maintenaceRequestStatus}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Create maintenance request button + form */}
                    {canCreateRequest && (
                      <div className={`${styles.cardActionFooter} ${styles.paddedTop}`}>
                        <button
                          type="button"
                          className={`${styles.btnAction} ${styles.btnMaintenance}`}
                          onClick={() => openMaintenanceRequest(asset._id)}
                        >
                          ⚙ Create Maintenance Request
                        </button>

                        {isFormOpen && (
                          <div>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                onSubmit(asset._id);
                              }}
                            >
                              <br />
                              <textarea
                                value={maintenanceRequestValue}
                                onChange={(e) =>
                                  setMaintenanceRequestValue(e.target.value)
                                }
                                placeholder="Enter your maintenance request"
                                style={{ marginBottom: '20px' }}
                              />
                              <br />
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <button
                                  type="button"
                                  className={`${styles.btnAction} ${styles.btnMaintenaceRequest}`}
                                  onClick={closeMaintenanceRequest}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className={`${styles.btnAction} ${styles.btnMaintenaceRequest}`}
                                  disabled={
                                    !maintenanceRequestValue.trim() || isSubmitting
                                  }
                                >
                                  {isSubmitting ? 'Submitting…' : 'Submit'}
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conditional metadata blocks */}
                    {asset.leftdays != null && asset.leftdays !== ('' as any) && (
                      <div style={{ marginTop: '1em' }}>
                        <span className={styles.structuralAmenities}>
                          Left Days: {asset.leftdays}
                        </span>
                      </div>
                    )}

                    {asset.initialAmountToPay != null &&
                      asset.initialAmountToPay !== ('' as any) && (
                        <div style={{ marginTop: '1em' }}>
                          <span className={styles.structuralAmenities}>
                            Amnount to pay: {asset.initialAmountToPay} , This Month
                          </span>
                        </div>
                      )}

                    {asset.lastPaymentDate && (
                      <div style={{ marginTop: '1em' }}>
                        <span className={styles.structuralAmenities}>
                          Last Payment Date:{' '}
                          {new Date(asset.lastPaymentDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}

                    {asset.lastPaymentStatus && (
                      <div style={{ marginTop: '1em' }}>
                        <span className={styles.structuralAmenities}>
                          Last Payment Status: {asset.lastPaymentStatus}
                        </span>
                      </div>
                    )}

                    {asset.bookedAt && (
                      <div style={{ marginTop: '1em' }}>
                        <span className={styles.structuralAmenities}>
                          Booked At:{' '}
                          {new Date(asset.bookedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination footer */}
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