// ============================================================================
// FILE: src/components/auth/login/LoginComponent.test.tsx
// PURPOSE: Automated component & integration test suite for LoginComponent
// ============================================================================

// ============================================================================
// SECTION 1: CORE TESTING & COMPONENT IMPORTS
// ============================================================================
// Import React so JSX syntax (<LoginComponent />) compiles properly in tests
import React from 'react';
// Import `screen` to query rendered DOM elements and `waitFor` to await async UI/state updates
import { screen, waitFor } from '@testing-library/react';
// Import `userEvent` to simulate realistic user interactions (typing, clearing inputs, clicking)
import userEvent from '@testing-library/user-event';
// Import Vitest test runner functions: test grouping, assertions, mocks, and lifecycle hooks
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
// Import `http` and `HttpResponse` from Mock Service Worker (MSW) to define fake REST endpoints
import { http, HttpResponse } from 'msw';
// Import `setupServer` from `msw/node` to intercept Node/jsdom network requests during tests
import { setupServer } from 'msw/node';
// Import the actual Next.js LoginComponent we are testing
import LoginComponent from './LoginComponent';
// Import our custom helper that wraps components inside a fresh Redux Toolkit <Provider>
import { renderWithProviders } from '@/test/test-utils';
// Import all exported functions from our toast utility so we can spy on/assert toast notifications
import * as toastUtils from '@/utils/toast';

// ============================================================================
// SECTION 2: NEXT.JS ROUTER & TOAST NOTIFICATION MOCKS
// ============================================================================
// Create a Vitest spy function to track every URL passed to `router.push(...)`
const pushMock = vi.fn();

// Replace Next.js's `next/navigation` module with a fake router returning our `pushMock` spy
vi.mock('next/navigation', () => ({
  // Return a mock `useRouter` hook object whenever the component calls `useRouter()`
  useRouter: () => ({
    // Attach our spy to `push` so we can verify redirects (e.g., `'tenant/tenantdashboard'`)
    push: pushMock,
    // Stub `replace` with an empty spy in case the component calls `router.replace()`
    replace: vi.fn(),
    // Stub `prefetch` with an empty spy so Next.js Link/router prefetch calls don't fail
    prefetch: vi.fn(),
  }),
}));

// Replace `@/utils/toast` with mock functions so tests don't render real toast popups
vi.mock('@/utils/toast', () => ({
  // Spy on `notifySuccess` calls to verify success banners
  notifySuccess: vi.fn(),
  // Spy on `notifyError` calls to verify error banners
  notifyError: vi.fn(),
}));

// ============================================================================
// SECTION 3: MOCK SERVICE WORKER (MSW) BACKEND API SIMULATION
// ============================================================================
// Define the base URL matching your Express backend (`NEXT_PUBLIC_API_URL` on port 3001)
const API_BASE = 'http://localhost:3001';

// Create an in-memory MSW mock server with default handlers for RTK Query endpoints
const server = setupServer(
  // Intercept GET requests to `/api/auth/getoneadmin` and return `data: 0` (meaning no admin exists yet)
  http.get(`${API_BASE}/api/auth/getoneadmin`, () => {
    // Return a JSON response `{ data: 0 }` with HTTP status 200
    return HttpResponse.json({ data: 0 });
  }),
  // Intercept POST requests to `/api/auth/login` and simulate a successful Tenant login
  http.post(`${API_BASE}/api/auth/login`, async () => {
    // Return a mock JWT token and user profile matching your MongoDB User schema
    return HttpResponse.json({
      // Fake JWT token saved to `localStorage`
      token: 'mock-jwt-token-123',
      // Mock authenticated user object returned by the Express backend
      user: {
        // MongoDB-style user ID
        _id: 'user-99',
        // User's full display name
        fullName: 'Sergio Moncada',
        // User's email address
        email: 'sergio@example.com',
        // Role used by LoginComponent to decide which dashboard to redirect to
        role: 'Tenant',
        // Relative path to the user's profile avatar
        image: '/uploads/sergio.png',
      },
    });
  })
);

// Start the MSW server once before any test in this file runs (`bypass` lets unrelated requests pass through)
beforeAll(() => server.listen({ onUnhandledFrame: 'bypass' }));
// Reset any per-test `server.use(...)` handler overrides after each individual test finishes
afterEach(() => server.resetHandlers());
// Shut down the MSW server and clean up listeners after all tests in this file finish
afterAll(() => server.close());

// ============================================================================
// SECTION 4: TEST SUITE FOR <LoginComponent />
// ============================================================================
describe('LoginComponent', () => {
  // Run before each `it(...)` test block to ensure a clean slate
  beforeEach(() => {
    // Clear call history on `pushMock` so redirects from previous tests don't leak into the next test
    pushMock.mockClear();
  });

  // --------------------------------------------------------------------------
  // TEST 1: Initial UI Rendering & Disabled Submit Button State
  // --------------------------------------------------------------------------
  it('renders login form elements and disables submit button initially', () => {
    // Render LoginComponent wrapped in a fresh Redux store provider
    renderWithProviders(<LoginComponent />);

    // Verify default greeting heading appears when no `userChoice` is stored in localStorage
    expect(screen.getByText(/Welcome Back Guest/i)).toBeInTheDocument();
    // Verify email input field is rendered and discoverable by its placeholder text
    expect(screen.getByPlaceholderText(/alex.sterling@corporate.com/i)).toBeInTheDocument();
    // Verify password input field is rendered and discoverable by its placeholder text
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();

    // Locate the submit button by its accessible role and visible text
    const submitButton = screen.getByRole('button', { name: /Secure Sign In/i });
    // Assert that the button starts disabled because `react-hook-form` `isValid` is false
    expect(submitButton).toBeDisabled();
  });

  // --------------------------------------------------------------------------
  // TEST 2: React Hook Form Required Field Validation
  // --------------------------------------------------------------------------
  it('shows validation error messages when inputs are touched and left empty', async () => {
    // Initialize a `userEvent` session to simulate real keyboard typing
    const user = userEvent.setup();
    // Mount LoginComponent with Redux store
    renderWithProviders(<LoginComponent />);

    // Grab references to both form inputs
    const emailInput = screen.getByPlaceholderText(/alex.sterling@corporate.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    // Type one character into the email input to mark it dirty/touched
    await user.type(emailInput, 'a');
    // Clear the email input to trigger `required: 'Email is required*'` validation
    await user.clear(emailInput);
    // Wait for and assert that the email validation error message renders in the DOM
    expect(await screen.findByText('Email is required*')).toBeInTheDocument();

    // Type one character into the password input to mark it dirty/touched
    await user.type(passwordInput, 'a');
    // Clear the password input to trigger `required: 'Password is required*'` validation
    await user.clear(passwordInput);
    // Wait for and assert that the password validation error message renders in the DOM
    expect(await screen.findByText('Password is required*')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // TEST 3: Conditional Admin Check & Hiding the Register Link
  // --------------------------------------------------------------------------
  it('hides the Register link when userChoice is Admin and an Admin already exists', async () => {
    // Simulate the landing page having stored `'Admin'` in `localStorage`
    localStorage.setItem('userChoice', 'Admin');

    // Override the default MSW handler for this test only to report that 1 Admin already exists
    server.use(
      // Respond with `{ data: 1 }` so `response?.data > 0` evaluates to true
      http.get(`${API_BASE}/api/auth/getoneadmin`, () => {
        // Return JSON indicating an admin account exists in MongoDB
        return HttpResponse.json({ data: 1 });
      })
    );

    // Mount LoginComponent so `useEffect` reads `localStorage` and `useGetOneAdminQuery` fetches
    renderWithProviders(<LoginComponent />);

    // Assert that the heading dynamically updates to greet `'Admin'`
    expect(await screen.findByText(/Welcome Back Admin/i)).toBeInTheDocument();
    // Wait for `haveAdmin` state to update to `'HasAdmin'` and verify the Register link disappears
    await waitFor(() => {
      // `queryByText` returns `null` (instead of throwing) when an element is absent from the DOM
      expect(screen.queryByText(/Register/i)).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 4: Full Tenant Login Flow (API -> localStorage -> Redux -> Redirect)
  // --------------------------------------------------------------------------
  it('logs in a Tenant, saves credentials to localStorage, updates Redux store, and redirects', async () => {
    // Start a simulated user interaction session
    const user = userEvent.setup();
    // Render component and destructure `store` so we can inspect Redux state directly after login
    const { store } = renderWithProviders(<LoginComponent />);

    // Type a valid email address into the email input field
    await user.type(
      screen.getByPlaceholderText(/alex.sterling@corporate.com/i),
      'sergio@example.com'
    );
    // Type a valid password into the password input field
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'Secret123!');

    // Find the submit button and wait until `react-hook-form` marks the form valid and enables it
    const submitButton = screen.getByRole('button', { name: /Secure Sign In/i });
    await waitFor(() => expect(submitButton).toBeEnabled());

    // Click "Secure Sign In" to trigger `onSubmit` and the RTK Query `useLoginMutation` request
    await user.click(submitButton);

    // Wait for the async API call, toast notification, localStorage writes, and router redirect
    await waitFor(() => {
      // Verify success toast was triggered with exact message
      expect(toastUtils.notifySuccess).toHaveBeenCalledWith('Login successfully');
      // Verify JWT token was persisted in `localStorage`
      expect(localStorage.getItem('token')).toBe('mock-jwt-token-123');
      // Verify user's full name was persisted in `localStorage`
      expect(localStorage.getItem('userName')).toBe('Sergio Moncada');
      // Verify Next.js router redirected the Tenant to the tenant dashboard route
      expect(pushMock).toHaveBeenCalledWith('tenant/tenantdashboard');
    });

    // Read the `user` slice directly from the Redux store to verify `dispatch(setUser(...))` ran
    const reduxUser = store.getState().user;
    // Assert Redux state holds the authenticated user's email
    expect(reduxUser.email).toBe('sergio@example.com');
    // Assert Redux state holds the authenticated user's role
    expect(reduxUser.role).toBe('Tenant');
  });

  // --------------------------------------------------------------------------
  // TEST 5: Role-Based Redirect Routing for Owner Role
  // --------------------------------------------------------------------------
  it('redirects Admin and Owner roles to their respective dashboards', async () => {
    // Start a simulated user interaction session
    const user = userEvent.setup();

    // Override `/api/auth/login` for this test to return a user with `role: 'Owner'`
    server.use(
      // Intercept POST login and return an Owner payload
      http.post(`${API_BASE}/api/auth/login`, () =>
        // Send JSON response representing a property owner account
        HttpResponse.json({
          // Mock JWT token for the Owner
          token: 'owner-token',
          // Mock Owner profile
          user: {
            // Owner ID
            _id: 'owner-1',
            // Owner display name
            fullName: 'Owner User',
            // Owner email
            email: 'owner@example.com',
            // Role set to `'Owner'` to test the `else if (role === 'Owner')` branch
            role: 'Owner',
            // Empty profile image string
            image: '',
          },
        })
      )
    );

    // Render LoginComponent with a fresh Redux store
    renderWithProviders(<LoginComponent />);

    // Enter Owner credentials into the form
    await user.type(
      screen.getByPlaceholderText(/alex.sterling@corporate.com/i),
      'owner@example.com'
    );
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'OwnerPass123');
    // Submit the form
    await user.click(screen.getByRole('button', { name: /Secure Sign In/i }));

    // Assert that `router.push` redirected to the Owner dashboard route
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('owner/ownerdashboard');
    });
  });
});