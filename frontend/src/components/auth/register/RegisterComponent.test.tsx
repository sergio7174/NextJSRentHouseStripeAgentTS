// ============================================================================
// FILE: src/components/auth/register/RegisterComponent.test.tsx
// PURPOSE: Automated component & integration test suite for RegisterComponent
// ============================================================================

// ============================================================================
// SECTION 1: CORE TESTING & COMPONENT IMPORTS
// ============================================================================
// Import React so JSX syntax (<RegisterComponent />) compiles cleanly in tests
import React from 'react';
// Import `screen`, `waitFor`, and `fireEvent` to query DOM nodes, await async updates, and trigger file inputs
import { screen, waitFor, fireEvent } from '@testing-library/react';
// Import `userEvent` to simulate realistic typing, clearing, and button clicks
import userEvent from '@testing-library/user-event';
// Import Vitest test functions, spies, and lifecycle hooks
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
// Import `http` and `HttpResponse` from Mock Service Worker (MSW) to intercept backend requests
import { http, HttpResponse } from 'msw';
// Import `setupServer` from `msw/node` to run our mock HTTP server inside Node/jsdom
import { setupServer } from 'msw/node';
// Import the RegisterComponent under test
import RegisterComponent from './RegisterComponent';
// Import our reusable Redux Toolkit <Provider> wrapper
import { renderWithProviders } from '@/test/test-utils';

// ============================================================================
// SECTION 2: NEXT.JS ROUTER & BROWSER API MOCKS
// ============================================================================
// Create a spy to track every route passed to `router.push(...)`
const pushMock = vi.fn();

// Mock `next/navigation` so `useRouter()` returns our controlled `pushMock` spy
vi.mock('next/navigation', () => ({
  // Return mock router methods whenever RegisterComponent invokes `useRouter()`
  useRouter: () => ({
    // Track navigation calls (e.g., `router.push('/login')`)
    push: pushMock,
    // Stub `replace`
    replace: vi.fn(),
    // Stub `prefetch`
    prefetch: vi.fn(),
  }),
}));

// Define `URL.createObjectURL` safely WITHOUT overwriting the native `URL` constructor class
const createObjectURLMock = vi.fn(() => 'blob:http://localhost:3001/mock-avatar-preview');
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  configurable: true,
  value: createObjectURLMock,
});

// ============================================================================
// SECTION 3: MOCK SERVICE WORKER (MSW) BACKEND API SIMULATION
// ============================================================================
// Create an MSW server intercepting your exact Express registration endpoint (`/api/auth/signUp`)
const server = setupServer(
  // Intercept POST requests to `/api/auth/signUp` on any port (3000 or 3001)
  http.post('*/api/auth/signUp', async () => {
    // Return HTTP 201 Created with a mock registered user payload
    return HttpResponse.json(
      {
        message: 'User registered successfully',
        user: {
          _id: 'new-user-101',
          fullName: 'Sergio Moncada',
          email: 'sergio@example.com',
          role: 'Owner',
        },
      },
      { status: 201 }
    );
  })
);

// Start the MSW server once before running the test suite
beforeAll(() => server.listen({ onUnhandledFrame: 'bypass' }));
// Reset per-test MSW handler overrides after each test
afterEach(() => server.resetHandlers());
// Close the MSW server once all tests complete
afterAll(() => server.close());

// ============================================================================
// SECTION 4: TEST SUITE FOR <RegisterComponent />
// ============================================================================
describe('RegisterComponent', () => {
  // Reset spies before each individual test
  beforeEach(() => {
    // Clear call history on `pushMock`
    pushMock.mockClear();
    // Clear call history on `URL.createObjectURL`
    createObjectURLMock.mockClear();
    // Clear call history on `window.alert` (stubbed globally in `setupTests.ts`)
    vi.mocked(window.alert).mockClear();
  });

  // --------------------------------------------------------------------------
  // TEST 1: Initial Rendering, Disabled Register Button & Back Button Redirect
  // --------------------------------------------------------------------------
  it('renders all registration inputs, keeps Register disabled initially, and navigates back to /login', async () => {
    // Initialize `userEvent` for button clicking
    const user = userEvent.setup();
    // Mount RegisterComponent inside a fresh Redux store provider
    renderWithProviders(<RegisterComponent />);

    // Verify main headings and branding render properly
    expect(screen.getByText(/House Rental System/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Register/i })).toBeInTheDocument();

    // Verify all 6 required form fields render by their placeholder text
    expect(screen.getByPlaceholderText('Please, Enter your Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Please, Enter your Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Please, Enter your Id')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Please, Enter your Phone #')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();

    // Verify the Register submit button starts disabled when the form is empty
    const registerButton = screen.getByRole('button', { name: /^Register$/i });
    expect(registerButton).toBeDisabled();

    // Click the "Back" button and verify it redirects to `/login`
    const backButton = screen.getByRole('button', { name: /^Back$/i });
    await user.click(backButton);
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  // --------------------------------------------------------------------------
  // TEST 2: Required Field Validation & Password Mismatch Guard
  // --------------------------------------------------------------------------
  it('displays required field errors and detects password mismatch', async () => {
    // Initialize `userEvent` session
    const user = userEvent.setup();
    // Mount RegisterComponent
    renderWithProviders(<RegisterComponent />);

    // Grab username and password inputs
    const usernameInput = screen.getByPlaceholderText('Please, Enter your Username');
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');

    // Touch and clear username to trigger required error
    await user.type(usernameInput, 'a');
    await user.clear(usernameInput);
    expect(await screen.findByText('Username is required*')).toBeInTheDocument();

    // Enter two non-matching passwords to verify the mismatch warning and disabled submit state
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Different456');

    // Verify `"Password mismatch*"` renders in the DOM
    expect(await screen.findByText('Password mismatch*')).toBeInTheDocument();
    // Verify Register button remains disabled while passwords do not match
    expect(screen.getByRole('button', { name: /^Register$/i })).toBeDisabled();
  });

  // --------------------------------------------------------------------------
  // TEST 3: User Image File Selection & Preview Generation (`changeImg`)
  // --------------------------------------------------------------------------
  it('generates and displays an image preview when a user selects a profile picture', () => {
    // Mount RegisterComponent
    renderWithProviders(<RegisterComponent />);

    // Create a fake PNG File object
    const mockFile = new File(['dummy-image-bytes'], 'avatar.png', { type: 'image/png' });
    // Locate the file input element by its associated label `"Add User Picture:"`
    const fileInput = screen.getByLabelText(/Add User Picture:/i) as HTMLInputElement;

    // Trigger the `onChange` event with our mock file
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Verify `URL.createObjectURL` was called with the selected file
    expect(createObjectURLMock).toHaveBeenCalledWith(mockFile);

    // Verify the preview `<img>` tag now appears in the DOM with the generated blob URL
    const previewImg = screen.getByAltText('Preview') as HTMLImageElement;
    expect(previewImg).toBeInTheDocument();
    expect(previewImg.src).toBe('blob:http://localhost:3001/mock-avatar-preview');
  });

  // --------------------------------------------------------------------------
  // TEST 4: Full Successful Registration Flow -> Alert -> Redirect to /login
  // --------------------------------------------------------------------------
  it('submits valid registration data, alerts success, and redirects to /login', async () => {
    // Set `userChoice` in `localStorage` to simulate registering as an Owner
    localStorage.setItem('userChoice', 'Owner');

    // Start `userEvent` session
    const user = userEvent.setup();
    // Mount RegisterComponent
    renderWithProviders(<RegisterComponent />);

    // Fill out all 6 required fields with valid matching data
    await user.type(screen.getByPlaceholderText('Please, Enter your Username'), 'Sergio Moncada');
    await user.type(screen.getByPlaceholderText('Please, Enter your Email'), 'sergio@example.com');
    await user.type(screen.getByPlaceholderText('Please, Enter your Id'), 'V-12345678');
    await user.type(screen.getByPlaceholderText('Please, Enter your Phone #'), '+584121234567');
    await user.type(screen.getByPlaceholderText('Enter Password'), 'Secret123!');
    await user.type(screen.getByPlaceholderText('Confirm Password'), 'Secret123!');

    // Wait for `react-hook-form` to validate all inputs and enable the Register button
    const registerButton = screen.getByRole('button', { name: /^Register$/i });
    await waitFor(() => expect(registerButton).toBeEnabled());

    // Submit the registration form
    await user.click(registerButton);

    // Verify the success alert fires and Next.js redirects the user to `/login`
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Registration successful! Please log in.');
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
  });

  // --------------------------------------------------------------------------
  // TEST 5: Handles Backend Registration Error Gracefully
  // --------------------------------------------------------------------------
  it('shows failure alert and stays on register page if backend returns an error', async () => {
    // Override MSW to return HTTP 400 Bad Request (e.g., email already exists)
    server.use(
      http.post('*/api/auth/signUp', () => {
        return HttpResponse.json({ message: 'Email already registered' }, { status: 400 });
      })
    );

    // Start `userEvent` session
    const user = userEvent.setup();
    // Mount RegisterComponent
    renderWithProviders(<RegisterComponent />);

    // Fill out valid form fields
    await user.type(screen.getByPlaceholderText('Please, Enter your Username'), 'Sergio Moncada');
    await user.type(screen.getByPlaceholderText('Please, Enter your Email'), 'sergio@example.com');
    await user.type(screen.getByPlaceholderText('Please, Enter your Id'), 'V-12345678');
    await user.type(screen.getByPlaceholderText('Please, Enter your Phone #'), '+584121234567');
    await user.type(screen.getByPlaceholderText('Enter Password'), 'Secret123!');
    await user.type(screen.getByPlaceholderText('Confirm Password'), 'Secret123!');

    // Submit the form
    const registerButton = screen.getByRole('button', { name: /^Register$/i });
    await waitFor(() => expect(registerButton).toBeEnabled());
    await user.click(registerButton);

    // Verify the catch block triggers the error alert and does NOT redirect to `/login`
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Registration failed. Please try again.');
      expect(pushMock).not.toHaveBeenCalledWith('/login');
    });
  });
});