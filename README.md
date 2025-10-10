# Farmarket API

Farmarket is a backend application designed to simplify agricultural product trading by connecting farmers, vendors, and buyers. It enables secure authentication, efficient product management, and structured category organization — all powered by Node.js and Express.

The goal is to provide a reliable foundation for a full-stack marketplace that promotes local agribusiness and digital inclusion across Africa.

---

## Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Database:** MongoDB (Mongoose ODM)  
- **Authentication:** JWT  
- **Image Storage:** Cloudinary  
- **Testing:** Jest + Supertest  
- **CI/CD:** GitHub Actions
- **Deployment:** Railway
- **API documentation:** Postman

---

## Key Features

- User registration and login with JWT authentication  
- Secure password hashing using bcrypt  
- CRUD operations for **categories** and **products**  
- Cloudinary integration for product image uploads  
- Input validation and structured error handling  
- Centralized environment configuration  
- Modular folder structure for scalability

---

## Folder Structure

```
farmflow-backend/
│
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   └── product.controller.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── multer.js
│   ├── models/
│   │   ├── category.schema.js
│   │   ├── product.schema.js
│   │   └── user.schema.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── category.routes.js
│   │   └── product.routes.js
│   ├── utils/
│   │   └── uploadCloudinary.js
|   |   └── deleteCloudinary.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── category.test.js
│   │   └── product.test.js
│   ├── app.js
│   └── index.js
│
├── .env.example
├── package.json
└── README.md
```

---

## Environment Variables
```bash
Create a `.env` file in the root directory and include the following:
cp .env.sample .env

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/ugberaeseac/farmarketBackend.git

# 2. Navigate to the project folder
cd farmarketBackend

# 3. Install dependencies
npm install

# 4. Create and configure .env file (see above)

# 5. Start the development server
npm run dev

# 6. Run tests
npm test
```

---

## 📡 API Documentation

### ** Auth Routes**

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

### ** Category Routes**

#### Create Category  
**POST** `/api/categories`

**Request:**
```json
{ "name": "Fruits" }
```

**Response:**
```json
{
  "_id": "672b1a4...",
  "name": "Fruits",
  "slug": "fruits",
  "createdAt": "2025-10-10T12:34:56Z"
}
```

#### Get All Categories  
**GET** `/api/categories`

---

### ** Product Routes**

#### Create Product  
**POST** `/api/products`  
> Requires authentication (Bearer Token)

**Request:**
```json
{
  "name": "Organic Tomatoes",
  "description": "Freshly picked tomatoes from local farms",
  "unit": "kg",
  "quantity": 50,
  "pricePerUnit": 300,
  "minimumOrderQuantity": 10,
  "status": "is_active",
  "category": "672b1a4...",
  "image": "image_upload_link"
}
```

**Response:**
```json
{
  "_id": "672b2f9...",
  "name": "Organic Tomatoes",
  "description": "Freshly picked tomatoes from local farms",
  "unit": "kg",
  "quantity": 50,
  "pricePerUnit": 300,
  "minimumOrderQuantity": 10,
  "status": "is_active",
  "category": "672b1a4...",
  "image": "https://res.cloudinary.com/.../tomatoes.jpg"
}
```

#### Get Products by Category  
**GET** `/api/categories/:id/products`

---

## Testing

Farmarket includes automated tests powered by **Jest** and **Supertest**.

```bash
# Run all tests
npm test
```

Each test covers core functionalities:
- Authentication flow (register/login)  
- Category CRUD  
- Product creation and retrieval  

---

## Future Improvements

- Add password reset functionality  
- Implement pagination and product search  
- Introduce admin dashboard for vendor management  
- Add payment integration (Flutterwave/Paystack)

---

## Resources

- 🌐 **Live App:** [FarmFlow (Mobile)](https://farm-flow-tawny.vercel.app/)  
- 💻 **Backend Repo:** [GitHub Repository](https://github.com/ugberaeseac/farmarketBackend.git)  
- 🧠 **Figma Design:** [View Design](https://www.figma.com/design/2NaSN8pjmf81m3o9FV2AMd/Farm-Flow?node-id=13-72&t=xMZmArayZqEsj4xW-1)  
- 📮 **Postman Docs:** [API Collection](https://documenter.getpostman.com/view/45172601/2sB3QJNAWg#0c27c894-f676-41e6-a7b2-39a799a4040a)  
- ⚙️ **Backend API:** [API Base URL](https://farmarket.up.railway.app/api/)

---
