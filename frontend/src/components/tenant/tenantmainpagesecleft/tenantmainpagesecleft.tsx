'use client';

import React, { useState, useMemo } from 'react';
import styles from './TenantCatalogLeft.module.css';
import {
  useGetAvailableHousesBookedFalseQuery,
  useEdithouseupdatebookedMutation,
} from '../../../store/api/houseApi';
import type { House } from '../../../store/api/houseApi';
import { useCreateBookingMutation } from "../../../store/api/bookingApi"
import { environment } from "@/environments/environments";
import { useAppSelector } from "../../../store/hooks";

interface TenantCatalogLeftProps {
  catalogTitle?: string;
  baseUrl?: string;
  defaultHouseImage?: string;
  itemsPerPage?: number;
}

export default function TenantCatalogLeft({

  catalogTitle = 'Available Houses',
  baseUrl = environment.endpointI,
  defaultHouseImage = './images/mainownerpage/ownerimage01.png',
  itemsPerPage = 6,
}: TenantCatalogLeftProps) {
  // 1. RTK Query Hooks for Data Fetching & Mutations
  const {
    data: availableHouses = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAvailableHousesBookedFalseQuery();

  const [rentHouse, { isLoading: isRenting }] = useCreateBookingMutation();
  const [edithouseupdatebooked ] = useEdithouseupdatebookedMutation(); 
  const tenant = useAppSelector((state) => state.user);

  // 2. Local UI Filter, Pagination & Image Fallback State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRooms, setMinRooms] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [activeRentingId, setActiveRentingId] = useState<string | null>(null);


  // USD Currency Formatter (replaces Angular `| currency:'USD'`)
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  // 3. Client-Side Filtering (City, Max Price, Min Rooms)
  const filteredHouses = useMemo(() => {
    return availableHouses.filter((house:any) => {
      const matchesCity =
        !searchQuery.trim() ||
        house.city.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesPrice =
        !maxPrice || house.RentPrice <= Number(maxPrice);
      const matchesRooms =
        !minRooms || house.totalRooms >= Number(minRooms);

      return matchesCity && matchesPrice && matchesRooms;
    });
  }, [availableHouses, searchQuery, maxPrice, minRooms]);

  // 4. Pagination Calculation
  const totalPages = Math.max(1, Math.ceil(filteredHouses.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAvailableHouses = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredHouses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHouses, safeCurrentPage, itemsPerPage]);

  const isEmptyState = !isLoading && filteredHouses.length === 0;

  // 5. RTK Query Mutation Handler
  const handleRentHouse = async (house: House) => {

    alert("Im at tenantmainpagesecleft - line 85 - handle rent house - house._id: " + house._id)
    if (isRenting) return;
    setActiveRentingId(house._id);

    try {
       await rentHouse({
         houseId: house._id,
         tenantId: tenant.id ?? '',
         tenantfullname: tenant.name ?? '',
         tenantemail: tenant.email ?? '',
         ownerId: house.ownerId,
         ownerfullname: house.ownerfullname ?? '',
         owneremail: house.owneremail ?? '',
         houseCode: house.houseCode,
         state: house.state ?? '',
         city: house.city ?? '',
         street: house.street ?? '',
         image: house.image ?? null,
         RentPrice: Number(house.RentPrice ?? 0),
       }).unwrap();
      // Cache tag invalidation automatically refetches getAvailableHouses!
    } catch (err) {
      console.error('Failed to rent house via RTK Query:', err);
    } finally {
      setActiveRentingId(null);
    }
//  section to update house - booked= true
const payloadupdateHouse = { booked: true }

  try {
       await edithouseupdatebooked({
         house: house ?? '',
         data:payloadupdateHouse ?? '',
       }).unwrap();
      // Cache tag invalidation automatically refetches edithouseupdatebooked!
    } catch (err) {
      console.error('Failed to rent house via RTK Query:', err);
    } 
  

// end of section to update house - booked= true

  };

  const handleImageError = (houseId: string) => {
    setBrokenImages((prev) => ({ ...prev, [houseId]: true }));
  };

  return (
    <section className={`${styles['flex-column-container']} ${styles['catalog-card-panel']}`}>
      {/* Search Toolbar */}
      <div className={styles['search-toolbar']}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="City..."
          className={styles['search-input']}
        />
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Max Price"
          className={styles['search-input']}
        />
        <input
          type="number"
          value={minRooms}
          onChange={(e) => {
            setMinRooms(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Min Rooms"
          className={styles['search-input']}
        />
      </div>

      {/* Container Title */}
      <div className={styles['container-title-bar']}>
        <h2>{catalogTitle}</h2>
      </div>

      {/* Scrollable Cards Viewport */}
      <div className={styles['scrollable-cards-viewport']}>
        {isLoading && (
          <div className={styles['empty-state-fallback']}>
            <p>Loading available houses...</p>
          </div>
        )}

        {isError && (
          <div className={styles['empty-state-fallback']}>
            <p>
              Error loading houses:{' '}
              {'status' in error ? `Status ${error.status}` : 'Network error'}
            </p>
            <button type="button" className={styles['btn-nav-page']} onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {isEmptyState && !isError && (
          <div className={styles['empty-state-fallback']}>
            <p>No active Available Houses under your account parameters yet.</p>
          </div>
        )}

        {!isLoading && !isError && paginatedAvailableHouses.length > 0 && (
          
          <div className={styles['cards-responsive-grid']}>
           
            {paginatedAvailableHouses.map((house:any) => {
              const imageSrc =
                house.image && !brokenImages[house._id]
                  ? `${baseUrl}${house.image}`
                  : defaultHouseImage;
              const isThisCardRenting = isRenting && activeRentingId === house._id;

              return (
                <article key={house._id} className={styles['property-item-card']}>
                  <div className={styles['card-image-wrapper']}>
                    
                    <img
                      src={imageSrc}
                      alt="House Element Listing Snapshot Preview"
                      onError={() => handleImageError(house._id)}
                    />
                    <span className={`${styles['badge-status']} ${styles['status-vacant']}`}>
                      Available
                    </span>
                  </div>

                  <div className={styles['card-body-content']}>
                    <div className={styles['card-row-header']}>
                      <h3 className={styles['house-identity-code']}>{house.houseCode}</h3>
                      <span className={styles['rent-price-tag']}>
                        {formatCurrency(house.RentPrice)}/mo
                      </span>
                    </div>

                    <p className={styles['location-geography']}>
                      <i className="geo-pin" /> {house.city}, {house.state}
                    </p>

                    <div className={styles['structural-amenities']}>
                      <span>
                        🏠 Total Rooms: <strong>{house.totalRooms}</strong>
                      </span>
                    </div>

                    <div className={styles['developer-spec-links']}>
                      <a
                        role="button"
                        tabIndex={0}
                        className={`${styles['lnk-spec']} ${styles['lnk-edit']}`}
                        onClick={() => handleRentHouse(house)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRentHouse(house)}
                        style={{
                          pointerEvents: isRenting ? 'none' : 'auto',
                          opacity: isThisCardRenting ? 0.6 : 1,
                        }}
                      >
                        {isThisCardRenting ? 'Renting...' : 'Rent House'}
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <footer className={styles['pagination-footer-wrapper']}>
          <button
            type="button"
            className={styles['btn-nav-page']}
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className={styles['page-indicator-counter']}>
            Page {safeCurrentPage} of {totalPages}
          </span>
          <button
            type="button"
            className={styles['btn-nav-page']}
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </footer>
      )}
    </section>
  );
}
