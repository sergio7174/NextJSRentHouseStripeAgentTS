// ============================================================================
// FILE: e2e/auth-tenant.spec.ts
// PURPOSE: Focused Playwright E2E spec for Tenant authentication & navigation
// ============================================================================
import { test, expect } from '@playwright/test';
import { mockLoginAsRole, ROLE_DASHBOARD_ROUTES } from './helpers/auth';

test.describe('Auth - Tenant Flow (E2E)', () => {
  test('logs in a Tenant via mocked API and redirects away from /login', async ({ page }) => {
    await mockLoginAsRole(page, 'Tenant');

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Tenant);
  });

  test('persists Tenant session across a full page reload', async ({ page }) => {
    await mockLoginAsRole(page, 'Tenant');

    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Tenant);
    const currentUrl = page.url();

    await page.reload();
    await expect(page).toHaveURL(currentUrl);
  });
});