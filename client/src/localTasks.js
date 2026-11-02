// Browser-only stand-in for the /api/tasks routes, used when the Node API isn't
// deployed (e.g. static hosting). Mirrors the server's responses and validation.
const STORAGE_KEY = 'taskflow.tasks'

let cache = null

function load() {
  if (cache) return cache
  try {
    const stored = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY))
    cache = Array.isArray(stored) ? stored : []
  } catch {
    cache = []
  }
  return cache
}

function save() {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Storage blocked or full: tasks still live in memory for this session.
  }
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function validate(payload, { partial = false } = {}) {
  const result = {}

  if (!partial || 'title' in payload) {
    const title = cleanText(payload.title, 120)
    if (!title) throw new Error('A task title is required.')
    result.title = title
  }

  if (!partial || 'description' in payload) {
    if (payload.description !== undefined && typeof payload.description !== 'string') {
      throw new Error('Description must be text.')
    }
    result.description = cleanText(payload.description ?? '', 500)
  }

  if ('completed' in payload) {
    if (typeof payload.completed !== 'boolean') throw new Error('Completed must be a boolean.')
    result.completed = payload.completed
  }

  if (partial && Object.keys(result).length === 0) {
    throw new Error('Provide at least one task field to update.')
  }

  return result
}

export function resetLocalTasks() {
  cache = []
  save()
}

export async function localRequest(path = '', options = {}) {
  const method = options.method ?? 'GET'
  const id = path.replace(/^\//, '')
  const payload = options.body ? JSON.parse(options.body) : {}
  const tasks = load()

  if (method === 'GET' && !id) {
    return [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  if (method === 'POST' && !id) {
    const value = validate(payload)
    const now = new Date().toISOString()
    const task = { id: newId(), ...value, completed: false, createdAt: now, updatedAt: now }
    tasks.push(task)
    save()
    return { ...task }
  }

  const task = tasks.find((item) => item.id === id)
  if (!task) throw new Error('Task not found.')

  if (method === 'PUT') {
    Object.assign(task, validate(payload, { partial: true }), {
      updatedAt: new Date().toISOString(),
    })
    save()
    return { ...task }
  }

  if (method === 'DELETE') {
    tasks.splice(tasks.indexOf(task), 1)
    save()
    return null
  }

  throw new Error('Method not allowed.')
}
