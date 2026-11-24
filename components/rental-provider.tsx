"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { IconCheck, IconX } from "@tabler/icons-react"
import {
  createDemoData,
  type DemoData,
  type TenantForm,
  type TenantSubmission,
} from "@/lib/rental"
import { saveTenantForm } from "@/lib/tenant-form"

interface Context {
  data: DemoData
  ready: boolean
  authenticated: boolean
  update: (fn: (data: DemoData) => DemoData) => void
  login: () => void
  logout: () => void
  notify: (message: string) => void
  reset: () => void
  submitTenantForm: (form: TenantForm, id: string) => TenantSubmission | string
}
const RentalContext = createContext<Context | null>(null)
const STORAGE_KEY = "id-rental-demo-v1"
export function RentalProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(() => createDemoData())
  const [ready, setReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [toast, setToast] = useState("")
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
        if (
          stored?.version === 1 &&
          Array.isArray(stored.motors) &&
          Array.isArray(stored.branches) &&
          stored.cms
        )
          setData({
            ...stored,
            submissions: Array.isArray(stored.submissions)
              ? stored.submissions
              : [],
          })
        setAuthenticated(sessionStorage.getItem("id-rental-admin") === "demo")
      } catch {
        /* The in-memory demo remains usable if storage is unavailable. */
      }
      setReady(true)
    })
  }, [])
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        /* Demo can run in memory. */
      }
    }
  }, [data, ready])
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4200)
      return () => clearTimeout(timer)
    }
  }, [toast])
  const login = () => {
    setAuthenticated(true)
    try {
      sessionStorage.setItem("id-rental-admin", "demo")
    } catch {}
  }
  const logout = () => {
    setAuthenticated(false)
    try {
      sessionStorage.removeItem("id-rental-admin")
    } catch {}
  }
  return (
    <RentalContext.Provider
      value={{
        data,
        ready,
        authenticated,
        update: (fn) => setData(fn),
        submitTenantForm: (form, id) => {
          const result = saveTenantForm(data, form, id)
          if (typeof result === "string") return result
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data))
          } catch {
            return "Penyimpanan demo belum dapat menyimpan formulir. Kurangi ukuran foto atau reset data demo, lalu coba lagi."
          }
          setData(result.data)
          return result.submission
        },
        login,
        logout,
        notify: setToast,
        reset: () => {
          setData(createDemoData())
          setToast("Data demo dikembalikan. Jadwal diperbarui mulai besok.")
        },
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          <IconCheck size={20} />
          <span>{toast}</span>
          <button aria-label="Tutup notifikasi" onClick={() => setToast("")}>
            <IconX size={16} />
          </button>
        </div>
      )}
    </RentalContext.Provider>
  )
}
export function useRental() {
  const value = useContext(RentalContext)
  if (!value) throw new Error("RentalProvider diperlukan")
  return value
}
