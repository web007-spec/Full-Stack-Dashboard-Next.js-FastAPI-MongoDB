import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, type ListParams } from '@/lib/api'

export function useDeployments(params: ListParams) {
  return useQuery({
    queryKey: ['deployments', params],
    queryFn: () => api.listDeployments(params),
    placeholderData: keepPreviousData,
  })
}
