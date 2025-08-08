#!/bin/bash

echo "🚀 Testing Deployed Version Controlled Key-Value Store API"
echo "URL: https://vd-ct.vercel.app"
echo ""

# Test 1: API Documentation
echo "1. Testing API Documentation:"
curl -s https://vd-ct.vercel.app/ | jq .
echo ""

# Test 2: Health Check
echo "2. Testing Health Check:"
curl -s https://vd-ct.vercel.app/health | jq .
echo ""

# Test 3: Store first value
echo "3. Storing first value (mykey: value1):"
RESPONSE1=$(curl -s -X POST https://vd-ct.vercel.app/object \
  -H "Content-Type: application/json" \
  -d '{"mykey": "value1"}')
echo $RESPONSE1 | jq .
TIMESTAMP1=$(echo $RESPONSE1 | jq -r '.timestamp')
echo ""

# Wait a moment
sleep 2

# Test 4: Store updated value
echo "4. Storing updated value (mykey: value2):"
RESPONSE2=$(curl -s -X POST https://vd-ct.vercel.app/object \
  -H "Content-Type: application/json" \
  -d '{"mykey": "value2"}')
echo $RESPONSE2 | jq .
TIMESTAMP2=$(echo $RESPONSE2 | jq -r '.timestamp')
echo ""

# Test 5: Get latest value
echo "5. Getting latest value:"
curl -s https://vd-ct.vercel.app/object/mykey | jq .
echo ""

# Test 6: Get value at first timestamp
echo "6. Getting value at first timestamp ($TIMESTAMP1):"
curl -s "https://vd-ct.vercel.app/object/mykey?timestamp=$TIMESTAMP1" | jq .
echo ""

# Test 7: Get value at second timestamp
echo "7. Getting value at second timestamp ($TIMESTAMP2):"
curl -s "https://vd-ct.vercel.app/object/mykey?timestamp=$TIMESTAMP2" | jq .
echo ""

# Test 8: Test non-existent key
echo "8. Testing non-existent key:"
curl -s https://vd-ct.vercel.app/object/nonexistent | jq .
echo ""

echo "✅ All tests completed!"
echo ""
echo "🌐 Your API is successfully deployed at: https://vd-ct.vercel.app"
