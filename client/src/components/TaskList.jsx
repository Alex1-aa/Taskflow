import { useMemo } from 'react'

function Icon({ name, size = 17 }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    edit: (
      <>
        <path d="m5 16-.7 3.7L8 19l10.7-10.7a2.1 2.1 0 0 0-3-3L5 16Z" />
        <path d="m14.5 6.5 3 3" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M10 11v6M14 11v6" />
        <path d="M6 7l1 12h10l1-12M9 7V4h6v3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
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

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' })
    .format(new Date(value))
    .toUpperCase()
}

function FilterButton({ active, label, count, onClick }) {
  return (
    <button
      className={`filter-button ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span>{label}</span>
      <b>{String(count).padStart(2, '0')}</b>
    </button>
  )
}

export default function TaskList({
  tasks,
  allTasks,
  filter,
  onFilterChange,
  onToggle,
  onEdit,
  onDelete,
  actionLoading,
  loading,
}) {
  const counts = useMemo(
    () => ({
      all: allTasks.length,
      pending: allTasks.filter((task) => !task.completed).length,
      completed: allTasks.filter((task) => task.completed).length,
    }),
    [allTasks],
  )

  return (
    <>
      <div className="filter-bar" role="group" aria-label="Filter tasks">
        <FilterButton
          active={filter === 'all'}
          label="ALL"
          count={counts.all}
          onClick={() => onFilterChange('all')}
        />
        <FilterButton
          active={filter === 'pending'}
          label="PENDING"
          count={counts.pending}
          onClick={() => onFilterChange('pending')}
        />
        <FilterButton
          active={filter === 'completed'}
          label="COMPLETED"
          count={counts.completed}
          onClick={() => onFilterChange('completed')}
        />
      </div>

      {loading ? (
        <div className="list-state loading-state">
          <span className="loader" />
          <div>
            <strong>SYNCING TASK STREAM</strong>
            <p>Checking the in-memory API...</p>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="list-state empty-state">
          <div className="empty-icon">
            <span>+</span>
          </div>
          <strong>{allTasks.length === 0 ? 'THE QUEUE IS CLEAR' : 'NOTHING IN THIS VIEW'}</strong>
          <p>
            {allTasks.length === 0
              ? 'Add a task above to give the workspace something to move.'
              : 'Try another filter to bring more work into view.'}
          </p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task, index) => {
            const busy = actionLoading === task.id
            return (
              <article
                className={`task-row ${task.completed ? 'completed' : ''}`}
                key={task.id}
                style={{ '--row-index': index }}
              >
                <button
                  className={`task-check ${task.completed ? 'checked' : ''}`}
                  onClick={() => onToggle(task)}
                  disabled={busy}
                  aria-label={
                    task.completed
                      ? `Mark ${task.title} as pending`
                      : `Mark ${task.title} as completed`
                  }
                >
                  <Icon name="check" size={16} />
                </button>
                <div className="task-content">
                  <div className="task-title-line">
                    <h3>{task.title}</h3>
                    <span className={`task-status ${task.completed ? 'done' : ''}`}>
                      {task.completed ? 'DONE' : 'PENDING'}
                    </span>
                  </div>
                  {task.description && <p>{task.description}</p>}
                  <div className="task-meta">
                    <span>{formatDate(task.createdAt)}</span>
                    <span className="meta-divider">/</span>
                    <span>{task.completed ? 'SHIPPED' : 'IN PROGRESS'}</span>
                  </div>
                </div>
                <div className="task-actions">
                  <button
                    className="icon-button"
                    onClick={() => onEdit(task)}
                    disabled={busy}
                    aria-label={`Edit ${task.title}`}
                    title="Edit task"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => onDelete(task)}
                    disabled={busy}
                    aria-label={`Delete ${task.title}`}
                    title="Delete task"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
