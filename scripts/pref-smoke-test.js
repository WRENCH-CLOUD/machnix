/**
 * WrenchCloud Performance Smoke Test Script
 * 
 * This script measures API response times and validates core functionality.
 * Run after performance changes to verify improvements.
 * 
 * Usage:
 *   node scripts/perf-smoke-test.mjs
 *   node scripts/perf-smoke-test.mjs --base-url=https://wrenchcloud.in
 * 
 * Requirements:
 *   - App must be running (locally or remote)
 *   - You need a valid session cookie for authenticated routes
 */

const BASE_URL = process.argv.find(a => a.startsWith('--base-url='))?.split('=')[1] || 'http://localhost:3000'
const VERBOSE = process.argv.includes('--verbose')

// ============================================================================
// Helpers
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

function formatMs(ms) {
  if (ms < 500) return colorize(`${ms}ms`, 'green')
  if (ms < 2000) return colorize(`${ms}ms`, 'yellow')
  return colorize(`${ms}ms`, 'red')
}

function statusEmoji(status) {
  if (status >= 200 && status < 300) return '✅'
  if (status === 401) return '🔒'
  if (status === 404) return '⚠️'
  return '❌'
}

async function timedFetch(url, options = {}) {
  const start = performance.now()
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Cookie': globalCookie,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    const elapsed = Math.round(performance.now() - start)
    const body = await res.text()
    let json = null
    try { json = JSON.parse(body) } catch {}
    
    return {
      status: res.status,
      elapsed,
      body,
      json,
      ok: res.ok,
      headers: Object.fromEntries(res.headers.entries()),
    }
  } catch (err) {
    const elapsed = Math.round(performance.now() - start)
    return {
      status: 0,
      elapsed,
      body: err.message,
      json: null,
      ok: false,
      error: err,
    }
  }
}

// ============================================================================
// Test Definitions
// ============================================================================

const tests = []
const results = []
let globalCookie = ''

function test(name, endpoint, options = {}) {
  tests.push({ name, endpoint, ...options })
}

// -- Health / Auth Routes --
test('Landing Page', '/', { expectStatus: 200, unauthenticated: true })
test('Auth: /api/auth/me', '/api/auth/me', { expectStatus: [200, 401] })

// -- High-Traffic API Routes (these are the ones we optimized) --
test('Dashboard Stats', '/api/tenant/stats', { expectStatus: [200, 400] })
test('Tenant Settings', '/api/tenant/settings', { expectStatus: [200, 400] })
test('Onboarding Status', '/api/tenant/onboarding', { expectStatus: [200, 400] })
test('Jobs List', '/api/jobs', { expectStatus: [200, 400] })
test('Inventory Snapshot', '/api/inventory/items/snapshot', { expectStatus: [200, 400] })

// -- Inventory Legacy (should still work) --
test('Inventory Items (legacy)', '/api/inventory/items', { expectStatus: [200, 400] })

// -- Secondary Routes --
test('Mechanics List', '/api/mechanics', { expectStatus: [200, 400] })
test('Customers List', '/api/customers', { expectStatus: [200, 400] })

// ============================================================================
// Runner
// ============================================================================

async function login() {
  console.log(colorize('\n🔐 Checking authentication...', 'cyan'))
  
  // Try to get session from /api/auth/me first
  const res = await timedFetch(`${BASE_URL}/api/auth/me`)
  
  if (res.status === 200 && res.json?.user) {
    console.log(colorize(`   Authenticated as: ${res.json.user.email}`, 'green'))
    console.log(colorize(`   Tenant ID: ${res.json.user.tenantId || 'none'}`, 'dim'))
    return true
  }
  
  console.log(colorize('   Not authenticated. Tests will show 401 for protected routes.', 'yellow'))
  console.log(colorize('   Tip: Copy your session cookie from browser DevTools and set:', 'dim'))
  console.log(colorize('   COOKIE="sb-xxx-auth-token=..." node scripts/perf-smoke-test.mjs', 'dim'))
  return false
}

async function runTests() {
  console.log(colorize('\n🚀 WrenchCloud Performance Smoke Test', 'bold'))
  console.log(colorize(`   Target: ${BASE_URL}`, 'dim'))
  console.log(colorize(`   Time: ${new Date().toISOString()}`, 'dim'))
  
  // Check for cookie from environment
  if (process.env.COOKIE) {
    globalCookie = process.env.COOKIE
  }
  
  const isAuthenticated = await login()
  
  console.log(colorize('\n📊 Running API tests...\n', 'cyan'))
  console.log(`${'Test'.padEnd(30)} ${'Status'.padEnd(8)} ${'Time'.padEnd(12)} ${'Notes'}`)
  console.log('─'.repeat(75))
  
  let passed = 0
  let failed = 0
  let totalTime = 0
  
  for (const t of tests) {
    const result = await timedFetch(`${BASE_URL}${t.endpoint}`)
    totalTime += result.elapsed
    
    // Check status
    const expectedStatuses = Array.isArray(t.expectStatus) ? t.expectStatus : [t.expectStatus]
    const statusOk = expectedStatuses.includes(result.status)
    
    // Determine if test passed
    const testPassed = statusOk
    if (testPassed) passed++
    else failed++
    
    // Notes
    let notes = ''
    if (result.status === 401) notes = 'unauthorized'
    else if (result.status === 400) notes = 'missing tenant'
    else if (result.json && Array.isArray(result.json)) notes = `${result.json.length} items`
    else if (result.json?.items && Array.isArray(result.json.items)) notes = `${result.json.items.length} items`
    else if (result.json?.recentJobs) notes = `${result.json.recentJobs.length} recent jobs`
    else if (result.error) notes = result.error.message
    
    // Cache header info
    const cacheControl = result.headers?.['cache-control']
    if (cacheControl && VERBOSE) notes += ` [cache: ${cacheControl}]`
    
    const emoji = statusEmoji(result.status)
    console.log(
      `${emoji} ${t.name.padEnd(28)} ${String(result.status).padEnd(8)} ${formatMs(result.elapsed).padEnd(20)} ${colorize(notes, 'dim')}`
    )
    
    results.push({
      name: t.name,
      endpoint: t.endpoint,
      status: result.status,
      elapsed: result.elapsed,
      passed: testPassed,
    })
  }
  
  // ========================================
  // Summary
  // ========================================
  console.log('─'.repeat(75))
  console.log()
  
  const avgTime = Math.round(totalTime / tests.length)
  const slowTests = results.filter(r => r.elapsed > 2000)
  const fastTests = results.filter(r => r.elapsed < 500 && r.passed)
  
  console.log(colorize('📈 Summary:', 'bold'))
  console.log(`   Total tests: ${tests.length}`)
  console.log(`   Passed: ${colorize(String(passed), 'green')}  Failed: ${failed > 0 ? colorize(String(failed), 'red') : '0'}`)
  console.log(`   Total time: ${formatMs(totalTime)}`)
  console.log(`   Average: ${formatMs(avgTime)}`)
  
  if (slowTests.length > 0) {
    console.log(colorize(`\n   ⚠️  Slow tests (>2s):`, 'yellow'))
    slowTests.forEach(t => {
      console.log(`      - ${t.name}: ${formatMs(t.elapsed)}`)
    })
  }
  
  if (fastTests.length > 0) {
    console.log(colorize(`\n   ⚡ Fast tests (<500ms):`, 'green'))
    fastTests.forEach(t => {
      console.log(`      - ${t.name}: ${formatMs(t.elapsed)}`)
    })
  }
  
  // Performance targets
  console.log(colorize('\n🎯 Performance Targets:', 'bold'))
  const statsTest = results.find(r => r.name === 'Dashboard Stats')
  const jobsTest = results.find(r => r.name === 'Jobs List')
  const invTest = results.find(r => r.name === 'Inventory Snapshot')
  
  const targets = [
    { name: 'Dashboard Stats', result: statsTest, target: 2000 },
    { name: 'Jobs List', result: jobsTest, target: 2000 },
    { name: 'Inventory Snapshot', result: invTest, target: 2000 },
  ]
  
  for (const t of targets) {
    if (!t.result || t.result.status === 401) {
      console.log(`   ${t.name.padEnd(25)} ${colorize('SKIP (auth required)', 'dim')}`)
    } else {
      const met = t.result.elapsed <= t.target
      const icon = met ? '✅' : '❌'
      console.log(`   ${icon} ${t.name.padEnd(23)} ${formatMs(t.result.elapsed)} (target: <${t.target}ms)`)
    }
  }
  
  console.log()
}

runTests().catch(console.error)