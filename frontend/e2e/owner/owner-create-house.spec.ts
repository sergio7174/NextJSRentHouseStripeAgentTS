// ============================================================================
// FILE: e2e/owner/owner-create-house.spec.ts
// PURPOSE: Focused Playwright E2E spec for Owner house creation flow
// ============================================================================
import { test, expect } from '@playwright/test';
import { mockLoginAsRole, ROLE_DASHBOARD_ROUTES, ROLE_USERS } from '../helpers/auth';

const OWNER_CREATE_HOUSE_ROUTE = '/owner/ownercreatehouse';

test.describe('Owner House Creation Flow (E2E)', () => {
  test('creates a new house listing as an Owner via mocked RTK Query mutation', async ({ page }) => {
    test.setTimeout(60000);

    let createHouseUrl = '';
    let createHousePostData: string | null = null;

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Register broad API route BEFORE mockLoginAsRole so all API mocks are active
    await page.route('**/*', async (route) => {
      const req = route.request();
      const type = req.resourceType();

      if (type !== 'fetch' && type !== 'xhr') {
        await route.continue();
        return;
      }

      const url = req.url();
      const method = req.method();

      // Let mockLoginAsRole handle POST /login without duplicate overrides
      if (method === 'POST' && url.includes('login')) {
        await route.fallback();
        return;
      }

      // Admin check query fired on LoginComponent mount (useGetOneAdminQuery)
      if (method === 'GET' && url.toLowerCase().includes('admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: 1 }),
        });
        return;
      }

      // Owner house list / dashboard GET endpoints
      if (method === 'GET' && (url.includes('/api/house') || url.includes('house'))) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }

      // createHouse mutation (POST .../api/house/createhouse)
      if (method === 'POST' && url.includes('createhouse')) {
        createHouseUrl = url;
        createHousePostData = req.postData();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'House created successfully',
            NewHouse: {
              _id: 'house-owner-e2e-201',
              houseCode: 'HC-VAL-201',
              ownerId: ROLE_USERS.Owner.id,
              booked: false,
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await mockLoginAsRole(page, 'Owner');
    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Owner, { timeout: 15000 });
})
})