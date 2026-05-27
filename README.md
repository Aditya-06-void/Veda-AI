<div align="center">

# 🧠 Veda AI

### AI-Powered Educational Assessment Platform

Generate structured exam papers from source documents, evaluate student answer sheets with vision AI, and manage your school's assessment workflow — all in one place.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Queue-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)

</div>

---

## Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Frontend — Next.js 16 + React 19"]
        UI["Pages & Components\n/assignments · /groups · /library · /toolkit"]
        Store["Zustand Store\nAssignment State"]
        WS_Client["Socket.IO Client\nReal-time Updates"]
    end

    subgraph API["⚙️ Backend — Express 5 + TypeScript"]
        Server["REST API\n/api/v1/*"]
        SocketIO["Socket.IO Server\nBroadcasts Updates"]
        RateLimit["Rate Limiter\n+ Helmet"]
        Multer["Multer\nFile Upload Handler"]
    end

    subgraph Queue["🔄 Job Queue — BullMQ"]
        QueueManager["Queue Manager\nenqueueGeneration()"]
        Worker["Background Worker\nProcesses Jobs"]
        FallbackAsync["In-Memory Fallback\n(no Redis)"]
    end

    subgraph AI["🤖 NVIDIA AI Models"]
        LLM["Llama 3.3 70B Instruct\nQuestion Generation"]
        Vision["Llama 3.2 90B Vision\nAnswer Sheet OCR"]
        Gemma["Gemma 4 31B\nFallback Generator"]
    end

    subgraph Storage["🗄️ Storage Layer"]
        Mongo["MongoDB Atlas\nAssignments · Groups · Library · Evaluations"]
        RedisCache["Redis Cache\nAssignment List Cache"]
        MemFallback["In-Memory Map\n(dev fallback)"]
    end

    UI -->|"REST calls"| Server
    UI <-->|"Zustand"| Store
    Store <-->|"ws events"| WS_Client
    WS_Client <-->|"assignment:update"| SocketIO

    Server --> RateLimit
    Server --> Multer
    Server -->|"enqueue"| QueueManager
    Server <-->|"CRUD"| Mongo
    Server <-->|"read cache"| RedisCache
    SocketIO -->|"broadcast"| WS_Client

    QueueManager -->|"Redis available"| Worker
    QueueManager -->|"no Redis"| FallbackAsync
    Worker -->|"generateQuestionPaper()"| LLM
    Worker -->|"fallback"| Gemma
    Worker -->|"evaluateAnswerSheet()"| Vision
    Worker -->|"save result"| Mongo
    Worker -->|"status update"| SocketIO

    LLM -->|"structured JSON paper"| Worker
    Vision -->|"OCR text"| Worker
    Gemma -->|"structured JSON paper"| Worker

    Mongo <-->|"mongoReady=false"| MemFallback
    RedisCache <-->|"redisReady=false"| MemFallback
```

---

## Features

### 📄 Question Paper Generation
- Upload source material (PDF, HTML, TXT) — all questions are extracted strictly from that document
- Configure question types, counts, marks per section (MCQ, Short, Long, Numerical, etc.)
- AI auto-formats MCQ options (`A) … B) … C) … D) …`), distributes difficulty levels (Easy / Moderate / Challenging), and produces a structured answer key
- Regenerate at any time; paper and answer key persist to MongoDB

### 📝 AI Answer Sheet Evaluator *(new)*
- Upload a student's answer sheet — handwritten image (PNG/JPG), typed PDF, or plain text
- Vision model (`Llama 3.2 90B Vision`) performs OCR on handwritten sheets
- Evaluation model scores each answer against the answer key with partial marks
- Per-question feedback, total marks, percentage, and letter grade (A+ → F) stored to MongoDB
- Expandable result cards in the UI per student

### 🏫 Groups & Library
- Organise assignments by class, subject, and board
- Library stores reference documents (papers, quizzes, lesson plans, guides, rubrics)

### ⚡ Real-time Updates
- `assignment:update` WebSocket events keep the UI in sync across tabs
- Status progression: `draft → queued → generating → completed`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand |
| Backend | Express 5, TypeScript, Socket.IO, Zod validation |
| AI Models | NVIDIA API — Llama 3.3 70B, Llama 3.2 90B Vision, Gemma 4 31B |
| Database | MongoDB Atlas (Mongoose 9) |
| Queue | BullMQ + Redis (ioredis) |
| File Handling | Multer, pdf-parse |
| Security | Helmet, CORS, express-rate-limit |

---

## Project Structure

```
veda-ai/
├── backend/
│   └── src/
│       ├── server.ts        # Express app, routes, Socket.IO
│       ├── generator.ts     # Question paper generation (NVIDIA LLMs)
│       ├── evaluator.ts     # Answer sheet evaluation (vision + text models)
│       ├── queue.ts         # BullMQ job queue + in-memory fallback
│       ├── repository.ts    # MongoDB models + CRUD (assignments, groups, library, evaluations)
│       ├── cache.ts         # Redis caching layer
│       ├── toolkit.ts       # Streaming LLM toolkit endpoint
│       ├── types.ts         # Shared TypeScript types
│       ├── validation.ts    # Zod schemas
│       └── config.ts        # Environment config
├── frontend/
│   └── src/
│       ├── app/
│       │   └── (shell)/
│       │       ├── assignments/  # Assignments page
│       │       ├── groups/       # Groups page
│       │       ├── library/      # Library page
│       │       └── toolkit/      # AI toolkit page
│       ├── components/
│       │   ├── assignment/
│       │   │   ├── assignment-form.tsx      # Create assignment form
│       │   │   ├── assignment-list.tsx      # Sidebar list
│       │   │   ├── assignment-output.tsx    # Paper display + PDF export
│       │   │   └── evaluate-panel.tsx       # Answer sheet evaluator UI
│       │   └── layout/                      # Sidebar, topbar, mobile nav
│       ├── lib/
│       │   ├── api.ts        # All fetch calls
│       │   ├── types.ts      # Frontend TypeScript types
│       │   ├── socket.ts     # Socket.IO client
│       │   └── constants.ts  # Default question types
│       └── store/
│           └── use-assignment-store.ts  # Zustand global state
└── README.md
```

---

## API Reference

### Assignments
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/assignments` | List all (paginated) |
| `POST` | `/api/v1/assignments` | Create assignment |
| `GET` | `/api/v1/assignments/:id` | Get assignment |
| `DELETE` | `/api/v1/assignments/:id` | Delete assignment |
| `POST` | `/api/v1/assignments/:id/upload` | Upload source document |
| `POST` | `/api/v1/assignments/:id/generate` | Enqueue generation |
| `POST` | `/api/v1/assignments/:id/regenerate` | Re-generate paper |

### Evaluations
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/v1/assignments/:id/evaluate` | Submit answer sheet |
| `GET` | `/api/v1/assignments/:id/evaluations` | List evaluations |
| `DELETE` | `/api/v1/evaluations/:id` | Delete evaluation |

### Other
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/stats` | App statistics |
| `GET` | `/api/v1/groups` | List groups |
| `POST` | `/api/v1/groups` | Create group |
| `GET` | `/api/v1/library` | List library docs |
| `POST` | `/api/v1/toolkit/generate` | Stream LLM response |
| `GET` | `/health` | Health check |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas URI (or local mongod)
- Redis URL (or use the built-in in-memory fallback)
- NVIDIA API key from [build.nvidia.com](https://build.nvidia.com)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in NVIDIA_API_KEY, MONGODB_URI, REDIS_URL
npm install
npm run dev
```

Backend runs at `http://localhost:4000`

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=4000
FRONTEND_URL=http://localhost:3000
NVIDIA_API_KEY=nvapi-...
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
REDIS_HOST=...
REDIS_PORT=...
REDIS_USERNAME=default
REDIS_PASSWORD=...
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

> **Note:** Both Redis and MongoDB are optional. Without them the app runs entirely in memory — useful for local development, but data is lost on server restart.

---

## Data Flow

```mermaid
sequenceDiagram
    actor Teacher
    participant UI as Next.js UI
    participant API as Express API
    participant Queue as BullMQ Worker
    participant NVIDIA as NVIDIA LLMs
    participant DB as MongoDB

    Teacher->>UI: Fill assignment form + upload PDF
    UI->>API: POST /assignments
    API->>DB: Save assignment (draft)
    UI->>API: POST /assignments/:id/upload
    API->>API: Extract text from PDF/HTML
    API->>DB: Save with extractedText
    UI->>API: POST /assignments/:id/generate
    API->>Queue: Enqueue job
    API-->>UI: status = queued (WebSocket)
    Queue->>NVIDIA: Llama 3.3 70B — generate paper JSON
    Queue->>DB: Save generatedPaper
    Queue-->>UI: status = completed (WebSocket)
    UI->>Teacher: Display formatted question paper

    Teacher->>UI: Click "Evaluate Answers" + upload answer sheet
    UI->>API: POST /assignments/:id/evaluate
    API->>NVIDIA: Llama 3.2 90B Vision — OCR image
    API->>NVIDIA: Llama 3.3 70B — score answers
    API->>DB: Save evaluation
    API-->>UI: Return evaluation result
    UI->>Teacher: Show marks, grade, per-question feedback
```

---

<div align="center">

Built with ❤️ for educators · Powered by NVIDIA AI

</div>
