// ============================================================================
// FILE: src/components/owner/ownermainpagesecleft/ownermainpagesecleft.test.tsx
// PURPOSE: Automated component test suite for Ownermainpagesecleft (Owner Available Houses)
// ============================================================================

// ============================================================================
// SECTION 1: CORE TESTING & COMPONENT IMPORTS
// ============================================================================
// Import React so JSX syntax (<Ownermainpagesecleft />) compiles cleanly in tests
import React from 'react';
// Import `screen` and `fireEvent` to query rendered DOM nodes and simulate image load errors
import { screen, fireEvent } from '@testing-library/react';
// Import `userEvent` to simulate realistic typing in search inputs and clicking pagination buttons
import userEvent from '@testing-library/user-event';
// Import Vitest test runner functions, spies, and lifecycle hooks
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Import the Ownermainpagesecleft component under test
import Ownermainpagesecleft from './ownermainpagesecleft';
// Import our reusable Redux Toolkit <Provider> wrapper
import { renderWithProviders } from '@/test/test-utils';
// Import `setUser` action so we can seed an authenticated Owner into Redux state before rendering
import { setUser } from '@/store/slices/userSlice';
// Import the RTK Query hook module so we can spy on and control query responses per test
import * as houseApiModule from '@/store/api/houseApi';

// ============================================================================
// SECTION 2: ENVIRONMENT & RTK QUERY MODULE MOCKS
// ============================================================================
// Mock `@/environments/environments` so `environment.endpointI` resolves predictably in tests
vi.mock('@/environments/environments', () => ({
  // Provide a deterministic backend base URL for image concatenation (`BASE_URL + house.image`)
  environment: {
    endpointI: 'http://localhost:3001',
  },
}));

// Mock `@/store/api/houseApi` while preserving any non-hook exports
vi.mock('@/store/api/houseApi', async (importOriginal) => {
  // Import the original module so TypeScript types and non-mocked properties remain intact
  const actual = await importOriginal<typeof houseApiModule>();
  return {
    ...actual,
    // Spy on `useGetHousesByOwnerBfalseQuery` so each test can supply custom owner house lists/states
    useGetHousesByOwnerBfalseQuery: vi.fn(),
  };
});

// ============================================================================
// SECTION 3: MOCK DATASET FIXTURES (11 OWNER HOUSES FOR FILTER & PAGINATION TESTS)
// ============================================================================
// Generate 11 realistic owner houses so we can verify both multi-field filtering and 10-per-page pagination
const MOCK_OWNER_AVAILABLE_HOUSES = [
  {
    _id: 'own-house-1',
    houseCode: 'OWN-101',
    city: 'Valencia',
    state: 'Carabobo',
    RentPrice: 850,
    totalRooms: 3,
    image: '/uploads/own1.jpg',
    booked: false,
  },
  {
    _id: 'own-house-2',
    houseCode: 'OWN-102',
    city: 'Caracas',
    state: 'Miranda',
    RentPrice: 1600,
    totalRooms: 5,
    image: null,
    booked: false,
  },
  {
    _id: 'own-house-3',
    houseCode: 'OWN-103',
    city: 'Valencia',
    state: 'Carabobo',
    RentPrice: 600,
    totalRooms: 2,
    image: '/uploads/own3.jpg',
    booked: false,
  },
  {
    _id: 'own-house-4',
    houseCode: 'OWN-104',
    city: 'Maracay',
    state: 'Aragua',
    RentPrice: 950,
    totalRooms: 3,
    image: '/uploads/own4.jpg',
    booked: false,
  },
  {
    _id: 'own-house-5',
    houseCode: 'OWN-105',
    city: 'Barquisimeto',
    state: 'Lara',
    RentPrice: 700,
    totalRooms: 2,
    image: '/uploads/own5.jpg',
    booked: false,
  },
  {
    _id: 'own-house-6',
    houseCode: 'OWN-106',
    city: 'Maracaibo',
    state: 'Zulia',
    RentPrice: 1100,
    totalRooms: 4,
    image: '/uploads/own6.jpg',
    booked: false,
  },
  {
    _id: 'own-house-7',
    houseCode: 'OWN-107',
    city: 'Merida',
    state: 'Merida',
    RentPrice: 780,
    totalRooms: 3,
    image: '/uploads/own7.jpg',
    booked: false,
  },
  {
    _id: 'own-house-8',
    houseCode: 'OWN-108',
    city: 'San Cristobal',
    state: 'Tachira',
    RentPrice: 820,
    totalRooms: 3,
    image: '/uploads/own8.jpg',
    booked: false,
  },
  {
    _id: 'own-house-9',
    houseCode: 'OWN-109',
    city: 'Puerto La Cruz',
    state: 'Anzoategui',
    RentPrice: 1300,
    totalRooms: 4,
    image: '/uploads/own9.jpg',
    booked: false,
  },
  {
    _id: 'own-house-10',
    houseCode: 'OWN-110',
    city: 'Valencia',
    state: 'Carabobo',
    RentPrice: 1450,
    totalRooms: 4,
    image: '/uploads/own10.jpg',
    booked: false,
  },
  {
    _id: 'own-house-11',
    houseCode: 'OWN-111',
    city: 'Cumana',
    state: 'Sucre',
    RentPrice: 650,
    totalRooms: 2,
    image: '/uploads/own11.jpg',
    booked: false,
  },
];

// ============================================================================
// SECTION 4: TEST SUITE FOR <Ownermainpagesecleft />
// ============================================================================
describe('Ownermainpagesecleft', () => {
  // Configure default healthy RTK Query hook response before each test
  beforeEach(() => {
    // Default `useGetHousesByOwnerBfalseQuery` mock returning our 11 owner properties
    vi.mocked(houseApiModule.useGetHousesByOwnerBfalseQuery).mockReturnValue({
      data: MOCK_OWNER_AVAILABLE_HOUSES,
      isLoading: false,
      isError: false,
    } as any);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Redux `skip` Guard, Loading State, and Empty/Error Fallback States
  // --------------------------------------------------------------------------
  it('skips query when ownerId is empty, and renders loading and empty/error fallback states', () => {
    // 1A. Render with default unauthenticated store (`user.id === ''`) -> expects `{ skip: true }`
    const { rerender } = renderWithProviders(<Ownermainpagesecleft />);
    expect(houseApiModule.useGetHousesByOwnerBfalseQuery).toHaveBeenCalledWith('', {
      skip: true,
    });

    // 1B. Simulate `isLoading: true` (sticky mockReturnValue across re-renders)
    vi.mocked(houseApiModule.useGetHousesByOwnerBfalseQuery).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    } as any);

    rerender(<Ownermainpagesecleft />);
    expect(screen.getByText('Loading available houses…')).toBeInTheDocument();

    // 1C. Simulate `isError: true` -> displays empty/error fallback message
    vi.mocked(houseApiModule.useGetHousesByOwnerBfalseQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
    } as any);

    rerender(<Ownermainpagesecleft />);
    expect(
      screen.getByText('No active Available Houses under your account parameters yet.')
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 2: Renders Owner Properties, Currency Formatting, Badges & Image Fallback
  // --------------------------------------------------------------------------
  it('renders owner house details, currency formatting, Available badges, and swaps broken images', () => {
    // Render component and seed an authenticated Owner into Redux store
    const { store } = renderWithProviders(<Ownermainpagesecleft />);
    store.dispatch(
      setUser({
        id: 'owner-77',
        name: 'Carlos Owner',
        email: 'carlos@estates.com',
        role: 'Owner',
        userImage: '',
      })
    );

    // Verify section heading and first property details render properly
    expect(screen.getByRole('heading', { name: 'List Houses for renting' })).toBeInTheDocument();
    expect(screen.getByText('OWN-101')).toBeInTheDocument();
    expect(screen.getByText('$850.00/mo')).toBeInTheDocument();

    // Verify all 10 visible cards on Page 1 display the "Available" badge
    expect(screen.getAllByText('Available')).toHaveLength(10);

    // Verify broken image `onError` swaps image `src` to `/images/mainownerpage/background.jpg`
    const images = screen.getAllByAltText(
      'House Element Listing Snapshot Preview'
    ) as HTMLImageElement[];
    expect(images[0].src).toContain('/uploads/own1.jpg');

    fireEvent.error(images[0]);
    expect(images[0].src).toContain('/images/mainownerpage/background.jpg');
  });

  // --------------------------------------------------------------------------
  // TEST 3: Client-Side Filtering by City, Max Price, and Min Rooms
  // --------------------------------------------------------------------------
  it('filters owner houses dynamically by city, maxPrice, and minRooms', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Ownermainpagesecleft />);

    // Grab the three search toolbar inputs
    const cityInput = screen.getByPlaceholderText('City...');
    const maxPriceInput = screen.getByPlaceholderText('Max Price');
    const minRoomsInput = screen.getByPlaceholderText('Min Rooms');

    // Filter by City = "Valencia" (matches OWN-101, OWN-103, OWN-110)
    await user.type(cityInput, 'Valencia');
    expect(screen.getByText('OWN-101')).toBeInTheDocument();
    expect(screen.getByText('OWN-103')).toBeInTheDocument();
    expect(screen.getByText('OWN-110')).toBeInTheDocument();
    expect(screen.queryByText('OWN-102')).not.toBeInTheDocument();

    // Narrow further with Max Price = 1000 (eliminates OWN-110 at $1,450)
    await user.clear(maxPriceInput);
    await user.type(maxPriceInput, '1000');
    expect(screen.getByText('OWN-101')).toBeInTheDocument();
    expect(screen.getByText('OWN-103')).toBeInTheDocument();
    expect(screen.queryByText('OWN-110')).not.toBeInTheDocument();

    // Narrow further with Min Rooms = 3 (eliminates OWN-103 with 2 rooms, leaving only OWN-101)
    await user.clear(minRoomsInput);
    await user.type(minRoomsInput, '3');
    expect(screen.getByText('OWN-101')).toBeInTheDocument();
    expect(screen.queryByText('OWN-103')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 4: Pagination Controls (`ITEMS_PER_PAGE = 10` -> Page 1 of 2 & Page 2 of 2)
  // --------------------------------------------------------------------------
  it('paginates owner houses across pages when total exceeds 10 items', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component with 11 mock houses (Page 1 has 10 items, Page 2 has 1 item)
    renderWithProviders(<Ownermainpagesecleft />);

    // Verify Page 1 indicator and 11th property (`OWN-111`) is hidden on Page 1
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('OWN-101')).toBeInTheDocument();
    expect(screen.queryByText('OWN-111')).not.toBeInTheDocument();

    // Verify Previous starts disabled and Next is enabled
    const prevButton = screen.getByRole('button', { name: 'Previous' });
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    // Click "Next" -> advances to Page 2 and shows `OWN-111`
    await user.click(nextButton);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('OWN-111')).toBeInTheDocument();
    expect(screen.queryByText('OWN-101')).not.toBeInTheDocument();
    expect(nextButton).toBeDisabled();
    expect(prevButton).toBeEnabled();

    // Click "Previous" -> returns to Page 1
    await user.click(prevButton);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('OWN-101')).toBeInTheDocument();
  });
});