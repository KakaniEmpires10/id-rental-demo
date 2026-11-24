import { Suspense } from "react"
import { AdminPage } from "@/components/admin-page"
import { LoadingView } from "@/components/rental-ui"
export default function Page() {
  return (
    <Suspense fallback={<LoadingView />}>
      <AdminPage />
    </Suspense>
  )
}
