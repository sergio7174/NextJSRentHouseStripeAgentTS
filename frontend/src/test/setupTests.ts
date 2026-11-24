// src/test/setupTests.ts
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically unmount React trees after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

// Mock window.alert so catch blocks don't crash jsdom
vi.stubGlobal('alert', vi.fn());