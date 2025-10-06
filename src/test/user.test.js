process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRES = '1h';

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app'); // path from src/test -> src/app.js
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

const signToken = (id, role = 'buyer') => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });
};

describe('User controller', () => {
  test('GET /api/users/me returns current user (protected)', async () => {
    // create user via signup endpoint to get token
    const p = { firstName:'Test', lastName:'User', email:'testuser@example.com', password:'pass123', confirmPassword:'pass123' };
    const signup = await request(app).post('/api/auth/signup').send(p).expect(201);
    const token = signup.body.token;

    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.user).toHaveProperty('email', p.email);
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('GET /api/users is admin-only and lists users', async () => {
    // create admin directly in DB
    const admin = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'adminpass',
        role: 'admin'
    });
    const adminToken = signToken(admin._id.toString(), 'admin');

    // create a regular user
    await request(app).post('/api/auth/signup').send({
        firstName:'New', lastName:'User', email:'newuser@example.com', password:'password1', confirmPassword:'password1'
    }).expect(201);

    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/users/:id validations and fetch single user', async () => {
    const u = await User.create({
        firstName:'Test', lastName:'User', email:'testuser@example.com', password:'pw123565'
    });
    const admin = await User.create({
        firstName: 'Admin2', lastName: 'Account', email: 'admin2@example.com', password: 'adminPassword', role: 'admin'
    });
    const adminToken = signToken(admin._id.toString(), 'admin');

    // invalid id
    await request(app).get('/api/users/invalid-id').set('Authorization', `Bearer ${adminToken}`).expect(400);

    // not found
    const fakeId = new mongoose.Types.ObjectId();
    await request(app).get(`/api/users/${fakeId}`).set('Authorization', `Bearer ${adminToken}`).expect(404);

    // success
    const res = await request(app).get(`/api/users/${u._id.toString()}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(res.body.user).toHaveProperty('email', 'testuser@example.com');
  });

  test('PUT /api/users/:id update user, email conflict returns 409', async () => {
    // create two users
    const a = await User.create({ firstName:'Test', lastName:'User', email:'testuser@example.com', password:'password1' });
    const b = await User.create({ firstName:'New', lastName:'User', email:'newuser@example.com', password:'password2' });

    // user A signs in to get token
    const signupA = await request(app).post('/api/auth/signup').send({
        firstName: 'Test', lastName: 'User', email: 'testuser@example.com', password: 'password1', confirmPassword: 'password1'
    }).expect(201).catch(() => {}); // ignore if duplicate during reruns
    // For stable auth token: generate token directly from DB id
    const tokenA = signToken(a._id.toString(), a.role);

    // attempt to update A's email to B's email -> expect 409
    const resConflict = await request(app)
        .put(`/api/users/${a._id.toString()}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ email: 'newuser@example.com' })
        .expect(409);
    expect(resConflict.body.message).toMatch(/Email already in use/i);

    // successful update (change firstName)
    const resOk = await request(app)
        .put(`/api/users/${a._id.toString()}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ firstName: 'A-updated' })
        .expect(200);
    expect(resOk.body.data).toHaveProperty('firstName', 'A-updated');
  });

  test('DELETE /api/users/:id admin can delete user', async () => {
        const target = await User.create({ firstName:'Test', lastName:'User', email:'testuser@example.com', password:'password1' });
        const admin = await User.create({ firstName:'Admin', lastName:'User', email:'adminuser@example.com', password:'adminPass', role:'admin' });
        const adminToken = signToken(admin._id.toString(), 'admin');

        const res = await request(app).delete(`/api/users/${target._id.toString()}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
        expect(res.body.data.email).toBe('testuser@example.com');

    // now trying to delete non-existing returns 404
    await request(app).delete(`/api/users/${target._id.toString()}`).set('Authorization', `Bearer ${adminToken}`).expect(404);
  });

  test('PATCH /api/users/:id setUserRole (admin only) and validation', async () => {
        const target = await User.create({ firstName:'Test', lastName:'User', email:'testuser@example.com', password:'password1' });
        const admin = await User.create({ firstName:'Admin', lastName:'User', email:'adminz@example.com', password:'passAdmin', role:'admin' });
        const adminToken = signToken(admin._id.toString(), 'admin');

    // invalid role
    await request(app).patch(`/api/users/${target._id.toString()}/role`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'invalidRole' }).expect(400);

    // valid role update
    const res = await request(app).patch(`/api/users/${target._id.toString()}/role`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'farmer' }).expect(200);
    expect(res.body.data.role).toBe('farmer');
  });
});
