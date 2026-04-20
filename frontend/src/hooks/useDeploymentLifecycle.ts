import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Deployment, type DeploymentListResponse } from '@/lib/api'

function patchDeletedAt(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  deleted_at: string | null,
) {
  queryClient.setQueriesData<DeploymentListResponse>({ queryKey: ['deployments'] }, (old) => {
    if (!old) return old
    return {
      ...old,
      items: old.items.map((d) => (d.deployment_id === id ? { ...d, deleted_at } : d)),
    }
  })
  queryClient.setQueryData<Deployment>(['deployment', id], (old) =>
    old ? { ...old, deleted_at } : old,
  )
}

export function useDeleteDeployment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteDeployment(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['deployments'] })
      await queryClient.cancelQueries({ queryKey: ['deployment', id] })

      const prevList = queryClient.getQueriesData<DeploymentListResponse>({
        queryKey: ['deployments'],
      })
      const prevDetail = queryClient.getQueryData<Deployment>(['deployment', id])

      patchDeletedAt(queryClient, id, new Date().toISOString())

      return { prevList, prevDetail }
    },

    onError: (_err, id, context) => {
      if (context?.prevDetail) queryClient.setQueryData(['deployment', id], context.prevDetail)
      if (context?.prevList) {
        for (const [key, data] of context.prevList) queryClient.setQueryData(key, data)
      }
    },

    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
      queryClient.invalidateQueries({ queryKey: ['deployment', id] })
    },
  })
}

export function useRestoreDeployment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.restoreDeployment(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['deployments'] })
      await queryClient.cancelQueries({ queryKey: ['deployment', id] })

      const prevList = queryClient.getQueriesData<DeploymentListResponse>({
        queryKey: ['deployments'],
      })
      const prevDetail = queryClient.getQueryData<Deployment>(['deployment', id])

      patchDeletedAt(queryClient, id, null)

      return { prevList, prevDetail }
    },

    onSuccess: (updated, id) => {
      queryClient.setQueryData(['deployment', id], updated)
    },

    onError: (_err, id, context) => {
      if (context?.prevDetail) queryClient.setQueryData(['deployment', id], context.prevDetail)
      if (context?.prevList) {
        for (const [key, data] of context.prevList) queryClient.setQueryData(key, data)
      }
    },

    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
      queryClient.invalidateQueries({ queryKey: ['deployment', id] })
    },
  })
}
