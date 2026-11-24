// ============================================================================
// FILE: e2e/tenant/tenant-booking.spec.ts
// PURPOSE: E2E test for TenantCatalogLeft house rental & booked-status update
// ============================================================================
import { test, expect } from '@playwright/test';
import { mockLoginAsRole, ROLE_DASHBOARD_ROUTES, ROLE_USERS } from '../helpers/auth';

const MOCK_AVAILABLE_HOUSE = {
  _id: 'house-e2e-101',
  houseCode: 'HC-NAG-101',
  ownerId: 'owner-e2e-1',
  ownerfullname: 'Carlos Owner',
  owneremail: 'carlos.owner@example.com',
  description: 'Modern Villa in Naguanagua',
  booked: false,
  pincode: '2005',
  state: 'Carabobo',
  city: 'Naguanagua',
  street: 'Av. Universidad',
  landmark: 'Near Shopping Center',
  totalRooms: 3,
  RentPrice: 850,
  legalDocuments: 'Verified',
  image: null,
};

test.describe('Tenant Catalog Rent Flow (E2E)', () => {
  test('filters available houses and rents a house via mocked RTK Query mutations', async ({ page }) => {
    let bookingPayload: Record<string, unknown> | null = null;
    let bookedUpdatePayload: Record<string, unknown> | null = null;

    // Accept alert() calls triggered in TenantCatalogLeft and houseApi.ts
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

      // 1. Available houses query (useGetAvailableHousesBookedFalseQuery)
      if (method === 'GET' && url.includes('listAllHousesBookedFalse')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [MOCK_AVAILABLE_HOUSE],
          }),
        });
        return;
      }

      // 2. Create booking mutation (useCreateBookingMutation)
      if (method === 'POST' && (url.includes('booking') || url.includes('rent'))) {
        bookingPayload = (req.postDataJSON() as Record<string, unknown> | null) ?? {};
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Booking created',
            data: {
              _id: 'booking-e2e-501',
              houseId: MOCK_AVAILABLE_HOUSE._id,
              tenantId: ROLE_USERS.Tenant.id,
            },
          }),
        });
        return;
      }

      // 3. Update house booked=true mutation (useEdithouseupdatebookedMutation)
      if (method === 'PUT' && url.includes('update-housebooked')) {
        bookedUpdatePayload = (req.postDataJSON() as Record<string, unknown> | null) ?? {};
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...MOCK_AVAILABLE_HOUSE, booked: true },
          }),
        });
        return;
      }

      await route.continue();
    });

    await mockLoginAsRole(page, 'Tenant');
    await expect(page).toHaveURL(ROLE_DASHBOARD_ROUTES.Tenant);

    // Scope to the TenantCatalogLeft ("Available Houses") section so the right panel's
    // "City..." input doesn't trigger a strict-mode collision.
    const catalogSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: /available houses/i }) })
      .first();

    await catalogSection.getByPlaceholder('City...').fill('Naguanagua');

    const houseCard = catalogSection.locator('article').filter({ hasText: 'HC-NAG-101' });
    await expect(houseCard).toBeVisible({ timeout: 10000 });
    await expect(houseCard).toContainText('$850.00/mo');
    await expect(houseCard).toContainText('Naguanagua, Carabobo');
    await expect(houseCard).toContainText('Total Rooms: 3');

    const rentButton = houseCard.getByRole('button', { name: /rent house/i });
    const createBookingRes = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        (res.url().includes('booking') || res.url().includes('rent'))
    );
    const updateBookedRes = page.waitForResponse(
      (res) => res.request().method() === 'PUT' && res.url().includes('update-housebooked')
    );

    await rentButton.click();

    const [bookingResponse, bookedResponse] = await Promise.all([
      createBookingRes,
      updateBookedRes,
    ]);

    expect([200, 201]).toContain(bookingResponse.status());
    expect(bookedResponse.status()).toBe(200);
    expect(bookingPayload).toMatchObject({
      houseId: MOCK_AVAILABLE_HOUSE._id,
      houseCode: MOCK_AVAILABLE_HOUSE.houseCode,
      tenantId: 'user-1',
    });
    expect(bookedUpdatePayload).toMatchObject({ booked: true });
    expect(bookedUpdatePayload).toMatchObject({ booked: true });
  });
});

// to run this script from PS D:\NEXTJS NOV 2026\renthouseBackend>
// npx playwright test e2e/tenant/tenant-booking.spec.ts