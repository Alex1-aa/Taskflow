import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTask, deleteTask, listTasks, updateTask } from './routes/tasks.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distPath = path.join(projectRoot, 'dist')

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function sendNoContent(res) {
  res.writeHead(204)
  res.end()
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.setEncoding('utf8')

    req.on('data', (chunk) => {
      raw += chunk
      if (Buffer.byteLength(raw) > 100 * 1024) {
        const error = new Error('Request body is too large.')
        error.statusCode = 413
        reject(error)
        req.destroy()
      }
    })

    req.on('end', () => {
      if (!raw.trim()) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        const error = new Error('Request body must be valid JSON.')
        error.statusCode = 400
        reject(error)
      }
    })

    req.on('error', reject)
  })
}

async function sendStaticFile(res, relativePath) {
  const safePath = path.normalize(relativePath).replace(/^([.][.][/\\])+/, '')
  const filePath = path.join(distPath, safePath)
  if (!filePath.startsWith(distPath)) return false

  try {
    const contents = await readFile(filePath)
    const extension = path.extname(filePath).toLowerCase()
    res.writeHead(200, { 'Content-Type': mimeTypes[extension] || 'application/octet-stream' })
    res.end(contents)
    return true
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') return false
    throw error
  }
}

async function requestHandler(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const pathname = requestUrl.pathname
  const method = req.method || 'GET'

  if (pathname === '/health' && method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'taskflow-api',
      storage: 'memory',
      runtime: 'node:http',
    })
  }

  if (pathname === '/api/tasks' || pathname.startsWith('/api/tasks/')) {
    const taskId = pathname.startsWith('/api/tasks/')
      ? decodeURIComponent(pathname.slice('/api/tasks/'.length))
      : ''

    if (pathname === '/api/tasks' && method === 'GET') return sendJson(res, 200, listTasks())
    if (taskId && method === 'GET') return sendJson(res, 404, { error: 'Task not found.' })
    if (pathname === '/api/tasks' && method === 'POST') {
      const result = createTask(await readJson(req))
      if (result.error) return sendJson(res, 400, { error: result.error })
      return sendJson(res, 201, result.task)
    }
    if (taskId && method === 'PUT') {
      const result = updateTask(taskId, await readJson(req))
      if (result.notFound) return sendJson(res, 404, { error: 'Task not found.' })
      if (result.error) return sendJson(res, 400, { error: result.error })
      return sendJson(res, 200, result.task)
    }
    if (taskId && method === 'DELETE') {
      const result = deleteTask(taskId)
      if (result.notFound) return sendJson(res, 404, { error: 'Task not found.' })
      return sendNoContent(res)
    }

    return sendJson(res, 405, { error: 'Method not allowed.' })
  }

  if (pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'API route not found.' })

  if (method === 'GET') {
    const staticPath = pathname === '/' ? '/index.html' : pathname
    if (await sendStaticFile(res, staticPath)) return undefined
    if (req.headers.accept?.includes('text/html')) {
      if (await sendStaticFile(res, '/index.html')) return undefined
    }
  }

  return sendJson(res, 404, { error: 'Not found.' })
}

export const app = createServer((req, res) => {
  requestHandler(req, res).catch((error) => {
    if (error.statusCode) return sendJson(res, error.statusCode, { error: error.message })
    console.error(error)
    return sendJson(res, 500, { error: 'Unexpected server error.' })
  })
})

export function startServer(port = Number(process.env.PORT || 3000)) {
  return app.listen(port, '0.0.0.0', () => {
    console.log(`Taskflow Node.js API listening on port ${port}`)
  })
}

if (process.argv[1] === __filename) startServer()
