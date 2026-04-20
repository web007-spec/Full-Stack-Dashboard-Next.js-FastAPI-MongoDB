import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Deployment, type DeploymentListResponse } from '@/lib/api'

function patchListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  updater: (d: Deployment) => Deployment,
) {
  queryClient.setQueriesData<DeploymentListResponse>({ queryKey: ['deployments'] }, (old) => {
    if (!old) return old
    return { ...old, items: old.items.map((d) => (d.deployment_id === id ? updater(d) : d)) }
  })
}

export function useUpsertAttribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, key, value }: { id: string; key: string; value: string }) =>
      api.upsertAttribute(id, key, value),

    onMutate: async ({ id, key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['deployment', id] })
      const prevDetail = queryClient.getQueryData<Deployment>(['deployment', id])

      queryClient.setQueryData<Deployment>(['deployment', id], (old) =>
        old ? { ...old, attributes: { ...old.attributes, [key]: value } } : old,
      )
      patchListCache(queryClient, id, (d) => ({
        ...d,
        attributes: { ...d.attributes, [key]: value },
      }))

      return { prevDetail }
    },

    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(['deployment', id], updated)
    },

    onError: (_err, { id }, context) => {
      if (context?.prevDetail) queryClient.setQueryData(['deployment', id], context.prevDetail)
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },

    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
      queryClient.invalidateQueries({ queryKey: ['deployment', id] })
    },
  })
}

export function useDeleteAttribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, key }: { id: string; key: string }) => api.deleteAttribute(id, key),

    onMutate: async ({ id, key }) => {
      await queryClient.cancelQueries({ queryKey: ['deployment', id] })
      const prevDetail = queryClient.getQueryData<Deployment>(['deployment', id])

      queryClient.setQueryData<Deployment>(['deployment', id], (old) => {
        if (!old) return old
        const { [key]: _removed, ...rest } = old.attributes
        return { ...old, attributes: rest }
      })
      patchListCache(queryClient, id, (d) => {
        const { [key]: _removed, ...rest } = d.attributes
        return { ...d, attributes: rest }
      })

      return { prevDetail }
    },

    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(['deployment', id], updated)
    },

    onError: (_err, { id }, context) => {
      if (context?.prevDetail) queryClient.setQueryData(['deployment', id], context.prevDetail)
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },

    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
      queryClient.invalidateQueries({ queryKey: ['deployment', id] })
    },
  })
}
