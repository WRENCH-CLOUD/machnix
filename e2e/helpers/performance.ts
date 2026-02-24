import { expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Performance Check Utility for WrenchCloud E2E Tests
// Fails any test if a page takes longer than the threshold to load.
// ─────────────────────────────────────────────────────────────────────────────

export interface PerfOptions {
  /** Maximum allowed time in milliseconds (default: 3000ms) */
  maxLoadTimeMs?: number;
  /** Whether to also check Largest Contentful Paint (default: true) */
  checkLCP?: boolean;
  /** Whether to check Time to First Byte (default: true) */
  checkTTFB?: boolean;
}

const DEFAULT_OPTIONS: Required<PerfOptions> = {
  maxLoadTimeMs: 3_000,
  checkLCP: true,
  checkTTFB: true,
};

/**
 * Navigates to a URL and asserts that key performance metrics
 * are below the configured threshold.
 *
 * @example
 * ```ts
 * await assertPageLoadPerformance(page, '/dashboard');
 * await assertPageLoadPerformance(page, '/inventory', { maxLoadTimeMs: 2000 });
 * ```
 */
export async function assertPageLoadPerformance(
  page: Page,
  url: string,
  options?: PerfOptions,
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Navigate and wait for load event
  const startTime = Date.now();
  await page.goto(url, { waitUntil: 'load' });
  const loadDuration = Date.now() - startTime;

  // ── Basic Load Time ─────────────────────────────────────────────────────────
  expect(
    loadDuration,
    `Page "${url}" took ${loadDuration}ms to load (threshold: ${opts.maxLoadTimeMs}ms)`,
  ).toBeLessThanOrEqual(opts.maxLoadTimeMs);

  // ── Navigation Timing API Metrics ───────────────────────────────────────────
  const navigationTiming = await page.evaluate(() => {
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (!entry) return null;
    return {
      ttfb: entry.responseStart - entry.requestStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
      fullLoad: entry.loadEventEnd - entry.startTime,
    };
  });

  if (navigationTiming) {
    // TTFB check
    if (opts.checkTTFB) {
      expect(
        navigationTiming.ttfb,
        `TTFB for "${url}" was ${navigationTiming.ttfb.toFixed(0)}ms (threshold: ${opts.maxLoadTimeMs / 3}ms)`,
      ).toBeLessThanOrEqual(opts.maxLoadTimeMs / 3); // TTFB should be ≤ 1/3 of total budget
    }

    // Full load from navigation timing
    if (navigationTiming.fullLoad > 0) {
      expect(
        navigationTiming.fullLoad,
        `Navigation timing fullLoad for "${url}" was ${navigationTiming.fullLoad.toFixed(0)}ms`,
      ).toBeLessThanOrEqual(opts.maxLoadTimeMs);
    }
  }

  // ── Largest Contentful Paint (LCP) ──────────────────────────────────────────
  if (opts.checkLCP) {
    const lcpValue = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        let lcp: number | null = null;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            lcp = lastEntry.startTime;
          }
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // Give it a moment to collect entries, then report
        setTimeout(() => {
          observer.disconnect();
          resolve(lcp);
        }, 1_000);
      });
    });

    if (lcpValue !== null) {
      expect(
        lcpValue,
        `LCP for "${url}" was ${lcpValue.toFixed(0)}ms (threshold: ${opts.maxLoadTimeMs}ms)`,
      ).toBeLessThanOrEqual(opts.maxLoadTimeMs);
    }
  }
}

/**
 * Measures the time for a specific user action (e.g., clicking a button
 * and waiting for a response) and asserts it's within budget.
 *
 * @example
 * ```ts
 * await assertActionPerformance(
 *   page,
 *   'Create Job Card',
 *   async () => {
 *     await page.getByRole('button', { name: 'Create Job' }).click();
 *     await page.waitForURL(/\/jobs\//);
 *   },
 *   { maxLoadTimeMs: 2000 },
 * );
 * ```
 */
export async function assertActionPerformance(
  page: Page,
  actionName: string,
  action: () => Promise<void>,
  options?: PerfOptions,
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const start = Date.now();
  await action();
  const duration = Date.now() - start;

  expect(
    duration,
    `Action "${actionName}" took ${duration}ms (threshold: ${opts.maxLoadTimeMs}ms)`,
  ).toBeLessThanOrEqual(opts.maxLoadTimeMs);

  return duration;
}
