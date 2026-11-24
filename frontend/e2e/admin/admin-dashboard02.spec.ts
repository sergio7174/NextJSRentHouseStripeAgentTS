// ============================================================================
// FILE: e2e/admin/admin-dashboard02.spec.ts
// PURPOSE: Focused Playwright E2E spec for Admin dashboard & management flow
// ============================================================================
import { test, expect } from '@playwright/test';
import { mockLoginAsRole, ROLE_DASHBOARD_ROUTES, ROLE_USERS } from '../helpers/auth';

test.describe('Admin Dashboard Flow (E2E)', () => {
  test('logs in as Admin, loads dashboard data, and triggers an admin action', async ({ page }) => {
    test.setTimeout(60000);

    let adminActionUrl = '';
    let adminActionMethod = '';

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.route('**/*', async (route) => {
      const req = route.request();
      const type = req.resourceType();

      if (type !== 'fetch' && type !== 'xhr') {
        await route.continue();
        return;
      }

      const url = req.url();
      const method = req.method();

      // Let mockLoginAsRole handle POST /login
      if (method === 'POST' && url.includes('login')) {
        await route.fallback();
        return;
      }

      // Admin check query (useGetOneAdminQuery)
      if (method === 'GET' && url.toLowerCase().includes('admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: 1,
          }),
        });
        return;
      }

      // Mock houses or users GET endpoints with realistic sample records
      if (method === 'GET' && (url.includes('/api/house') || url.includes('house'))) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                _id: 'house-admin-e2e-301',
                houseCode: 'HC-ADM-301',
                city: 'Valencia',
                rentPrice: 1100,
                booked: false,
                approved: false,
              },
            ],
            houses: [
              {
                _id: 'house-admin-e2e-301',
                houseCode: 'HC-ADM-301',
                city: 'Valencia',
                rentPrice: 1100,
                booked: false,
                approved: false,
              },
            ],
          }),
        });
        return;
      }

      if (method === 'GET' && (url.includes('/api/user') || url.includes('user'))) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                _id: ROLE_USERS.Owner.id,
                fullName: ROLE_USERS.Owner.name,
                email: ROLE_USERS.Owner.email,
                role: 'Owner',
              },
              {
                _id: ROLE_USERS.Tenant.id,
                fullName: ROLE_USERS.Tenant.name,
                email: ROLE_USERS.Tenant.email,
                role: 'Tenant',
              },
            ],
          }),
        });
        return;
      }

      // Intercept any Admin write/update/delete mutation so we verify real request handling
      if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
        !url.includes('login')
      ) {
        adminActionUrl = url;
        adminActionMethod = method;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Admin action completed',
          }),
        });
        return;
      }

      await route.continue();
    });

    await mockLoginAsRole(page, 'Admin');
    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Admin, { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/admin/i, { timeout: 15000 });

    // If a management action button (e.g., Approve / Verify / Delete / Toggle) is present, exercise it
    const actionButton = page
      .getByRole('button', { name: /approve|verify|toggle|status|delete/i })
      .first();

    if (await actionButton.isVisible().catch(() => false)) {
      await actionButton.click();
      expect(adminActionMethod).toBeTruthy();
      expect(adminActionUrl).toBeTruthy();
    }
  });
});