"use client"
import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  IconMapPin,
  IconCalendarEvent,
  IconMotorbike,
  IconSearch,
  IconArrowRight,
} from "@tabler/icons-react"
import { useRental } from "./rental-provider"
import { validPeriod, type SearchFilters } from "@/lib/rental"
export function SearchForm({
  initial,
  compact = false,
}: {
  initial?: SearchFilters
  compact?: boolean
}) {
  const { data } = useRental()
  const router = useRouter()
  const [filters, setFilters] = useState<SearchFilters>(
    initial || {
      branch: "",
      start: data.demoStart,
      end: data.demoEnd,
      type: "",
    }
  )
  const [error, setError] = useState("")
  const [loading, startTransition] = useTransition()
  const field = (key: keyof SearchFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setError("")
  }
  function search(e: FormEvent) {
    e.preventDefault()
    if (!data.branches.some((b) => b.id === filters.branch && b.active)) {
      setError("Pilih cabang atau lokasi pengambilan terlebih dahulu.")
      return
    }
    if (!validPeriod(filters.start, filters.end)) {
      setError("Tanggal dan jam pengembalian harus sesudah mulai sewa.")
      return
    }
    startTransition(() => {
      router.push(`/motor?${new URLSearchParams({ ...filters }).toString()}`)
    })
  }
  return (
    <form
      className={`search-form ${compact ? "search-compact" : ""}`}
      onSubmit={search}
      id="pencarian"
    >
      <div className="search-form-title">
        <span>
          <IconSearch size={18} /> Mulai rencana perjalanan Anda
        </span>
        <span>Konfirmasi pemesanan melalui WhatsApp</span>
      </div>
      <div className="search-fields">
        <label>
          <span>
            <IconMapPin size={16} /> Lokasi pengambilan
          </span>
          <select
            required
            value={filters.branch}
            onChange={(e) => field("branch", e.target.value)}
            aria-label="Lokasi pengambilan"
          >
            <option value="" disabled>
              Pilih cabang
            </option>
            {data.branches
              .filter((b) => b.active)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          <span>
            <IconCalendarEvent size={16} /> Mulai sewa
          </span>
          <input
            type="datetime-local"
            required
            value={filters.start}
            onChange={(e) => field("start", e.target.value)}
            aria-label="Tanggal dan jam mulai sewa"
          />
        </label>
        <label>
          <span>
            <IconCalendarEvent size={16} /> Pengembalian
          </span>
          <input
            type="datetime-local"
            required
            value={filters.end}
            onChange={(e) => field("end", e.target.value)}
            aria-label="Tanggal dan jam pengembalian"
          />
        </label>
        <label>
          <span>
            <IconMotorbike size={16} /> Jenis motor <small>opsional</small>
          </span>
          <select
            value={filters.type}
            onChange={(e) => field("type", e.target.value)}
            aria-label="Jenis motor"
          >
            <option value="">Semua jenis</option>
            {["Matic", "Manual", "Sport"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <button
          className="btn btn-yellow search-submit"
          disabled={loading}
          type="submit"
        >
          {loading ? (
            <span className="spinner small" />
          ) : (
            <IconSearch size={19} />
          )}{" "}
          {loading ? "Mencari…" : "Cari Motor Tersedia"}
          <IconArrowRight size={17} />
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
