'use client'

import type { Filters } from '@/hooks/useFilters'

interface Props {
  searchInput: string
  onSearchChange: (v: string) => void
  filters: Filters
  onFilterChange: (key: keyof Omit<Filters, 'q'>, value: string | number | boolean) => void
  onReset: () => void
}

export function FilterBar({ searchInput, onSearchChange, filters, onFilterChange, onReset }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        type="search"
        placeholder="Search by name, ID, creator…"
        value={searchInput}
        onChange={(e) => onSearchChange(e.target.value)}
        className="border rounded px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <select
        value={filters.status}
        onChange={(e) => onFilterChange('status', e.target.value)}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="failed">Failed</option>
        <option value="stopped">Stopped</option>
      </select>

      <select
        value={filters.type}
        onChange={(e) => onFilterChange('type', e.target.value)}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All types</option>
        <option value="web_service">Web service</option>
        <option value="worker">Worker</option>
        <option value="cron_job">Cron job</option>
      </select>

      <select
        value={filters.environment}
        onChange={(e) => onFilterChange('environment', e.target.value)}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All environments</option>
        <option value="production">Production</option>
        <option value="staging">Staging</option>
        <option value="development">Development</option>
      </select>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.include_deleted}
          onChange={(e) => onFilterChange('include_deleted', e.target.checked)}
          className="rounded"
        />
        Show deleted
      </label>

      <button
        onClick={onReset}
        className="text-sm text-gray-500 hover:text-gray-800 underline"
      >
        Reset
      </button>
    </div>
  )
}
