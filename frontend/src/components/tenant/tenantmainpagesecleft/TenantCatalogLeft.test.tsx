// ============================================================================
// FILE: src/components/tenant/tenantmainpagesecleft/TenantCatalogLeft.test.tsx
// PURPOSE: Automated component test suite for TenantCatalogLeft (Available Houses)
// ============================================================================

// ============================================================================
// SECTION 1: CORE TESTING & COMPONENT IMPORTS
// ============================================================================
// Import React so JSX syntax (<TenantCatalogLeft />) compiles cleanly in tests
import React from 'react';
// Import `screen`, `waitFor`, and `fireEvent` to query DOM elements, await async calls, and simulate image errors
import { screen, waitFor, fireEvent } from '@testing-library/react';
// Import `userEvent` to simulate realistic typing in search inputs and clicking buttons/links
import userEvent from '@testing-library/user-event';
// Import Vitest test runner functions, spies, and lifecycle hooks
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Import the TenantCatalogLeft component under test
import TenantCatalogLeft from './tenantmainpagesecleft';
// Import our reusable Redux Toolkit <Provider> wrapper
import { renderWithProviders } from '@/test/test-utils';
// Import `setUser` action so we can seed an authenticated Tenant into Redux state before rendering
import { setUser } from '@/store/slices/userSlice';
// Import the RTK Query hook modules so we can spy on and control their return values per test
import * as houseApiModule from '../../../store/api/houseApi';
import * as bookingApiModule from '../../../store/api/bookingApi';

// ============================================================================
// SECTION 2: ENVIRONMENT & RTK QUERY MODULE MOCKS
// ============================================================================
// Mock `@/environments/environments` so `environment.endpointI` resolves predictably in tests
vi.mock('@/environments/environments', () => ({
  // Provide a deterministic backend base URL for image concatenation (`${baseUrl}${house.image}`)
  environment: {
    endpointI: 'http://localhost:3001',
  },
}));

// Mock `houseApi` while preserving any non-hook exports
vi.mock('../../../store/api/houseApi', async (importOriginal) => {
  // Import the original module so TypeScript types and non-mocked properties remain intact
  const actual = await importOriginal<typeof houseApiModule>();
  return {
    ...actual,
    // Spy on `useGetAvailableHousesBookedFalseQuery` so each test can supply custom house lists/states
    useGetAvailableHousesBookedFalseQuery: vi.fn(),
    // Spy on `useEdithouseupdatebookedMutation` so we can assert `booked: true` updates
    useEdithouseupdatebookedMutation: vi.fn(),
  };
});

// Mock `bookingApi` while preserving any non-hook exports
vi.mock('../../../store/api/bookingApi', async (importOriginal) => {
  // Import the original module so non-mocked properties remain intact
  const actual = await importOriginal<typeof bookingApiModule>();
  return {
    ...actual,
    // Spy on `useCreateBookingMutation` so we can assert booking creation payloads
    useCreateBookingMutation: vi.fn(),
  };
});

// ============================================================================
// SECTION 3: MOCK DATASET FIXTURES (AVAILABLE HOUSES)
// ============================================================================
// Create a realistic list of 7 available houses to test filtering and 6-per-page pagination
const MOCK_HOUSES = [
  {
    _id: 'house-1',
    ownerId: 'owner-10',
    ownerfullname: 'Carlos Perez',
    owneremail: 'carlos@estates.com',
    houseCode: 'VLA-101',
    state: 'Carabobo',
    city: 'Valencia',
    street: 'Av. Bolivar Norte',
    image: '/uploads/house1.jpg',
    RentPrice: 850,
    totalRooms: 3,
    booked: false,
  },
  {
    _id: 'house-2',
    ownerId: 'owner-11',
    ownerfullname: 'Maria Gomez',
    owneremail: 'maria@estates.com',
    houseCode: 'CCS-202',
    state: 'Miranda',
    city: 'Caracas',
    street: 'Altamira Sur',
    image: '/uploads/house2.jpg',
    RentPrice: 1500,
    totalRooms: 4,
    booked: false,
  },
  {
    _id: 'house-3',
    ownerId: 'owner-12',
    ownerfullname: 'Luis Diaz',
    owneremail: 'luis@estates.com',
    houseCode: 'VLA-103',
    state: 'Carabobo',
    city: 'Valencia',
    street: 'El Trigal',
    image: null,
    RentPrice: 600,
    totalRooms: 2,
    booked: false,
  },
  {
    _id: 'house-4',
    ownerId: 'owner-13',
    ownerfullname: 'Ana Torres',
    owneremail: 'ana@estates.com',
    houseCode: 'MCY-404',
    state: 'Aragua',
    city: 'Maracay',
    street: 'Las Delicias',
    image: '/uploads/house4.jpg',
    RentPrice: 950,
    totalRooms: 3,
    booked: false,
  },
  {
    _id: 'house-5',
    ownerId: 'owner-14',
    ownerfullname: 'Pedro Ruiz',
    owneremail: 'pedro@estates.com',
    houseCode: 'BQTO-505',
    state: 'Lara',
    city: 'Barquisimeto',
    street: 'Av. Lara',
    image: '/uploads/house5.jpg',
    RentPrice: 700,
    totalRooms: 2,
    booked: false,
  },
  {
    _id: 'house-6',
    ownerId: 'owner-15',
    ownerfullname: 'Elena Silva',
    owneremail: 'elena@estates.com',
    houseCode: 'MBO-606',
    state: 'Zulia',
    city: 'Maracaibo',
    street: 'Bella Vista',
    image: '/uploads/house6.jpg',
    RentPrice: 1100,
    totalRooms: 4,
    booked: false,
  },
  {
    _id: 'house-7',
    ownerId: 'owner-16',
    ownerfullname: 'Jorge Mendez',
    owneremail: 'jorge@estates.com',
    houseCode: 'VLA-707',
    state: 'Carabobo',
    city: 'Valencia',
    street: 'Naguanagua',
    image: '/uploads/house7.jpg',
    RentPrice: 1200,
    totalRooms: 5,
    booked: false,
  },
];

// ============================================================================
// SECTION 4: TEST SUITE FOR <TenantCatalogLeft />
// ============================================================================
describe('TenantCatalogLeft', () => {
  // Declare reusable mock functions for query refetch and mutation triggers
  const refetchMock = vi.fn();
  const createBookingTriggerMock = vi.fn();
  const editHouseBookedTriggerMock = vi.fn();

  // Reset all spies and configure default healthy RTK Query hook responses before each test
  beforeEach(() => {
    // Clear call history on spies
    refetchMock.mockClear();
    createBookingTriggerMock.mockClear();
    editHouseBookedTriggerMock.mockClear();
    vi.mocked(window.alert).mockClear();

    // Configure RTK Query `.unwrap()` chains so `await rentHouse(...).unwrap()` resolves cleanly
    createBookingTriggerMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ message: 'Booking created' }),
    });
    editHouseBookedTriggerMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ message: 'House marked booked' }),
    });

    // Default `useGetAvailableHousesBookedFalseQuery` mock returning our 7 houses
    vi.mocked(houseApiModule.useGetAvailableHousesBookedFalseQuery).mockReturnValue({
      data: MOCK_HOUSES,
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: refetchMock,
    } as any);

    // Default `useCreateBookingMutation` mock returning our trigger function and loading flag
    vi.mocked(bookingApiModule.useCreateBookingMutation).mockReturnValue([
      createBookingTriggerMock,
      { isLoading: false },
    ] as any);

    // Default `useEdithouseupdatebookedMutation` mock returning our trigger function
    vi.mocked(houseApiModule.useEdithouseupdatebookedMutation).mockReturnValue([
      editHouseBookedTriggerMock,
      { isLoading: false },
    ] as any);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Loading State, Error + Retry State, and Empty Fallback State
  // --------------------------------------------------------------------------
  it('renders loading, error with retry button, and empty states properly', async () => {
    // Initialize `userEvent` for clicking the Retry button
    const user = userEvent.setup();

    // 1A. Simulate `isLoading: true`
    vi.mocked(houseApiModule.useGetAvailableHousesBookedFalseQuery).mockReturnValueOnce({
      data: [],
      isLoading: true,
      isError: false,
      error: undefined,
      refetch: refetchMock,
    } as any);

    const { rerender } = renderWithProviders(<TenantCatalogLeft />);
    // Verify loading message appears
    expect(screen.getByText('Loading available houses...')).toBeInTheDocument();

    // 1B. Simulate `isError: true` with HTTP status 500
    vi.mocked(houseApiModule.useGetAvailableHousesBookedFalseQuery).mockReturnValueOnce({
      data: [],
      isLoading: false,
      isError: true,
      error: { status: 500 },
      refetch: refetchMock,
    } as any);

    rerender(<TenantCatalogLeft />);
    // Verify error message displays the status code
    expect(screen.getByText(/Error loading houses: Status 500/i)).toBeInTheDocument();
    // Click Retry button and verify `refetch()` is triggered
    await user.click(screen.getByRole('button', { name: /Retry/i }));
    expect(refetchMock).toHaveBeenCalledTimes(1);

    // 1C. Simulate empty house list (`data: []`)
    vi.mocked(houseApiModule.useGetAvailableHousesBookedFalseQuery).mockReturnValueOnce({
      data: [],
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: refetchMock,
    } as any);

    rerender(<TenantCatalogLeft />);
    // Verify empty-state fallback text renders
    expect(
      screen.getByText('No active Available Houses under your account parameters yet.')
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 2: Client-Side Filtering (City, Max Price, Min Rooms)
  // --------------------------------------------------------------------------
  it('filters available houses dynamically by city, maxPrice, and minRooms', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount TenantCatalogLeft
    renderWithProviders(<TenantCatalogLeft />);

    // Grab the three search toolbar inputs by placeholder text
    const cityInput = screen.getByPlaceholderText('City...');
    const maxPriceInput = screen.getByPlaceholderText('Max Price');
    const minRoomsInput = screen.getByPlaceholderText('Min Rooms');

    // Filter by City = "Valencia" (matches VLA-101, VLA-103, VLA-707)
    await user.type(cityInput, 'Valencia');
    expect(screen.getByText('VLA-101')).toBeInTheDocument();
    expect(screen.getByText('VLA-103')).toBeInTheDocument();
    expect(screen.getByText('VLA-707')).toBeInTheDocument();
    expect(screen.queryByText('CCS-202')).not.toBeInTheDocument();

    // Narrow further with Max Price = 900 (eliminates VLA-707 at $1,200)
    await user.type(maxPriceInput, '900');
    expect(screen.getByText('VLA-101')).toBeInTheDocument();
    expect(screen.getByText('VLA-103')).toBeInTheDocument();
    expect(screen.queryByText('VLA-707')).not.toBeInTheDocument();

    // Narrow further with Min Rooms = 3 (eliminates VLA-103 with 2 rooms, leaving only VLA-101)
    await user.type(minRoomsInput, '3');
    expect(screen.getByText('VLA-101')).toBeInTheDocument();
    expect(screen.queryByText('VLA-103')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 3: Pagination Controls (`itemsPerPage = 6` -> Page 1 of 2 & Page 2 of 2)
  // --------------------------------------------------------------------------
  it('paginates houses across pages and toggles Previous/Next buttons accurately', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Render with default `itemsPerPage = 6` against our 7 mock houses (2 pages total)
    renderWithProviders(<TenantCatalogLeft itemsPerPage={6} />);

    // Verify Page 1 indicator and first 6 houses are visible while 7th house is hidden
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('VLA-101')).toBeInTheDocument();
    expect(screen.queryByText('VLA-707')).not.toBeInTheDocument();

    // Verify "Previous" button starts disabled on Page 1
    const prevButton = screen.getByRole('button', { name: 'Previous' });
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    // Click "Next" to advance to Page 2
    await user.click(nextButton);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('VLA-707')).toBeInTheDocument();
    expect(screen.queryByText('VLA-101')).not.toBeInTheDocument();
    expect(nextButton).toBeDisabled();
    expect(prevButton).toBeEnabled();

    // Click "Previous" to return to Page 1
    await user.click(prevButton);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('VLA-101')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 4: Image Fallback Handling When an Image Fails to Load (`onError`)
  // --------------------------------------------------------------------------
  it('switches to defaultHouseImage when a property image triggers onError', () => {
    // Render with a custom `defaultHouseImage` path
    renderWithProviders(<TenantCatalogLeft defaultHouseImage="/images/fallback-house.png" />);

    // Find all rendered house images
    const images = screen.getAllByAltText('House Element Listing Snapshot Preview') as HTMLImageElement[];

    // First image starts with `${baseUrl}${house.image}`
    expect(images[0].src).toContain('/uploads/house1.jpg');

    // Simulate a broken image load event on the first card
    fireEvent.error(images[0]);

    // Verify the first image `src` updates immediately to `defaultHouseImage`
    expect(images[0].src).toContain('/images/fallback-house.png');
  });

  // --------------------------------------------------------------------------
  // TEST 5: Rent House Action (`useCreateBookingMutation` + `useEdithouseupdatebookedMutation`)
  // --------------------------------------------------------------------------
  it('dispatches createBooking and updates house booked status to true when Rent House is clicked', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Render component and grab Redux `store`
    const { store } = renderWithProviders(<TenantCatalogLeft />);

    // Seed an authenticated Tenant into Redux `user` slice so `tenantId`, `tenantfullname`, and `tenantemail` populate
    store.dispatch(
      setUser({
        id: 'tenant-55',
        name: 'Sergio Moncada',
        email: 'sergio.tenant@example.com',
        role: 'Tenant',
        userImage: '/uploads/tenant.png',
      })
    );

    // Click the first "Rent House" action link (corresponding to `house-1` / `VLA-101`)
    const rentLinks = screen.getAllByRole('button', { name: 'Rent House' });
    await user.click(rentLinks[0]);

    // Verify `createBooking` mutation was invoked with the combined Redux tenant + house payload
    await waitFor(() => {
      expect(createBookingTriggerMock).toHaveBeenCalledWith({
        houseId: 'house-1',
        tenantId: 'tenant-55',
        tenantfullname: 'Sergio Moncada',
        tenantemail: 'sergio.tenant@example.com',
        ownerId: 'owner-10',
        ownerfullname: 'Carlos Perez',
        owneremail: 'carlos@estates.com',
        houseCode: 'VLA-101',
        state: 'Carabobo',
        city: 'Valencia',
        street: 'Av. Bolivar Norte',
        image: '/uploads/house1.jpg',
        RentPrice: 850,
      });
    });

    // Verify `edithouseupdatebooked` mutation was also called to mark the house `booked: true`
    await waitFor(() => {
      expect(editHouseBookedTriggerMock).toHaveBeenCalledWith({
        house: MOCK_HOUSES[0],
        data: { booked: true },
      });
    });
  });
});