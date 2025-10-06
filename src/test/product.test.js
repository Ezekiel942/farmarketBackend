// src/test/product.test.js
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.JWT_EXPIRES = '1h';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const User = require('../models/user.schema');
const Category = require('../models/category.schema');
const Product = require('../models/product.schema');

// MOCK cloudinary utils so tests do not call the network
// Provide a mock that works whether controller requires a function or an object with uploadFile
jest.mock('../utils/uploadCloudinary', () => {
  const fn = jest.fn(() => Promise.resolve({
    secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/farmarket/test.jpg',
    public_id: 'farmarket/test-1234',
    resource_type: 'image'
  }));
  // support both module shapes: require(...)() and require(...).uploadFile()
  fn.uploadFile = fn;
  return fn;
});
jest.mock('../utils/deleteCloudinary', () => jest.fn(() => Promise.resolve({ result: 'ok' })));

let mongod;
const farmerPayload = {
  firstName: 'Farmer',
  lastName: 'Joe',
  email: 'farmer2@example.com',
  password: 'password123',
  confirmPassword: 'password123'
};
const buyerPayload = {
  firstName: 'Buyer',
  lastName: 'Ann',
  email: 'buyer2@example.com',
  password: 'password123',
  confirmPassword: 'password123'
};
const adminPayload = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin2@example.com',
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

describe('Product endpoints', () => {
  let farmerToken;
  let buyerToken;
  let adminToken;
  let categoryId;
  beforeEach(async () => {
    // admin signup -> promote to admin -> login
    await request(app).post('/api/auth/signup').send(adminPayload).expect(201);
    const adminUser = await User.findOne({ email: adminPayload.email });
    adminUser.role = 'admin';
    await adminUser.save();
    adminToken = (await request(app).post('/api/auth/login').send({ email: adminPayload.email, password: adminPayload.password })).body.token;

    // farmer signup -> promote to farmer -> login
    await request(app).post('/api/auth/signup').send(farmerPayload).expect(201);
    const farmerUser = await User.findOne({ email: farmerPayload.email });
    farmerUser.role = 'farmer';
    await farmerUser.save();
    farmerToken = (await request(app).post('/api/auth/login').send({ email: farmerPayload.email, password: farmerPayload.password })).body.token;

    // buyer signup/login
    await request(app).post('/api/auth/signup').send(buyerPayload).expect(201);
    buyerToken = (await request(app).post('/api/auth/login').send({ email: buyerPayload.email, password: buyerPayload.password })).body.token;

    // create a category
    const cat = await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Poultry' }).expect(201);
    categoryId = cat.body.data._id;
  });

  test('Buyer cannot create product; farmer can create product (with images mocked)', async () => {
    const productPayload = {
      name: 'Frozen Chicken',
      description: 'Local frozen chicken',
      category: categoryId,
      quantity: 50,
      unit: 'kg',
      pricePerUnit: 1200,
      status: 'is_active'
    };

    // buyer forbidden
    await request(app).post('/api/products').set('Authorization', `Bearer ${buyerToken}`)
      .field('name', productPayload.name)
      .field('description', productPayload.description)
      .field('category', productPayload.category)
      .field('quantity', String(productPayload.quantity))
      .field('unit', productPayload.unit)
      .field('pricePerUnit', String(productPayload.pricePerUnit))
      .field('status', productPayload.status)
      .attach('images', Buffer.from('img'), 'chicken.jpg')
      .expect(403);

    // farmer create (attach file even though upload is mocked)
    const res = await request(app).post('/api/products').set('Authorization', `Bearer ${farmerToken}`)
      .field('name', productPayload.name)
      .field('description', productPayload.description)
      .field('category', productPayload.category)
      .field('quantity', String(productPayload.quantity))
      .field('unit', productPayload.unit)
      .field('pricePerUnit', String(productPayload.pricePerUnit))
      .field('status', productPayload.status)
      .attach('images', Buffer.from('img'), 'chicken.jpg')
      .expect(201);

    expect(res.body.data).toHaveProperty('name', 'Frozen Chicken');
    expect(Array.isArray(res.body.data.images)).toBe(true);
    expect(res.body.data).toHaveProperty('farmer'); // farmer id stored
  });

  test('Validation errors on create product (missing fields)', async () => {
    // missing name
    await request(app).post('/api/products').set('Authorization', `Bearer ${farmerToken}`)
      .send({ description: 'no name', category: categoryId, quantity: 1, unit: 'kg', pricePerUnit: 100 })
      .expect(400);

    // invalid category id
    await request(app).post('/api/products').set('Authorization', `Bearer ${farmerToken}`)
      .send({ name: 'X', description: 'D', category: 'badid', quantity: 1, unit: 'kg', pricePerUnit: 100 })
      .expect(400);
  });

  test('Get all products, get product by id, update and delete permissions', async () => {
    // create product by farmer
    const createRes = await request(app).post('/api/products').set('Authorization', `Bearer ${farmerToken}`)
      .field('name', 'Farm Eggs')
      .field('description', 'Fresh eggs')
      .field('category', categoryId)
      .field('quantity', '200')
      .field('unit', 'dozen')
      .field('pricePerUnit', '800')
      .field('status', 'is_active')
      .attach('images', Buffer.from('img'), 'eggs.jpg')
      .expect(201);

    const productId = createRes.body.data._id;

    // get products list
    const listRes = await request(app).get('/api/products').expect(200);
    expect(listRes.body).toHaveProperty('count', 1);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    // get by id
    const byId = await request(app).get(`/api/products/${productId}`).expect(200);
    expect(byId.body.data).toHaveProperty('name', 'Farm Eggs');

    // update attempt by other farmer (create another farmer)
    const otherFarmer = {
      firstName: 'Farmer2', lastName: 'X', email: 'farmer3@example.com', password: 'password123', confirmPassword: 'password123'
    };
    await request(app).post('/api/auth/signup').send(otherFarmer).expect(201);
    const otherUser = await User.findOne({ email: otherFarmer.email });
    otherUser.role = 'farmer';
    await otherUser.save();
    const otherToken = (await request(app).post('/api/auth/login').send({ email: otherFarmer.email, password: otherFarmer.password })).body.token;

    // other farmer should get 403
    await request(app).put(`/api/products/${productId}`).set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Tampered' })
      .expect(403);

    // owner farmer can update
    const updated = await request(app).put(`/api/products/${productId}`).set('Authorization', `Bearer ${farmerToken}`)
      .field('name', 'Farm Eggs Large')
      .field('minimumOrderQuantity', 10)
      .expect(200);
    expect(updated.body.data).toHaveProperty('name', 'Farm Eggs Large');

    // admin can delete
    await request(app).delete(`/api/products/${productId}`).set('Authorization', `Bearer ${adminToken}`).expect(200);

    // after delete, not found
    await request(app).get(`/api/products/${productId}`).expect(404);
  });
});
