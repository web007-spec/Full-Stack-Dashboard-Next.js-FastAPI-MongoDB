'use client'

import { useState } from 'react'

interface Props {
  value: string
  placeholder?: string
  textClassName?: string
  onSave: (newValue: string) => void
}

export function InlineEdit({ value, placeholder = '—', textClassName = '', onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function startEdit() {
    setDraft(value)
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed !== value) {
      onSave(trimmed)
    }
  }

  function cancel() {
    setEditing(false)
    setDraft(value)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
          if (e.key === 'Escape') cancel()
        }}
        className="w-full rounded border border-blue-400 px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={startEdit}
      onKeyDown={(e) => e.key === 'Enter' && startEdit()}
      title="Click to edit"
      className={`cursor-text rounded px-1 -mx-1 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 ${textClassName}`}
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </span>
  )
}
