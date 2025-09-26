const request = require('supertest');
const app = require('../app');

describe('Health Test', () => {
    it('should return status 200.OK and API homepage message', async() => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toBe('This is the API homepage');
    });
});