/**
 * ════════════════════════════════════════════════════════════════
 *  إعدادات بيئة الاختبار - Vitest Setup
 * ════════════════════════════════════════════════════════════════
 *  يتم تشغيل هذا الملف قبل كل اختبار
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi, beforeAll, afterAll } from 'vitest';

// تنظيف DOM بعد كل اختبار
afterEach(() => {
  cleanup();
});

// محاكاة window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// محاكاة IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
}

global.IntersectionObserver = MockIntersectionObserver as any;

// localStorage: نعتمد على التطبيق الحقيقي الذي يوفّره jsdom
// (يدعم getItem/setItem/removeItem/clear + التعداد عبر Object.keys).
// ملاحظة: أي mock مع vi.fn() يكسر اختبارات notificationManager لأنه لا يخزن فعلياً.
beforeEach(() => {
  window.localStorage.clear();
});

// محاكاة console.error لتجنب الرسائل المزعجة في الاختبارات
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement'))
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
