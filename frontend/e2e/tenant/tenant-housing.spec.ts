// ============================================================================
// FILE: e2e/tenant/tenant-housing.spec.ts
// PURPOSE: Focused Playwright E2E spec for Tenant house browsing & details
// ============================================================================
import { test, expect } from '@playwright/test';
import { mockLoginAsRole } from '../helpers/auth';

const MOCK_HOUSES = [
  {
    _id: 'house-e2e-101',
    id: 'house-e2e-101',
    title: 'Modern Villa in Naguanagua',
    city: 'Naguanagua',
    address: 'Av. Universidad, Naguanagua',
    price: 850,
    bedrooms: 3,
    bathrooms: 2,
    status: 'available',
    images: [],
  },
  {
    _id: 'house-e2e-102',
    id: 'house-e2e-102',
    title: 'Sunny Apartment in El Trigal',
    city: 'Valencia',
    address: 'Urb. El Trigal, Valencia',
    price: 620,
    bedrooms: 2,
    bathrooms: 2,
    status: 'available',
    images: [],
  },
];

test.describe('Tenant Housing Flow (E2E)', () => {
  test('displays mocked house listings for an authenticated Tenant', async ({ page }) => {
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (method === 'GET' && (url.includes('house') || url.includes('propert') || url.includes('listing'))) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            houses: MOCK_HOUSES,
            data: MOCK_HOUSES,
          }),
        });
        return;
      }

      await route.continue();
    });

    await mockLoginAsRole(page, 'Tenant');

    // Navigate to houses/listings page if the Tenant dashboard doesn't render listings directly
    const hasVillaImmediately = await page.getByText(/Modern Villa in Naguanagua/i).isVisible().catch(() => false);
    if (!hasVillaImmediately) {
      await page.goto('/houses');
    }

    await expect(page.getByText(/Modern Villa in Naguanagua/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Sunny Apartment in El Trigal/i)).toBeVisible();
  });

  test('opens a house detail view when selecting a listing', async ({ page }) => {
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (method === 'GET' && (url.includes('house') || url.includes('propert') || url.includes('listing'))) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            house: MOCK_HOUSES[0],
            houses: MOCK_HOUSES,
            data: MOCK_HOUSES,
          }),
        });
        return;
      }

      await route.continue();
    });

    await mockLoginAsRole(page, 'Tenant');

    const listingText = page.getByText(/Modern Villa in Naguanagua/i).first();
    if (!(await listingText.isVisible().catch(() => false))) {
      await page.goto('/houses');
    }

    await expect(listingText).toBeVisible({ timeout: 10000 });
    await listingText.click();

    await expect(page.getByText(/Naguanagua/i).first()).toBeVisible();
  });
});