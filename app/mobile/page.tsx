import { Suspense } from "react"
import { MobileSimulator } from "@/components/mobile-simulator"
import { LoadingView } from "@/components/rental-ui"
import "./mobile.css"
export default function Page() {
  return (
    <Suspense fallback={<LoadingView />}>
      <MobileSimulator />
    </Suspense>
  )
}
