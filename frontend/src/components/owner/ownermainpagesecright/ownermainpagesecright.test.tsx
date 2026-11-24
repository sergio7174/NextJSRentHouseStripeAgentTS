/*
Looking at Ownermainpagesecright, there are five core behaviors to test:

    Redux Query skip Guard, Loading State & Error Toast:

        When state.user.id is empty (''), useGetRentedHousesByOwnerIdQuery is invoked with { skip: true }.

        Displays "Loading rented houses…" while isLoading: true, and surfaces an error toast banner plus the empty contract fallback message when isError: true.

    Approval Badges, Maintenance Request Visibility & Conditional Metadata:

        Renders "Rented" badge and hides "⚙ Change Status" when approvalStatus === 'Approved', while rendering "Not Applied" badge + "⚙ Change Status" when approvalStatus === 'notApplied'.

        Displays "Maintenance Request: <text>" and the 3 status buttons (⚙ 'In Progress', ⚙ 'Resolved', ⚙ 'Rejected') when asset.maintenaceRequest is present, or "No maintenance request submitted." when absent.

    Owner Booking Approval (handleChangeHouseCheckedStatus):

        Clicking "⚙ Change Status" calls changeHouseCheckedStatus({ houseId, OwnerChecked: true, approvalStatus: 'Approved', RentPrice }) and displays the "House status updated" success toast (or an error toast on failure).

    Owner Maintenance Status Update (handleChangeMaintReqStatus):

        Clicking "⚙ 'In Progress'", "⚙ 'Resolved'", or "⚙ 'Rejected'" calls changeMaintReqStatusMutation({ houseId, approvalStatus: status }) and displays "Maintenance status → <status>" (or an error toast on rejection).

    City Search Filter (City...):

        Filters the owner's rented houses dynamically by city substring.


*/
// ============================================================================
// FILE: src/components/owner/ownermainpagesecright/ownermainpagesecright.test.tsx
// PURPOSE: Automated component test suite for Ownermainpagesecright (Owner Bookings & Maintenance)
// ============================================================================

// ============================================================================
// SECTION 1: CORE TESTING & COMPONENT IMPORTS
// ============================================================================
// Import React so JSX syntax (<Ownermainpagesecright />) compiles cleanly in tests
import React from 'react';
// Import `screen` and `waitFor` to query rendered DOM nodes and await async state updates
import { screen, waitFor } from '@testing-library/react';
// Import `userEvent` to simulate realistic typing in search inputs and clicking action buttons
import userEvent from '@testing-library/user-event';
// Import Vitest test runner functions, spies, and lifecycle hooks
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Import the Ownermainpagesecright component under test
import Ownermainpagesecright from './ownermainpagesecright';
// Import our reusable Redux Toolkit <Provider> wrapper
import { renderWithProviders } from '@/test/test-utils';
// Import `setUser` action so we can seed an authenticated Owner into Redux state before rendering
import { setUser } from '@/store/slices/userSlice';
// Import the RTK Query hook module so we can spy on and control query/mutation responses per test
import * as bookingApiModule from '@/store/api/bookingApi';

// ============================================================================
// SECTION 2: ENVIRONMENT & RTK QUERY MODULE MOCKS
// ============================================================================
// Mock `@/environments/environments` so `environment.endpointI` resolves predictably in tests
vi.mock('@/environments/environments', () => ({
  // Provide a deterministic backend base URL for image concatenation (`BASE_URL + asset.image`)
  environment: {
    endpointI: 'http://localhost:3001',
  },
}));

// Mock `@/store/api/bookingApi` while preserving any non-hook exports
vi.mock('@/store/api/bookingApi', async (importOriginal) => {
  // Import the original module so TypeScript types and non-mocked properties remain intact
  const actual = await importOriginal<typeof bookingApiModule>();
  return {
    ...actual,
    // Spy on `useGetRentedHousesByOwnerIdQuery` so each test can supply custom owner bookings/states
    useGetRentedHousesByOwnerIdQuery: vi.fn(),
    // Spy on `useChangeHouseCheckedStatusMutation` so we can assert booking approval payloads
    useChangeHouseCheckedStatusMutation: vi.fn(),
    // Spy on `usePutchangeMaintReqStatusMutation` so we can assert maintenance status payloads
    usePutchangeMaintReqStatusMutation: vi.fn(),
  };
});

// ============================================================================
// SECTION 3: MOCK DATASET FIXTURES (OWNER RENTED HOUSES & BOOKING REQUESTS)
// ============================================================================
// Create realistic owner bookings covering Approved (with maintenance) and notApplied (awaiting approval)
const MOCK_OWNER_BOOKED_HOUSES = [
  {
    _id: 'owner-booking-1',
    houseCode: 'OWN-101',
    city: 'Valencia',
    state: 'Carabobo',
    RentPrice: 950,
    image: '/uploads/owner_rented1.jpg',
    approvalStatus: 'Approved',
    ownerChecked: true,
    maintenaceRequest: 'Water heater needs inspection',
    leftdays: 19,
    initialAmountToPay: 950,
    lastPaymentStatus: 'Paid',
  },
  {
    _id: 'owner-booking-2',
    houseCode: 'OWN-202',
    city: 'Caracas',
    state: 'Miranda',
    RentPrice: 1400,
    image: null,
    approvalStatus: 'notApplied',
    ownerChecked: false,
    maintenaceRequest: '',
  },
];

// ============================================================================
// SECTION 4: TEST SUITE FOR <Ownermainpagesecright />
// ============================================================================
describe('Ownermainpagesecright', () => {
  // Declare reusable mock trigger functions for the two owner mutations
  const changeHouseCheckedTriggerMock = vi.fn();
  const changeMaintReqStatusTriggerMock = vi.fn();

  // Reset all spies and configure default healthy RTK Query hook responses before each test
  beforeEach(() => {
    // Clear call history on spies
    changeHouseCheckedTriggerMock.mockClear();
    changeMaintReqStatusTriggerMock.mockClear();

    // Configure default `.unwrap()` resolution for `changeHouseCheckedStatus`
    changeHouseCheckedTriggerMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ message: 'Approved' }),
    });

    // Configure default `.unwrap()` resolution for `putchangeMaintReqStatus`
    changeMaintReqStatusTriggerMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ message: 'Status updated' }),
    });

    // Default `useGetRentedHousesByOwnerIdQuery` mock returning our 2 owner bookings
    vi.mocked(bookingApiModule.useGetRentedHousesByOwnerIdQuery).mockReturnValue({
      data: MOCK_OWNER_BOOKED_HOUSES,
      isLoading: false,
      isError: false,
      error: undefined,
    } as any);

    // Default `useChangeHouseCheckedStatusMutation` mock
    vi.mocked(bookingApiModule.useChangeHouseCheckedStatusMutation).mockReturnValue([
      changeHouseCheckedTriggerMock,
      { isLoading: false },
    ] as any);

    // Default `usePutchangeMaintReqStatusMutation` mock
    vi.mocked(bookingApiModule.usePutchangeMaintReqStatusMutation).mockReturnValue([
      changeMaintReqStatusTriggerMock,
      { isLoading: false },
    ] as any);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Redux `skip` Guard When Unauthenticated, Loading State & Error Toast
  // --------------------------------------------------------------------------
  it('skips query when ownerId is empty, and handles loading and error toast states', async () => {
    // 1A. Render with default unauthenticated store (`user.id === ''`) -> expects `{ skip: true }`
    const { rerender } = renderWithProviders(<Ownermainpagesecright />);
    expect(bookingApiModule.useGetRentedHousesByOwnerIdQuery).toHaveBeenCalledWith('', {
      skip: true,
    });

    // 1B. Simulate `isLoading: true` (sticky mockReturnValue across effect re-renders)
    vi.mocked(bookingApiModule.useGetRentedHousesByOwnerIdQuery).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: undefined,
    } as any);

    rerender(<Ownermainpagesecright />);
    expect(screen.getByText('Loading rented houses…')).toBeInTheDocument();

    // 1C. Simulate `isError: true` -> surfaces toast banner and empty contract fallback
    vi.mocked(bookingApiModule.useGetRentedHousesByOwnerIdQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: { data: { message: 'Failed to load owner bookings' } },
    } as any);

    rerender(<Ownermainpagesecright />);
    expect(await screen.findByText('Failed to load owner bookings')).toBeInTheDocument();
    expect(
      screen.getByText('No active rental contracts signed under your account parameters yet.')
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 2: Badges, Conditional Change Status Button, Maintenance Info & Metadata
  // --------------------------------------------------------------------------
  it('renders status badges, conditional Change Status button, maintenance info, and lease metadata', () => {
    // Render component and seed an authenticated Owner into Redux store
    const { store } = renderWithProviders(<Ownermainpagesecright />);
    store.dispatch(
      setUser({
        id: 'owner-77',
        name: 'Carlos Owner',
        email: 'carlos@estates.com',
        role: 'Owner',
        userImage: '',
      })
    );

    // Verify both house codes render
    expect(screen.getByText('House Code: OWN-101')).toBeInTheDocument();
    expect(screen.getByText('House Code: OWN-202')).toBeInTheDocument();
    expect(screen.getAllByAltText('Leased House Element Snapshot')[0]).toHaveAttribute(
      'src',
      'http://localhost:3001/uploads/owner_rented1.jpg'
    );
    expect(screen.getAllByAltText('Leased House Element Snapshot')[1]).toHaveAttribute(
      'src',
      '/images/mainownerpage/background.jpg'
    );

    // Verify status badges ("Rented" for Approved, "Not Applied" for notApplied)
    expect(screen.getByText('Rented')).toBeInTheDocument();
    expect(screen.getByText('Not Applied')).toBeInTheDocument();

    // Verify only the unapproved property (`OWN-202`) renders the "⚙ Change Status" button
    expect(screen.getAllByRole('button', { name: /Change Status/i })).toHaveLength(1);

    // Verify maintenance request text renders for `OWN-101` and fallback text renders for `OWN-202`
    expect(
      screen.getByText('Maintenance Request: Water heater needs inspection')
    ).toBeInTheDocument();
    expect(screen.getByText('No maintenance request submitted.')).toBeInTheDocument();

    // Verify lease metadata renders for `OWN-101`
    expect(screen.getByText('Left Days: 19')).toBeInTheDocument();
    expect(screen.getByText('Amnount to pay: 950 , This Month')).toBeInTheDocument();
    expect(screen.getByText('Last Payment Status: Paid')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 3: Approving a Tenant Booking (`handleChangeHouseCheckedStatus`)
  // --------------------------------------------------------------------------
  it('dispatches changeHouseCheckedStatus and shows success toast when Change Status is clicked', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Ownermainpagesecright />);

    // Click the "⚙ Change Status" button on `OWN-202` (`owner-booking-2`)
    await user.click(screen.getByRole('button', { name: /Change Status/i }));

    // Verify `changeHouseCheckedStatus` receives exact approval payload
    await waitFor(() => {
      expect(changeHouseCheckedTriggerMock).toHaveBeenCalledWith({
        houseId: 'owner-booking-2',
        OwnerChecked: true,
        approvalStatus: 'Approved',
        RentPrice: 1400,
      });
    });

    // Verify success toast appears
    expect(await screen.findByText('House status updated')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 4: Updating Maintenance Request Status (`In Progress`, `Resolved`, `Rejected`)
  // --------------------------------------------------------------------------
  it('dispatches putchangeMaintReqStatus with selected status and shows toast feedback', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Ownermainpagesecright />);

    // Click "⚙ 'In Progress'" on `OWN-101` (`owner-booking-1`)
    await user.click(screen.getByRole('button', { name: /In Progress/i }));

    await waitFor(() => {
      expect(changeMaintReqStatusTriggerMock).toHaveBeenCalledWith({
        houseId: 'owner-booking-1',
        approvalStatus: 'In Progress',
      });
    });
    expect(await screen.findByText('Maintenance status → In Progress')).toBeInTheDocument();

    // Click "⚙ 'Resolved'" on `OWN-101`
    await user.click(screen.getByRole('button', { name: /Resolved/i }));

    await waitFor(() => {
      expect(changeMaintReqStatusTriggerMock).toHaveBeenCalledWith({
        houseId: 'owner-booking-1',
        approvalStatus: 'Resolved',
      });
    });
    expect(await screen.findByText('Maintenance status → Resolved')).toBeInTheDocument();

    // Simulate backend error when clicking "⚙ 'Rejected'"
    changeMaintReqStatusTriggerMock.mockReturnValueOnce({
      unwrap: vi.fn().mockRejectedValue({
        data: { message: 'Could not reject maintenance ticket' },
      }),
    });

    await user.click(screen.getByRole('button', { name: /Rejected/i }));
    expect(await screen.findByText('Could not reject maintenance ticket')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 5: Client-Side Filtering by City
  // --------------------------------------------------------------------------
  it('filters owner rented houses dynamically by city search input', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Ownermainpagesecright />);

    // Type "Valencia" into the City filter input
    const cityInput = screen.getByPlaceholderText('City...');
    await user.type(cityInput, 'Valencia');

    // Verify `OWN-101` remains visible and `OWN-202` (Caracas) is filtered out
    expect(screen.getByText('House Code: OWN-101')).toBeInTheDocument();
    expect(screen.queryByText('House Code: OWN-202')).not.toBeInTheDocument();
  });
});