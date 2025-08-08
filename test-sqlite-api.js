const http = require('http');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testSQLiteAPI() {
  console.log('🗄️ SQLite API Regression Test');
  console.log('Testing SQLite server running on http://localhost:3000 (npm start)');
  console.log('');

  const baseOptions = {
    hostname: 'localhost',
    port: 3000,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    // Test 1: API Documentation
    console.log('1. Testing API Documentation:');
    const docs = await makeRequest({
      ...baseOptions,
      path: '/',
      method: 'GET'
    });
    console.log('   Status:', docs.status === 200 ? '✅ OK' : '❌ Failed');
    console.log('   Database:', docs.data.database || docs.data.name);
    console.log('');

    // Test 2: Health Check
    console.log('2. Testing Health Check:');
    const health = await makeRequest({
      ...baseOptions,
      path: '/health',
      method: 'GET'
    });
    console.log('   Status:', health.status === 200 ? '✅ Healthy' : '❌ Unhealthy');
    console.log('   Database Status:', health.data.database || health.data.status);
    console.log('');

    // Test 3: Store value
    console.log('3. Storing regression test value:');
    const store1 = await makeRequest({
      ...baseOptions,
      path: '/object',
      method: 'POST'
    }, { regression_test: 'test_value_1' });
    console.log('   Status:', store1.status === 200 ? '✅ Success' : '❌ Failed');
    console.log('   Response:', store1.data);
    const timestamp1 = store1.data.timestamp;
    console.log('');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Update value
    console.log('4. Updating regression test value:');
    const store2 = await makeRequest({
      ...baseOptions,
      path: '/object',
      method: 'POST'
    }, { regression_test: 'test_value_2' });
    console.log('   Status:', store2.status === 200 ? '✅ Success' : '❌ Failed');
    console.log('   Response:', store2.data);
    console.log('');

    // Test 5: Get latest value
    console.log('5. Getting latest value:');
    const get1 = await makeRequest({
      ...baseOptions,
      path: '/object/regression_test',
      method: 'GET'
    });
    console.log('   Status:', get1.status === 200 ? '✅ Found' : '❌ Not Found');
    console.log('   Latest Value:', get1.data.value);
    console.log('   Correct Value:', get1.data.value === 'test_value_2' ? '✅ Yes' : '❌ No');
    console.log('');

    // Test 6: Get value at first timestamp
    if (timestamp1) {
      console.log(`6. Getting value at first timestamp (${timestamp1}):`);
      const get2 = await makeRequest({
        ...baseOptions,
        path: `/object/regression_test?timestamp=${timestamp1}`,
        method: 'GET'
      });
      console.log('   Status:', get2.status === 200 ? '✅ Found' : '❌ Not Found');
      console.log('   Historical Value:', get2.data.value);
      console.log('   Version Control:', get2.data.value === 'test_value_1' ? '✅ Working' : '❌ Failed');
      console.log('');
    }

    // Test 7: Error handling
    console.log('7. Testing error handling (non-existent key):');
    const get3 = await makeRequest({
      ...baseOptions,
      path: '/object/nonexistent_key',
      method: 'GET'
    });
    console.log('   Status:', get3.status === 404 ? '✅ Correct 404' : '❌ Wrong Status');
    console.log('   Error Message:', get3.data.error);
    console.log('');

    console.log('✅ SQLite API regression test completed!');
    
  } catch (error) {
    console.error('❌ Error during local API testing:', error.message);
    console.log('');
    console.log('💡 Make sure the server is running on http://localhost:3000');
  }
}

testSQLiteAPI();
