# AnnaSetu — Cooperative-Powered Community Logistics Platform for Surplus Food Redistribution
### SIH Problem Statement 26089

A marketplace connecting **surplus food donors** (restaurants, hostels, college canteens,
households, weddings/events) → **NGOs/organizations** that need the food → **cooperative
delivery workers** who get paid a fair fare/wage for every pickup-and-drop job.

---

## 1. How it works (system flow)

1. A **donor** posts a surplus-food listing (type, quantity, pickup address + GPS, expiry time).
2. The backend automatically finds the **nearest verified NGO** within range using MongoDB
   geospatial queries (`$geoNear`).
3. It then finds the **nearest available cooperative worker** and creates a paid **Assignment**
   (pickup from donor → drop at NGO), with the fare calculated from total distance travelled.
4. The **worker** marks the job "Picked Up" then "Delivered" from their dashboard. On delivery,
   their wage is credited and they become available for the next job.
5. **Admin** verifies NGOs before they can start receiving matches (prevents fake/unsafe NGOs).

```
 Donor posts food  ─┐
                     ├─► Matching Engine ─► Nearest verified NGO
                     │                     ─► Nearest available worker ─► Assignment (fare set)
                     └─► Donation status: pending → matched → assigned → picked_up → delivered
```

## 2. Tech stack

| Layer     | Choice                                         | Why |
|-----------|-------------------------------------------------|-----|
| Backend   | Node.js + Express                                | fast to build, huge ecosystem, easy for a hackathon timeline |
| Database  | MongoDB + Mongoose                               | native **geospatial queries** (`2dsphere`, `$geoNear`) — perfect for "nearest NGO/worker" matching |
| Auth      | JWT + bcrypt                                     | stateless, simple role-based access (`donor`/`ngo`/`worker`/`admin`) |
| Frontend  | Plain HTML/CSS/JS                                | zero build step — runs by just opening a file, ideal for a live demo. Swap for React later if you want. |

## 3. Folder structure

```
surplus-food-platform/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── models/               # User, Donation, Assignment (Mongoose schemas)
│   ├── middleware/auth.js    # JWT verification + role guard
│   ├── utils/matching.js     # THE CORE LOGIC: nearest-NGO / nearest-worker / fare calc
│   ├── routes/                # auth, donations, assignments, users
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html            # donor / ngo / worker dashboards in one page
    ├── style.css
    └── app.js                # calls the backend API with fetch()
```

## 4. Step-by-step: run it locally

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally (`mongodb://127.0.0.1:27017`) **or** a free MongoDB Atlas cluster

### Step 1 — Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI (Atlas URL if you're using cloud) and a random JWT_SECRET
npm run dev
# Server runs on http://localhost:5000
```
Check it's alive: open `http://localhost:5000/api/health` → should show `{"status":"ok"}`.

### Step 2 — Frontend
No build step needed. Just open `frontend/index.html` directly in your browser
(or serve it with any static server, e.g. `npx serve frontend`).

### Step 3 — Demo flow
1. Register an **NGO** account (capture location) — note: NGOs need admin verification.
2. Since there's no admin UI yet, verify it manually for the demo:
   in MongoDB shell / Compass: `db.users.updateOne({email:"ngo@test.com"},{$set:{verified:true}})`
   — or add a temporary admin account and call `PUT /api/users/:id/verify`.
3. Register a **cooperative worker** account (capture location, near the NGO).
4. Register a **donor** account and log in.
5. Post a donation with the "use current location" button — watch it auto-match to the NGO
   and auto-assign the worker with a computed fare.
6. Log in as the **worker**, mark the job "Picked Up" then "Delivered" — their earnings update live.
7. Log in as the **NGO** to see the incoming donation on their dashboard.

## 5. Fare / wage logic (`backend/utils/matching.js`)

```
fare = base fare (₹30) + distance travelled (km) × ₹8/km
distance = worker→pickup distance + pickup→NGO distance   (both from $geoNear, in meters)
```
Tune `baseFare` and `perKmRate` to match real local cooperative wage norms — this is the
knob that makes the "fair employment" pitch concrete and demonstrable.

## 6. What to build next (good talking points for your SIH pitch)

- **Route optimization** for workers handling multiple pickups in one trip (batch deliveries).
- **Push notifications** (Firebase/OneSignal) to NGOs and workers instead of dashboard polling.
- **Photo verification** of food quality at pickup (image upload + basic checks).
- **Digital wallet / UPI payout** for worker wages instead of an in-app ledger.
- **Rating system** for workers and NGOs to build trust in the cooperative.
- **Admin panel** for NGO verification, dispute handling, and city-wide analytics
  (kg of food saved, CO₂ emissions avoided, meals served, wages paid to workers).
- **Expiry-time cron job** to auto-mark stale, unmatched donations as `expired`.
- **Multilingual UI** (Hindi + regional languages) since donors/workers may not all use English.
