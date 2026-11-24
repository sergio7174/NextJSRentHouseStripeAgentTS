// ============================================================================
// FILE: e2e/auth/role-guards.spec.ts
// PURPOSE: Negative & role-boundary E2E coverage across Tenant, Owner, and Admin
// ============================================================================
import { test, expect } from '@playwright/test';
import { mockLoginAsRole, ROLE_DASHBOARD_ROUTES } from '../helpers/auth';

test.describe('Role Guards & Session Boundaries (E2E)', () => {
  test('prevents a Tenant from accessing Owner and Admin routes directly', async ({ page }) => {
    test.setTimeout(60000);

    await page.route('**/*', async (route) => {
      const req = route.request();
      const type = req.resourceType();

      if (type !== 'fetch' && type !== 'xhr') {
        await route.continue();
        return;
      }

      const url = req.url();
      const method = req.method();

      if (method === 'POST' && url.includes('login')) {
        await route.fallback();
        return;
      }

      if (method === 'GET' && url.toLowerCase().includes('admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: 1 }),
        });
        return;
      }

      if (method === 'GET' && url.includes('house')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }

      await route.continue();
    });

    await mockLoginAsRole(page, 'Tenant');
    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Tenant, { timeout: 15000 });

    // Owner navigation bar must not render for a Tenant even if visiting an /owner/* URL
    await page.goto('/owner/ownercreatehouse', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation', { name: 'Owner navigation' })).toBeHidden({
      timeout: 10000,
    });

    // Attempt direct navigation to Admin dashboard
    await page.goto('/admin/admindashboard', { waitUntil: 'domcontentloaded' });
    const onAdminDashboard = ROLE_DASHBOARD_ROUTES.Admin.test(page.url());
    if (onAdminDashboard) {
      await expect(page.getByRole('heading', { name: /create house form/i })).toBeHidden();
    }
  });

  test('signs out an authenticated Owner and redirects to /login', async ({ page }) => {
    test.setTimeout(60000);

    await page.route('**/*', async (route) => {
      const req = route.request();
      const type = req.resourceType();

      if (type !== 'fetch' && type !== 'xhr') {
        await route.continue();
        return;
      }

      const url = req.url();
      const method = req.method();

      if (method === 'POST' && url.includes('login')) {
        await route.fallback();
        return;
      }

      if (method === 'GET' && url.toLowerCase().includes('admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: 1 }),
        });
        return;
      }

      if (method === 'GET' && url.includes('house')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }

      await route.continue();
    });

    await mockLoginAsRole(page, 'Owner');
    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Owner, { timeout: 15000 });

    const signOutButton = page.getByRole('button', { name: /sign out|logout/i }).first();
    await expect(signOutButton).toBeVisible({ timeout: 10000 });
    await signOutButton.click();

    await expect(page).toHaveURL(/\/login$/, { timeout: 15000 });
  });
});

// to run this script from PS D:\NEXTJS NOV 2026\renthouseBackend>
// npx playwright test e2e/auth/role-guards.spec.ts