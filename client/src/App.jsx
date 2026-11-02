import { useCallback, useEffect, useMemo, useState } from 'react'
import TaskForm from './components/TaskForm.jsx'
import TaskList from './components/TaskList.jsx'
import { localRequest } from './localTasks.js'

const API_URL = '/api/tasks'

function Icon({ name, size = 18 }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    activity: (
      <>
        <path d="M3 12h4l2.2-6 4.1 12 2.2-6H21" />
        <path d="M3 4h18" opacity=".3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M10 11v6M14 11v6" />
        <path d="M6 7l1 12h10l1-12M9 7V4h6v3" />
      </>
    ),
    edit: (
      <>
        <path d="m5 16-.7 3.7L8 19l10.7-10.7a2.1 2.1 0 0 0-3-3L5 16Z" />
        <path d="m14.5 6.5 3 3" />
      </>
    ),
    arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

// Thrown when there is no task API to talk to (network failure, or a host that
// serves a 404/HTML page instead), so the app can fall back to browser storage.
class ApiUnavailableError extends Error {}

async function request(path = '', options = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
  } catch {
    throw new ApiUnavailableError('The task API is unreachable.')
  }
  const isJson = response.headers.get('content-type')?.includes('application/json')
  if (response.status !== 204 && !isJson) {
    throw new ApiUnavailableError('The task API is unreachable.')
  }
  const data = response.status === 204 ? null : await response.json()
  if (!response.ok) throw new Error(data?.error || 'The API request failed.')
  return data
}

function formatCount(count) {
  return String(count).padStart(2, '0')
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [editingTask, setEditingTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [apiOnline, setApiOnline] = useState(false)
  const [localMode, setLocalMode] = useState(false)
  const send = localMode ? localRequest : request

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await request()
      setTasks(data)
      setApiOnline(true)
      setLocalMode(false)
    } catch (requestError) {
      setApiOnline(false)
      if (requestError instanceof ApiUnavailableError) {
        setTasks(await localRequest())
        setLocalMode(true)
      } else {
        setError(requestError.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length
    return {
      total: tasks.length,
      completed,
      pending: tasks.length - completed,
    }
  }, [tasks])

  const visibleTasks = useMemo(() => {
    if (filter === 'pending') return tasks.filter((task) => !task.completed)
    if (filter === 'completed') return tasks.filter((task) => task.completed)
    return tasks
  }, [filter, tasks])

  async function handleSubmit(values) {
    const isEditing = Boolean(editingTask)
    setActionLoading(isEditing ? editingTask.id : 'create')
    setError('')
    try {
      if (isEditing) {
        const updatedTask = await send(`/${editingTask.id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        })
        setTasks((current) =>
          current.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
        )
        setEditingTask(null)
        setNotice('Task updated successfully.')
      } else {
        const createdTask = await send('', {
          method: 'POST',
          body: JSON.stringify(values),
        })
        setTasks((current) => [createdTask, ...current])
        setNotice('Task added to the queue.')
      }
      setApiOnline(!localMode)
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    } finally {
      setActionLoading('')
    }
  }

  async function handleToggle(task) {
    setActionLoading(task.id)
    setError('')
    try {
      const updatedTask = await send(`/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed }),
      })
      setTasks((current) =>
        current.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
      )
      setNotice(updatedTask.completed ? 'Task marked complete.' : 'Task returned to pending.')
      setApiOnline(!localMode)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setActionLoading('')
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return
    setActionLoading(task.id)
    setError('')
    try {
      await send(`/${task.id}`, { method: 'DELETE' })
      setTasks((current) => current.filter((item) => item.id !== task.id))
      if (editingTask?.id === task.id) setEditingTask(null)
      setNotice('Task removed from the queue.')
      setApiOnline(!localMode)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setActionLoading('')
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <span>[</span>
            <i />
            <span>]</span>
          </div>
          <div>
            <div className="brand-name">TASKFLOW</div>
            <div className="brand-caption">WORKSPACE / 01</div>
          </div>
        </div>

        <nav className="side-nav" aria-label="Primary navigation">
          <div className="side-nav-label">NAVIGATION</div>
          <a className="nav-item active" href="#workspace">
            <Icon name="grid" size={16} /> <span>Workspace</span>
            <span className="nav-index">01</span>
          </a>
          <a className="nav-item" href="#api-surface">
            <Icon name="activity" size={16} /> <span>API surface</span>
            <span className="nav-index">02</span>
          </a>
        </nav>

        <div className="sidebar-spacer" />

        <div className="api-card" id="api-surface">
          <div className="api-card-header">
            <span>RUNTIME STATUS</span>
            <span className={`status-dot ${apiOnline || localMode ? 'online' : 'offline'}`} />
          </div>
          <div className="api-status">
            {apiOnline
              ? 'API ONLINE'
              : localMode
                ? 'LOCAL MODE'
                : loading
                  ? 'CONNECTING'
                  : 'API OFFLINE'}
          </div>
          <div className="api-meta">
            <span>POST /api/tasks</span>
            <span>{localMode ? 'BROWSER' : 'MEMORY'}</span>
          </div>
          <div className="api-meter">
            <span style={{ width: apiOnline || localMode ? '100%' : '18%' }} />
          </div>
        </div>

        <div className="sidebar-footer">
          <span>BUILD 1.0.0</span>
          <span>{localMode ? 'LOCAL STORAGE' : 'IN-MEMORY'}</span>
        </div>
      </aside>

      <main className="main-content" id="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>PROJECTS</span>
            <b>/</b>
            <strong>TASKFLOW</strong>
          </div>
          <div className="topbar-right">
            <span className="live-pill">
              <i /> LIVE PREVIEW
            </span>
            <span className="topbar-date">OCT 21, 2026</span>
          </div>
        </header>

        <section className="intro-section">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> DAILY WORKSPACE
            </div>
            <h1>
              Ship the next
              <br />
              <em>small thing.</em>
            </h1>
            <p className="intro-copy">
              A focused queue for turning ideas into done. Keep the list moving, one clear action at
              a time.
            </p>
          </div>
          <div className="intro-decoration" aria-hidden="true">
            <span>CRUD / 01</span>
            <span>→</span>
            <div className="decoration-line" />
          </div>
        </section>

        <section className="stats-grid" aria-label="Task summary">
          <div className="stat-card stat-card-primary">
            <span className="stat-label">TOTAL TASKS</span>
            <strong>{formatCount(stats.total)}</strong>
            <span className="stat-foot">
              <Icon name="grid" size={13} /> ALL ITEMS
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">PENDING</span>
            <strong>{formatCount(stats.pending)}</strong>
            <span className="stat-foot amber">
              <Icon name="clock" size={13} /> IN QUEUE
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">COMPLETED</span>
            <strong>{formatCount(stats.completed)}</strong>
            <span className="stat-foot green">
              <Icon name="check" size={13} /> SHIPPED
            </span>
          </div>
          <div className="progress-card">
            <div className="progress-copy">
              <span className="stat-label">QUEUE HEALTH</span>
              <strong>
                {stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </strong>
            </div>
            <div className="progress-track">
              <span
                style={{ width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%` }}
              />
            </div>
            <span className="progress-note">
              {stats.total
                ? `${stats.completed} of ${stats.total} tasks shipped`
                : 'Add a task to start the queue'}
            </span>
          </div>
        </section>

        {error && (
          <div className="alert error-alert" role="alert">
            <Icon name="activity" size={17} />
            <span>{error}</span>
            <button className="alert-action" onClick={loadTasks}>
              RETRY
            </button>
          </div>
        )}
        {notice && (
          <div className="toast" role="status">
            <Icon name="check" size={16} /> {notice}
          </div>
        )}

        <section className="workspace-grid">
          <div className="panel composer-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">{editingTask ? 'EDIT MODE' : 'NEW ENTRY'}</span>
                <h2>{editingTask ? 'Refine the task' : 'Add to the queue'}</h2>
              </div>
              <span className="panel-code">{editingTask ? 'PUT /:ID' : 'POST /TASKS'}</span>
            </div>
            <TaskForm
              initialTask={editingTask}
              onSubmit={handleSubmit}
              onCancel={() => setEditingTask(null)}
              submitting={Boolean(actionLoading)}
            />
            <div className="composer-tip">
              <span className="tip-mark">i</span>
              <span>
                Keep the title crisp. Use the description for context, not a second title.
              </span>
            </div>
          </div>

          <div className="panel principles-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">WORKFLOW NOTES</span>
                <h2>Make it observable</h2>
              </div>
              <Icon name="activity" size={20} />
            </div>
            <div className="principle-list">
              <div className="principle-item">
                <span>01</span>
                <p>
                  <strong>Capture</strong> the next action, not the whole project.
                </p>
              </div>
              <div className="principle-item">
                <span>02</span>
                <p>
                  <strong>Commit</strong> to one clear outcome at a time.
                </p>
              </div>
              <div className="principle-item">
                <span>03</span>
                <p>
                  <strong>Close</strong> the loop when the work ships.
                </p>
              </div>
            </div>
            <div className="principle-footer">
              <span className="signal-bar">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <span>FOCUS MODE ENABLED</span>
            </div>
          </div>
        </section>

        <section className="panel task-panel">
          <div className="panel-heading task-panel-heading">
            <div>
              <span className="panel-kicker">TASK STREAM</span>
              <h2>Your working queue</h2>
            </div>
            <span className="panel-code">
              GET /TASKS <span className="slash">//</span> {formatCount(visibleTasks.length)} SHOWN
            </span>
          </div>
          <TaskList
            tasks={visibleTasks}
            allTasks={tasks}
            filter={filter}
            onFilterChange={setFilter}
            onToggle={handleToggle}
            onEdit={setEditingTask}
            onDelete={handleDelete}
            actionLoading={actionLoading}
            loading={loading}
          />
        </section>

        <footer className="main-footer">
          <span>TASKFLOW / A SMALL SYSTEM FOR BIGGER FOLLOW-THROUGHS</span>
          <span>
            NODE HTTP <b>×</b> REACT
          </span>
        </footer>
      </main>
    </div>
  )
}
