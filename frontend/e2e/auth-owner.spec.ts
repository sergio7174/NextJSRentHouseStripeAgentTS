// ============================================================================
// FILE: e2e/auth-owner.spec.ts
// PURPOSE: Focused Playwright E2E spec for Owner authentication & navigation
// ============================================================================
import { test, expect } from '@playwright/test';
import { mockLoginAsRole, ROLE_DASHBOARD_ROUTES } from './helpers/auth';

test.describe('Auth - Owner Flow (E2E)', () => {
  test('logs in an Owner via mocked API and redirects to the Owner dashboard', async ({ page }) => {
    await mockLoginAsRole(page, 'Owner');

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Owner);
  });

  test('persists Owner session across a full page reload', async ({ page }) => {
    await mockLoginAsRole(page, 'Owner');

    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Owner);
    const currentUrl = page.url();

    await page.reload();
    await expect(page).toHaveURL(currentUrl);
  });
});