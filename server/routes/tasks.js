import { randomUUID } from 'node:crypto'

export const tasks = []

export function resetTasks() {
  tasks.length = 0
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function validateTaskInput(body, { partial = false } = {}) {
  const payload = body && typeof body === 'object' ? body : {}
  const result = {}

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'title')) {
    const title = cleanText(payload.title, 120)
    if (!title) return { error: 'A task title is required.' }
    result.title = title
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'description')) {
    if (payload.description !== undefined && typeof payload.description !== 'string') {
      return { error: 'Description must be text.' }
    }
    result.description = cleanText(payload.description ?? '', 500)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'completed')) {
    if (typeof payload.completed !== 'boolean') return { error: 'Completed must be a boolean.' }
    result.completed = payload.completed
  }

  if (partial && Object.keys(result).length === 0) {
    return { error: 'Provide at least one task field to update.' }
  }

  return { value: result }
}

export function listTasks() {
  return [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function createTask(body) {
  const { value, error } = validateTaskInput(body)
  if (error) return { error }

  const now = new Date().toISOString()
  const task = {
    id: randomUUID(),
    title: value.title,
    description: value.description,
    completed: false,
    createdAt: now,
    updatedAt: now,
  }

  tasks.push(task)
  return { task }
}

export function updateTask(id, body) {
  const task = tasks.find((item) => item.id === id)
  if (!task) return { notFound: true }

  const { value, error } = validateTaskInput(body, { partial: true })
  if (error) return { error }

  Object.assign(task, value, { updatedAt: new Date().toISOString() })
  return { task }
}

export function deleteTask(id) {
  const index = tasks.findIndex((item) => item.id === id)
  if (index === -1) return { notFound: true }

  tasks.splice(index, 1)
  return { deleted: true }
}
