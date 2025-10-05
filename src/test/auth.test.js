
const JWT_SECRET = 'testsecret';
process.env.JWT_SECRET = JWT_SECRET;
process.env.JWT_EXPIRES = '1h'; //

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/user.schema');

let mongod;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
});
afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
});

describe('Auth: signup / login / protect', () => {
    test('signup: creates user, returns token and user (no password)', async () => {
        const payload = {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        password: 'password123',
        confirmPassword: 'password123'
    };

        const res = await request(app).post('/api/auth/signup').send(payload).expect(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).not.toHaveProperty('password');

        // verify user exists in DB and password is hashed
        const dbUser = await User.findOne({ email: payload.email }).select('+password');
        expect(dbUser).toBeTruthy();
        expect(dbUser.password).not.toBe(payload.password);
        const match = await dbUser.comparePassword(payload.password);
        expect(match).toBe(true);
});

test('signup: duplicate email returns 409', async () => {
        const p = { firstName:'Test', lastName:'User', email:'testuser@example.com', password:'abc1234', confirmPassword:'abc1234' };
        await request(app).post('/api/auth/signup').send(p).expect(201);
        await request(app).post('/api/auth/signup').send(p).expect(409);
});

test('signup: password mismatch returns 400', async () => {
        const p = { firstName:'Test', lastName:'User', email:'mismatch@example.com', password:'12345678', confirmPassword:'87654321' };
        const res = await request(app).post('/api/auth/signup').send(p).expect(400);
        expect(res.body.message || res.body.error).toBeTruthy();
});

test('login: success returns token and user', async () => {
        // create user
        const payload = { firstName:'Test', lastName:'User', email:'login@example.com', password:'pass123', confirmPassword:'pass123' };
        await request(app).post('/api/auth/signup').send(payload).expect(201);

    const res = await request(app).post('/api/auth/login').send({ email: payload.email, password: payload.password }).expect(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.email).toBe(payload.email);
});

test('login: invalid credentials returns 400', async () => {
        await request(app).post('/api/auth/login').send({ email: 'noone@example.com', password: 'password' }).expect(400);
        // create user then wrong password
        const p = { firstName:'Test', lastName:'User', email:'testuser@example.com', password:'right123', confirmPassword:'right123' };
        await request(app).post('/api/auth/signup').send(p).expect(201);
        await request(app).post('/api/auth/login').send({ email: p.email, password: 'badpass' }).expect(400);
});

test('protect middleware: /users/me requires valid token', async () => {
        const p = { firstName:'Test', lastName:'User', email:'testuser@example.com', password:'pwd1234', confirmPassword:'pwd1234' };
        const signup = await request(app).post('/api/auth/signup').send(p).expect(201);
        const token = signup.body.token;

    // valid token -> success
    const ok = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(ok.body.user.email).toBe(p.email);

    // invalid token -> 401
    await request(app).get('/api/users/me').set('Authorization', 'Bearer bad.token.here').expect(401);

    // missing token -> 401
    await request(app).get('/api/users/me').expect(401);
});
});
