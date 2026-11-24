/*
Looking at Ownercreatehouse, there are five core behaviors to test (plus stubbing TopOwnerMenu and Footer so layout navigation components don't add unrelated router/Redux side effects):

    Initial Render, Disabled Submit Guard & Back Navigation:

        Renders "Create House Form", all property fields, keeps "Create House Element" disabled when empty, and navigates to '/owner/ownerdashboard' when "← Back to Owner Dashboard" is clicked.

    Field Blur Validation Rules (houseCode, RentPrice, pincode, description):

        Blurring invalid values displays the exact validation messages (Minimum 3 characters, valid base rent amount, valid numerical format, description is required).

    Multipart Image Selection, Preview & Remove Button (onFileSelect / onClearImage):

        Uploading an image calls URL.createObjectURL, renders "Selected property preview", and clicking "✕ Remove" calls URL.revokeObjectURL, clears the preview, and shows the required image validation message.

    Full Property Creation Flow (onSubmit -> useCreateHouseMutation -> Redirect):

        Seeds an authenticated Owner in Redux (OwnerId, OwnerEmail, OwnerName), fills out all required inputs + file upload, verifies createHouse receives the exact payload + selectedFile + owner metadata, and redirects to '/owner/ownerdashboard'.

    Backend Error Alert Handling:

        Displays the error banner when createHouse rejects or returns a response without NewHouse, without redirecting.

*/
// ============================================================================
// FILE: src/components/owner/ownercreatehouse/ownercreatehouse.test.tsx
// PURPOSE: Automated component test suite for Ownercreatehouse (Property Creation Form)
// ============================================================================

// ============================================================================
// SECTION 1: CORE TESTING & COMPONENT IMPORTS
// ============================================================================
// Import React so JSX syntax (<Ownercreatehouse />) compiles cleanly in tests
import React from 'react';
// Import `screen`, `waitFor`, and `fireEvent` to query DOM elements, await async calls, and trigger file inputs
import { screen, waitFor, fireEvent } from '@testing-library/react';
// Import `userEvent` to simulate realistic typing, blurring, and button clicks
import userEvent from '@testing-library/user-event';
// Import Vitest test runner functions, spies, and lifecycle hooks
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Import the Ownercreatehouse component under test
import Ownercreatehouse from './ownercreatehouse';
// Import our reusable Redux Toolkit <Provider> wrapper
import { renderWithProviders } from '@/test/test-utils';
// Import `setUser` action so we can seed an authenticated Owner into Redux state before rendering
import { setUser } from '@/store/slices/userSlice';
// Import the RTK Query hook module so we can spy on and control `useCreateHouseMutation` per test
import * as houseApiModule from '@/store/api/houseApi';

// ============================================================================
// SECTION 2: NEXT.JS ROUTER, LAYOUT WRAPPERS & BROWSER URL MOCKS
// ============================================================================
// Create a spy to track every route passed to `router.push(...)`
const pushMock = vi.fn();

// Mock `next/navigation` so `useRouter()` returns our controlled `pushMock` spy
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Stub layout header and footer wrappers to isolate Ownercreatehouse form logic
vi.mock('../../../layouts/topmenu/owner/TopOwnerMenu', () => ({
  default: () => <div data-testid="top-owner-menu-stub" />,
}));
vi.mock('../../../layouts/footer/footer', () => ({
  default: () => <div data-testid="footer-stub" />,
}));

// Define `URL.createObjectURL` and `URL.revokeObjectURL` safely without breaking the `URL` constructor class
const createObjectURLMock = vi.fn(() => 'blob:http://localhost:3001/mock-house-preview');
const revokeObjectURLMock = vi.fn();
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  configurable: true,
  value: createObjectURLMock,
});
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  configurable: true,
  value: revokeObjectURLMock,
});

// Mock `@/store/api/houseApi` while preserving any non-hook exports
vi.mock('@/store/api/houseApi', async (importOriginal) => {
  const actual = await importOriginal<typeof houseApiModule>();
  return {
    ...actual,
    // Spy on `useCreateHouseMutation` so we can assert multipart house creation payloads
    useCreateHouseMutation: vi.fn(),
  };
});

// ============================================================================
// SECTION 3: TEST SUITE FOR <Ownercreatehouse />
// ============================================================================
describe('Ownercreatehouse', () => {
  // Declare reusable mock trigger function for `useCreateHouseMutation`
  const createHouseTriggerMock = vi.fn();

  // Reset spies and configure default healthy RTK Query mutation behavior before each test
  beforeEach(() => {
    pushMock.mockClear();
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();
    createHouseTriggerMock.mockClear();

    // Configure default `.unwrap()` resolution returning `NewHouse`
    createHouseTriggerMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        message: 'House created successfully',
        NewHouse: { _id: 'new-house-900', houseCode: 'LUX-CARACAS-01' },
      }),
    });

    // Default `useCreateHouseMutation` mock returning our trigger function and loading state
    vi.mocked(houseApiModule.useCreateHouseMutation).mockReturnValue([
      createHouseTriggerMock,
      { isLoading: false },
    ] as any);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Initial Render, Disabled Submit Button & Back Navigation
  // --------------------------------------------------------------------------
  it('renders Create House Form, keeps submit button disabled initially, and navigates back', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Ownercreatehouse />);

    // Verify form heading and submit button disabled state
    expect(screen.getByRole('heading', { name: 'Create House Form' })).toBeInTheDocument();
    const submitButton = screen.getByRole('button', { name: 'Create House Element' });
    expect(submitButton).toBeDisabled();

    // Click "← Back to Owner Dashboard" and verify `router.push('/owner/ownerdashboard')`
    await user.click(screen.getByRole('button', { name: /Back to Owner Dashboard/i }));
    expect(pushMock).toHaveBeenCalledWith('/owner/ownerdashboard');
  });

  // --------------------------------------------------------------------------
  // TEST 2: Field Validation Messages on Blur (`houseCode`, `RentPrice`, `pincode`, `description`)
  // --------------------------------------------------------------------------
  it('displays field validation errors when invalid inputs are blurred', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Ownercreatehouse />);

    // Enter fewer than 3 chars in House Code and blur
    const houseCodeInput = screen.getByLabelText(/House Code \/ Identifier/i);
    await user.type(houseCodeInput, 'AB');
    fireEvent.blur(houseCodeInput);
    expect(
      screen.getByText('The identifier code is required (Minimum 3 characters).')
    ).toBeInTheDocument();

    // Blur Rent Price at 0
    const rentPriceInput = screen.getByLabelText(/Rent Price \(USD\)/i);
    fireEvent.blur(rentPriceInput);
    expect(
      screen.getByText('You must specify a valid base rent amount.')
    ).toBeInTheDocument();

    // Enter non-numeric Pincode and blur
    const pincodeInput = screen.getByLabelText(/Zip Code \/ Pincode/i);
    await user.type(pincodeInput, 'ABC-12');
    fireEvent.blur(pincodeInput);
    expect(
      screen.getByText('Please enter a valid numerical format.')
    ).toBeInTheDocument();

    // Blur empty Description
    const descriptionInput = screen.getByLabelText(/Detailed Property Description/i);
    fireEvent.blur(descriptionInput);
    expect(
      screen.getByText('The description is required for public catalog listing purposes.')
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 3: Property Image File Selection, Preview & Remove Action (`onFileSelect` / `onClearImage`)
  // --------------------------------------------------------------------------
  it('previews selected property image and revokes blob URL when removed', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount component
    renderWithProviders(<Ownercreatehouse />);

    // Upload a mock JPEG property photo
    const mockFile = new File(['mock-house-image'], 'villa.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/Property Image File/i) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Verify `URL.createObjectURL` was invoked and preview image + filename render
    expect(createObjectURLMock).toHaveBeenCalledWith(mockFile);
    expect(screen.getByAltText('Selected property preview')).toBeInTheDocument();
    expect(screen.getAllByText('villa.jpg').length).toBeGreaterThan(0);

    // Click "✕ Remove" and verify `URL.revokeObjectURL` cleans up and required error appears
    await user.click(screen.getByRole('button', { name: /Remove selected image/i }));
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost:3001/mock-house-preview');
    expect(screen.queryByAltText('Selected property preview')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'The reference image file is strictly required for binary multipart uploading.'
      )
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 4: Full Valid Form Submission -> `useCreateHouseMutation` -> Dashboard Redirect
  // --------------------------------------------------------------------------
  it('submits valid property payload with Owner Redux metadata and redirects to ownerdashboard', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Render component and seed authenticated Owner into Redux store
    const { store } = renderWithProviders(<Ownercreatehouse />);
    store.dispatch(
      setUser({
        id: 'owner-77',
        name: 'Carlos Owner',
        email: 'carlos@estates.com',
        role: 'Owner',
        userImage: '',
      })
    );

    // Fill all required property inputs
    await user.type(screen.getByLabelText(/House Code \/ Identifier/i), 'LUX-CARACAS-01');
    const rentInput = screen.getByLabelText(/Rent Price \(USD\)/i);
    await user.clear(rentInput);
    await user.type(rentInput, '1800');

    await user.type(screen.getByLabelText(/State \/ Region/i), 'Miranda');
    await user.type(screen.getByLabelText(/^City$/i), 'Caracas');
    await user.type(screen.getByLabelText(/Street \/ Avenue/i), 'Av. Francisco de Miranda');
    await user.type(screen.getByLabelText(/Zip Code \/ Pincode/i), '1060');
    await user.type(screen.getByLabelText(/Landmark/i), 'Near Parque del Este');

    const roomsInput = screen.getByLabelText(/Total Rooms/i);
    await user.clear(roomsInput);
    await user.type(roomsInput, '4');

    await user.type(screen.getByLabelText(/Legal Documents/i), 'deed.pdf, tax.pdf');
    await user.type(
      screen.getByLabelText(/Detailed Property Description/i),
      'Modern penthouse with panoramic Avila mountain views.'
    );

    // Select required property image file
    const mockFile = new File(['house-bytes'], 'penthouse.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Property Image File/i), {
      target: { files: [mockFile] },
    });

    // Verify submit button is now enabled and click it
    const submitButton = screen.getByRole('button', { name: 'Create House Element' });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    // Verify `createHouse` mutation received exact payload, file, and Redux owner identity
    await waitFor(() => {
      expect(createHouseTriggerMock).toHaveBeenCalledWith({
        payload: {
          houseCode: 'LUX-CARACAS-01',
          description: 'Modern penthouse with panoramic Avila mountain views.',
          pincode: '1060',
          state: 'Miranda',
          city: 'Caracas',
          street: 'Av. Francisco de Miranda',
          landmark: 'Near Parque del Este',
          totalRooms: 4,
          RentPrice: 1800,
          legalDocuments: 'deed.pdf, tax.pdf',
        },
        selectedFile: mockFile,
        OwnerId: 'owner-77',
        OwnerEmail: 'carlos@estates.com',
        OwnerName: 'Carlos Owner',
      });
    });

    // Verify redirect to `/owner/ownerdashboard`
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/owner/ownerdashboard');
    });
  });

  // --------------------------------------------------------------------------
  // TEST 5: Backend Error Handling Without Redirecting
  // --------------------------------------------------------------------------
  it('displays error banner and stays on page when createHouse mutation fails', async () => {
    // Configure `createHouse` to reject with a backend validation message
    createHouseTriggerMock.mockReturnValueOnce({
      unwrap: vi.fn().mockRejectedValue({
        data: { message: 'House code LUX-CARACAS-01 already exists' },
      }),
    });

    // Initialize `userEvent` session
    const user = userEvent.setup();
    renderWithProviders(<Ownercreatehouse />);

    // Populate minimum valid form + file
    await user.type(screen.getByLabelText(/House Code \/ Identifier/i), 'LUX-CARACAS-01');
    await user.type(screen.getByLabelText(/Rent Price \(USD\)/i), '1200');
    await user.type(screen.getByLabelText(/State \/ Region/i), 'Carabobo');
    await user.type(screen.getByLabelText(/^City$/i), 'Valencia');
    await user.type(screen.getByLabelText(/Street \/ Avenue/i), 'Av. Bolivar');
    await user.type(screen.getByLabelText(/Zip Code \/ Pincode/i), '2001');
    await user.type(screen.getByLabelText(/Total Rooms/i), '3');
    await user.type(screen.getByLabelText(/Detailed Property Description/i), 'Spacious home');

    const mockFile = new File(['house-bytes'], 'home.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Property Image File/i), {
      target: { files: [mockFile] },
    });

    // Submit form
    await user.click(screen.getByRole('button', { name: 'Create House Element' }));

    // Verify error alert renders and router does NOT navigate away
    expect(
      await screen.findByText('House code LUX-CARACAS-01 already exists')
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalledWith('/owner/ownerdashboard');
  });
});