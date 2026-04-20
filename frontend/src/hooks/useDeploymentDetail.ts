import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useDeploymentDetail(id: string | null) {
  return useQuery({
    queryKey: ['deployment', id],
    queryFn: () => api.getDeployment(id!),
    enabled: id != null,
  })
}
