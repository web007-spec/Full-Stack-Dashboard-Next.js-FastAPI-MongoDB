'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import type { DeploymentEnvironment, DeploymentStatus, DeploymentType, ListParams, SortField, SortOrder } from '@/lib/api'
import { useDebounce } from './useDebounce'

export interface Filters {
  q: string
  status: DeploymentStatus | ''
  type: DeploymentType | ''
  environment: DeploymentEnvironment | ''
  sort: SortField
  order: SortOrder
  page: number
  limit: number
  include_deleted: boolean
}

const DEFAULTS: Filters = {
  q: '',
  status: '',
  type: '',
  environment: '',
  sort: 'created_at',
  order: 'desc',
  page: 1,
  limit: 20,
  include_deleted: false,
}

export function filtersToApiParams(filters: Filters): ListParams {
  return {
    ...(filters.q && { q: filters.q }),
    ...(filters.status && { status: filters.status }),
    ...(filters.type && { type: filters.type }),
    ...(filters.environment && { environment: filters.environment }),
    sort: filters.sort,
    order: filters.order,
    page: filters.page,
    limit: filters.limit,
    ...(filters.include_deleted && { include_deleted: true }),
  }
}

export function useFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Local state for search input gives instant feedback while typing
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')
  const debouncedQ = useDebounce(searchInput, 300)

  // Parse all other filters directly from the URL
  const filters: Filters = {
    q: searchParams.get('q') ?? '',
    status: (searchParams.get('status') as DeploymentStatus) || '',
    type: (searchParams.get('type') as DeploymentType) || '',
    environment: (searchParams.get('environment') as DeploymentEnvironment) || '',
    sort: (searchParams.get('sort') as SortField) || 'created_at',
    order: (searchParams.get('order') as SortOrder) || 'desc',
    page: parseInt(searchParams.get('page') ?? '1', 10),
    limit: parseInt(searchParams.get('limit') ?? '20', 10),
    include_deleted: searchParams.get('include_deleted') === 'true',
  }

  // When debounced search value settles, push it into the URL and reset page
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedQ) {
      params.set('q', debouncedQ)
    } else {
      params.delete('q')
    }
    params.delete('page')
    router.replace(`?${params.toString()}`, { scroll: false })
    // searchParams intentionally excluded — we only want to react to debouncedQ changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ])

  const setFilter = useCallback(
    (key: keyof Omit<Filters, 'q'>, value: string | number | boolean) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === '' || value === false) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
      // Any filter change resets to page 1
      if (key !== 'page') params.delete('page')
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchInput('')
    router.replace('?', { scroll: false })
  }, [router])

  return { filters, searchInput, setSearchInput, setFilter, resetFilters }
}
