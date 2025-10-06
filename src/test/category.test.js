// src/test/category.test.js
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.JWT_EXPIRES = '1h';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app'); 
const User = require('../models/user.schema');
const Category = require('../models/category.schema');
const Product = require('../models/product.schema');

let mongod;
const adminPayload = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'password123',
    confirmPassword: 'password123'
};
const farmerPayload = {
    firstName: 'Farmer',
    lastName: 'Joe',
    email: 'farmer@example.com',
    password: 'password123',
    confirmPassword: 'password123'
};
const buyerPayload = {
    firstName: 'Buyer',
    lastName: 'Ann',
    email: 'buyer@example.com',
    password: 'password123',
    confirmPassword: 'password123'
};

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
    await Category.deleteMany({});
    await Product.deleteMany({});
});

describe('Category endpoints', () => {
    let adminToken;
    let farmerToken;
    let buyerToken;
    beforeEach(async () => {
        // create admin
        await request(app).post('/api/auth/signup').send(adminPayload).expect(201);
        // promote to admin
        const adminUser = await User.findOne({ email: adminPayload.email });
        adminUser.role = 'admin';
        await adminUser.save();
        // login admin and get token
        const adminLogin = await request(app).post('/api/auth/login').send({ email: adminPayload.email, password: adminPayload.password }).expect(200);
        adminToken = adminLogin.body.token;

        // farmer signup/login then promote to farmer role
        await request(app).post('/api/auth/signup').send(farmerPayload).expect(201);
        const farmerUser = await User.findOne({ email: farmerPayload.email });
        farmerUser.role = 'farmer';
        await farmerUser.save();
        const farmerLogin = await request(app).post('/api/auth/login').send({ email: farmerPayload.email, password: farmerPayload.password }).expect(200);
        farmerToken = farmerLogin.body.token;

        // buyer signup/login
        await request(app).post('/api/auth/signup').send(buyerPayload).expect(201);
        const buyerLogin = await request(app).post('/api/auth/login').send({ email: buyerPayload.email, password: buyerPayload.password }).expect(200);
        buyerToken = buyerLogin.body.token;
    });

    test('Admin can create category; duplicate returns 409; non-admin cannot create', async () => {
        const payload = { name: 'Vegetables' };
        // admin creates
        const res = await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send(payload).expect(201);
        expect(res.body.data).toHaveProperty('name', 'Vegetables');
        expect(res.body.data).toHaveProperty('slug', 'vegetables');

        // duplicate
        await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send(payload).expect(409);

        // farmer cannot create
        await request(app).post('/api/categories').set('Authorization', `Bearer ${farmerToken}`).send({ name: 'Fruits' }).expect(403);

        // buyer cannot create
        await request(app).post('/api/categories').set('Authorization', `Bearer ${buyerToken}`).send({ name: 'Dairy' }).expect(403);
    });

    test('Get categories list and count', async () => {
        // create two categories as admin
        await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Fruits' }).expect(201);
        await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Dairy' }).expect(201);

        const res = await request(app).get('/api/categories').expect(200);
        expect(res.body).toHaveProperty('count', 2);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.map(c => c.slug)).toEqual(expect.arrayContaining(['fruits', 'dairy']));
    });

    test('Get category by id and products for category', async () => {

        const catRes = await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Grains' }).expect(201);
        const catId = catRes.body.data._id;


        // create a product for this category as farmer (no files attached)
        const productPayload = {
        name: 'Maize',
        description: 'Yellow maize',
        category: catId,
        quantity: 100,
        unit: 'kg',
        pricePerUnit: 300,
        status: 'is_active'
        };

        await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${farmerToken}`)
        .field('name', productPayload.name)
        .field('description', productPayload.description)
        .field('category', productPayload.category)
        .field('quantity', String(productPayload.quantity))
        .field('unit', productPayload.unit)
        .field('pricePerUnit', String(productPayload.pricePerUnit))
        .field('status', productPayload.status)
        .expect(201);

        // get category by id
        const byId = await request(app).get(`/api/categories/${catId}`).expect(200);
        expect(byId.body.data).toHaveProperty('slug', 'grains');

        // get products in category
        const catProducts = await request(app).get(`/api/categories/${catId}/products`).expect(200);
        expect(catProducts.body).toHaveProperty('count', 1);
        expect(Array.isArray(catProducts.body.data)).toBe(true);
        expect(catProducts.body.data[0]).toHaveProperty('name', 'Maize');
    });

    test('Update and delete category (admin only)', async () => {
        // create category
        const cat = await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Roots' }).expect(201);
        const catId = cat.body.data._id;

        // update by admin
        const updated = await request(app).put(`/api/categories/${catId}`).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Root Crops' }).expect(200);
        expect(updated.body.data).toHaveProperty('name', 'Root Crops');
        expect(updated.body.data).toHaveProperty('slug', 'root-crops');

        // delete by farmer should fail
        await request(app).delete(`/api/categories/${catId}`).set('Authorization', `Bearer ${farmerToken}`).expect(403);

        // delete by admin should succeed
        await request(app).delete(`/api/categories/${catId}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    });
});
