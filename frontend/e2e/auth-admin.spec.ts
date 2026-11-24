// ============================================================================
// FILE: e2e/auth-admin.spec.ts
// PURPOSE: Focused Playwright E2E spec for Admin authentication & navigation
// ============================================================================
import { test, expect } from '@playwright/test';
import { mockLoginAsRole, ROLE_DASHBOARD_ROUTES } from './helpers/auth';

test.describe('Auth - Admin Flow (E2E)', () => {
  test('logs in an Admin via mocked API and redirects to the Admin dashboard', async ({ page }) => {
    await mockLoginAsRole(page, 'Admin');

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Admin);
  });

  test('persists Admin session across a full page reload', async ({ page }) => {
    await mockLoginAsRole(page, 'Admin');

    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Admin);
    const currentUrl = page.url();

    await page.reload();
    await expect(page).toHaveURL(currentUrl);
  });
});