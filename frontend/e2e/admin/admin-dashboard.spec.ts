// ============================================================================
// FILE: e2e/admin/admin-dashboard.spec.ts
// PURPOSE: Focused Playwright E2E spec for Admin dashboard & management flow
// ============================================================================
import { test, expect } from '@playwright/test';
import { mockLoginAsRole, ROLE_DASHBOARD_ROUTES, ROLE_USERS } from '../helpers/auth';

test.describe('Admin Dashboard Flow (E2E)', () => {
  test('logs in as Admin and loads the Admin dashboard via mocked APIs', async ({ page }) => {
    test.setTimeout(60000);

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.route('**/*', async (route) => {
      const req = route.request();
      const type = req.resourceType();

      // Let Next.js page navigations and static assets pass through untouched
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

      // Mock houses, users, or bookings GET endpoints used by Admin panels
      if (
        method === 'GET' &&
        (url.includes('/api/house') ||
          url.includes('/api/user') ||
          url.includes('house') ||
          url.includes('user') ||
          url.includes('booking'))
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            houses: [],
            users: [],
          }),
        });
        return;
      }

      await route.continue();
    });

    await mockLoginAsRole(page, 'Admin');
    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Admin, { timeout: 15000 });

    // Confirm Admin dashboard renders
    await expect(page.locator('body')).toContainText(/admin/i, { timeout: 15000 });
    expect(ROLE_USERS.Admin.role).toBe('Admin');
  });
});

// Run Command
// PowerShell
// D:\NEXTJS NOV 2026\nexthouserentingWithFeaturesNOV2026>
// npx playwright test e2e/admin/admin-dashboard.spec.ts