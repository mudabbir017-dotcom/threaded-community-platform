# Playto – Scalable Community Feed

A full-stack community discussion platform featuring nested threaded comments, interactive likes, and a dynamic 24-hour karma leaderboard.

Playto is designed to demonstrate efficient backend engineering, relational database design, recursive SQL queries, and concurrency-safe operations through a Reddit-style community feed.

## Key Features

- **Community Feed:** Create posts and explore discussions in a chronological feed.
- **Nested Threaded Comments:** Supports replies at multiple levels using a recursive comment structure.
- **Interactive Like System:** Like and unlike posts and comments with dynamically updated counts.
- **24-Hour Karma Leaderboard:** Ranks the top 5 users based on engagement earned within a rolling 24-hour window.
- **Dynamic Karma Calculation:** Calculates scores directly from engagement records instead of relying on stored counters.
- **Efficient Comment Retrieval:** Uses Recursive CTEs to retrieve complete comment hierarchies in a single database query.
- **Concurrency-Safe Likes:** Uses database transactions and unique constraints to prevent duplicate likes.
- **Optimized Database Access:** Uses indexing and batched queries to reduce unnecessary database operations.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, Bootstrap |
| Backend | Node.js, Express.js |
| Database | SQLite, better-sqlite3 |
| API Communication | REST APIs, Axios |
| Query Optimization | SQL, Recursive CTEs |
| Database Design | Relational Schema, Adjacency List Model |

## Engineering Highlights

### 1. Recursive Comment Retrieval
Implemented a Recursive Common Table Expression (CTE) to fetch nested comments in a single SQL query.

The resulting flat dataset is converted into a hierarchical tree using a HashMap in O(n) time and O(n) space, avoiding the N+1 query problem.

### 2. Concurrency-Safe Like System
Implemented atomic like/unlike operations using database transactions and UNIQUE constraints.

Uses `INSERT OR IGNORE`-style conflict handling to prevent duplicate likes when concurrent requests occur.

### 3. Dynamic 24-Hour Leaderboard
Designed a leaderboard that calculates user karma dynamically from likes recorded within the last 24 hours.

**Karma Rules:**
- Post like = 5 points
- Comment like = 1 point

Uses SQL aggregation with `UNION ALL`, `SUM()`, and time-window filtering to determine the top 5 users.

### 4. Database Optimization
- Used the Adjacency List model to represent nested comments.
- Added indexes for comment hierarchy lookups, like tracking, and time-based leaderboard queries.
- Used batch queries to retrieve user like statuses and avoid repeated database calls.
- Enabled SQLite Write-Ahead Logging (WAL) mode for improved concurrent read performance.

## Project Structure

```text
Playto/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
├── server/
│   ├── db/
│   │   ├── database.js
│   │   ├── schema.sql
│   │   └── seed.js
│   ├── routes/
│   │   ├── users.js
│   │   ├── posts.js
│   │   ├── comments.js
│   │   ├── likes.js
│   │   └── leaderboard.js
│   ├── services/
│   └── index.js
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/scalable-community-feed.git
cd scalable-community-feed
```

### 2. Set Up the Backend

```bash
cd server
npm install
npm run seed
npm run dev
```

The backend API runs at:

`http://localhost:3001`

### 3. Set Up the Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the Vite development URL shown in your terminal (usually `http://localhost:5173`).

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | Retrieve users |
| GET | `/api/posts` | Retrieve community feed |
| GET | `/api/posts/:id` | Retrieve a post with nested comments |
| POST | `/api/posts` | Create a post |
| POST | `/api/comments` | Add a comment or reply |
| POST | `/api/likes` | Toggle post/comment like |
| GET | `/api/leaderboard` | Retrieve top 5 users |

## Learning Outcomes

- Designing relational database schemas for hierarchical data.
- Implementing recursive SQL queries using CTEs.
- Preventing duplicate operations using database constraints.
- Managing atomic database operations with transactions.
- Optimizing backend performance through indexing and batch queries.
- Building RESTful APIs using Express.js.
- Integrating React frontend components with backend services.

---

**Playto** – Built to explore efficient community interactions and scalable backend engineering.
