const request = require('supertest');
const app = require('../server');
const Database = require('../src/database');

describe('Version Controlled Key-Value Store API', () => {
  let testDb;

  beforeAll(async () => {
    // Use in-memory database for testing
    testDb = new Database(':memory:');
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DB init
  });

  afterAll(async () => {
    if (testDb) {
      await testDb.close();
    }
  });

  describe('POST /object', () => {
    test('should store a key-value pair successfully', async () => {
      const response = await request(app)
        .post('/object')
        .send({ mykey: 'value1' })
        .expect(201);

      expect(response.body).toHaveProperty('key', 'mykey');
      expect(response.body).toHaveProperty('value', 'value1');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('number');
    });

    test('should update existing key with new value', async () => {
      // Store initial value
      await request(app)
        .post('/object')
        .send({ testkey: 'value1' })
        .expect(201);

      // Update with new value
      const response = await request(app)
        .post('/object')
        .send({ testkey: 'value2' })
        .expect(201);

      expect(response.body).toHaveProperty('key', 'testkey');
      expect(response.body).toHaveProperty('value', 'value2');
    });

    test('should reject empty request body', async () => {
      const response = await request(app)
        .post('/object')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject multiple key-value pairs', async () => {
      const response = await request(app)
        .post('/object')
        .send({ key1: 'value1', key2: 'value2' })
        .expect(400);

      expect(response.body.error).toContain('exactly one key-value pair');
    });

    test('should reject invalid key format', async () => {
      const response = await request(app)
        .post('/object')
        .send({ 'invalid key!': 'value' })
        .expect(400);

      expect(response.body.error).toContain('Invalid key');
    });
  });

  describe('GET /object/:key', () => {
    beforeEach(async () => {
      // Store test data
      await request(app)
        .post('/object')
        .send({ gettest: 'initial_value' });
      
      // Wait a moment then store updated value
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await request(app)
        .post('/object')
        .send({ gettest: 'updated_value' });
    });

    test('should get latest value for existing key', async () => {
      const response = await request(app)
        .get('/object/gettest')
        .expect(200);

      expect(response.body).toHaveProperty('value', 'updated_value');
    });

    test('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .get('/object/nonexistent')
        .expect(404);

      expect(response.body.error).toContain('Key not found');
    });

    test('should get value at specific timestamp', async () => {
      // Store a value
      const storeResponse = await request(app)
        .post('/object')
        .send({ timestamptest: 'value_at_time' });

      const timestamp = storeResponse.body.timestamp;

      // Get value at that timestamp
      const response = await request(app)
        .get(`/object/timestamptest?timestamp=${timestamp}`)
        .expect(200);

      expect(response.body).toHaveProperty('value', 'value_at_time');
    });

    test('should reject invalid timestamp format', async () => {
      const response = await request(app)
        .get('/object/testkey?timestamp=invalid')
        .expect(400);

      expect(response.body.error).toContain('Invalid timestamp');
    });

    test('should return 404 for timestamp before key existed', async () => {
      const response = await request(app)
        .get('/object/gettest?timestamp=1')
        .expect(404);

      expect(response.body.error).toContain('No value found');
    });
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown')
        .expect(404);

      expect(response.body.error).toContain('Endpoint not found');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/object')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });
  });
});
