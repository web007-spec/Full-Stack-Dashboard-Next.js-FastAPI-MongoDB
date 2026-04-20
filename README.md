# Deployments Dashboard

A full-stack internal dashboard for browsing, filtering, editing, and managing ~5,000 deployment records.

**Stack:** Next.js 14 (App Router) · FastAPI · MongoDB 7 · TanStack Query v5 · Tailwind CSS

---

## Quick start

### Prerequisites
- Docker Desktop (for MongoDB)
- Python 3.11+
- Node.js 18+

### 1. Start MongoDB

```bash
docker compose up -d
```

### 2. Seed the database (~5,000 records)

```bash
cd seed
pip install -r requirements.txt
python seed.py
cd ..
```

### 3. Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

### 4. Start the frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/deployments` | List with `q`, `status`, `type`, `environment`, `sort`, `order`, `page`, `limit`, `include_deleted` |
| `GET` | `/deployments/{id}` | Single deployment |
| `PATCH` | `/deployments/{id}` | Update top-level fields + `name`/`description` shortcuts |
| `DELETE` | `/deployments/{id}` | Soft delete (sets `deleted_at`) |
| `POST` | `/deployments/{id}/restore` | Unset `deleted_at` |
| `PUT` | `/deployments/{id}/attributes/{key}` | Upsert one attribute |
| `DELETE` | `/deployments/{id}/attributes/{key}` | Remove one attribute |
| `GET` | `/health` | Liveness check |

All list responses: `{ items, total, page, limit, has_more }`.
All errors: `{ detail: string }` with an appropriate HTTP status code.

---

## How each requirement is addressed

### 1 — Browse ~5,000 deployments efficiently
Server-side pagination (`page` + `limit`, default 20). A compound index on `(deleted_at, created_at DESC)` covers the default query path without a collection scan. `placeholderData: keepPreviousData` in TanStack Query keeps the table populated while the next page loads.

### 2 — Find deployments instantly
Search input is debounced 300 ms on the client — no request fires on every keystroke. The server uses MongoDB `$text` search against an index covering `deployment_id`, `attributes.name`, `attributes.description`, and `created_by`. Status/type/environment filters are applied server-side so the payload stays small as the dataset grows.

### 3 — Sort by multiple fields
Six sort fields (`created_at`, `updated_at`, `name`, `status`, `type`, `environment`) via `sort` + `order` query params. Each is backed by an index. Clicking a column header batches the sort + order change into a single `router.replace` call to avoid a stale-closure race.

### 4 — Avoid redundant reloads
TanStack Query with `staleTime: 30_000`. Data fetched within the last 30 seconds is served from cache with no network round-trip. URL-synced filters make the query key stable across navigation — returning to the same view hits the cache, not the server.

### 5 — Inline editing of name and description
`InlineEdit` renders as text until clicked, then becomes a controlled input (Enter/blur = commit, Escape = cancel). Saves via `PATCH /deployments/{id}` using `name`/`description` body fields — the backend maps these to `attributes.name`/`attributes.description` in one `$set` operation. Optimistic update makes it feel instant; rollback fires automatically on API error.

### 6 — Attribute CRUD from a detail view
A slide-in drawer fetches the deployment by its own query key (`['deployment', id]`) for authoritative data. Attribute values are inline-editable via `PUT /deployments/{id}/attributes/{key}`. Deletion uses the `DELETE` counterpart. Both mutations optimistically update the drawer cache and every open list page, with rollback on error.

### 7 — Recoverable soft deletes for 30 days
`deleted_at` field on every document. A MongoDB TTL index (`expireAfterSeconds: 2592000`) auto-purges records where `deleted_at` is older than 30 days — no cron job or cleanup code required. List queries filter `deleted_at: null` by default; the "Show deleted" toggle sends `include_deleted=true`. Restore sets `deleted_at` back to `null`.

### 8 — Data stays fresh for concurrent users
`refetchOnWindowFocus: true` (TanStack Query default). When a user returns to the browser tab, any query older than 30 seconds is re-fetched silently in the background. The table remains populated with cached data during the refetch — no loading flash.

---

## Indexing strategy

| Index | Purpose |
|-------|---------|
| `deployment_id` (unique) | Point lookups |
| `(deleted_at, created_at DESC)` | Default list query |
| `(deleted_at, status/type/environment)` | Filtered list queries |
| `attributes.name` | Sort by name |
| Text on `deployment_id`, `attributes.name`, `attributes.description`, `created_by` | Full-text search |
| `deleted_at` TTL (2 592 000 s) | Auto-purge after 30 days |

---

## Project layout

```
deployments-dashboard/
├── backend/
│   └── app/
│       ├── main.py                  # FastAPI app, lifespan, CORS
│       ├── core/config.py           # pydantic-settings (.env)
│       ├── db/mongodb.py            # Motor client lifecycle
│       ├── db/indexes.py            # Index definitions (idempotent, run at startup)
│       ├── models/deployment.py     # Pydantic request/response schemas
│       ├── api/deployments.py       # Route handlers (thin)
│       └── services/deployments.py  # Query + mutation logic
├── frontend/
│   └── src/
│       ├── app/                     # Next.js App Router pages + providers
│       ├── components/
│       │   ├── DeploymentsDashboard.tsx   # Client orchestrator
│       │   ├── DeploymentsTable.tsx       # Table with inline edit + actions
│       │   ├── DeploymentDrawer.tsx       # Detail panel + attribute CRUD
│       │   ├── FilterBar.tsx              # Search + filter controls
│       │   ├── Pagination.tsx
│       │   ├── InlineEdit.tsx             # Click-to-edit primitive
│       │   └── StatusBadge.tsx
│       ├── hooks/
│       │   ├── useDeployments.ts          # List query
│       │   ├── useDeploymentDetail.ts     # Single-item query
│       │   ├── useFilters.ts              # URL-synced filter state + debounce
│       │   ├── usePatchDeployment.ts      # Optimistic patch
│       │   ├── useAttributeMutations.ts   # Optimistic attribute upsert/delete
│       │   └── useDeploymentLifecycle.ts  # Optimistic delete/restore
│       └── lib/
│           ├── api.ts               # Typed fetch wrapper (all endpoints)
│           └── queryClient.ts       # QueryClient factory (staleTime, refetchOnFocus)
├── seed/                            # Database seed script
└── docker-compose.yml               # MongoDB 7
```
