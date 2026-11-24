// ============================================================================
// FILE: src/components/tenant/tenantmainpagesecright/tenantmainpagesecright.test.tsx
// PURPOSE: Automated component test suite for Tenantmainpagesecright (Rented Houses & Maintenance)
// ============================================================================

// ============================================================================
// SECTION 1: CORE TESTING & COMPONENT IMPORTS
// ============================================================================
// Import React so JSX syntax (<Tenantmainpagesecright />) compiles cleanly in tests
import React from 'react';
// Import `screen` and `waitFor` to query rendered DOM nodes and await async state transitions
import { screen, waitFor } from '@testing-library/react';
// Import `userEvent` to simulate realistic typing in search/textarea fields and button clicks
import userEvent from '@testing-library/user-event';
// Import Vitest test runner functions, spies, and lifecycle hooks
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Import the Tenantmainpagesecright component under test
import Tenantmainpagesecright from './tenantmainpagesecright';
// Import our reusable Redux Toolkit <Provider> wrapper
import { renderWithProviders } from '@/test/test-utils';
// Import `setUser` action so we can seed an authenticated Tenant into Redux state before rendering
import { setUser } from '@/store/slices/userSlice';
// Import the RTK Query hook module so we can spy on and control query/mutation responses per test
import * as bookingApiModule from '@/store/api/bookingApi';

// ============================================================================
// SECTION 2: ENVIRONMENT & RTK QUERY MODULE MOCKS
// ============================================================================
// Mock `@/environments/environments` so `environment.endpointI` resolves predictably in tests
vi.mock('@/environments/environments', () => ({
  // Provide a deterministic backend base URL for image concatenation (`baseUrl + asset.image`)
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
    // Spy on `useGetRentedHousesByTenantIdQuery` so each test can supply custom lease lists/states
    useGetRentedHousesByTenantIdQuery: vi.fn(),
    // Spy on `usePutMaintenanceReqCreateMutation` so we can assert maintenance request payloads
    usePutMaintenanceReqCreateMutation: vi.fn(),
  };
});

// ============================================================================
// SECTION 3: MOCK DATASET FIXTURES (RENTED LEASES)
// ============================================================================
// Create realistic rented house contracts covering Approved (no request), Approved (existing request), and notApplied
const MOCK_RENTED_HOUSES = [
  {
    _id: 'booking-1',
    houseCode: 'VLA-101',
    city: 'Valencia',
    state: 'Carabobo',
    RentPrice: 850,
    image: '/uploads/rented1.jpg',
    approvalStatus: 'Approved',
    ownerChecked: true,
    maintenaceRequest: '',
    maintenaceRequestStatus: '',
    leftdays: 22,
    initialAmountToPay: 850,
    lastPaymentStatus: 'Paid',
  },
  {
    _id: 'booking-2',
    houseCode: 'CCS-202',
    city: 'Caracas',
    state: 'Miranda',
    RentPrice: 1600,
    image: null,
    approvalStatus: 'Approved',
    ownerChecked: true,
    maintenaceRequest: 'Leaking kitchen faucet',
    maintenaceRequestStatus: 'Pending',
    leftdays: 15,
    initialAmountToPay: 1600,
    lastPaymentStatus: 'Pending',
  },
  {
    _id: 'booking-3',
    houseCode: 'MCY-303',
    city: 'Maracay',
    state: 'Aragua',
    RentPrice: 700,
    image: '/uploads/rented3.jpg',
    approvalStatus: 'notApplied',
    ownerChecked: false,
    maintenaceRequest: '',
    maintenaceRequestStatus: '',
  },
];

// ============================================================================
// SECTION 4: TEST SUITE FOR <Tenantmainpagesecright />
// ============================================================================
describe('Tenantmainpagesecright', () => {
  // Declare reusable mock functions for query refetch and maintenance mutation trigger
  const refetchMock = vi.fn();
  const putMaintenanceTriggerMock = vi.fn();

  // Reset all spies and configure default healthy RTK Query hook responses before each test
  beforeEach(() => {
    // Clear call history on spies
    refetchMock.mockClear();
    putMaintenanceTriggerMock.mockClear();

    // Configure default `.unwrap()` resolution for `putMaintenanceReqCreate`
    putMaintenanceTriggerMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        maintenaceRequestCreated: true,
        message: 'Created',
      }),
    });

    // Default `useGetRentedHousesByTenantIdQuery` mock returning our 3 rented contracts
    vi.mocked(bookingApiModule.useGetRentedHousesByTenantIdQuery).mockReturnValue({
      data: MOCK_RENTED_HOUSES,
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: refetchMock,
    } as any);

    // Default `usePutMaintenanceReqCreateMutation` mock returning our trigger function and loading flag
    vi.mocked(bookingApiModule.usePutMaintenanceReqCreateMutation).mockReturnValue([
      putMaintenanceTriggerMock,
      { isLoading: false },
    ] as any);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Redux `skip` Guard When Unauthenticated, Loading State & Error Toast
  // --------------------------------------------------------------------------
  it('skips query when tenantId is empty, and handles loading and error toast states', async () => {
    // 1A. Render with default unauthenticated store (`user.id === ''`) -> expects `{ skip: true }`
    const { rerender } = renderWithProviders(<Tenantmainpagesecright />);
    expect(bookingApiModule.useGetRentedHousesByTenantIdQuery).toHaveBeenCalledWith('', {
      skip: true,
    });

    // 1B. Simulate `isLoading: true` (use sticky `mockReturnValue` across effect re-renders)
    vi.mocked(bookingApiModule.useGetRentedHousesByTenantIdQuery).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: undefined,
      refetch: refetchMock,
    } as any);

    rerender(<Tenantmainpagesecright />);
    expect(screen.getByText('Loading rented houses…')).toBeInTheDocument();

    // 1C. Simulate `isError: true` -> surfaces toast banner and empty contract fallback
    vi.mocked(bookingApiModule.useGetRentedHousesByTenantIdQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: { data: { message: 'Failed to fetch tenant leases' } },
      refetch: refetchMock,
    } as any);

    rerender(<Tenantmainpagesecright />);
    expect(await screen.findByText('Failed to fetch tenant leases')).toBeInTheDocument();
    expect(
      screen.getByText('No active rental contracts signed under your account parameters yet.')
    ).toBeInTheDocument();
  });
  // --------------------------------------------------------------------------
  // TEST 2: Approval Status Badges, Existing Maintenance Info & Lease Metadata
  // --------------------------------------------------------------------------
  it('renders approval badges, existing maintenance request info, and conditional lease metadata', () => {
    // Render component and seed authenticated Tenant into Redux store
    const { store } = renderWithProviders(<Tenantmainpagesecright />);
    store.dispatch(
      setUser({
        id: 'tenant-55',
        name: 'Sergio Moncada',
        email: 'sergio.tenant@example.com',
        role: 'Tenant',
        userImage: '',
      })
    );

    // Verify all 3 house codes render
    expect(screen.getByText('VLA-101')).toBeInTheDocument();
    expect(screen.getByText('CCS-202')).toBeInTheDocument();
    expect(screen.getByText('MCY-303')).toBeInTheDocument();

    // Verify status badges ("Rented" for Approved contracts, "Not Applied" for notApplied contract)
    expect(screen.getAllByText('Rented')).toHaveLength(2);
    expect(screen.getByText('Not Applied')).toBeInTheDocument();

    // Verify existing maintenance request & status render on `CCS-202`
    expect(screen.getByText(/Maintenance Request: Leaking kitchen faucet/i)).toBeInTheDocument();
    expect(screen.getByText(/Maintenance Request Status: Pending/i)).toBeInTheDocument();

    // Verify only `VLA-101` (Approved + no existing request) shows the "Create Maintenance Request" button
    expect(screen.getAllByRole('button', { name: /Create Maintenance Request/i })).toHaveLength(1);

    // Verify conditional lease metadata blocks render on `VLA-101`
    expect(screen.getByText('Left Days: 22')).toBeInTheDocument();
    expect(screen.getByText('Amnount to pay: 850 , This Month')).toBeInTheDocument();
    expect(screen.getByText('Last Payment Status: Paid')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 3: Client-Side Filtering by City and Max Price
  // --------------------------------------------------------------------------
  it('filters rented houses dynamically by city and maxPrice', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Tenantmainpagesecright />);

    // Grab City and Max Price filter inputs
    const cityInput = screen.getByPlaceholderText('City...');
    const maxPriceInput = screen.getByPlaceholderText('Max Price');

    // Filter by City = "Valencia" -> only `VLA-101` remains visible
    await user.type(cityInput, 'Valencia');
    expect(screen.getByText('VLA-101')).toBeInTheDocument();
    expect(screen.queryByText('CCS-202')).not.toBeInTheDocument();
    expect(screen.queryByText('MCY-303')).not.toBeInTheDocument();

    // Clear City filter and set Max Price to 800 -> only `MCY-303` ($700) matches
    await user.clear(cityInput);
    await user.clear(maxPriceInput);
    await user.type(maxPriceInput, '800');
    expect(screen.getByText('MCY-303')).toBeInTheDocument();
    expect(screen.queryByText('VLA-101')).not.toBeInTheDocument();
    expect(screen.queryByText('CCS-202')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 4: Successful Maintenance Request Creation, Toast & Refetch
  // --------------------------------------------------------------------------
  it('opens maintenance form, validates non-empty text, submits request, shows success toast, and refetches', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Tenantmainpagesecright />);

    // Open the maintenance request form for `VLA-101` (`booking-1`)
    await user.click(screen.getByRole('button', { name: /Create Maintenance Request/i }));

    // Locate the textarea and Submit button
    const textarea = screen.getByPlaceholderText('Enter your maintenance request');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    // Submit button must start disabled while textarea is empty
    expect(submitButton).toBeDisabled();

    // Type a valid maintenance issue description
    await user.type(textarea, 'Air conditioner is not cooling properly');
    expect(submitButton).toBeEnabled();

    // Submit the form
    await user.click(submitButton);

    // Verify `putMaintenanceReqCreate` was called with exact `id` and `maintenaceRequest` payload
    await waitFor(() => {
      expect(putMaintenanceTriggerMock).toHaveBeenCalledWith({
        id: 'booking-1',
        payload: { maintenaceRequest: 'Air conditioner is not cooling properly' },
      });
    });

    // Verify success toast appears, form closes, and `refetch()` runs
    expect(await screen.findByText('House Edited successfully')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter your maintenance request')).not.toBeInTheDocument();
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // TEST 5: Cancel Button & Backend Submission Error Toast Handling
  // --------------------------------------------------------------------------
  it('closes form on Cancel and displays an error toast if maintenance creation fails', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Tenantmainpagesecright />);

    // Open the maintenance form and verify clicking Cancel hides it without calling the mutation
    await user.click(screen.getByRole('button', { name: /Create Maintenance Request/i }));
    expect(screen.getByPlaceholderText('Enter your maintenance request')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByPlaceholderText('Enter your maintenance request')).not.toBeInTheDocument();
    expect(putMaintenanceTriggerMock).not.toHaveBeenCalled();

    // Re-open form and simulate backend rejection on submit
    putMaintenanceTriggerMock.mockReturnValueOnce({
      unwrap: vi.fn().mockRejectedValue({
        data: { message: 'Unable to register maintenance request' },
      }),
    });

    await user.click(screen.getByRole('button', { name: /Create Maintenance Request/i }));
    await user.type(
      screen.getByPlaceholderText('Enter your maintenance request'),
      'Broken front door lock'
    );
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    // Verify error toast surfaces and form stays open so the user does not lose their text
    expect(
      await screen.findByText('Unable to register maintenance request')
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your maintenance request')).toBeInTheDocument();
  });
});