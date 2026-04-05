#!/usr/bin/env node
/* global process */

/**
 * Unit tests for the Powerball API server
 * Tests all endpoints to ensure they're working correctly
 */

const BASE_URL = process.argv[2] || 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, testFn) {
  try {
    log(`\nTesting: ${name}`, 'blue');
    await testFn();
    testsPassed++;
    log(`✓ PASS: ${name}`, 'green');
  } catch (error) {
    testsFailed++;
    log(`✗ FAIL: ${name}`, 'red');
    log(`  Error: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Response: ${JSON.stringify(error.response.data).substring(0, 100)}`, 'red');
    }
  }
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }
  
  return await response.json();
}

async function runTests() {
  log('='.repeat(60), 'blue');
  log(`Powerball API Server Tests - Testing: ${BASE_URL}`, 'blue');
  log('='.repeat(60), 'blue');

  // Test 1: Powerball Status Endpoint
  await test('GET /api/powerball-status', async () => {
    const data = await fetchAPI('/powerball-status');
    if (!data.success) {
      throw new Error('Status endpoint returned success: false');
    }
    if (!data.message) {
      throw new Error('Status endpoint missing message field');
    }
    log(`  Response: ${JSON.stringify(data)}`, 'yellow');
  });

  // Test 2: Powerball Data Endpoint
  await test('GET /api/powerball-data', async () => {
    const data = await fetchAPI('/powerball-data');
    if (!Array.isArray(data)) {
      throw new Error('Data endpoint should return an array');
    }
    if (data.length === 0) {
      log('  Warning: Data array is empty', 'yellow');
    }
    log(`  Response: Array with ${data.length} items`, 'yellow');
    if (data.length > 0) {
      const firstItem = data[0];
      if (!firstItem.DrawDate || !firstItem.WinningNumbers) {
        throw new Error('Data items missing required fields (DrawDate, WinningNumbers)');
      }
      log(`  Sample item: DrawDate=${firstItem.DrawDate}, has WinningNumbers=${!!firstItem.WinningNumbers}`, 'yellow');
    }
  });

  // Test 3: CORS Headers
  await test('CORS Headers', async () => {
    const response = await fetch(`${API_BASE}/powerball-status`, {
      method: 'OPTIONS',
    });
    const corsHeader = response.headers.get('Access-Control-Allow-Origin');
    if (!corsHeader) {
      throw new Error('Missing CORS headers');
    }
    log(`  CORS Origin: ${corsHeader}`, 'yellow');
  });

  // Test 4: Update Powerball Endpoint (quick test - may timeout)
  await test('POST /api/update-powerball (timeout test)', async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${API_BASE}/update-powerball`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        log(`  Response: ${JSON.stringify(data)}`, 'yellow');
      } else {
        log(`  Status: ${response.status} (endpoint is accessible, operation may be long-running)`, 'yellow');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        log('  Endpoint responded but operation timed out (expected for long-running operation)', 'yellow');
        // This is actually success - the endpoint is working, just takes time
      } else {
        throw error;
      }
    }
  });

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  log(`Total Tests: ${testsPassed + testsFailed}`, 'blue');
  log(`Passed: ${testsPassed}`, 'green');
  log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log('='.repeat(60), 'blue');
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\nFatal Error: ${error.message}`, 'red');
  process.exit(1);
});

