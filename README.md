# Taskflow // Workspace

A focused full-stack task manager for learning React, fetch, native Node.js HTTP servers, REST APIs, and CRUD operations.

## Run it

```bash
npm install
npm run build
npm start
```

The app is served at `http://localhost:3000`. During client-only development, use `npm run dev` for Vite and run the API separately with `npm start` after building.

## Backend

The backend uses Node.js's built-in `node:http` module rather than Express or another server framework. It includes JSON body parsing, REST routing, status handling, static frontend serving, SPA fallback, and a health endpoint directly in `server/server.js`.

## API

- `GET /api/tasks` — list tasks
- `POST /api/tasks` — create a task with a title and optional description
- `PUT /api/tasks/:id` — edit title/description or toggle `completed`
- `DELETE /api/tasks/:id` — delete a task
- `GET /health` — service health check

Tasks are stored in an in-memory array and reset when the server restarts. This is intentional for the first learning version.
