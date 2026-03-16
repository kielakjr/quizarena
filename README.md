# QuizArena

A real-time multiplayer quiz platform inspired by Kahoot. Create quizzes, host live game sessions, and compete with other players — with a scoring system based on answer speed and streaks.

---

## Features

- **User accounts** — registration and login with password hashing (bcrypt) and JWT authentication
- **Quiz creator** — full CRUD with support for images (questions + cover), time limits, and point values
- **Real-time gameplay** — WebSocket communication (Socket.IO) between host and players
- **Speed-based scoring** — points calculated based on correctness and response time, with streak bonuses
- **Animated leaderboard** — smooth transitions powered by Framer Motion
- **Join by PIN** — players enter a 6-digit game PIN and a nickname to join a session
- **Dashboard** — manage your quizzes with stats (play count, public/private status)
- **Image uploads** — question images and quiz covers handled via Multer
- **Input validation** — server-side schema validation with Zod
- **Rate limiting** — API protection against excessive requests

---

## Tech Stack

### Frontend (`/client`)

| Technology | Role |
|---|---|
| React 19 | UI components |
| TypeScript | Static typing |
| Vite 7 | Bundler / dev server |
| Tailwind CSS 4 | Styling |
| React Router 7 | Client-side routing |
| Framer Motion | Animations |
| Socket.IO Client | WebSocket communication |
| Axios | HTTP requests |

### Backend (`/server`)

| Technology | Role |
|---|---|
| Node.js + Express 5 | HTTP server / REST API |
| TypeScript | Static typing |
| MongoDB + Mongoose 9 | Database |
| Socket.IO | Real-time communication |
| JWT (jsonwebtoken) | Authentication |
| bcrypt | Password hashing |
| Zod | Schema validation |
| Multer | File uploads |
| express-rate-limit | Request throttling |

---

## Project Structure

```
quizarena/
├── client/                        # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/                   # Axios configuration
│   │   ├── components/            # UI components (Layout, Avatar, Leaderboard, etc.)
│   │   ├── context/               # React contexts (Auth, Socket)
│   │   ├── hooks/                 # Custom hooks (useGameSocket)
│   │   ├── pages/
│   │   │   ├── Landing.tsx            # Home page (join by PIN)
│   │   │   ├── LoginPage.tsx          # Login
│   │   │   ├── RegisterPage.tsx       # Registration
│   │   │   ├── DashboardPage.tsx      # Quiz management panel
│   │   │   ├── CreateQuizPage.tsx     # Quiz creator
│   │   │   ├── EditQuizPage.tsx       # Quiz editor
│   │   │   ├── HostPage.tsx           # Host view during a game
│   │   │   ├── LobbyPage.tsx          # Player waiting room
│   │   │   └── LivePlayPage.tsx       # Player gameplay view
│   │   ├── types/                 # TypeScript type definitions
│   │   ├── utils/                 # Utility functions
│   │   ├── App.tsx                # Root component with routing
│   │   └── main.tsx               # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── server/                        # Backend (Express + Socket.IO)
│   ├── src/
│   │   ├── config/                # Environment configuration
│   │   ├── controllers/           # Route handlers
│   │   ├── middleware/            # Auth, error handling
│   │   ├── models/
│   │   │   ├── User.ts               # User model
│   │   │   ├── Quiz.ts               # Quiz model (questions, options)
│   │   │   └── GameSession.ts         # Game session model
│   │   ├── routes/
│   │   │   ├── auth.routes.ts         # /auth (login, register)
│   │   │   ├── quiz.routes.ts         # /quizzes (CRUD)
│   │   │   └── game.routes.ts         # /games
│   │   ├── socket/
│   │   │   ├── index.ts              # Socket.IO setup
│   │   │   ├── GameStore.ts          # In-memory game store with DB persistence
│   │   │   └── gameHandlers.ts       # Game event handlers
│   │   ├── validation/            # Zod schemas
│   │   ├── seed.ts                # Database seeding script
│   │   ├── app.ts                 # Express configuration
│   │   └── index.ts               # Server entry point
│   ├── uploads/                   # Uploaded images directory
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **MongoDB** (local instance or MongoDB Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/kielakjr/quizarena.git
cd quizarena
```

### 2. Configure environment variables

Create a `server/.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/quizarena
JWT_SECRET=your_jwt_secret_key
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4. (Optional) Seed the database

```bash
cd server
npm run seed
```

### 5. Run the application

In **two separate terminals**:

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

The app will be available at **http://localhost:5173**

---

## How to Play

### As a host (requires an account):
1. Register and log in
2. Create a quiz from the Dashboard
3. Start hosting — you will receive a **6-digit PIN**
4. Share the PIN with players
5. Once players have joined, start the game

### As a player (no account needed):
1. Go to the home page
2. Enter the **game PIN** provided by the host
3. Choose a **nickname**
4. Answer questions as fast as you can

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Log in |
| `GET` | `/quizzes` | List user's quizzes |
| `POST` | `/quizzes` | Create a new quiz |
| `GET` | `/quizzes/:id` | Get quiz details |
| `PUT` | `/quizzes/:id` | Update a quiz |
| `DELETE` | `/quizzes/:id` | Delete a quiz |
| `POST` | `/games` | Create a game session |

---

## WebSocket Events

### Host to Server

| Event | Description |
|---|---|
| `host:join` | Join a session as host |
| `game:start` | Start the game |
| `game:next` | Advance to the next question |
| `game:showLeaderboard` | Show the leaderboard |

### Player to Server

| Event | Description |
|---|---|
| `player:join` | Join the lobby |
| `player:answer` | Submit an answer |

### Server to Clients

| Event | Description |
|---|---|
| `lobby:update` | Player list update |
| `game:countdown` | Pre-game countdown |
| `question:show` | Display a question |
| `question:results` | Results after a question |
| `game:leaderboard` | Leaderboard data |
| `game:finished` | Game over |

---

## Scripts

### Backend (`/server`)

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start with hot-reload (nodemon) |
| `build` | `npm run build` | Compile TypeScript |
| `start` | `npm start` | Start in production mode |
| `seed` | `npm run seed` | Seed the database |

### Frontend (`/client`)

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Dev server (Vite) |
| `build` | `npm run build` | Production build |
| `preview` | `npm run preview` | Preview the build |
| `lint` | `npm run lint` | Lint the code (ESLint) |

---

## License

ISC
