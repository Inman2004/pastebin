# Pastebin Lite

A simple, secure pastebin application built with Next.js and **shadcn/ui**.

## Features

- **Create Pastes**: Share arbitrary text.
- **Constraints**:
  - **TTL (Time To Live)**: Set an expiry time in seconds.
  - **View Limit**: Set a maximum number of views.
- **Persistence**:
  - **Redis**: Set `REDIS_URL`.
  - **PostgreSQL / NeonDB**: Set `DATABASE_URL`.
  - **File System**: Automatic fallback for local development (no setup required).
- **UI**: Modern, accessible UI using Radix primitives via **shadcn/ui** and Tailwind CSS.

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

This application supports multiple persistence backends via a unified `PasteStore` interface:

1.  **Redis**: Recommended for high performance and native TTL support. Used if `REDIS_URL` is present.
2.  **PostgreSQL**: Supported via `pg`. Used if `DATABASE_URL` is present (and `REDIS_URL` is not).
    -   Automatically creates the `pastes` table if it doesn't exist.
    -   Ideal for services like NeonDB.
3.  **File System**: Used if no environment variables are set. Persists data to `pastes.json` locally.

## Design Decisions

- **Framework**: Next.js 16 (App Router).
- **UI Library**: shadcn/ui for accessible, composable components.
- **ID Generation**: `nanoid` for collision-resistant short IDs.
- **Deterministic Testing**: `TEST_MODE=1` enables time-travel testing via HTTP headers.

## API Endpoints

- `GET /api/healthz`: Health check.
- `POST /api/pastes`: Create a new paste.
- `GET /api/pastes/:id`: Retrieve paste metadata.
- `GET /p/:id`: View paste (HTML).
