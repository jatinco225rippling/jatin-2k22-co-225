## Setup Instructions

### 1. Prerequisites

Make sure you have:

* **Node.js** ≥ 18
* **npm** (comes with Node)
* **MongoDB** running locally or a MongoDB Atlas connection string
* Git (optional, for cloning)

---

### 2. Clone the repository

```bash
git clone <YOUR_REPO_URL>
cd <YOUR_REPO_NAME>
```

If you followed the suggested structure, you should have:

```text
src/
  backend/   # Node/Express API
  frontend/  # Next.js app
```

(If your backend folder is called `rippling-backend`, just replace paths accordingly.)

---

### 3. Backend setup (Node + Express + MongoDB)

1. Go to backend folder:

   ```bash
   cd src/backend        # or cd rippling-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the backend root:

   ```env
   PORT=4000
   MONGO_URI=mongodb://localhost:27017/boostly
   JWT_SECRET=super_secret_jwt_key_change_me
   CLIENT_URL=http://localhost:3000
   ```

   * `MONGO_URI` → use your local MongoDB URI or Atlas URI
   * `CLIENT_URL` → URL where your Next.js frontend runs

---

### 4. Frontend setup (Next.js + shadcn)

1. Open a new terminal and go to the frontend folder:

   ```bash
   cd src/frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` in the frontend root:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
   ```

   This must match your backend URL + `/api`.

---

## Run Instructions

### 1. Start the backend (API server)

In the backend directory:

```bash
cd src/backend        # or rippling-backend
npm run dev
```

* Runs Express server with Nodemon on **[http://localhost:4000](http://localhost:4000)**
* API base URL: **[http://localhost:4000/api](http://localhost:4000/api)**

You should see logs like:

```text
🚀 Server running on port 4000
✅ MongoDB connected
```

---

### 2. Start the frontend (Next.js app)

In another terminal, from the frontend directory:

```bash
cd src/frontend
npm run dev
```

* Runs the Next.js app on **[http://localhost:3000](http://localhost:3000)**

Now open:

```text
http://localhost:3000
```

* You should see:

  * **/signup** – create a new student account
  * **/login** – log in with email + password
  * **/dashboard** – leaderboard with recognition + endorsements
  * **/account** – profile + credits + redeem modal

---

### 3. Production-style run (optional)

If you want to simulate a production build:

**Backend:**

```bash
cd src/backend
npm run start    # (same as node server.js)
```

**Frontend:**

```bash
cd src/frontend
npm run build
npm run start    # serves production build on port 3000
```

---

If you tell me your exact folder names (e.g. if it’s `rippling-backend` + `rippling-frontend` instead of `src/backend`), I can rewrite this block 1:1 to match your repo.
