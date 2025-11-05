# FarMarket Backend API

A RESTful API for an agricultural marketplace connecting farmers and buyers. Built with Node.js, Express, and MongoDB.

## Features

- 🔐 Authentication & Authorization (JWT)
- 👨‍🌾 User roles (buyer, farmer, admin)
- 📦 Product management with images
- 🗂️ Category organization
- 🖼️ Image upload (Cloudinary)
- 📄 API documentation (Swagger)

## Tech Stack

- **Runtime:** Node.js >= 18
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **Image Storage:** Cloudinary
- **Testing:** Jest + Supertest
- **Deployment:** Render
- **Documentation:** Swagger/OpenAPI

---

## Installation

```bash
# Clone the repository
git clone https://github.com/Ezekiel942/farmarketBackend.git

# Install dependencies
cd farmarketBackend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start the server
npm start

# For development with auto-reload
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES=1h

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## API Documentation

### Authentication Endpoints

#### Register New User

```http
POST /api/auth/signup
Content-Type: application/json

{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
}
```

Response (201 Created):
```json
{
    "message": "User successfully created",
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
        "_id": "5f7d3e...",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "role": "buyer"
    }
}
```

#### User Login

```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```

Response (200 OK):
```json
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
        "_id": "5f7d3e...",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "role": "buyer"
    }
}
```

#### Register User  
**POST** `/api/auth/signup`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@demo.com",
  "password": "strongpassword"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "672aef1234...",
    "name": "John Doe",
    "email": "john@demo.com"
  },
  "token": "eyJhbGciOiJIUzI1..."
}
```

---

#### Login User  
**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "john@demo.com",
  "password": "strongpassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1..."
}
```

---

### Product Management

#### Create Product

```http
POST /api/products
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

{
    "name": "Fresh Tomatoes",
    "description": "Organic farm-fresh tomatoes",
    "category": "category_id",
    "quantity": 100,
    "unit": "kg",
    "pricePerUnit": 2.5,
    "minimumOrderQuantity": {
        "value": 10,
        "unit": "kg",
        "enabled": true
    },
    "images": [files]
}
```

Response (201 Created):
```json
{
    "message": "Product created successfully",
    "data": {
        "_id": "5f7d3e...",
        "name": "Fresh Tomatoes",
        "description": "Organic farm-fresh tomatoes",
        "slug": "fresh-tomatoes",
        "category": "5f7d3e...",
        "farmer": "5f7d3e...",
        "quantity": 100,
        "unit": "kg",
        "pricePerUnit": 2.5,
        "images": [
            {
                "url": "https://res.cloudinary.com/...",
                "publicId": "farmarket/..."
            }
        ],
        "status": "is_active"
    }
}
```

#### List All Products

```http
GET /api/products
```

Response (200 OK):
```json
{
    "message": "Products retrieved successfully",
    "data": [
        {
            "_id": "5f7d3e...",
            "name": "Fresh Tomatoes",
            "description": "Organic farm-fresh tomatoes",
            "slug": "fresh-tomatoes",
            "category": {
                "_id": "5f7d3e...",
                "name": "Vegetables"
            },
            "farmer": {
                "_id": "5f7d3e...",
                "firstName": "John",
                "lastName": "Doe"
            },
            "quantity": 100,
            "unit": "kg",
            "pricePerUnit": 2.5,
            "images": [
                {
                    "url": "https://res.cloudinary.com/...",
                    "publicId": "farmarket/..."
                }
            ],
            "status": "is_active"
        }
    ]
}
```

### Category Management

#### Create Category (Admin Only)

```http
POST /api/categories
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
    "name": "Vegetables"
}
```

Response (201 Created):
```json
{
    "message": "Category created successfully",
    "data": {
        "_id": "5f7d3e...",
        "name": "Vegetables",
        "slug": "vegetables"
    }
}
```

#### List Categories

```http
GET /api/categories
```

Response (200 OK):
```json
{
    "message": "Categories retrieved successfully",
    "data": [
        {
            "_id": "5f7d3e...",
            "name": "Vegetables",
            "slug": "vegetables"
        }
    ]
}
```

## Response Formats

### Success Response
```json
{
    "message": "Operation successful",
    "data": {
        // Response data
    }
}
```

### Error Response
```json
{
    "message": "Error description"
}
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Render Deployment Steps

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables in Render dashboard
5. Deploy!

### Required Environment Variables on Render

- `NODE_ENV=production`
- `PORT=10000` (Render will override this)
- `MONGO_URI=your_production_mongodb_uri`
- `JWT_SECRET=your_production_jwt_secret`
- `CLOUDINARY_CLOUD_NAME=your_cloud_name`
- `CLOUDINARY_API_KEY=your_api_key`
- `CLOUDINARY_API_SECRET=your_api_secret`

## API Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Server Error

## Security Features

- Password hashing (bcrypt)
- JWT authentication
- Role-based access control
- Request validation
- Secure headers (helmet)
- CORS protection

## License

This project is licensed under the ISC License.

---
