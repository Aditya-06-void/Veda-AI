# VedaAI

AI Assessment Creator built to match the provided VedaAI Figma flow.

## Stack

- Frontend: Next.js, TypeScript, Tailwind, Zustand, Socket.IO client, shadcn-style UI primitives
- Backend: Express, TypeScript, Socket.IO, BullMQ, Redis cache/queue support, MongoDB persistence support
- Realtime: WebSocket updates for assignment status changes

## Project Structure

- `frontend/` → Next.js UI
- `backend/` → Express API, queue, generation flow

## Features

- Figma-inspired assignment dashboard UI
- Empty state, assignment list, create flow, and generated paper output
- Structured question-paper generation with sections, difficulty, marks, and answer key
- Zustand-powered frontend state management
- WebSocket-driven status updates
- BullMQ + Redis integration when configured
- MongoDB persistence when configured
- Safe in-memory fallback for local development without Redis or MongoDB

## Run Locally

### 1. Backend

Copy `backend/.env.example` to `backend/.env` if you want custom values.

```bash
cd backend
npm install
npm run dev
```

Default backend URL: `http://localhost:4000`

### 2. Frontend

Copy `frontend/.env.example` to `frontend/.env.local`.

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL: `http://localhost:3000`

## Environment

### Frontend

- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `NEXT_PUBLIC_SOCKET_URL=http://localhost:4000`

### Backend

- `PORT=4000`
- `FRONTEND_URL=http://localhost:3000`
- `MONGODB_URI=` optional
- `REDIS_URL=` optional

## Architecture Notes

- Assignments are created through the frontend form and posted to the backend.
- The backend stores the assignment and queues generation.
- If Redis is available, BullMQ handles the generation job.
- If Redis is not available, a local fallback simulates the same async flow.
- Socket.IO broadcasts assignment updates so the UI automatically reflects `queued`, `generating`, and `completed` states.
- Generated output is always structured before rendering. The UI never prints raw model text blocks directly.

## Verification Completed

- `frontend`: `npm run lint`, `npm run build`
- `backend`: `npm run build`
- Live flow verified:
  - `GET /health`
  - `POST /api/assignments`
  - `POST /api/assignments/:id/generate`
  - `GET /api/assignments/:id`
