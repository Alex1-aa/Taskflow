import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { localRequest, resetLocalTasks } from '../client/src/localTasks.js'

beforeEach(() => {
  resetLocalTasks()
})

test('local store creates, lists, updates, and deletes tasks like the API', async () => {
  const created = await localRequest('', {
    method: 'POST',
    body: JSON.stringify({ title: '  Write docs  ', description: 'README' }),
  })
  assert.equal(created.title, 'Write docs')
  assert.equal(created.completed, false)

  assert.deepEqual(await localRequest(), [created])

  const updated = await localRequest(`/${created.id}`, {
    method: 'PUT',
    body: JSON.stringify({ completed: true }),
  })
  assert.equal(updated.completed, true)

  assert.equal(await localRequest(`/${created.id}`, { method: 'DELETE' }), null)
  assert.deepEqual(await localRequest(), [])
})

test('local store rejects invalid input and unknown ids', async () => {
  await assert.rejects(
    localRequest('', { method: 'POST', body: JSON.stringify({ title: '   ' }) }),
    /A task title is required\./,
  )
  await assert.rejects(localRequest('/missing', { method: 'DELETE' }), /Task not found\./)
})
