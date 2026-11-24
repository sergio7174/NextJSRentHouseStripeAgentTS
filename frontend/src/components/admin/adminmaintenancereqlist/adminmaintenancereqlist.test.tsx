/*
Looking at Adminmaintenancereqlist, there are five core behaviors to test (plus stubbing TopAdminMenu and Footer so layout chrome doesn't introduce unrelated router/Redux side effects):

    Loading, Error & Empty Table States:

        Displays "Loading maintenance requests…" while isLoading: true, "Failed to communicate with MongoDB backend services." when isError: true, and "No active maintenance request documents found matching criteria." when the list is empty.

    Rendering Maintenance Rows & Status Badges:

        Renders all table columns (House Code, State, City, Detailed Maintenance Request, Execution Status, and Delete action button) across the admin list.

    Dual-Field AND Filtering (Filter by House Code + Filter by City Area):

        Filters rows dynamically when typing into Filter by House Code, Filter by City Area, or both simultaneously.

    Pagination Controls (ITEMS_PER_PAGE = 15):

        Paginates across Page 1 of 2 and Page 2 of 2 when there are 16+ maintenance records, toggling Previous and Next disabled states accurately.

    Admin Delete Confirmation & Rollback (deleteRequest):

        Prompts window.confirm(...) when clicking "Delete", cancels safely without calling editbookingdeletemaintreq if the admin clicks Cancel, calls editbookingdeletemaintreq(bookingId) when confirmed, and triggers refetch() if the backend deletion rejects.

*/
// ============================================================================
// FILE: src/components/admin/adminmaintenancereqlist/adminmaintenancereqlist.test.tsx
// PURPOSE: Automated component test suite for Adminmaintenancereqlist
// ============================================================================

// ============================================================================
// SECTION 1: CORE TESTING & COMPONENT IMPORTS
// ============================================================================
// Import React so JSX syntax (<Adminmaintenancereqlist />) compiles cleanly in tests
import React from 'react';
// Import `screen` and `waitFor` to query table rows/cells and await async mutation calls
import { screen, waitFor } from '@testing-library/react';
// Import `userEvent` to simulate realistic typing in filter inputs and clicking Delete/pagination buttons
import userEvent from '@testing-library/user-event';
// Import Vitest test runner functions, spies, and lifecycle hooks
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Import the Adminmaintenancereqlist component under test
import Adminmaintenancereqlist from './adminmaintenancereqlist';
// Import our reusable Redux Toolkit <Provider> wrapper
import { renderWithProviders } from '@/test/test-utils';
// Import the RTK Query hook modules so we can spy on and control query/mutation responses per test
import * as dashboardApiModule from '@/store/api/dashboardApi';
import * as bookingApiModule from '@/store/api/bookingApi';

// ============================================================================
// SECTION 2: LAYOUT WRAPPERS & RTK QUERY MODULE MOCKS
// ============================================================================
// Stub TopAdminMenu and Footer layout components to isolate Adminmaintenancereqlist logic
vi.mock('../../layouts/topmenu/admin/TopAdminMenu', () => ({
  default: () => <div data-testid="top-admin-menu-stub" />,
}));
vi.mock('../../layouts/footer/footer', () => ({
  default: () => <div data-testid="footer-stub" />,
}));

// Mock `@/store/api/dashboardApi` while preserving any non-hook exports
vi.mock('@/store/api/dashboardApi', async (importOriginal) => {
  const actual = await importOriginal<typeof dashboardApiModule>();
  return {
    ...actual,
    // Spy on `useGetallMaintenanceRequestsQuery` so each test can supply custom request lists/states
    useGetallMaintenanceRequestsQuery: vi.fn(),
  };
});

// Mock `@/store/api/bookingApi` while preserving any non-hook exports
vi.mock('@/store/api/bookingApi', async (importOriginal) => {
  const actual = await importOriginal<typeof bookingApiModule>();
  return {
    ...actual,
    // Spy on `useEditbookingdeletemaintreqMutation` so we can assert administrative delete calls
    useEditbookingdeletemaintreqMutation: vi.fn(),
  };
});

// ============================================================================
// SECTION 3: MOCK DATASET FIXTURES (16 MAINTENANCE REQUESTS FOR FILTER & PAGINATION)
// ============================================================================
// Generate 16 realistic maintenance records so we can test both dual filtering and 15-per-page pagination
const MOCK_MAINTENANCE_REQUESTS = Array.from({ length: 16 }, (_, index) => {
  const num = index + 1;
  if (num === 1) {
    return {
      _id: 'maint-1',
      houseCode: 'H-401',
      state: 'Carabobo',
      city: 'Valencia',
      maintenaceRequest: 'Main pipe water leak in bathroom',
      maintenaceRequestStatus: 'In Progress',
    };
  }
  if (num === 2) {
    return {
      _id: 'maint-2',
      houseCode: 'H-402',
      state: 'Miranda',
      city: 'Caracas',
      maintenaceRequest: 'Broken balcony sliding door lock',
      maintenaceRequestStatus: 'Pending',
    };
  }
  return {
    _id: `maint-${num}`,
    houseCode: `H-${400 + num}`,
    state: 'Aragua',
    city: num === 16 ? 'Maracay' : 'Turmero',
    maintenaceRequest: `Routine electrical inspection #${num}`,
    maintenaceRequestStatus: 'Resolved',
  };
});

// ============================================================================
// SECTION 4: TEST SUITE FOR <Adminmaintenancereqlist />
// ============================================================================
describe('Adminmaintenancereqlist', () => {
  // Declare reusable mock functions for query refetch and delete mutation trigger
  const refetchMock = vi.fn();
  const deleteMaintReqTriggerMock = vi.fn();
  const confirmSpy = vi.spyOn(window, 'confirm');

  // Reset spies and configure default healthy RTK Query hook responses before each test
  beforeEach(() => {
    refetchMock.mockClear();
    deleteMaintReqTriggerMock.mockClear();
    confirmSpy.mockReset();

    // Default `window.confirm` to `true` (admin confirms deletion) unless overridden in a test
    confirmSpy.mockReturnValue(true);

    // Configure default `.unwrap()` resolution for `editbookingdeletemaintreq`
    deleteMaintReqTriggerMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ message: 'Maintenance request deleted' }),
    });

    // Default `useGetallMaintenanceRequestsQuery` mock returning our 16 maintenance requests
    vi.mocked(dashboardApiModule.useGetallMaintenanceRequestsQuery).mockReturnValue({
      data: MOCK_MAINTENANCE_REQUESTS,
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    } as any);

    // Default `useEditbookingdeletemaintreqMutation` mock returning our trigger function
    vi.mocked(bookingApiModule.useEditbookingdeletemaintreqMutation).mockReturnValue([
      deleteMaintReqTriggerMock,
      { isLoading: false },
    ] as any);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Loading State, Backend Error State, and Empty Table Fallback
  // --------------------------------------------------------------------------
  it('renders loading, error, and empty table states properly', () => {
    // 1A. Simulate `isLoading: true`
    vi.mocked(dashboardApiModule.useGetallMaintenanceRequestsQuery).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      refetch: refetchMock,
    } as any);

    const { rerender } = renderWithProviders(<Adminmaintenancereqlist />);
    expect(screen.getByText('Loading maintenance requests…')).toBeInTheDocument();

    // 1B. Simulate `isError: true`
    vi.mocked(dashboardApiModule.useGetallMaintenanceRequestsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch: refetchMock,
    } as any);

    rerender(<Adminmaintenancereqlist />);
    expect(
      screen.getByText('Failed to communicate with MongoDB backend services.')
    ).toBeInTheDocument();

    // 1C. Simulate empty array (`data: []`)
    vi.mocked(dashboardApiModule.useGetallMaintenanceRequestsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    } as any);

    rerender(<Adminmaintenancereqlist />);
    expect(
      screen.getByText('No active maintenance request documents found matching criteria.')
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 2: Dual-Field AND Filtering (`Filter by House Code` + `Filter by City Area`)
  // --------------------------------------------------------------------------
  it('filters maintenance requests by House Code and City Area with AND semantics', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Adminmaintenancereqlist />);

    // Verify initial rows render properly
    expect(screen.getByText('H-401')).toBeInTheDocument();
    expect(screen.getByText('Main pipe water leak in bathroom')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();

    // Grab the two filter inputs by their `<label>` text
    const houseCodeInput = screen.getByLabelText('Filter by House Code');
    const cityInput = screen.getByLabelText('Filter by City Area');

    // Type "H-40" -> matches H-401, H-402, and H-403 (`400 + 3`), while excluding H-404+
    // Type "H-40" -> matches H-401..H-404, while excluding H-410
    await user.type(houseCodeInput, 'H-40');
    expect(screen.getByText('H-401')).toBeInTheDocument();
    expect(screen.getByText('H-402')).toBeInTheDocument();
    expect(screen.queryByText('H-410')).not.toBeInTheDocument();

    // Narrow further by typing "Caracas" in City Area -> leaves only H-402
    await user.type(cityInput, 'Caracas');
    expect(screen.getByText('H-402')).toBeInTheDocument();
    expect(screen.queryByText('H-401')).not.toBeInTheDocument();
    expect(screen.getByText('H-402')).toBeInTheDocument();
    expect(screen.queryByText('H-401')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 3: Pagination Controls (`ITEMS_PER_PAGE = 15` -> Page 1 of 2 & Page 2 of 2)
  // --------------------------------------------------------------------------
  it('paginates maintenance requests across pages when count exceeds 15 items', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component with 16 mock requests (15 on Page 1, 1 on Page 2)
    renderWithProviders(<Adminmaintenancereqlist />);

    // Verify Page 1 indicator and 16th item (`H-416` / `Maracay`) is hidden on Page 1
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('H-401')).toBeInTheDocument();
    expect(screen.queryByText('H-416')).not.toBeInTheDocument();

    // Verify Previous starts disabled and Next is enabled
    const prevButton = screen.getByRole('button', { name: 'Previous' });
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    // Click "Next" -> advances to Page 2 and renders `H-416`
    await user.click(nextButton);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('H-416')).toBeInTheDocument();
    expect(screen.getByText('Maracay')).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
    expect(prevButton).toBeEnabled();

    // Click "Previous" -> returns to Page 1
    await user.click(prevButton);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('H-401')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 4: Administrative Deletion with Confirmation Dialog & Error Rollback
  // --------------------------------------------------------------------------
  it('prompts confirmation before deleting, cancels safely, deletes on confirm, and refetches on error', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Adminmaintenancereqlist />);

    // 4A. Simulate Admin clicking "Cancel" in `window.confirm` -> mutation must NOT fire
    confirmSpy.mockReturnValueOnce(false);
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to permanently delete maintenance request document for house code H-401 from MongoDB?'
    );
    expect(deleteMaintReqTriggerMock).not.toHaveBeenCalled();

    // 4B. Simulate Admin confirming deletion -> calls `editbookingdeletemaintreq('maint-1')`
    confirmSpy.mockReturnValueOnce(true);
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteMaintReqTriggerMock).toHaveBeenCalledWith('maint-1');
    });

    // 4C. Simulate backend rejection on delete -> calls `refetch()` to restore authoritative state
    confirmSpy.mockReturnValueOnce(true);
    deleteMaintReqTriggerMock.mockReturnValueOnce({
      unwrap: vi.fn().mockRejectedValue(new Error('MongoDB delete failed')),
    });

    await user.click(deleteButtons[1]);
    await waitFor(() => {
      expect(deleteMaintReqTriggerMock).toHaveBeenCalledWith('maint-2');
      expect(refetchMock).toHaveBeenCalledTimes(1);
    });
  });
});