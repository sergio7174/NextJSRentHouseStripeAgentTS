// ============================================================================
// FILE: e2e/helpers/auth.ts
// PURPOSE: Reusable Playwright helpers for Tenant, Owner, and Admin E2E auth
// ============================================================================
import { Page } from '@playwright/test';

export type UserRole = 'Tenant' | 'Owner' | 'Admin';

export interface MockUserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  userImage?: string;
}

export const ROLE_USERS: Record<UserRole, MockUserProfile> = {
  Tenant: {
    id: 'tenant-e2e-1',
    name: 'Sofia Tenant',
    email: 'sofia.tenant@example.com',
    role: 'Tenant',
    userImage: '',
  },
  Owner: {
    id: 'owner-e2e-1',
    name: 'Carlos Owner',
    email: 'carlos.owner@example.com',
    role: 'Owner',
    userImage: '',
  },
  Admin: {
    id: 'admin-e2e-1',
    name: 'Elena Admin',
    email: 'elena.admin@example.com',
    role: 'Admin',
    userImage: '',
  },
};

export async function mockLoginAsRole(page: Page, role: UserRole) {
  const user = ROLE_USERS[role];

  await page.route('**/login**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: `e2e-mock-jwt-${role.toLowerCase()}`,
        role: user.role,
        user,
      }),
    });
  });

  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  await page.getByPlaceholder('alex.sterling@corporate.com').fill(user.email);
  await page.getByLabel(/password/i).fill('SecretPass123!');

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes('login') && res.request().method() === 'POST'
  );
  await page.getByRole('button', { name: /secure sign in/i }).click();
  await responsePromise;
}

export const ROLE_DASHBOARD_ROUTES: Record<UserRole, RegExp> = {
  Tenant: /\/tenant(\/tenantdashboard|\/dashboard)?/i,
  Owner: /\/owner(\/ownerdashboard|\/dashboard)?/i,
  Admin: /\/admin(\/admindashboard|\/dashboard)?/i,
};