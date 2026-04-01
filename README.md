# PEAKMALE — Full-Stack eCommerce

> India's boldest gaming accessories store — Now with a production-grade backend, MongoDB database, JWT auth, and manual UPI QR payment system.

---

## Project Structure

```
peakmale-fullstack/
│
├── backend/                    ← Node.js + Express API server
│   ├── server.js               ← Entry point
│   ├── seed.js                 ← DB seeder (run once)
│   ├── .env.example            ← Copy to .env and fill values
│   ├── package.json
│   │
│   ├── models/
│   │   ├── Product.js          ← Product schema
│   │   ├── User.js             ← User schema (with bcrypt)
│   │   ├── Cart.js             ← Cart schema
│   │   └── Order.js            ← Order schema (full UPI payment fields)
│   │
│   ├── controllers/
│   │   ├── productController.js
│   │   ├── userController.js   ← Register, login, JWT
│   │   ├── cartController.js
│   │   ├── orderController.js  ← Place order, calc shipping
│   │   ├── paymentController.js← UTR submit, screenshot upload
│   │   └── adminController.js  ← Verify payments, dashboard stats
│   │
│   ├── routes/
│   │   ├── products.js
│   │   ├── users.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── payment.js
│   │   └── admin.js
│   │
│   ├── middleware/
│   │   ├── auth.js             ← JWT protect + adminOnly
│   │   ├── errorHandler.js     ← Global error handler
│   │   └── upload.js           ← Multer (screenshot upload)
│   │
│   └── uploads/
│       └── screenshots/        ← Payment screenshots stored here
│
├── frontend/
│   ├── index.html              ← Main store (copy from original, update script ref)
│   ├── script.js               ← UPDATED — fetches from API, syncs cart
│   ├── checkout.html           ← REBUILT — 4-step UPI payment flow
│   ├── login.html              ← NEW — login/register page
│   ├── admin.html              ← NEW — admin dashboard
│   └── style.css               ← Copy from original (unchanged)
│
├── render.yaml                 ← Render.com backend deployment config
├── vercel.json                 ← Vercel frontend deployment config
├── .gitignore
└── README.md
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | — | Server health check |
| GET | `/api/products` | — | List products (with ?category=gaming&featured=true) |
| GET | `/api/products/:id` | — | Single product |
| POST | `/api/users/register` | — | Register user |
| POST | `/api/users/login` | — | Login → returns JWT |
| GET | `/api/users/me` | 🔒 | My profile |
| GET | `/api/users/orders` | 🔒 | My order history |
| GET | `/api/cart` | 🔒 | Get cart |
| POST | `/api/cart` | 🔒 | Add/update item |
| DELETE | `/api/cart/:productId` | 🔒 | Remove item |
| DELETE | `/api/cart/clear` | 🔒 | Clear cart |
| POST | `/api/orders` | 🔒 | **Place order** |
| GET | `/api/orders/:id` | 🔒 | Get order |
| GET | `/api/payment/upi-details` | — | UPI ID + QR URL |
| POST | `/api/payment/submit-utr` | 🔒 | **Submit UTR after UPI payment** |
| POST | `/api/payment/upload-screenshot` | 🔒 | Upload payment screenshot |
| GET | `/api/admin/stats` | 🔒👑 | Dashboard stats |
| GET | `/api/admin/orders` | 🔒👑 | All orders (with filters) |
| GET | `/api/admin/orders/:id` | 🔒👑 | Order detail |
| PATCH | `/api/admin/orders/:id/verify` | 🔒👑 | **Approve or reject UTR** |
| PATCH | `/api/admin/orders/:id/status` | 🔒👑 | Update order status |

🔒 = requires `Authorization: Bearer <token>` header  
👑 = admin role required

---

## UPI Payment Flow

```
Customer places order (POST /api/orders)
        ↓
Backend creates order with paymentStatus: "pending"
Backend returns upiDetails { upiId, amount, qrUrl }
        ↓
Frontend shows QR Code + UPI ID
Customer pays via PhonePe / GPay / Paytm
        ↓
Customer submits UTR (POST /api/payment/submit-utr)
Backend sets paymentStatus: "verification_pending"
        ↓
Admin opens admin.html → sees ⏳ Verify UTR
Admin checks their payment app for the UTR
Admin clicks "Approve" → PATCH /api/admin/orders/:id/verify
Backend sets paymentStatus: "paid", orderStatus: "confirmed"
        ↓
Order confirmed — admin can now dispatch
```

---

## Step-by-Step Run Guide

### 1. Prerequisites

- Node.js v18+
- MongoDB Atlas account (free tier works)
- A UPI ID for your business

### 2. Clone and install

```bash
git clone https://github.com/yourusername/peakmale-fullstack.git
cd peakmale-fullstack/backend
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/peakmale
JWT_SECRET=pick_a_random_32+_character_string_here
ADMIN_EMAIL=admin@peakmale.in
ADMIN_PASSWORD=YourSecureAdminPass123!
UPI_ID=yourname@upi
UPI_NAME=PeakMale Store
UPI_QR_URL=                        # optional: URL to your QR image
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5500
```

### 4. Seed the database

```bash
node seed.js
```

This creates:
- All 7 products
- An admin user at the email in your `.env`

### 5. Start the backend

```bash
npm run dev          # development (nodemon)
# or
npm start            # production
```

Backend runs at: `http://localhost:5000`

### 6. Serve the frontend

Open `frontend/index.html` in a browser.

**Option A — VS Code Live Server**  
Right-click `index.html` → Open with Live Server

**Option B — simple HTTP server**
```bash
cd frontend
npx serve .
```

The API_BASE in `script.js` and `checkout.html` auto-detects localhost vs production.

### 7. Test the full flow

1. Go to `login.html` → Register an account
2. Browse products on `index.html`
3. Add items to cart → Checkout
4. Fill shipping details, choose UPI
5. Place order → You'll see the UPI QR + amount
6. Submit a dummy UTR (12 digits, e.g. `123456789012`)
7. Open `admin.html` and log in as admin
8. Go to "Verify UTR" → Approve the payment

---

## Frontend Integration Notes

### Copy these files from the generated `frontend/` folder:

| File | What changed |
|------|-------------|
| `script.js` | Fetches products from API, syncs cart with backend for logged-in users |
| `checkout.html` | Fully rebuilt — 4-step UPI flow, UTR submission, screenshot upload |
| `login.html` | New file — login/register with JWT |
| `admin.html` | New file — admin dashboard with order/payment management |

### In `index.html`:
- Add `<div id="navAuthArea"></div>` in the nav for login/user display
- Update the `<script src="script.js">` reference if needed

---

## Deployment Guide

### Backend → Render.com

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add all environment variables from `.env` in the Render dashboard
8. Deploy — note your URL e.g. `https://peakmale-api.onrender.com`

**Important:** Update `API_BASE` in `script.js`, `checkout.html`, `login.html`, and `admin.html` to your Render URL.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect your GitHub repo
3. Root Directory: `frontend`
4. Framework Preset: Other (static)
5. Deploy

### Database → MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist `0.0.0.0/0` (allow all IPs for Render)
4. Get the connection string — it goes in `MONGO_URI`
5. Run `node seed.js` once after backend is deployed (or via Render shell)

---

## Security Notes

- JWT tokens expire in 7 days (configurable via `JWT_EXPIRES_IN`)
- Passwords are hashed with bcrypt (12 rounds)
- Rate limiting: 100 req/15min globally, 20 req/15min on auth routes
- CORS is locked to your allowed origins
- Admin routes require both JWT + admin role
- UTR is validated for format and checked for duplicates
- Never commit your `.env` file — it's in `.gitignore`

---

## Future Enhancements

- [ ] WhatsApp/email notifications on order status change
- [ ] Product reviews and ratings system
- [ ] Inventory alerts when stock < 5
- [ ] Razorpay/PhonePe gateway integration (backend is already structured for it)
- [ ] Order tracking with shipping partner API
- [ ] Cloudinary integration for product images
- [ ] Analytics dashboard with charts

---

*Made with ❤️ in India — PEAKMALE*
