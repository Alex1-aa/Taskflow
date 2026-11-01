import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { app } from '../server/server.js'
import { resetTasks } from '../server/routes/tasks.js'

let server
let baseUrl

beforeEach(async () => {
  resetTasks()
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

afterEach(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  server = undefined
})

async function api(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = response.status === 204 ? null : await response.json()
  return { response, body }
}

test('GET /api/tasks starts with an empty list', async () => {
  const { response, body } = await api('/api/tasks')
  assert.equal(response.status, 200)
  assert.deepEqual(body, [])
})

test('POST validates and creates a task', async () => {
  const invalid = await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ description: 'No title' }),
  })
  assert.equal(invalid.response.status, 400)

  const created = await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: 'Wire the API', description: 'Connect the React form.' }),
  })
  assert.equal(created.response.status, 201)
  assert.equal(created.body.title, 'Wire the API')
  assert.equal(created.body.completed, false)
  assert.equal(created.body.description, 'Connect the React form.')
})

test('PUT edits task details and toggles completion', async () => {
  const created = await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: 'Draft docs' }),
  })
  const id = created.body.id

  const edited = await api(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title: 'Ship docs', description: 'Add the usage notes.' }),
  })
  assert.equal(edited.response.status, 200)
  assert.equal(edited.body.title, 'Ship docs')

  const completed = await api(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ completed: true }),
  })
  assert.equal(completed.response.status, 200)
  assert.equal(completed.body.completed, true)
})

test('DELETE removes a task and returns not found afterwards', async () => {
  const created = await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: 'Remove me' }),
  })
  const id = created.body.id
  const deleted = await api(`/api/tasks/${id}`, { method: 'DELETE' })
  assert.equal(deleted.response.status, 204)

  const missing = await api(`/api/tasks/${id}`)
  assert.equal(missing.response.status, 404)
})
