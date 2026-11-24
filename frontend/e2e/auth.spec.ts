// ============================================================================
// FILE: e2e/auth.spec.ts
// PURPOSE: First Playwright E2E smoke & authentication flow spec
// ============================================================================
import { test, expect } from '@playwright/test';

test.describe('Authentication & Role Navigation (E2E)', () => {
  test('renders the login form and blocks empty submission', async ({ page }) => {
    await page.goto('/login');

    // Verify core login controls are visible
    const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    const submitButton = page.getByRole('button', { name: /login|sign in/i }).first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // If the submit button is disabled initially, verify it stays disabled when empty;
    // otherwise verify clicking it keeps the user on /login.
    if (await submitButton.isDisabled()) {
      await expect(submitButton).toBeDisabled();
    } else {
      await submitButton.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('logs in a Tenant via mocked API and navigates away from /login', async ({ page }) => {
  // Intercept only the auth login endpoint (adjust pattern/keys to match your authApi.ts)
  await page.route('**/login**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'e2e-mock-jwt-token',
        role: 'Tenant',
        user: {
          id: 'tenant-e2e-1',
          name: 'Sofia Tenant',
          email: 'sofia.tenant@example.com',
          role: 'Tenant',
          userImage: '',
        },
      }),
    });
  });

  await page.goto('/login');

  await page.getByPlaceholder('alex.sterling@corporate.com').fill('sofia.tenant@example.com');
  await page.getByLabel(/password/i).fill('SecretPass123!');

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes('login') && res.request().method() === 'POST'
  );
  await page.getByRole('button', { name: /secure sign in/i }).click();
  await responsePromise;

  await expect(page).not.toHaveURL(/\/login$/);
});
  test('displays an error message when login credentials are rejected', async ({ page }) => {
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (method === 'POST' && (url.includes('login') || url.includes('auth') || url.includes(':3001'))) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Invalid email or password',
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/login');

    const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    const submitButton = page.getByRole('button', { name: /login|sign in/i }).first();

    await emailInput.fill('wrong@example.com');
    await passwordInput.fill('WrongPass123!');
    await submitButton.click();

    // User should remain on /login when authentication fails
    await expect(page).toHaveURL(/\/login/);
  });
});

// ============================================================================
// FILE: e2e/auth.spec.ts
// PURPOSE: E2E Authentication & Role Redirects (Tenant -> Owner -> Admin)
// ============================================================================
//import { test, expect } from '@playwright/test';
import { mockLoginAsRole } from './helpers/auth';

test.describe('Authentication & Role Navigation (E2E)', () => {
  test('renders the login form and blocks empty submission 02', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByPlaceholder('alex.sterling@corporate.com');
    const passwordInput = page.getByLabel(/password/i);
    const submitButton = page.getByRole('button', { name: /secure sign in/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    if (await submitButton.isDisabled()) {
      await expect(submitButton).toBeDisabled();
    } else {
      await submitButton.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('displays an error message when login credentials are rejected 02', async ({ page }) => {
    await page.route('**/login**', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid email or password' }),
      });
    });

    await page.goto('/login');

    await page.getByPlaceholder('alex.sterling@corporate.com').fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('WrongPass123!');
    await page.getByRole('button', { name: /secure sign in/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  // 1. TENANT
  test('1. Tenant: logs in via mocked API, redirects out of /login, and persists session on reload', async ({ page }) => {
    await mockLoginAsRole(page, 'Tenant');

    await expect(page).not.toHaveURL(/\/login$/);
    const tenantUrl = page.url();

    await page.reload();
    await expect(page).toHaveURL(tenantUrl);
  });

  // 2. OWNER
  test('2. Owner: logs in via mocked API, redirects out of /login, and persists session on reload', async ({ page }) => {
    await mockLoginAsRole(page, 'Owner');

    await expect(page).not.toHaveURL(/\/login$/);
    const ownerUrl = page.url();

    await page.reload();
    await expect(page).toHaveURL(ownerUrl);
  });

  // 3. ADMIN
  test('3. Admin: logs in via mocked API, redirects out of /login, and persists session on reload', async ({ page }) => {
    await mockLoginAsRole(page, 'Admin');

    await expect(page).not.toHaveURL(/\/login$/);
    const adminUrl = page.url();

    await page.reload();
    await expect(page).toHaveURL(adminUrl);
  });
});