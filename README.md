# 🏏 Smart League Manager

<div align="center">
  <img width="80" src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Cricket_bat.svg/512px-Cricket_bat.svg.png" />

  **A production-grade full-stack cricket league management platform.**
  
  Real-time live scores · RBAC · WebSockets · JWT Auth · React + GSAP + Three.js

  ![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
  ![Node](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)
  ![Three.js](https://img.shields.io/badge/Three.js-Animated_BG-black?style=flat&logo=three.js)
  ![GSAP](https://img.shields.io/badge/GSAP-Animations-88CE02?style=flat)
</div>

---

## 🎯 What is Smart League Manager?

Smart League Manager is a **full-stack cricket tournament management platform** that lets organizations run complete cricket leagues — from creating tournaments and teams to broadcasting live match scores in real-time.

### Key Highlights

| Feature | Details |
|---|---|
| 🔐 Authentication | JWT + bcrypt password hashing |
| 👥 RBAC | 4 roles: Admin, Captain, Player, Viewer |
| ⚡ Real-time | WebSocket live score broadcasting |
| 📊 Leaderboard | Top batsmen, bowlers, team standings |
| 🏏 Tournaments | Create & manage multiple tournaments |
| 📅 Match Management | Schedule, filter, paginate matches |
| 📁 File Uploads | Team logos + player photos via multer |
| 🎨 UI | GSAP animations + Three.js cricket ball |

---

## 🗂️ Project Structure

```
Smart League Manager/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js           # Axios instance + JWT interceptor
│   │   ├── components/
│   │   │   ├── CreateMatchModal.jsx  # Admin match scheduling modal
│   │   │   ├── Navbar.jsx            # Sidebar with GSAP animation
│   │   │   ├── Navbar.css
│   │   │   ├── Skeleton.jsx          # Loading placeholders
│   │   │   └── ThreeBackground.jsx   # Three.js particle scene
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # JWT + role auth context
│   │   ├── hooks/
│   │   │   └── useWebSocket.js       # WS hook with auto-reconnect
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Role-specific home screen
│   │   │   ├── Leaderboard.jsx       # Team & player rankings
│   │   │   ├── LiveScore.jsx         # Real-time match scoreboard
│   │   │   ├── Login.jsx             # Auth page with card-flip
│   │   │   ├── Login.css
│   │   │   ├── Matches.jsx           # Paginated match grid
│   │   │   ├── PlayerProfile.jsx     # Stats + profile editor
│   │   │   ├── Settings.jsx          # Account settings
│   │   │   ├── TeamManagement.jsx    # Squad management
│   │   │   └── Tournaments.jsx       # Tournament list & creation
│   │   ├── router/
│   │   │   └── ProtectedRoute.jsx    # Auth + role gate
│   │   ├── App.jsx                   # Router setup
│   │   ├── index.css                 # Global design system
│   │   └── main.jsx                  # Entry point
│   ├── .env                          # VITE_API_URL, VITE_WS_URL
│   └── package.json
│
└── server/                    # Node.js + Express backend (coming soon)
    ├── src/
    │   ├── db.js              # pg Pool connection
    │   ├── schema.sql         # 6-table PostgreSQL schema
    │   ├── middleware/
    │   │   └── auth.js        # authenticateUser, authorizeRoles
    │   ├── routes/
    │   │   ├── auth.js        # /register, /login
    │   │   ├── teams.js       # Team CRUD
    │   │   ├── players.js     # Player CRUD
    │   │   ├── tournaments.js # Tournament CRUD
    │   │   ├── matches.js     # Match CRUD + pagination
    │   │   ├── scores.js      # Score + WebSocket broadcast
    │   │   ├── leaderboard.js # Aggregate queries
    │   │   └── upload.js      # multer file uploads
    │   ├── ws/
    │   │   └── wsServer.js    # WebSocket server
    │   └── index.js           # App entry
    ├── uploads/               # Stored team logos / player photos
    ├── .env                   # DB credentials, JWT secret
    └── package.json
```

---

## 👥 User Roles (RBAC)

| Role | Permissions |
|---|---|
| **Admin** | All access — create everything, update live scores, manage users |
| **Captain** | Create/manage own team, add players, view matches |
| **Player** | View matches, team details, edit own profile |
| **Viewer** | Read-only — live scores & leaderboard |

RBAC is enforced on:
- ✅ **Backend** – every API route has middleware: `authorizeRoles(['admin'])`
- ✅ **Frontend** – `ProtectedRoute` checks role, sidebar links filtered by role

---

## 🗄️ Database Schema

```sql
-- 6 tables with foreign keys + indexes

users         (id SERIAL, name, email, password_hash, role)
teams         (id SERIAL, name, captain_id → users.id, logo_url)
players       (id SERIAL, user_id → users.id, team_id → teams.id, role, runs, wickets, …)
tournaments   (id SERIAL, name, year, status)
matches       (id SERIAL, tournament_id, team1_id, team2_id, scheduled_date, status, winner_id)
scores        (id SERIAL, match_id, team_id, runs, wickets, overs, extras, updated_by, updated_at)
```

---

## 🔐 Authentication Flow

```
1. POST /api/auth/register → hash password (bcrypt) → generate JWT
2. POST /api/auth/login    → verify password → return JWT with { id, name, role }
3. Client stores JWT in localStorage
4. Every API request → Axios interceptor → Authorization: Bearer <token>
5. Server middleware verifies JWT → attaches req.user
6. authorizeRoles(['admin']) → checks req.user.role
```

---

## ⚡ WebSocket – Live Score

```
Client connects → ws://localhost:5000
Admin updates score → POST /api/matches/:id/update-score
Server saves to DB → broadcasts to ALL connected WS clients:
  { type: 'SCORE_UPDATE', matchId: 1, score: { team1: {...}, team2: {...} } }
LiveScore.jsx receives message → updates scoreboard with GSAP animation
```

---

## 🎨 UI Design System

- **Theme**: Dark · Cricket-green accent (`#22c55e`) · Glassmorphism cards
- **Typography**: [Outfit](https://fonts.google.com/specimen/Outfit) (headings) + [Inter](https://fonts.google.com/specimen/Inter) (body)
- **Animations**: GSAP entrance animations on every page, counter animations, card hover effects
- **Three.js**: Animated particle field + rotating cricket ball on Login page (mouse parallax)
- **Loading**: Shimmer skeletons in multiple variants (dashboard, table, cards, profile, list)
- **Toasts**: `react-hot-toast` with dark glassmorphism style

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install

```bash
git clone <your-repo>
cd "Smart League Manager"

# Install frontend dependencies
cd client && npm install

# Install backend dependencies (after backend is set up)
cd ../server && npm install
```

### 2. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE smart_league;"

# Run schema
psql -U postgres -d smart_league -f server/src/schema.sql
```

### 3. Configure Environment

**`server/.env`**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=smart_league
JWT_SECRET=your_super_secret_jwt_key_here
```

**`client/.env`** (already created)
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

### 4. Run Development Servers

```bash
# Terminal 1 – Backend
cd server && npm run dev

# Terminal 2 – Frontend
cd client && npm run dev
```

Frontend: **http://localhost:5173**  
Backend API: **http://localhost:5000**

---

## 📡 API Reference

### Auth
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login → returns JWT |

### Teams
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/teams` | Captain/Admin | Create team |
| POST | `/api/teams/:id/add-player` | Captain/Admin | Add player to team |
| GET | `/api/teams` | All | List all teams |

### Tournaments
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/tournaments` | Admin | Create tournament |
| GET | `/api/tournaments` | All | List tournaments |

### Matches
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/matches` | Admin | Schedule match |
| GET | `/api/matches` | All | List (paginated, filterable) |
| GET | `/api/matches/:id` | All | Match detail |

### Live Score
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/matches/:id/update-score` | Admin | Update + broadcast score |
| GET | `/api/matches/:id/score` | All | Current score |

### Leaderboard
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/leaderboard/teams` | All | Team points table |
| GET | `/api/leaderboard/batsmen` | All | Top run scorers |
| GET | `/api/leaderboard/bowlers` | All | Top wicket takers |

---

## 🎭 Demo Accounts

Once the backend is running, seed these accounts via registration:

| Email | Role | Password |
|---|---|---|
| admin@slm.com | Admin | password123 |
| captain@slm.com | Captain | password123 |
| player@slm.com | Player | password123 |
| viewer@slm.com | Viewer | password123 |

---

## 🧪 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 7, React Router v6 |
| Styling | Vanilla CSS (custom design system) |
| Animations | GSAP 3, Three.js |
| State | React Context (AuthContext) |
| HTTP | Axios with interceptors |
| Real-time | Native WebSocket + custom hook |
| Backend | Node.js, Express 5 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Database | **PostgreSQL 16** (pg driver) |
| Uploads | multer |
| Rate Limit | express-rate-limit |
| Security | helmet, cors |
| Notifications | react-hot-toast |
| Icons | react-icons (Feather + GI cricket set) |

---

## 📦 Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
# Deploy `dist/` to Vercel
```

### Backend (Render / Railway)
- Push to GitHub
- Connect repo to Render
- Set environment variables in dashboard
- Start command: `node src/index.js`

### Database (Neon / Supabase / Railway / RDS)
- Create a hosted **PostgreSQL** instance (recommended: [Neon](https://neon.tech) — free tier)
- Copy the connection string and update `DB_*` variables in server `.env`

---

## 📄 License

MIT © Smart League Manager 2025

---

<div align="center">Built with ❤️ for cricket fans everywhere 🏏</div>
