import { Suspense } from "react"
import { MotorResults } from "@/components/motor-results"
import { LoadingView } from "@/components/rental-ui"
export default function Page() {
  return (
    <Suspense fallback={<LoadingView />}>
      <MotorResults />
    </Suspense>
  )
}
