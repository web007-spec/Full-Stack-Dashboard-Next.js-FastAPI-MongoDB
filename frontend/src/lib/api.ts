export type DeploymentStatus = 'active' | 'failed' | 'stopped'
export type DeploymentType = 'web_service' | 'worker' | 'cron_job'
export type DeploymentEnvironment = 'production' | 'staging' | 'development'
export type SortField = 'created_at' | 'updated_at' | 'name' | 'status' | 'type' | 'environment'
export type SortOrder = 'asc' | 'desc'

export interface Deployment {
  deployment_id: string
  version: string
  status: DeploymentStatus
  type: DeploymentType
  environment: DeploymentEnvironment
  attributes: Record<string, string>
  created_at: string
  created_by: string
  updated_at: string
  deleted_at: string | null
}

export interface DeploymentListResponse {
  items: Deployment[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface ListParams {
  q?: string
  status?: DeploymentStatus
  type?: DeploymentType
  environment?: DeploymentEnvironment
  sort?: SortField
  order?: SortOrder
  page?: number
  limit?: number
  include_deleted?: boolean
}

export interface PatchDeploymentBody {
  version?: string
  status?: DeploymentStatus
  type?: DeploymentType
  environment?: DeploymentEnvironment
  name?: string
  description?: string
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, body.detail ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function toQueryString(params: ListParams): string {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', params.q)
  if (params.status) qs.set('status', params.status)
  if (params.type) qs.set('type', params.type)
  if (params.environment) qs.set('environment', params.environment)
  if (params.sort) qs.set('sort', params.sort)
  if (params.order) qs.set('order', params.order)
  if (params.page != null) qs.set('page', String(params.page))
  if (params.limit != null) qs.set('limit', String(params.limit))
  if (params.include_deleted) qs.set('include_deleted', 'true')
  return qs.toString() ? `?${qs.toString()}` : ''
}

export const api = {
  listDeployments: (params: ListParams = {}): Promise<DeploymentListResponse> =>
    request(`/deployments${toQueryString(params)}`),

  getDeployment: (id: string): Promise<Deployment> =>
    request(`/deployments/${id}`),

  patchDeployment: (id: string, body: PatchDeploymentBody): Promise<Deployment> =>
    request(`/deployments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteDeployment: (id: string): Promise<void> =>
    request(`/deployments/${id}`, { method: 'DELETE' }),

  restoreDeployment: (id: string): Promise<Deployment> =>
    request(`/deployments/${id}/restore`, { method: 'POST' }),

  upsertAttribute: (id: string, key: string, value: string): Promise<Deployment> =>
    request(`/deployments/${id}/attributes/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),

  deleteAttribute: (id: string, key: string): Promise<Deployment> =>
    request(`/deployments/${id}/attributes/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    }),
}
