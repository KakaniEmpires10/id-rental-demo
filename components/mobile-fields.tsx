"use client"
import Image from "next/image"
import { useState, type ReactNode } from "react"
import {
  IconUpload,
  IconX,
  IconMapPin,
  IconArrowUpRight,
} from "@tabler/icons-react"
import { type TenantDocument, type DemoData } from "@/lib/rental"
import { pickupMap } from "@/lib/mobile-rental"

export function AppField({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="app-field">
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      {children}
    </label>
  )
}
export function SummaryRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="app-summary-rows">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || "—"}</dd>
        </div>
      ))}
    </dl>
  )
}
export function LocationCard({
  data,
  branchId,
}: {
  data: DemoData
  branchId: string
}) {
  const branch = data.branches.find((b) => b.id === branchId)
  const map = pickupMap(data, branchId)
  if (!branch) return null
  return (
    <div className="app-location-card">
      <IconMapPin size={19} />
      <div>
        <strong>ID Rental · {branch.name}</strong>
        <p>{branch.address}</p>
        <small>{branch.hours}</small>
        {map ? (
          <a href={map} target="_blank" rel="noopener noreferrer">
            Lihat lokasi pengambilan <IconArrowUpRight size={14} />
          </a>
        ) : (
          <small>
            Alamat dan titik pengambilan akan dikonfirmasi admin sebelum Anda
            datang.
          </small>
        )}
      </div>
    </div>
  )
}
export function DocumentField({
  label,
  value,
  onChange,
}: {
  label: string
  value: TenantDocument | null
  onChange: (v: TenantDocument | null) => void
}) {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  async function upload(file?: File) {
    if (!file) return
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Pilih JPG, PNG, atau WebP maksimal 5 MB.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#fff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()
      const dataUrl = canvas.toDataURL("image/jpeg", 0.72)
      if (dataUrl.length > 700000) {
        setError("Foto masih terlalu besar. Pilih foto lebih kecil.")
        return
      }
      onChange({ name: file.name, dataUrl })
    } catch {
      setError("Foto belum dapat dibaca. Coba gambar lain.")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="app-document">
      <div>
        <strong>
          Foto {label} asli <b>*</b>
        </strong>
        <small>Gunakan foto contoh untuk simulasi.</small>
      </div>
      {value ? (
        <div className="app-document-preview">
          <Image
            src={value.dataUrl}
            alt={`Pratinjau foto ${label}`}
            width={100}
            height={65}
            unoptimized
          />
          <span>{value.name}</span>
          <button
            type="button"
            aria-label={`Hapus foto ${label}`}
            onClick={() => onChange(null)}
          >
            <IconX size={16} />
          </button>
        </div>
      ) : (
        <label className="app-upload">
          <IconUpload size={21} />
          <span>{loading ? "Menyiapkan foto…" : `Pilih foto ${label}`}</span>
          <small>JPG, PNG, WebP · maks. 5 MB</small>
          <input
            type="file"
            aria-label={`Unggah foto ${label}`}
            accept="image/jpeg,image/png,image/webp"
            disabled={loading}
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
      )}
      {error && (
        <p className="app-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
export function exampleDocument(label: string): TenantDocument {
  const canvas = document.createElement("canvas")
  canvas.width = 600
  canvas.height = 360
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#edf4ef"
  ctx.fillRect(0, 0, 600, 360)
  ctx.fillStyle = "#146b5d"
  ctx.font = "bold 32px sans-serif"
  ctx.fillText("DOKUMEN CONTOH", 45, 110)
  ctx.font = "20px sans-serif"
  ctx.fillText(`Simulasi lampiran ${label}`, 45, 165)
  ctx.fillText("Tanpa identitas pribadi", 45, 210)
  ctx.fillText("Hanya untuk presentasi ID Rental", 45, 255)
  return {
    name: `${label.toLowerCase()}-contoh.jpg`,
    dataUrl: canvas.toDataURL("image/jpeg", 0.7),
  }
}
