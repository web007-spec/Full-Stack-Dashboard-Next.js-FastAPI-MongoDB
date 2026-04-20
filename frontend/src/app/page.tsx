import { Suspense } from 'react'
import { DeploymentsDashboard } from '@/components/DeploymentsDashboard'

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
        <p className="mt-1 text-sm text-gray-500">Platform deployment registry</p>
      </div>
      {/* Suspense required: useSearchParams() is used inside DeploymentsDashboard */}
      <Suspense>
        <DeploymentsDashboard />
      </Suspense>
    </main>
  )
}
