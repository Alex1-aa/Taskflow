# Task Manager App — Plan

## Implementation approach

Build a small full-stack learning application with a Vite-powered React client and a native Node.js `http` server. The server owns an in-memory task array and exposes REST endpoints under `/api/tasks`; the client uses `fetch()` for all CRUD operations and keeps its visible list synchronized after mutations. The app runs from one Node.js process in Preview: the client is built to `dist/`, the native server serves that static output, and Vite remains the development tool for local client work.

The client is organized into `TaskForm`, `TaskList`, and focused presentational pieces inside `client/src/components/`. `App.jsx` owns tasks, filters, loading/error state, and the edit flow. The server is organized into `server/server.js` and `server/routes/tasks.js`, with validation and appropriate 2xx/4xx responses. In-memory storage is intentionally non-persistent and resets on restart, matching the learning goal.

## Project structure

- `client/src/App.jsx` — page shell, API orchestration, filter state, edit mode, empty/loading/error states.
- `client/src/components/TaskForm.jsx` — create and edit form with title/description validation and cancel behavior.
- `client/src/components/TaskList.jsx` — filtered list rendering, completion toggles, edit/delete actions.
- `client/src/App.css` — Terminal Focus visual system and responsive layout.
- `client/src/main.jsx` — React entry point.
- `server/server.js` — native Node.js HTTP server, static client serving, JSON parsing, API routing, health endpoint, and SPA fallback.
- `server/routes/tasks.js` — in-memory CRUD operations and validation.
- `public/manus-routes.json` — declared page routes for the managed preview.
- `tests/tasks.test.js` — basic API behavior coverage using Node's built-in test runner and an ephemeral server export.

## Design direction

### Style options considered

- **Notebook Utility** — 0.06 probability: warm paper-planner productivity UI with tactile ruled details.
- **Terminal Focus** — 0.68 probability: dark developer workspace with compact spacing and bright status markers.
- **Soft Modular** — 0.07 probability: light geometric cards with lavender accents and generous whitespace.

### Chosen movement: Terminal Focus

A dark, developer-oriented productivity console for learning full-stack CRUD by doing. The interface should feel capable and calm rather than noisy: every label explains a state, every control has a clear affordance, and task progress reads like a live system signal.

### Core principles

1. **Readable at a glance:** strong hierarchy, compact labels, and explicit status values.
2. **Evidence over decoration:** a small activity summary and clear counts reinforce what the app is doing.
3. **Fast, reversible actions:** editing and cancellation are always nearby; destructive actions are visually distinct.
4. **Learning-friendly feedback:** loading, errors, empty states, and API status are visible without being alarming.

### Color philosophy

Use a deep ink background with layered charcoal panels so the product feels like a focused workspace. Electric green is the ownable signal color for completion and healthy API state; amber flags pending work and warnings; muted lavender-gray supports secondary metadata without competing with task titles.

### Layout paradigm

A left rail establishes the product identity and API status while the main workspace carries the form and task stream. On narrow screens, the rail becomes a compact header and the workspace collapses into a single readable column.

### Signature elements

- A monospace `TASKFLOW // WORKSPACE` wordmark with a small green terminal cursor.
- Thin divider rules and dotted progress bars that echo code-editor status lines.
- Small uppercase status chips (`PENDING`, `DONE`, `API ONLINE`) paired with bright signal colors.

### Interaction and animation

Use short 140–180ms opacity/transform transitions for cards and controls. Newly created or updated tasks should settle into place with a subtle upward fade; completion should change the title color and check indicator without a distracting celebration. Buttons should respond with a small translate-y shift and border-color glow. Avoid infinite motion.

### Typography system

Use IBM Plex Mono for labels, navigation, counters, statuses, and the wordmark. Use a readable system sans stack for task titles and descriptions so long copy remains comfortable. Headings are compact, uppercase, and letter-spaced; body copy is sentence case with generous line height.

### Brand essence and voice

**Taskflow turns CRUD practice into a calm, observable workspace for people learning full-stack development.** Personality: precise, encouraging, quietly technical.

Voice examples:

- “Ship the next small thing.”
- “Your queue is clear. Nice work.”

### Wordmark and logo

A compact `TF` terminal-cursor mark: two bracket-like strokes framing a green square cursor, paired with the `TASKFLOW` wordmark. The same mark appears in the rail and the app metadata.

### Signature brand color

`#22C55E` — terminal green, reserved for completed work, healthy API state, active focus, and the primary action.

## Required behavior

The first version must support creating tasks with a required title and optional description, listing all tasks, toggling completion, editing title/description, deleting tasks, and filtering All/Pending/Completed. The native Node.js HTTP API must expose GET/POST/PUT/DELETE under `/api/tasks`, return validation and not-found errors, and retain data only in memory. The frontend must use `fetch()`, show loading/error states, and remain responsive.
