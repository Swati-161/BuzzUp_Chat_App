# BuzzUp — Real-Time Chat Application

A full-stack real-time messaging app built with **React**, **Node.js/Express**, **Firebase Realtime Database**, and **MongoDB**.

---

## Features

- Firebase Authentication (email/password)
- Real-time messaging via Firebase Realtime Database
- Message translation (Google Cloud Translate API)
- Media sharing — images, videos, audio (with compression & thumbnails)
- Real-time notifications
- Message read receipts
- User search

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19, React Router, Axios       |
| Auth      | Firebase Authentication             |
| Realtime  | Firebase Realtime Database          |
| Backend   | Node.js, Express 5                  |
| Database  | MongoDB (via Mongoose) — user store |
| Media     | Multer, Sharp, FFmpeg (compression) |
| Translate | Google Cloud Translate API          |
| Hosting   | Netlify (frontend) · Render (backend)|

---

## Project Structure

```
BuzzUp_Chat_App/
├── backend/                 # Express API server
│   ├── config/db.js         # MongoDB connection
│   ├── controllers/         # Route controllers
│   ├── middleware/          # JWT & Firebase auth middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── firebase.js          # Firebase Admin SDK init
│   └── server.js            # Entry point
│
└── my-chat-app/             # React frontend
    └── src/
        ├── components/      # UI components
        ├── context/         # AuthContext (Firebase user + username cache)
        ├── utils/           # Axios instance (auto token injection)
        └── firebase.js      # Firebase client init
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- A Firebase project (Realtime Database + Authentication enabled)
- A MongoDB Atlas cluster (free tier works)
- Google Cloud project with Translate API enabled (optional, for translation)

---

### 1. Clone the repo

```bash
git clone https://github.com/Swati-161/BuzzUp_Chat_App.git
cd BuzzUp_Chat_App
```

---

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Fill in the values in `.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/buzzup
JWT_SECRET=any_long_random_string
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"..."}   # single line JSON
PORT=5000
```

> **Getting `FIREBASE_CREDENTIALS`:**
> Firebase Console → Project Settings → Service Accounts → Generate new private key → download JSON → paste entire contents as a single line string in `.env`

Start the backend:

```bash
npm start
# Server running on port 5000
```

---

### 3. Set up the Frontend

```bash
cd ../my-chat-app
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Fill in the values:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

> **Getting Firebase config:**
> Firebase Console → Project Settings → Your apps → Web app → SDK setup and configuration

Start the frontend:

```bash
npm start
# App running on http://localhost:3000
```

---

## Architecture Notes

**Why both Firebase and MongoDB?**

- **Firebase Realtime Database** handles everything that needs to be real-time: messages, notifications, chatlist, and online presence. It pushes updates to all clients instantly without polling.
- **MongoDB** stores the user registry for server-side user search (`/api/users/search`). This lets us do regex-based username/email search which Firebase doesn't support natively.
- **Firebase Auth** is the single source of truth for authentication. The backend also supports JWT for REST endpoints.

---

## API Endpoints

| Method | Endpoint                    | Auth     | Description              |
|--------|-----------------------------|----------|--------------------------|
| POST   | `/api/auth/register`        | None     | Register new user        |
| POST   | `/api/auth/login`           | None     | Login, returns JWT       |
| GET    | `/api/auth/profile`         | JWT      | Get current user profile |
| PUT    | `/api/auth/update`          | JWT      | Update profile           |
| DELETE | `/api/auth/delete`          | JWT      | Delete account           |
| GET    | `/api/users`                | JWT      | List all users           |
| GET    | `/api/users/search?q=`      | JWT      | Search users             |
| GET    | `/api/messages/:userId`     | JWT      | Get message history      |
| POST   | `/api/messages`             | JWT      | Send message (REST)      |
| POST   | `/api/upload`               | Firebase | Upload media file        |
| POST   | `/api/translate`            | None     | Translate text           |

---

## Deployment

**Frontend (Netlify):**
1. Build: `npm run build`
2. Deploy the `build/` folder to Netlify
3. Set environment variables in Netlify dashboard

**Backend (Render):**
1. Connect your GitHub repo to Render
2. Set build command: `npm install`
3. Set start command: `node server.js`
4. Add all `.env` variables in Render's environment settings