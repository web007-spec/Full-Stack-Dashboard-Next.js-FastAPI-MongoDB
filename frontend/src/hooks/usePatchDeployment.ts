import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Deployment, type DeploymentListResponse, type PatchDeploymentBody } from '@/lib/api'

export function usePatchDeployment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatchDeploymentBody }) =>
      api.patchDeployment(id, body),

    onMutate: async ({ id, body }) => {
      // Prevent in-flight refetches from overwriting the optimistic update
      await queryClient.cancelQueries({ queryKey: ['deployments'] })

      // Snapshot all current list pages for rollback
      const previousData = queryClient.getQueriesData<DeploymentListResponse>({
        queryKey: ['deployments'],
      })

      // Apply the update optimistically across every cached page/filter combination
      queryClient.setQueriesData<DeploymentListResponse>({ queryKey: ['deployments'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((d): Deployment => {
            if (d.deployment_id !== id) return d
            return {
              ...d,
              ...(body.status != null && { status: body.status }),
              ...(body.version != null && { version: body.version }),
              ...(body.type != null && { type: body.type }),
              ...(body.environment != null && { environment: body.environment }),
              attributes: {
                ...d.attributes,
                ...(body.name != null && { name: body.name }),
                ...(body.description != null && { description: body.description }),
              },
            }
          }),
        }
      })

      return { previousData }
    },

    onError: (_err, _vars, context) => {
      // Roll back every affected cache entry
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },

    onSettled: () => {
      // Re-sync with the server after either success or failure
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },
  })
}
