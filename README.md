# Scalable Community Feed with Threaded Discussions & 24h Karma Leaderboard

A high-performance, full-stack community feed prototype featuring Reddit-style nested threaded comments, a concurrency-safe like system, and a dynamic 24-hour karma leaderboard.

Built for the **SILQ SDE** evaluation.

---

## 🛠 Tech Stack

| Layer     | Technology                              |
|-----------|----------------------------------------|
| Frontend  | React.js + Vite + Vanilla CSS          |
| Backend   | Node.js + Express.js (REST API)        |
| Database  | SQLite (via `better-sqlite3`)          |
| Queries   | Raw SQL — Recursive CTE, Aggregations |

---

##  Getting Started

### Prerequisites

- **Node.js** v18+ installed
- **npm** (comes with Node.js)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd Playto

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Seed the Database

```bash
cd server
npm run seed
```

This creates the SQLite database with 5 users, 5 posts, 18 nested comments, and 18 likes.

### 3. Run the Application

Open **two terminals**:

**Terminal 1 — Backend (port 3001):**
```bash
cd server
npm start
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd client
npm run dev
```

### 4. Open in Browser

Navigate to **http://localhost:5173**

---

## Project Structure

```
Playto/
├── server/                        # Backend (Express.js)
│   ├── index.js                   # Server entry point
│   ├── db/
│   │   ├── schema.sql             # Database schema
│   │   ├── database.js            # SQLite connection
│   │   └── seed.js                # Seed data
│   ├── routes/
│   │   ├── users.js               # User endpoints
│   │   ├── posts.js               # Post endpoints (feed + detail)
│   │   ├── comments.js            # Comment creation
│   │   ├── likes.js               # Like toggle
│   │   └── leaderboard.js         # 24h leaderboard
│   └── services/
│       ├── commentService.js      # Recursive CTE + tree builder
│       ├── likeService.js         # Concurrency-safe likes
│       └── leaderboardService.js  # Dynamic karma aggregation
├── client/                        # Frontend (React + Vite)
│   └── src/
│       ├── App.jsx                # Root layout + user context
│       ├── index.css              # Design system (dark theme)
│       ├── services/api.js        # API client
│       └── components/
│           ├── Feed.jsx           # Post feed
│           ├── PostDetail.jsx     # Post detail + comments
│           ├── CommentThread.jsx  # Recursive comment renderer
│           ├── CreatePost.jsx     # Post creation form
│           └── Leaderboard.jsx    # 24h karma leaderboard
├── README.md
└── EXPLAINER.md
```

---

##  Key Features

| Feature | Implementation |
|---------|---------------|
| **Nested Comments** | Adjacency List (`parent_id`) + Recursive CTE — fetches entire tree in 1 query |
| **N+1 Prevention** | Single `WITH RECURSIVE` SQL + O(n) in-memory tree construction |
| **Concurrency-Safe Likes** | `UNIQUE` constraints + SQLite transactions — prevents double-likes at DB level |
| **Dynamic Leaderboard** | `UNION ALL` aggregation with time-window filter — no cached karma counters |
| **MVC Architecture** | Routes → Services → Database — clean separation of concerns |

---

##  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List all users |
| `GET` | `/api/posts?userId=` | Feed with like status |
| `GET` | `/api/posts/:id?userId=` | Post + full comment tree |
| `POST` | `/api/posts` | Create post |
| `POST` | `/api/comments` | Add comment/reply |
| `POST` | `/api/likes` | Toggle like |
| `GET` | `/api/leaderboard` | Top 5 (24h karma) |
