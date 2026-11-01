import { useEffect, useState } from 'react'

const emptyValues = { title: '', description: '' }

export default function TaskForm({ initialTask, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(emptyValues)
  const [validationError, setValidationError] = useState('')
  const isEditing = Boolean(initialTask)

  useEffect(() => {
    setValues(
      initialTask
        ? { title: initialTask.title, description: initialTask.description || '' }
        : emptyValues,
    )
    setValidationError('')
  }, [initialTask])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    if (name === 'title' && value.trim()) setValidationError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!values.title.trim()) {
      setValidationError('A title is required before this task can join the queue.')
      return
    }

    try {
      await onSubmit({ title: values.title.trim(), description: values.description.trim() })
      if (!isEditing) setValues(emptyValues)
    } catch {
      // App owns the API error surface; keep entered values here for a quick retry.
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="task-title">
        TASK TITLE <span>REQUIRED</span>
      </label>
      <input
        id="task-title"
        name="title"
        value={values.title}
        onChange={handleChange}
        placeholder="e.g. Wire up the task API"
        maxLength={120}
        autoComplete="off"
        aria-invalid={Boolean(validationError)}
      />
      {validationError && <span className="field-error">{validationError}</span>}

      <label className="field-label" htmlFor="task-description">
        DESCRIPTION <span>OPTIONAL</span>
      </label>
      <textarea
        id="task-description"
        name="description"
        value={values.description}
        onChange={handleChange}
        placeholder="Add a little context for future you..."
        maxLength={500}
        rows={4}
      />
      <div className="field-meta">
        <span>{values.description.length}/500</span>
        <span>TEXT / PLAIN</span>
      </div>

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={submitting}>
          <span>{submitting ? 'SAVING...' : isEditing ? 'SAVE CHANGES' : 'ADD TASK'}</span>
          <span className="button-mark">{submitting ? '…' : '↗'}</span>
        </button>
        {isEditing && (
          <button className="text-button" type="button" onClick={onCancel} disabled={submitting}>
            CANCEL
          </button>
        )}
      </div>
    </form>
  )
}
