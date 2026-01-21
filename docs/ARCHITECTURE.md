**Pastebin Lite — Architecture & Data Handling**

Overview
- Pastebin Lite is a minimal paste-sharing service built on Next.js (App Router). It exposes HTTP APIs to create, fetch, and render pastes, and supports TTL and view limits.

Core components
- API routes
  - `POST /api/pastes` — create a paste (accepts `content`, optional `ttl_seconds`, optional `max_views`).
  - `GET /api/pastes/:id` — return JSON metadata and content when allowed.
  - `GET /p/:id` — user-facing HTML page that fetches the paste via the API.
- Store abstraction (`lib/store.ts`)
  - Provides a `PasteStore` interface with methods: `createPaste`, `getPaste`, `incrementView`, and `healthCheck`.
  - Implementation: Postgres (NeonDB). The repo enforces a DB-backed store (Postgres/Neon).

Data model
- Paste fields:
  - `id`: string (nanoid, 10)
  - `content`: text
  - `views`: integer (current view count)
  - `max_views` (optional): integer
  - `created_at`: epoch ms
  - `expires_at` (optional): epoch ms

How the application handles data
- Creation
  - `createPaste` generates a short `id`, stores the paste with `views = 0`, sets `expires_at` if `ttl_seconds` present, and persists to Postgres.
  - Postgres stores `expires_at`; the app checks expiration on fetch.

- Read + view counting
  - `GET /api/pastes/:id` fetches the paste from the store.
  - The API checks `expires_at` (if present) and `max_views` before counting a view.
  - After a successful read, the API increments the view count via `incrementView`.
  - Postgres increments `views` with an `UPDATE ... SET views = views + 1` query.

- Expiry behavior
  - Postgres: expiry is enforced in application logic by comparing `expires_at` to the current time.

- Key implementation decisions & challenges
- Enforce DB-backed storage
  - Rationale: local JSON fallback caused invisible data persistence differences across environments; production must use a persistent DB.
  - Action taken: `getStore()` now throws if `DATABASE_URL` is not set.

- Atomic view increments & concurrency
  - Problem: multiple concurrent reads must not allow views to bypass `max_views` rules.
  - Postgres solution: single-statement `UPDATE pastes SET views = views + 1 WHERE id = $1` is used; application checks `views` vs `max_views` from read result and treats reads conservatively.

- TTL handling
  - Postgres requires application-side expiry checks. API routes explicitly verify `expires_at` against the current time on every fetch.

- Time-travel testing & deterministic tests
  - Tests can inject a synthetic time header (`x-test-now-ms`) to simulate future/past times. API endpoints consult `getNow()` which respects test overrides.

- Migration from local JSON (`pastes.json`) to Postgres
  - A one-off script `scripts/migrate-pastes-to-db.ts` was added. It backs up `pastes.json` and inserts rows into Postgres using `ON CONFLICT DO NOTHING` to avoid duplicates.

Operational notes
- Environment variables
  - `DATABASE_URL` — Postgres/Neon connection string (example: `postgresql://user:pass@host/db?sslmode=require`).
  - The server will refuse to start unless `DATABASE_URL` is set.

- Verifying DB
  - Use `npx tsx scripts/check-db.ts` to validate connectivity and SSL config.

- Backups & rollback
  - The migration script creates a timestamped backup of `pastes.json` before inserting.
  - Postgres restores should be handled externally (cloud provider snapshot or `pg_dump` restore).

Security & privacy
- Paste content is stored as plain text. Consider encryption or access controls for sensitive data.
- The app does not expose raw DB credentials; `.env.local` should be kept out of source control.

Recommended next actions
- Add integration tests that exercise concurrent fetches to verify `max_views` semantics under load.
- Optionally add a scheduled job to delete expired Postgres rows to reclaim space (not required for correctness).

Contact / Ownership
- Author: repository owner. For questions about implementation details or further changes, open an issue in the repo.
