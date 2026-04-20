const COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  stopped: 'bg-gray-100 text-gray-700',
  web_service: 'bg-blue-100 text-blue-800',
  worker: 'bg-purple-100 text-purple-800',
  cron_job: 'bg-yellow-100 text-yellow-800',
  production: 'bg-orange-100 text-orange-800',
  staging: 'bg-amber-100 text-amber-800',
  development: 'bg-teal-100 text-teal-700',
}

export function StatusBadge({ value }: { value: string }) {
  const color = COLORS[value] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {value.replace(/_/g, ' ')}
    </span>
  )
}
