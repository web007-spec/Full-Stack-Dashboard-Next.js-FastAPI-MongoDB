'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { filtersToApiParams, useFilters } from '@/hooks/useFilters'
import { useDeployments } from '@/hooks/useDeployments'
import type { Deployment, SortField } from '@/lib/api'
import { DeploymentDrawer } from './DeploymentDrawer'
import { DeploymentsTable } from './DeploymentsTable'
import { FilterBar } from './FilterBar'
import { Pagination } from './Pagination'

export function DeploymentsDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { filters, searchInput, setSearchInput, setFilter, resetFilters } = useFilters()
  const { data, isFetching, isError } = useDeployments(filtersToApiParams(filters))
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function handleSort(field: SortField) {
    const newOrder = filters.sort === field && filters.order === 'desc' ? 'asc' : 'desc'
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', field)
    params.set('order', newOrder)
    params.delete('page')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  function handleSelect(deployment: Deployment) {
    setSelectedId(deployment.deployment_id)
  }

  return (
    <>
      <div className="space-y-4">
        <FilterBar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          filters={filters}
          onFilterChange={setFilter}
          onReset={resetFilters}
        />
        <DeploymentsTable
          items={data?.items ?? []}
          isFetching={isFetching}
          isError={isError}
          sort={filters.sort}
          order={filters.order}
          onSort={handleSort}
          onSelect={handleSelect}
        />
        {data && (
          <Pagination
            page={data.page}
            total={data.total}
            limit={data.limit}
            onPageChange={(p) => setFilter('page', p)}
          />
        )}
      </div>

      <DeploymentDrawer
        deploymentId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}
