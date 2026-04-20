'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { makeQueryClient } from '@/lib/queryClient'

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures one QueryClient per component instance, not per render
  const [queryClient] = useState(() => makeQueryClient())
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
