# Pastebin Lite

A simple, secure pastebin application built with Next.js and **shadcn/ui**.

## Features

- **Create Pastes**: Share arbitrary text.
- **Constraints**:
  - **TTL (Time To Live)**: Set an expiry time in seconds.
  - **View Limit**: Set a maximum number of views.
- **Persistence**:
 - **Persistence**:
  - **PostgreSQL / NeonDB**: Set `DATABASE_URL` (required).
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

This application uses PostgreSQL (NeonDB recommended) as the canonical persistence layer via the `PasteStore` interface.

- **PostgreSQL / NeonDB**: Required. Set `DATABASE_URL` in your environment.
  - The application will create the `pastes` table automatically if it does not exist.

Example `.env.local` for NeonDB/postgres:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
```

When running locally with `.env.local` present, Next.js will pick up the variables automatically.

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
