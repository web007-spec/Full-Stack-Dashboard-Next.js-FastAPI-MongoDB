'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { useDeploymentDetail } from '@/hooks/useDeploymentDetail'
import { useDeleteAttribute, useUpsertAttribute } from '@/hooks/useAttributeMutations'
import { useDeleteDeployment, useRestoreDeployment } from '@/hooks/useDeploymentLifecycle'
import { InlineEdit } from './InlineEdit'
import { StatusBadge } from './StatusBadge'

interface Props {
  deploymentId: string | null
  onClose: () => void
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <span className="w-28 shrink-0 text-gray-400">{label}</span>
      <span className="text-gray-800 break-all">{children}</span>
    </div>
  )
}

export function DeploymentDrawer({ deploymentId, onClose }: Props) {
  const { data: deployment, isLoading } = useDeploymentDetail(deploymentId)
  const { mutate: upsert } = useUpsertAttribute()
  const { mutate: deleteAttr } = useDeleteAttribute()
  const { mutate: del } = useDeleteDeployment()
  const { mutate: restore } = useRestoreDeployment()
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (deploymentId) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [deploymentId, onClose])

  if (!deploymentId) return null

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    const k = newKey.trim()
    const v = newValue.trim()
    if (!k || !v || !deploymentId) return
    upsert({ id: deploymentId, key: k, value: v })
    setNewKey('')
    setNewValue('')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-xl sm:w-[560px]">
        {/* Header */}
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs text-gray-400 font-mono truncate">{deploymentId}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-gray-900">
              {deployment?.attributes.name ?? '—'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {isLoading && <p className="text-sm text-gray-400">Loading…</p>}

          {deployment && (
            <>
              {/* Metadata */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Metadata</h3>
                <MetaRow label="Version">{deployment.version}</MetaRow>
                <MetaRow label="Status"><StatusBadge value={deployment.status} /></MetaRow>
                <MetaRow label="Type"><StatusBadge value={deployment.type} /></MetaRow>
                <MetaRow label="Environment"><StatusBadge value={deployment.environment} /></MetaRow>
                <MetaRow label="Created by">{deployment.created_by}</MetaRow>
                <MetaRow label="Created at">{new Date(deployment.created_at).toLocaleString()}</MetaRow>
                <MetaRow label="Updated at">{new Date(deployment.updated_at).toLocaleString()}</MetaRow>
                {deployment.deleted_at && (
                  <MetaRow label="Deleted at">
                    <span className="text-red-500">{new Date(deployment.deleted_at).toLocaleString()}</span>
                  </MetaRow>
                )}
              </section>

              {/* Actions */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</h3>
                {deployment.deleted_at ? (
                  <button
                    onClick={() => restore(deployment.deployment_id)}
                    className="rounded border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                  >
                    Restore deployment
                  </button>
                ) : (
                  <button
                    onClick={() => { del(deployment.deployment_id); onClose() }}
                    className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete deployment
                  </button>
                )}
              </section>

              {/* Attributes */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Attributes</h3>
                {Object.keys(deployment.attributes).length === 0 && (
                  <p className="text-sm text-gray-400">No attributes.</p>
                )}
                <div className="divide-y divide-gray-100 rounded border border-gray-200">
                  {Object.entries(deployment.attributes).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3 px-3 py-2">
                      <span className="w-32 shrink-0 font-mono text-xs text-gray-500 truncate" title={key}>{key}</span>
                      <div className="flex-1 text-sm">
                        <InlineEdit
                          value={value}
                          onSave={(v) => v && upsert({ id: deployment.deployment_id, key, value: v })}
                        />
                      </div>
                      <button
                        onClick={() => deleteAttr({ id: deployment.deployment_id, key })}
                        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                        aria-label={`Delete attribute ${key}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add attribute */}
                <form onSubmit={handleAdd} className="mt-3 flex gap-2">
                  <input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="key"
                    className="w-32 rounded border px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="value"
                    className="flex-1 rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newKey.trim() || !newValue.trim()}
                    className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                  >
                    Add
                  </button>
                </form>
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
