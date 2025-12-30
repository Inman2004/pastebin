# Pastebin Lite

A simple, secure pastebin application built with Next.js.

## Features

- **Create Pastes**: Share arbitrary text.
- **Constraints**:
  - **TTL (Time To Live)**: Set an expiry time in seconds.
  - **View Limit**: Set a maximum number of views.
- **Persistence**:
  - Uses **Redis** in production (via `REDIS_URL`).
  - Uses **File System** (JSON file) for local development (no setup required).

## Getting Started

### Prerequisites

- Node.js
- pnpm (or npm/yarn)

### Installation

1. Clone the repository.
2. Install dependencies:

```bash
pnpm install
```

### Running Locally

Start the development server:

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to create a paste.

### Running Tests

To run the functional tests (requires the server to be running in another terminal with `TEST_MODE=1`):

```bash
# Terminal 1
TEST_MODE=1 pnpm dev

# Terminal 2
pnpm tsx scripts/test-api.ts
```

## Persistence Layer

I chose **Redis** (specifically compatible with Vercel KV or Upstash) for the production persistence layer because:
- It is fast and suitable for key-value storage like paste IDs.
- It supports TTL (Time To Live) natively, simplifying expiry logic.
- It works well in serverless environments (connection pooling/HTTP clients).

For local development, I implemented a **File System** fallback. This ensures that:
- Developers don't need to spin up a Redis instance to run the app.
- Data persists across hot-reloads and server restarts during development.
- The application automatically switches based on the presence of the `REDIS_URL` environment variable.

## Design Decisions

- **Framework**: Next.js (App Router) was chosen for its serverless support, API route handling, and ease of deployment to Vercel.
- **ID Generation**: Used `nanoid` for short, URL-friendly unique identifiers.
- **Deterministic Testing**: Implemented a `TEST_MODE` that inspects the `x-test-now-ms` header to allow time-travel testing for expiry logic.
- **View Counting**:
  - View counts are stored in the same JSON object as the content.
  - While this creates a potential race condition under high concurrency, it simplifies the architecture for a "Lite" version.
  - Atomic increments are attempted (using Redis transactions or simple file locks logic in the fallback), but for high-scale production, separating counters or using RedisJSON/Lua scripts would be more robust.
- **Security**:
  - Content is rendered as text in a `<pre>` tag to prevent XSS.
  - No secrets are committed to the repo.

## API Endpoints

- `GET /api/healthz`: Health check.
- `POST /api/pastes`: Create a new paste.
  - Body: `{ "content": "...", "ttl_seconds": 60, "max_views": 5 }`
- `GET /api/pastes/:id`: Retrieve paste metadata (JSON).
- `GET /p/:id`: View paste (HTML).
