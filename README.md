# R4rupee — Backend API

A personal finance tracker REST API built with Node.js, Express, and MongoDB.

---

## Tech Stack

- **Runtime** — Node.js (ES Modules)
- **Framework** — Express.js
- **Database** — MongoDB via Mongoose
- **Auth** — JWT (access + refresh tokens)
- **File upload** — Multer (in-memory) + csv-parser

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-username/r4rupeeb.git
cd r4rupeeb
npm install
```

### 2. Create your `.env` file

Create a `.env` file at the root of the project:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d
```

### 3. Make sure `package.json` has ES Module support

```json
{
  "type": "module"
}
```

### 4. Start the server

```bash
npm run start
```

You should see:

```
MongoDB connected !! DB HOST: ...
Server is running on port 5000
```

---

## Project Structure

```
├── server.js                  # Entry point — connects DB then starts server
├── app.js                     # Express setup — middlewares, routes, error handler
├── .env                       # Environment variables (never commit this)
│
├── db/
│   └── index.js               # MongoDB connection
│
├── models/
│   ├── User.js
│   ├── Account.js
│   ├── Category.js
│   ├── Transaction.js
│   ├── Budget.js
│   ├── MonthlySummary.js
│   └── SavingsGoal.js
│
├── controllers/
│   ├── user.controller.js
│   └── transaction.controller.js
│
├── routes/
│   ├── user.routes.js
│   └── transaction.routes.js
│
├── middlewares/
│   ├── auth.middleware.js     # JWT verification
│   └── multer.middleware.js   # CSV file upload
│
└── utils/
    ├── ApiError.js
    ├── ApiResponse.js
    └── asyncHandler.js
```

---

## API Reference

> **Base URL:** `http://localhost:5000/api/v1`
>
> All requests must use **`http://`** not `https://` in local development.

---

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Welcome message |
| GET | `/api/health` | No | Server status |

---

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/register` | No | Register a new user |
| POST | `/users/login` | No | Login and get tokens |
| POST | `/users/logout` | Yes | Logout current user |
| GET | `/users/me` | Yes | Get current user profile |

---

### Transactions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/transactions/add` | Yes | Add a single transaction |
| POST | `/transactions/upload` | Yes | Upload a CSV of transactions |

---

## Request Details

### POST `/users/register`

**Body (JSON):**
```json
{
  "name": "Kanishk",
  "email": "kanishk@example.com",
  "password": "123456",
  "currency": "INR"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "User registered successfully",
  "data": { "_id": "...", "name": "Kanishk", "email": "kanishk@example.com" }
}
```

---

### POST `/users/login`

**Body (JSON):**
```json
{
  "email": "kanishk@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "_id": "...", "name": "Kanishk" },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

> Save the `accessToken` — you need it for all protected routes.

---

### POST `/users/logout`

**Headers:**
```
Authorization: Bearer <accessToken>
```

---

### GET `/users/me`

**Headers:**
```
Authorization: Bearer <accessToken>
```

---

### POST `/transactions/add`

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Salary",
  "category": "Income",
  "date": "2026-03-01",
  "amount": 50000,
  "type": "income"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| name | string | Yes | Any |
| category | string | Yes | Must exist in your Categories |
| date | string | Yes | Any valid date e.g. `2026-03-01` |
| amount | number | Yes | Must be > 0 |
| type | string | Yes | `income`, `expense`, `transfer` |
| note | string | No | Any |
| paymentMethod | string | No | `cash`, `card`, `bank_transfer`, `upi`, `wallet`, `other` |

---

### POST `/transactions/upload`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Body:** `form-data`

| Key | Type | Value |
|-----|------|-------|
| file | File | Your `.csv` file |

**CSV format** — first row must be the header exactly as shown:

```csv
name,category,date,amount,type
Salary,Income,2026-03-01,50000,income
Groceries,Food,2026-03-05,1200,expense
Netflix,Entertainment,2026-03-10,499,expense
```

**Response:**
```json
{
  "success": true,
  "message": "3 transaction(s) saved, 1 skipped.",
  "data": {
    "totalRows": 4,
    "savedCount": 3,
    "skippedCount": 1,
    "skipped": [
      { "row": 3, "reason": "Category \"xyz\" not found", "data": { ... } }
    ]
  }
}
```

> Rows with invalid data or unknown categories are skipped — the rest are saved. The `skipped` array tells you exactly which rows failed and why.

---

## How to Use in Postman

1. Open Postman and create a new request
2. Set the URL to `http://localhost:5000/api/v1/...` — always `http://`, never `https://`
3. For protected routes, go to the **Authorization** tab → select **Bearer Token** → paste your `accessToken`
4. For `/transactions/upload`, set Body to **form-data**, add a key named `file`, change its type to **File**, and select your CSV

---

## Error Response Format

All errors follow this shape:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed: amount must be a positive number",
  "errors": []
}
```

---

## Notes

- **Categories must exist before adding transactions.** The category name in your request/CSV is matched case-insensitively against categories you've created for your user.
- **An active Account must exist** before adding any transaction. Transactions are linked to your first active account automatically.
- Passwords are stored as plain text in the current version. Swap in `bcrypt` before going to production.