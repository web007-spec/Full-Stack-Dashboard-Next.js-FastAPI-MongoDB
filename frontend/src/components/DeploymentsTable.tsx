'use client'

import type { Deployment, SortField, SortOrder } from '@/lib/api'
import { usePatchDeployment } from '@/hooks/usePatchDeployment'
import { useDeleteDeployment, useRestoreDeployment } from '@/hooks/useDeploymentLifecycle'
import { InlineEdit } from './InlineEdit'
import { StatusBadge } from './StatusBadge'

interface Column {
  key: string
  label: string
  sortField?: SortField
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Name', sortField: 'name' },
  { key: 'version', label: 'Version' },
  { key: 'status', label: 'Status', sortField: 'status' },
  { key: 'type', label: 'Type', sortField: 'type' },
  { key: 'environment', label: 'Env', sortField: 'environment' },
  { key: 'team', label: 'Team' },
  { key: 'created_by', label: 'Creator' },
  { key: 'created_at', label: 'Created', sortField: 'created_at' },
]

interface Props {
  items: Deployment[]
  isFetching: boolean
  isError: boolean
  sort: SortField
  order: SortOrder
  onSort: (field: SortField) => void
  onSelect: (deployment: Deployment) => void
}

function SortIndicator({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) return <span className="ml-1 text-gray-300">↕</span>
  return <span className="ml-1 text-blue-600">{order === 'asc' ? '↑' : '↓'}</span>
}

export function DeploymentsTable({ items, isFetching, isError, sort, order, onSort, onSelect }: Props) {
  const { mutate: patch } = usePatchDeployment()
  const { mutate: del } = useDeleteDeployment()
  const { mutate: restore } = useRestoreDeployment()

  if (isError) {
    return (
      <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load deployments. Check that the API is running on port 8000.
      </p>
    )
  }

  return (
    <div className={`overflow-x-auto rounded border border-gray-200 transition-opacity duration-150 ${isFetching ? 'opacity-60' : ''}`}>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 whitespace-nowrap ${col.sortField ? 'cursor-pointer select-none hover:text-gray-800' : ''}`}
                onClick={() => col.sortField && onSort(col.sortField)}
              >
                {col.label}
                {col.sortField && <SortIndicator active={sort === col.sortField} order={order} />}
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {items.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-gray-400">
                No deployments found.
              </td>
            </tr>
          )}
          {items.map((d) => (
            <tr key={d.deployment_id} className={`hover:bg-gray-50 ${d.deleted_at ? 'bg-red-50/30' : ''}`}>
              <td className="px-4 py-3 max-w-[220px]">
                <div className="font-medium text-gray-900">
                  <InlineEdit
                    value={d.attributes.name ?? ''}
                    placeholder="Unnamed"
                    onSave={(v) => v && patch({ id: d.deployment_id, body: { name: v } })}
                  />
                </div>
                <div className="mt-0.5 text-xs text-gray-400">
                  <InlineEdit
                    value={d.attributes.description ?? ''}
                    placeholder="Add description…"
                    textClassName="text-xs"
                    onSave={(v) => v && patch({ id: d.deployment_id, body: { description: v } })}
                  />
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">{d.version}</td>
              <td className="px-4 py-3"><StatusBadge value={d.status} /></td>
              <td className="px-4 py-3"><StatusBadge value={d.type} /></td>
              <td className="px-4 py-3"><StatusBadge value={d.environment} /></td>
              <td className="px-4 py-3 text-gray-600">{d.attributes.team ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate" title={d.created_by}>
                {d.created_by}
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                {new Date(d.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <button
                    onClick={() => onSelect(d)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Details
                  </button>
                  {d.deleted_at ? (
                    <button
                      onClick={() => restore(d.deployment_id)}
                      className="text-xs text-green-600 hover:underline"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => del(d.deployment_id)}
                      className="text-xs text-red-400 hover:text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
