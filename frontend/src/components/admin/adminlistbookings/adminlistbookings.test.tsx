/*
Looking at Adminlistbookings, there are five core behaviors to test (plus stubbing TopAdminMenu and Footer so layout chrome doesn't introduce unrelated router/Redux side effects):

    Loading, Error & Empty States:

        Displays "Loading bookings…" while isLoading: true, "Failed to load bookings." when isError: true, and "No bookings found matching criteria." when the list is empty.

    Booking Card Rendering & Image Fallback (onError):

        Renders property card details (Code: H101, $1200 / mo, Booked / Available badges, Verified / Unverified owner status, Status: Approved) and falls back to 'assets/fallback-house.jpg' when an image fails to load.

    Four-Way AND Filtering (House Code, City, Owner Checked, Approval Status):

        Filters across text inputs and <select> dropdowns simultaneously with strict AND semantics.

    Pagination Controls (ITEMS_PER_PAGE = 15):

        Paginates across Page 1 of 2 and Page 2 of 2 when there are 16+ booking records, toggling Previous and Next disabled states accurately.

    Admin Delete Confirmation (deleteBooking):

        Prompts window.confirm("Are you sure you want to delete booking for H101?") when "Delete" is clicked, logging the deletion request only when confirmed.
*/
// ============================================================================
// FILE: src/components/admin/adminlistbookings/adminlistbookings.test.tsx
// PURPOSE: Automated component test suite for Adminlistbookings
// ============================================================================

// ============================================================================
// SECTION 1: CORE TESTING & COMPONENT IMPORTS
// ============================================================================
// Import React so JSX syntax (<Adminlistbookings />) compiles cleanly in tests
import React from 'react';
// Import `screen` and `fireEvent` to query booking cards and simulate image errors
import { screen, fireEvent } from '@testing-library/react';
// Import `userEvent` to simulate typing in search inputs, selecting dropdown options, and clicking buttons
import userEvent from '@testing-library/user-event';
// Import Vitest test runner functions, spies, and lifecycle hooks
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Import the Adminlistbookings component under test
import Adminlistbookings from './adminlistbookings';
// Import our reusable Redux Toolkit <Provider> wrapper
import { renderWithProviders } from '@/test/test-utils';
// Import the RTK Query hook module so we can spy on and control `useGetAllBookingsDocumentsQuery`
import * as bookingApiModule from '@/store/api/bookingApi';

// ============================================================================
// SECTION 2: ENVIRONMENT, LAYOUT WRAPPERS & RTK QUERY MODULE MOCKS
// ============================================================================
// Mock `@/environments/environments` so `environment.endpointI` resolves predictably in tests
vi.mock('@/environments/environments', () => ({
  environment: {
    endpointI: 'http://localhost:3001',
  },
}));

// Stub TopAdminMenu and Footer layout components to isolate Adminlistbookings logic
vi.mock('../../layouts/topmenu/admin/TopAdminMenu', () => ({
  default: () => <div data-testid="top-admin-menu-stub" />,
}));
vi.mock('../../layouts/footer/footer', () => ({
  default: () => <div data-testid="footer-stub" />,
}));

// Mock `@/store/api/bookingApi` while preserving any non-hook exports
vi.mock('@/store/api/bookingApi', async (importOriginal) => {
  const actual = await importOriginal<typeof bookingApiModule>();
  return {
    ...actual,
    // Spy on `useGetAllBookingsDocumentsQuery` so each test can supply custom booking datasets/states
    useGetAllBookingsDocumentsQuery: vi.fn(),
  };
});

// ============================================================================
// SECTION 3: MOCK DATASET FIXTURES (16 BOOKINGS FOR 4-WAY FILTER & PAGINATION)
// ============================================================================
// Generate 16 realistic booking records so we can test 4-way AND filtering and 15-per-page pagination
const MOCK_ALL_BOOKINGS = Array.from({ length: 16 }, (_, index) => {
  const num = index + 1;
  if (num === 1) {
    return {
      _id: 'book-1',
      houseCode: 'H101',
      city: 'Valencia',
      state: 'Carabobo',
      RentPrice: 950,
      totalRooms: 3,
      booked: true,
      ownerChecked: true,
      approvalStatus: 'Approved',
      image: '/uploads/b1.jpg',
    };
  }
  if (num === 2) {
    return {
      _id: 'book-2',
      houseCode: 'H102',
      city: 'Caracas',
      state: 'Miranda',
      RentPrice: 1500,
      totalRooms: 4,
      booked: false,
      ownerChecked: false,
      approvalStatus: 'Pending',
      image: null,
    };
  }
  if (num === 3) {
    return {
      _id: 'book-3',
      houseCode: 'H103',
      city: 'Valencia',
      state: 'Carabobo',
      RentPrice: 1100,
      totalRooms: 2,
      booked: false,
      ownerChecked: false,
      approvalStatus: 'Rejected',
      image: '/uploads/b3.jpg',
    };
  }
  return {
    _id: `book-${num}`,
    houseCode: `H${100 + num}`,
    city: num === 16 ? 'Maracay' : 'Barquisimeto',
    state: 'Lara',
    RentPrice: 800,
    totalRooms: 3,
    booked: true,
    ownerChecked: true,
    approvalStatus: 'Approved',
    image: `/uploads/b${num}.jpg`,
  };
});

// ============================================================================
// SECTION 4: TEST SUITE FOR <Adminlistbookings />
// ============================================================================
describe('Adminlistbookings', () => {
  // Spy on `window.confirm` and `console.log` for delete confirmation verification
  const confirmSpy = vi.spyOn(window, 'confirm');
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // Configure default healthy RTK Query hook response before each test
  beforeEach(() => {
    confirmSpy.mockReset();
    consoleLogSpy.mockClear();

    // Default `useGetAllBookingsDocumentsQuery` mock returning our 16 bookings
    vi.mocked(bookingApiModule.useGetAllBookingsDocumentsQuery).mockReturnValue({
      data: MOCK_ALL_BOOKINGS,
      isLoading: false,
      isError: false,
    } as any);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Loading State, Backend Error State, and Empty Fallback
  // --------------------------------------------------------------------------
  it('renders loading, error, and empty bookings fallback states properly', () => {
    // 1A. Simulate `isLoading: true`
    vi.mocked(bookingApiModule.useGetAllBookingsDocumentsQuery).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    } as any);

    const { rerender } = renderWithProviders(<Adminlistbookings />);
    expect(screen.getByText('Loading bookings…')).toBeInTheDocument();

    // 1B. Simulate `isError: true`
    vi.mocked(bookingApiModule.useGetAllBookingsDocumentsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
    } as any);

    rerender(<Adminlistbookings />);
    expect(screen.getByText('Failed to load bookings.')).toBeInTheDocument();

    // 1C. Simulate empty array (`data: []`)
    vi.mocked(bookingApiModule.useGetAllBookingsDocumentsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    rerender(<Adminlistbookings />);
    expect(screen.getByText('No bookings found matching criteria.')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 2: Card Rendering, Status Badges & Image Fallback (`onError`)
  // --------------------------------------------------------------------------
  it('renders booking card details, status badges, and falls back on broken images', () => {
    // Mount component
    renderWithProviders(<Adminlistbookings />);

    // Verify heading and first booking card details render properly
    expect(
      screen.getByRole('heading', { name: 'List Bookings - Administrator' })
    ).toBeInTheDocument();
    expect(screen.getByText('Code: H101')).toBeInTheDocument();
    expect(screen.getByText('$950 / mo')).toBeInTheDocument();
    expect(screen.getByText('Status: Approved')).toBeInTheDocument();

    // Verify image `onError` switches `src` to `'assets/fallback-house.jpg'`
    const images = screen.getAllByAltText('House Image') as HTMLImageElement[];
    expect(images[0].src).toContain('/uploads/b1.jpg');

    fireEvent.error(images[0]);
    expect(images[0].src).toContain('assets/fallback-house.jpg');
  });

  // --------------------------------------------------------------------------
  // TEST 3: Four-Way AND Filtering (`House Code`, `City`, `Owner Checked`, `Approval Status`)
  // --------------------------------------------------------------------------
  it('filters bookings using AND semantics across all four search controls', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Adminlistbookings />);

    // Grab all 4 filter controls by their `<label>` text
    const houseCodeInput = screen.getByLabelText('House Code');
    const cityInput = screen.getByLabelText('City');
    const ownerCheckedSelect = screen.getByLabelText('Owner Checked');
    const approvalStatusSelect = screen.getByLabelText('Approval Status');

    // Filter by City = "Valencia" -> matches H101 (Approved/Verified) and H103 (Rejected/Unverified)
    await user.type(cityInput, 'Valencia');
    expect(screen.getByText('Code: H101')).toBeInTheDocument();
    expect(screen.getByText('Code: H103')).toBeInTheDocument();
    expect(screen.queryByText('Code: H102')).not.toBeInTheDocument();

    // Narrow by Owner Checked = "false" (Unchecked) -> eliminates H101, leaving only H103
    await user.selectOptions(ownerCheckedSelect, 'false');
    expect(screen.getByText('Code: H103')).toBeInTheDocument();
    expect(screen.queryByText('Code: H101')).not.toBeInTheDocument();

    // Reset Owner Checked & City, then filter by House Code = "H10" and Approval Status = "pending"
    await user.selectOptions(ownerCheckedSelect, 'all');
    await user.clear(cityInput);
    await user.type(houseCodeInput, 'H10');
    await user.selectOptions(approvalStatusSelect, 'pending');

    expect(screen.getByText('Code: H102')).toBeInTheDocument();
    expect(screen.queryByText('Code: H101')).not.toBeInTheDocument();
    expect(screen.queryByText('Code: H103')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 4: Pagination Controls (`ITEMS_PER_PAGE = 15` -> Page 1 of 2 & Page 2 of 2)
  // --------------------------------------------------------------------------
  it('paginates bookings across pages when count exceeds 15 items', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component with 16 mock bookings (15 on Page 1, 1 on Page 2)
    renderWithProviders(<Adminlistbookings />);

    // Verify Page 1 indicator and 16th booking (`Code: H116` / `Maracay`) is hidden on Page 1
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Code: H101')).toBeInTheDocument();
    expect(screen.queryByText('Code: H116')).not.toBeInTheDocument();

    // Verify Previous starts disabled and Next is enabled
    const prevButton = screen.getByRole('button', { name: 'Previous' });
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    // Click "Next" -> advances to Page 2 and shows `Code: H116`
    await user.click(nextButton);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('Code: H116')).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
    expect(prevButton).toBeEnabled();

    // Click "Previous" -> returns to Page 1
    await user.click(prevButton);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Code: H101')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 5: Administrative Delete Confirmation (`deleteBooking`)
  // --------------------------------------------------------------------------
  it('prompts confirmation dialog and logs delete request only when confirmed', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Adminlistbookings />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });

    // 5A. Admin cancels confirmation -> should NOT log deletion
    confirmSpy.mockReturnValueOnce(false);
    await user.click(deleteButtons[0]);
    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete booking for H101?'
    );
    expect(consoleLogSpy).not.toHaveBeenCalled();

    // 5B. Admin confirms deletion -> logs `'Booking delete requested for:', 'H101'`
    confirmSpy.mockReturnValueOnce(true);
    await user.click(deleteButtons[0]);
    expect(consoleLogSpy).toHaveBeenCalledWith('Booking delete requested for:', 'H101');
  });
});