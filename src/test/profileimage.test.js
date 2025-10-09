// src/test/user.profileImage.test.js
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.JWT_EXPIRES = '1h';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const User = require('../models/user.schema');

// Mock Cloudinary upload/delete utils so tests don't hit the network
jest.mock('../utils/uploadCloudinary', () => {
  return {
    uploadSingleFile: jest.fn(async (buffer, publicId, folder, resource_type) => {
      // return a fake Cloudinary-like response
      return {
        secure_url: `https://res.cloudinary.com/demo/${publicId}.jpg`,
        public_id: publicId,
        resource_type: resource_type || 'image'
      };
    })
  };
});
jest.mock('../utils/deleteCloudinary', () => {
  return {
    __esModule: true,
    default: jest.fn(async (publicIds) => {
      // return fake deletion result (some code calls single publicId, product code might call array)
      return { result: 'ok' };
    }),
    // if your controller imports named function, mock named export too:
    deleteSingleFile: jest.fn(async (publicId) => ({ result: 'ok' }))
  };
});

const { uploadSingleFile } = require('../utils/uploadCloudinary');
const deleteUtils = require('../utils/deleteCloudinary');

let mongod;

const userPayload = {
  firstName: 'Test',
  lastName: 'User',
  email: 'testuser@example.com',
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
  jest.clearAllMocks();
});

describe('Profile image upload (updateProfileImage)', () => {
  let token;

  beforeEach(async () => {
    // create & login user
    await request(app).post('/api/auth/signup').send(userPayload).expect(201);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userPayload.email, password: userPayload.password })
      .expect(200);
    token = loginRes.body.token;
  });

  test('successful profile image upload (first time)', async () => {
    const res = await request(app)
      .patch('/api/users/me/profile/image')            // route used in controller routing
      .set('Authorization', `Bearer ${token}`)
      .attach('profileImage', Buffer.from([0xff, 0xd8, 0xff]), 'avatar.jpg') // .jpg -> image/jpeg
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Profile image updated successfully');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('profileImage');
    expect(res.body.user.profileImage).toHaveProperty('url');
    expect(res.body.user.profileImage).toHaveProperty('publicId');

    // ensure uploadSingleFile was called
    expect(uploadSingleFile).toHaveBeenCalledTimes(1);
    const calledWith = uploadSingleFile.mock.calls[0];
    // args: (buffer, publicId, folder, mimetype)
    expect(calledWith.length).toBeGreaterThanOrEqual(3);
  });

  test('replace existing profile image: old one removed and new set', async () => {
    // first upload
    const first = await request(app)
      .patch('/api/users/me/profile/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('profileImage', Buffer.from([0xff, 0xd8, 0xff]), 'first.jpg')
      .expect(200);

    const firstPublicId = first.body.user.profileImage.publicId;

    // prepare delete mock: some controllers call deleteSingleFile(publicId) or default export; handle both
    // our mock already defined; assert later it's called with previous id

    // second upload (this should attempt to delete the first publicId)
    const second = await request(app)
      .patch('/api/users/me/profile/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('profileImage', Buffer.from([0x89, 0x50, 0x4e]), 'second.png')
      .expect(200);

    const secondPublicId = second.body.user.profileImage.publicId;
    expect(secondPublicId).not.toEqual(firstPublicId);

    // delete util should have been called at least once with the previous publicId
    // depending on how you imported, either default or named export is used in controller. Check both:
    if (typeof deleteUtils === 'function') {
      // default export is a function (mocked earlier as default fn) - not likely in our test but keep safe
      expect(deleteUtils).toHaveBeenCalled();
    } else {
      // check named deleteSingleFile
      const { deleteSingleFile } = require('../utils/deleteCloudinary');
      expect(deleteSingleFile).toHaveBeenCalled();
      // ensure one of the calls included the previous public id
      const calledArgs = deleteSingleFile.mock.calls.flat();
      expect(calledArgs.some(a => a === firstPublicId || (Array.isArray(a) && a.includes(firstPublicId)))).toBeTruthy();
    }

    // upload called twice total
    expect(uploadSingleFile).toHaveBeenCalledTimes(2);
  });

  test('unsupported mimetype returns 400', async () => {
    // attach a .txt file which yields text/plain mimetype
    await request(app)
      .patch('/api/users/me/profile/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('profileImage', Buffer.from('hello world'), 'not-image.txt')
      .expect(400);
  });

  test('no file uploaded returns 400', async () => {
    await request(app)
      .patch('/api/users/me/profile/image')
      .set('Authorization', `Bearer ${token}`)
      .send({}) // no multipart attach
      .expect(400);
  });
});
