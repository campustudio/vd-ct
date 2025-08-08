const request = require('supertest');
const app = require('./server');

async function testProductionFeatures() {
  console.log('🔧 Testing Production Quality Features');
  console.log('=====================================\n');

  let testCount = 0;
  let passedCount = 0;

  async function runTest(testName, testFn) {
    testCount++;
    console.log(`${testCount}. Testing ${testName}:`);
    
    try {
      const result = await testFn();
      passedCount++;
      console.log(`   Status: ✅ ${result.status || 'Passed'}`);
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    } catch (error) {
      console.log(`   Status: ❌ Failed`);
      console.log(`   Error: ${error.message}`);
    }
    console.log();
  }

  // Test 1: Production Health Check
  await runTest('Production Health Check', async () => {
    const response = await request(app).get('/health');
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const requiredFields = ['status', 'timestamp', 'uptime', 'database', 'memory', 'nodeVersion'];
    for (const field of requiredFields) {
      if (!response.body.hasOwnProperty(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    return {
      status: 'Production health check working',
      details: {
        status: response.body.status,
        database: response.body.database.status,
        memory: response.body.memory.used,
        nodeVersion: response.body.nodeVersion
      }
    };
  });

  // Test 2: Content-Type Validation
  await runTest('Content-Type Validation', async () => {
    const response = await request(app)
      .post('/object')
      .set('Content-Type', 'text/plain')
      .send('{"test": "value"}')
      .expect(400);
    
    if (!response.body.requestId) {
      throw new Error('Missing requestId in error response');
    }
    
    if (!response.body.timestamp) {
      throw new Error('Missing timestamp in error response');
    }
    
    return {
      status: 'Content-Type validation working',
      details: {
        error: response.body.error,
        requestId: response.body.requestId.substring(0, 20) + '...',
        hasTimestamp: !!response.body.timestamp
      }
    };
  });

  // Test 3: Production Key Validation with Hints
  await runTest('Production Key Validation', async () => {
    const response = await request(app)
      .post('/object')
      .set('Content-Type', 'application/json')
      .send({ 'invalid key!': 'value' })
      .expect(400);
    
    if (!response.body.hints || !Array.isArray(response.body.hints)) {
      throw new Error('Missing validation hints');
    }
    
    if (!response.body.requestId) {
      throw new Error('Missing requestId');
    }
    
    return {
      status: 'Production validation with hints working',
      details: {
        error: response.body.error,
        hintsCount: response.body.hints.length,
        requestId: response.body.requestId.substring(0, 20) + '...'
      }
    };
  });

  // Test 4: Enhanced 201 Status Code for POST
  await runTest('Enhanced POST Response (201 Created)', async () => {
    const response = await request(app)
      .post('/object')
      .set('Content-Type', 'application/json')
      .send({ 'test_enhanced': 'value' })
      .expect(201);
    
    if (!response.body.requestId) {
      throw new Error('Missing requestId in success response');
    }
    
    if (!response.body.size) {
      throw new Error('Missing size information');
    }
    
    return {
      status: '201 Created status working',
      details: {
        key: response.body.key,
        timestamp: response.body.timestamp,
        size: response.body.size,
        requestId: response.body.requestId.substring(0, 20) + '...'
      }
    };
  });

  // Test 5: Enhanced GET Response with Metadata
  await runTest('Enhanced GET Response', async () => {
    const response = await request(app)
      .get('/object/test_enhanced')
      .expect(200);
    
    if (!response.body.requestId) {
      throw new Error('Missing requestId in GET response');
    }
    
    if (!response.body.retrievedAt) {
      throw new Error('Missing retrievedAt timestamp');
    }
    
    return {
      status: 'Enhanced GET response working',
      details: {
        value: response.body.value,
        timestamp: response.body.timestamp,
        requestId: response.body.requestId.substring(0, 20) + '...',
        hasRetrievedAt: !!response.body.retrievedAt
      }
    };
  });

  // Test 6: Enhanced 404 Error with Suggestions
  await runTest('Enhanced 404 Error Handling', async () => {
    const response = await request(app)
      .get('/unknown-endpoint')
      .expect(404);
    
    if (!response.body.availableEndpoints || !Array.isArray(response.body.availableEndpoints)) {
      throw new Error('Missing available endpoints list');
    }
    
    if (!response.body.hint) {
      throw new Error('Missing helpful hint');
    }
    
    return {
      status: 'Enhanced 404 handling working',
      details: {
        error: response.body.error,
        endpointsCount: response.body.availableEndpoints.length,
        hint: response.body.hint,
        requestId: response.body.requestId.substring(0, 20) + '...'
      }
    };
  });

  // Test 7: Enhanced Timestamp Validation with Hints
  await runTest('Enhanced Timestamp Validation', async () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + (2 * 24 * 60 * 60); // 2 days in future
    const response = await request(app)
      .get(`/object/test_enhanced?timestamp=${futureTimestamp}`)
      .expect(400);
    
    if (!response.body.hints || !Array.isArray(response.body.hints)) {
      throw new Error('Missing timestamp validation hints');
    }
    
    return {
      status: 'Enhanced timestamp validation working',
      details: {
        error: response.body.error,
        hintsCount: response.body.hints.length,
        exampleProvided: response.body.hints.some(hint => hint.includes('Example:'))
      }
    };
  });

  // Summary
  console.log('=====================================');
  console.log('📊 Enhanced Features Test Summary');
  console.log('=====================================');
  console.log(`Total Tests: ${testCount}`);
  console.log(`Passed: ${passedCount} ✅`);
  console.log(`Failed: ${testCount - passedCount} ❌`);
  console.log(`Success Rate: ${Math.round((passedCount / testCount) * 100)}%`);
  
  if (passedCount === testCount) {
    console.log('\n🎉 All enhanced production features are working correctly!');
    console.log('✅ Error tracking with unique IDs');
    console.log('✅ Enhanced validation with helpful hints');
    console.log('✅ Detailed system health monitoring');
    console.log('✅ Request/response metadata tracking');
    console.log('✅ Production-ready error handling');
  } else {
    console.log('\n⚠️  Some enhanced features failed testing.');
  }
  
  process.exit(passedCount === testCount ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  testProductionFeatures().catch(error => {
    console.error('Production features test failed:', error.message);
    process.exit(1);
  });
}

module.exports = testProductionFeatures;
