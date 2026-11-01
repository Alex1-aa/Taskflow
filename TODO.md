# Task Manager App — TODO

## Task entry and editing

- [x] Users can add a new task through a React task form with a required title and optional description.
- [x] Users can edit the title and description of an existing task and can cancel editing without losing the saved task.
- [x] The form shows clear validation feedback for a missing title and does not submit invalid data.

## Task list and completion

- [x] The app displays all tasks in a reusable React task list with clear pending and completed states.
- [x] Users can mark an individual task as completed and can return it to pending status.
- [x] Users can delete an individual task with an explicit task action.
- [x] The visible list can be filtered by All, Pending, or Completed.

## Node.js API and integration

- [x] The native Node.js HTTP backend provides `/api/tasks` GET, POST, PUT, and DELETE operations with appropriate status codes and error responses.
- [x] The React frontend connects to the API with `fetch()` and asynchronous state updates.
- [x] The interface presents loading and error handling states and uses a responsive CSS layout.
- [x] Task storage is an in-memory array and resets whenever the server restarts; no persistence layer is required for this first version.

## Project and learning structure

- [x] The app is organized around `client/src/components/TaskForm.jsx`, `client/src/components/TaskList.jsx`, `client/src/App.jsx`, `client/src/App.css`, `server/server.js`, and `server/routes/tasks.js`.
- [x] Basic tests cover core CRUD and integration behavior.
- [x] The managed preview starts on the configured port and the page route manifest declares the root route.
