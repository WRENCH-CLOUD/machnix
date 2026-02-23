import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Trend, Rate, Counter } from 'k6/metrics'
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js'

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const AUTH_COOKIE = __ENV.COOKIE || ''

// ============================================================================
// Custom Metrics
// ============================================================================

// Per-endpoint response time trends
const dashboardTrend = new Trend('dashboard_stats_duration', true)
const jobsListTrend = new Trend('jobs_list_duration', true)
const jobDetailTrend = new Trend('job_detail_duration', true)
const inventorySnapshotTrend = new Trend('inventory_snapshot_duration', true)
const inventoryDeltaTrend = new Trend('inventory_delta_duration', true)
const tenantSettingsTrend = new Trend('tenant_settings_duration', true)
const estimateTrend = new Trend('estimate_by_job_duration', true)
const invoiceTrend = new Trend('invoice_by_job_duration', true)
const onboardingTrend = new Trend('onboarding_status_duration', true)

// SLA metrics
const slaViolations = new Rate('sla_violations')    // % of requests > 2s
const errorRate = new Rate('error_rate')             // % of non-2xx responses
const totalRequests = new Counter('total_requests')

// ============================================================================
// Test Scenarios
// ============================================================================

export const options = {
  scenarios: {
    // Scenario 1: Smoke test — single user, verify everything works
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '0s',
      tags: { scenario: 'smoke' },
      exec: 'fullUserFlow',
    },

    // Scenario 2: Average load — 5 concurrent users
    average_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      startTime: '35s',
      tags: { scenario: 'average_load' },
      exec: 'fullUserFlow',
    },

    // Scenario 3: Spike — ramp up to 20 users
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 10 },
        { duration: '30s', target: 20 },
        { duration: '15s', target: 0 },
      ],
      startTime: '2m',
      tags: { scenario: 'spike' },
      exec: 'criticalPathOnly',
    },

    // Scenario 4: API endpoint soak — sustained load on hottest routes
    api_soak: {
      executor: 'constant-arrival-rate',
      rate: 10,                // 10 requests per second
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 15,
      startTime: '3m30s',
      tags: { scenario: 'api_soak' },
      exec: 'apiEndpointMix',
    },
  },

  // Thresholds — the build "fails" if these are breached
  thresholds: {
    // Global
    http_req_duration: [
      'p(95)<2000',   // 95th percentile under 2 seconds
      'p(99)<4000',   // 99th percentile under 4 seconds
    ],
    http_req_failed: ['rate<0.05'],  // Less than 5% errors

    // Per-endpoint SLAs
    dashboard_stats_duration: ['p(95)<2000'],
    jobs_list_duration: ['p(95)<2000'],
    job_detail_duration: ['p(95)<1500'],
    inventory_snapshot_duration: ['p(95)<2000'],
    tenant_settings_duration: ['p(95)<1000'],
    estimate_by_job_duration: ['p(95)<1500'],
    invoice_by_job_duration: ['p(95)<1500'],

    // Custom SLA metric
    sla_violations: ['rate<0.10'],  // Less than 10% of requests violate 2s SLA
    error_rate: ['rate<0.05'],
  },
}

// ============================================================================
// Shared Helpers
// ============================================================================

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Cookie': AUTH_COOKIE,
}

function apiGet(path, customTrend) {
  const url = `${BASE_URL}${path}`
  const res = http.get(url, { headers: defaultHeaders, tags: { endpoint: path } })

  totalRequests.add(1)
  errorRate.add(res.status < 200 || res.status >= 300)
  slaViolations.add(res.timings.duration > 2000)

  if (customTrend) {
    customTrend.add(res.timings.duration)
  }

  return res
}

function checkResponse(res, name, expectedStatuses = [200]) {
  return check(res, {
    [`${name} — status OK`]: (r) => expectedStatuses.includes(r.status),
    [`${name} — response time < 2s`]: (r) => r.timings.duration < 2000,
    [`${name} — has body`]: (r) => r.body && r.body.length > 0,
  })
}

// ============================================================================
// Scenario: Full User Flow
// Simulates a real user: login → dashboard → jobs list → open job → inventory
// ============================================================================

export function fullUserFlow() {
  // Step 1: Dashboard load (what happens when you first navigate to the app)
  group('Dashboard Load', () => {
    const statsRes = apiGet('/api/tenant/stats', dashboardTrend)
    checkResponse(statsRes, 'Dashboard Stats', [200, 400])

    const settingsRes = apiGet('/api/tenant/settings', tenantSettingsTrend)
    checkResponse(settingsRes, 'Tenant Settings', [200, 400])

    const onboardingRes = apiGet('/api/tenant/onboarding', onboardingTrend)
    checkResponse(onboardingRes, 'Onboarding Status', [200, 400])
  })

  sleep(1) // User reads the dashboard

  // Step 2: Navigate to Jobs Board
  group('Jobs Board', () => {
    const jobsRes = apiGet('/api/jobs', jobsListTrend)
    checkResponse(jobsRes, 'Jobs List', [200, 400])

    // If we got jobs, simulate clicking on the first one
    if (jobsRes.status === 200) {
      try {
        const jobs = JSON.parse(jobsRes.body)
        if (Array.isArray(jobs) && jobs.length > 0) {
          const jobId = jobs[0].id
          openJobDetails(jobId, jobs[0].vehicleId)
        }
      } catch {}
    }
  })

  sleep(1) // User reviews job details

  // Step 3: Navigate to Inventory
  group('Inventory Page', () => {
    const snapshotRes = apiGet('/api/inventory/items/snapshot', inventorySnapshotTrend)
    checkResponse(snapshotRes, 'Inventory Snapshot', [200, 400])

    // Simulate delta sync (would happen on subsequent visits)
    if (snapshotRes.status === 200) {
      try {
        const snapshot = JSON.parse(snapshotRes.body)
        if (snapshot.syncedAt) {
          const deltaRes = apiGet(
            `/api/inventory/items/delta?since=${encodeURIComponent(snapshot.syncedAt)}`,
            inventoryDeltaTrend
          )
          checkResponse(deltaRes, 'Inventory Delta', [200, 400])
        }
      } catch {}
    }
  })

  sleep(0.5)
}

// Helper: simulate opening job details (fires 6+ parallel requests)
function openJobDetails(jobId, vehicleId) {
  group('Job Details Dialog', () => {
    // These all fire in parallel when you click a job card
    const responses = http.batch([
      ['GET', `${BASE_URL}/api/jobs/${jobId}`, null, { headers: defaultHeaders, tags: { endpoint: '/api/jobs/[id]' } }],
      ['GET', `${BASE_URL}/api/estimates/by-job/${jobId}`, null, { headers: defaultHeaders, tags: { endpoint: '/api/estimates/by-job/[id]' } }],
      ['GET', `${BASE_URL}/api/invoices/by-job/${jobId}`, null, { headers: defaultHeaders, tags: { endpoint: '/api/invoices/by-job/[id]' } }],
      ['GET', `${BASE_URL}/api/jobs/${jobId}/tasks`, null, { headers: defaultHeaders, tags: { endpoint: '/api/jobs/[id]/tasks' } }],
      ['GET', `${BASE_URL}/api/tenant/settings`, null, { headers: defaultHeaders, tags: { endpoint: '/api/tenant/settings' } }],
      ['GET', `${BASE_URL}/api/inventory/items/snapshot`, null, { headers: defaultHeaders, tags: { endpoint: '/api/inventory/items/snapshot' } }],
    ])

    // Add vehicle history if we have a vehicle ID
    if (vehicleId) {
      const vhRes = apiGet(`/api/vehicles/${vehicleId}/job-history`)
      checkResponse(vhRes, 'Vehicle History', [200, 400, 404])
    }

    // Track per-endpoint metrics
    if (responses[0]) jobDetailTrend.add(responses[0].timings.duration)
    if (responses[1]) estimateTrend.add(responses[1].timings.duration)
    if (responses[2]) invoiceTrend.add(responses[2].timings.duration)

    // Check the critical ones
    responses.forEach((res, i) => {
      totalRequests.add(1)
      errorRate.add(res.status < 200 || res.status >= 400)
      slaViolations.add(res.timings.duration > 2000)
    })

    // The most important check: total time for all parallel requests
    const maxDuration = Math.max(...responses.map(r => r.timings.duration))
    check(null, {
      'Job Details — all requests < 3s': () => maxDuration < 3000,
    })
  })
}

// ============================================================================
// Scenario: Critical Path Only
// Lighter version for spike testing — only hits the most critical routes
// ============================================================================

export function criticalPathOnly() {
  const statsRes = apiGet('/api/tenant/stats', dashboardTrend)
  checkResponse(statsRes, 'Dashboard Stats', [200, 400])

  const jobsRes = apiGet('/api/jobs', jobsListTrend)
  checkResponse(jobsRes, 'Jobs List', [200, 400])

  sleep(0.3)
}

// ============================================================================
// Scenario: API Endpoint Mix
// Weighted random selection of API calls to simulate real traffic patterns
// ============================================================================

const ENDPOINT_WEIGHTS = [
  { weight: 25, fn: () => apiGet('/api/tenant/stats', dashboardTrend) },
  { weight: 25, fn: () => apiGet('/api/jobs', jobsListTrend) },
  { weight: 15, fn: () => apiGet('/api/tenant/settings', tenantSettingsTrend) },
  { weight: 15, fn: () => apiGet('/api/inventory/items/snapshot', inventorySnapshotTrend) },
  { weight: 10, fn: () => apiGet('/api/tenant/onboarding', onboardingTrend) },
  { weight: 10, fn: () => apiGet('/api/mechanics') },
]

// Precompute cumulative weights
const CUMULATIVE = []
let cumSum = 0
for (const ep of ENDPOINT_WEIGHTS) {
  cumSum += ep.weight
  CUMULATIVE.push({ cumWeight: cumSum, fn: ep.fn })
}
const TOTAL_WEIGHT = cumSum

export function apiEndpointMix() {
  const r = Math.random() * TOTAL_WEIGHT
  for (const entry of CUMULATIVE) {
    if (r <= entry.cumWeight) {
      const res = entry.fn()
      checkResponse(res, 'API Mix', [200, 400, 401])
      return
    }
  }
}

// ============================================================================
// HTML Report (generated after test run)
// ============================================================================

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  // Console summary
  const p95 = data.metrics?.http_req_duration?.values?.['p(95)']
  const p99 = data.metrics?.http_req_duration?.values?.['p(99)']
  const med = data.metrics?.http_req_duration?.values?.med
  const sla = data.metrics?.sla_violations?.values?.rate
  const errs = data.metrics?.error_rate?.values?.rate

  console.log('\n' + '='.repeat(60))
  console.log('  WrenchCloud Performance Test Results')
  console.log('='.repeat(60))
  console.log(`  Median Response Time:     ${med?.toFixed(0)}ms`)
  console.log(`  P95 Response Time:        ${p95?.toFixed(0)}ms`)
  console.log(`  P99 Response Time:        ${p99?.toFixed(0)}ms`)
  console.log(`  SLA Violations (>2s):     ${(sla * 100)?.toFixed(1)}%`)
  console.log(`  Error Rate:               ${(errs * 100)?.toFixed(1)}%`)
  console.log('='.repeat(60))

  // Per-endpoint breakdown
  const endpoints = [
    ['Dashboard Stats', 'dashboard_stats_duration'],
    ['Jobs List', 'jobs_list_duration'],
    ['Job Detail', 'job_detail_duration'],
    ['Inventory Snapshot', 'inventory_snapshot_duration'],
    ['Tenant Settings', 'tenant_settings_duration'],
    ['Estimate by Job', 'estimate_by_job_duration'],
    ['Invoice by Job', 'invoice_by_job_duration'],
  ]

  console.log('\n  Per-Endpoint P95:')
  for (const [name, key] of endpoints) {
    const val = data.metrics?.[key]?.values?.['p(95)']
    if (val !== undefined) {
      const status = val < 2000 ? '✅' : '❌'
      console.log(`    ${status} ${name.padEnd(25)} ${val.toFixed(0)}ms`)
    }
  }
  console.log()

  return {
    [`scripts/k6-results-${timestamp}.html`]: htmlReport(data),
    stdout: '',  // Already printed our custom summary
  }
}
