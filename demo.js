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

async function demo() {
  console.log('🚀 Testing Version Controlled Key-Value Store API\n');
  
  const baseOptions = {
    hostname: 'localhost',
    port: 3001,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    // Test 1: Store a key-value pair
    console.log('1. Storing key-value pair: {"mykey": "value1"}');
    const store1 = await makeRequest({
      ...baseOptions,
      path: '/object',
      method: 'POST'
    }, { mykey: 'value1' });
    console.log('   Response:', store1.data);
    const timestamp1 = store1.data.timestamp;

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Update the same key with new value
    console.log('\n2. Updating same key: {"mykey": "value2"}');
    const store2 = await makeRequest({
      ...baseOptions,
      path: '/object',
      method: 'POST'
    }, { mykey: 'value2' });
    console.log('   Response:', store2.data);
    const timestamp2 = store2.data.timestamp;

    // Test 3: Get latest value
    console.log('\n3. Getting latest value for "mykey"');
    const get1 = await makeRequest({
      ...baseOptions,
      path: '/object/mykey',
      method: 'GET'
    });
    console.log('   Response:', get1.data);

    // Test 4: Get value at first timestamp
    console.log(`\n4. Getting value at timestamp ${timestamp1} (should return "value1")`);
    const get2 = await makeRequest({
      ...baseOptions,
      path: `/object/mykey?timestamp=${timestamp1}`,
      method: 'GET'
    });
    console.log('   Response:', get2.data);

    // Test 5: Get value at second timestamp
    console.log(`\n5. Getting value at timestamp ${timestamp2} (should return "value2")`);
    const get3 = await makeRequest({
      ...baseOptions,
      path: `/object/mykey?timestamp=${timestamp2}`,
      method: 'GET'
    });
    console.log('   Response:', get3.data);

    // Test 6: Try to get non-existent key
    console.log('\n6. Getting non-existent key "nonexistent"');
    const get4 = await makeRequest({
      ...baseOptions,
      path: '/object/nonexistent',
      method: 'GET'
    });
    console.log('   Response:', get4.data);

    // Test 7: Health check
    console.log('\n7. Health check');
    const health = await makeRequest({
      ...baseOptions,
      path: '/health',
      method: 'GET'
    });
    console.log('   Response:', health.data);

    console.log('\n✅ All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during demo:', error.message);
  }
}

demo();
