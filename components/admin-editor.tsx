"use client"
import Image from "next/image"
import { useState, type FormEvent } from "react"
import { IconDeviceFloppy, IconUpload } from "@tabler/icons-react"
import { Modal } from "./rental-ui"
import { useRental } from "./rental-provider"
import {
  saveEntity,
  type EntityKind,
  type FormValues,
} from "@/lib/demo-actions"
import { dateTime, localDate } from "@/lib/rental"
export interface Field {
  key: string
  label: string
  type?: string
  required?: boolean
  options?: { value: string; label: string }[]
  hint?: string
  full?: boolean
  readOnly?: boolean
}
export function EditorFields({
  fields,
  values,
  setValues,
}: {
  fields: Field[]
  values: FormValues
  setValues: (values: FormValues) => void
}) {
  const [fileError, setFileError] = useState("")
  function upload(key: string, file?: File) {
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) {
      setFileError("Pilih gambar JPG, PNG, atau WebP maksimal 3 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setValues({ ...values, [key]: String(reader.result) })
      setFileError("")
    }
    reader.onerror = () =>
      setFileError("Gambar belum dapat dibaca. Coba file lain.")
    reader.readAsDataURL(file)
  }
  return (
    <div className="editor-grid">
      {fields.map((field) => (
        <label
          className={`${field.full ? "full" : ""} ${field.type === "checkbox" ? "checkbox-label" : ""}`}
          key={field.key}
        >
          {field.type === "checkbox" ? (
            <>
              <input
                type="checkbox"
                checked={!!values[field.key]}
                onChange={(e) =>
                  setValues({ ...values, [field.key]: e.target.checked })
                }
              />
              <span>{field.label}</span>
            </>
          ) : (
            <>
              <span>
                {field.label}
                {field.required && <span className="required"> *</span>}
              </span>
              {field.options ? (
                <select
                  required={field.required}
                  disabled={field.readOnly}
                  value={String(values[field.key] || "")}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                >
                  {!values[field.key] && <option value="">Pilih…</option>}
                  {field.options.map((o) => (
                    <option value={o.value} key={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={String(values[field.key] || "")}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                  maxLength={2000}
                />
              ) : field.type === "image" ? (
                <div className="image-field">
                  {values[field.key] && (
                    <Image
                      src={String(values[field.key])}
                      width={120}
                      height={90}
                      alt="Pratinjau gambar"
                      unoptimized
                    />
                  )}
                  <input
                    value={
                      String(values[field.key] || "").startsWith("data:")
                        ? "Gambar diunggah"
                        : String(values[field.key] || "")
                    }
                    readOnly={String(values[field.key] || "").startsWith(
                      "data:"
                    )}
                    onChange={(e) =>
                      setValues({ ...values, [field.key]: e.target.value })
                    }
                    placeholder="URL gambar atau unggah file"
                  />
                  <span className="upload-label">
                    <IconUpload size={16} /> Pilih gambar
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => upload(field.key, e.target.files?.[0])}
                    />
                  </span>
                </div>
              ) : (
                <input
                  type={field.type || "text"}
                  required={field.required}
                  readOnly={field.readOnly}
                  min={field.type === "number" ? 0 : undefined}
                  step={field.type === "number" ? 1 : undefined}
                  maxLength={
                    field.type === "text" || !field.type ? 200 : undefined
                  }
                  value={String(values[field.key] ?? "")}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                />
              )}
            </>
          )}
          {field.hint && <small>{field.hint}</small>}
        </label>
      ))}
      {fileError && <p className="form-error full">{fileError}</p>}
    </div>
  )
}
const labels: Record<EntityKind, string> = {
  motors: "motor",
  branches: "cabang",
  rentals: "penyewaan",
  maintenance: "perawatan",
  customers: "pelanggan",
}
export function EntityEditor({
  kind,
  id,
  onClose,
}: {
  kind: EntityKind
  id?: string
  onClose: () => void
}) {
  const { data, update, notify } = useRental()
  const existing = data[kind].find((i) => i.id === id)
  const defaults: Record<EntityKind, FormValues> = {
    motors: {
      code: `MTR-${String(data.motors.length + 1).padStart(3, "0")}`,
      brand: "Yamaha",
      model: "",
      plate: "DEMO",
      type: "Matic",
      year: "",
      cc: "",
      transmission: "Otomatis",
      branchId: data.branches.find((b) => b.active)?.id || "",
      price: "",
      photo: "/images/fazzio.png",
      status: "Siap disewakan",
      notes: "Data contoh prototype.",
    },
    branches: {
      name: "",
      address: "Alamat demo — akan dikonfirmasi admin.",
      hours: "Jam operasional akan dikonfirmasi",
      whatsapp: "",
      mapUrl: "",
      active: true,
    },
    customers: { name: "", phone: "", email: "", address: "", notes: "" },
    rentals: {
      code: `SWA-${String(data.rentals.length + 1).padStart(3, "0")}`,
      customerId: data.customers[0]?.id || "",
      motorId: data.motors.find((m) => m.status === "Siap disewakan")?.id || "",
      start: data.demoStart,
      end: data.demoEnd,
      status: "Dipesan",
      price: "150000",
      notes: "",
    },
    maintenance: {
      motorId: data.motors.find((m) => m.status === "Siap disewakan")?.id || "",
      issue: "",
      start: localDate(new Date()),
      end: data.demoEnd,
      status: "Dalam proses",
      notes: "",
    },
  }
  const [values, setValues] = useState<FormValues>(
    existing
      ? Object.fromEntries(
          Object.entries(existing).map(([k, v]) => [
            k,
            typeof v === "boolean" ? v : String(v),
          ])
        )
      : defaults[kind]
  )
  const [error, setError] = useState("")
  const options = (items: string[]) =>
    items.map((v) => ({ value: v, label: v }))
  const motorOptions = data.motors.map((m) => ({
    value: m.id,
    label: `${m.code} · ${m.brand} ${m.model} · ${data.branches.find((b) => b.id === m.branchId)?.name}`,
  }))
  const fields: Record<EntityKind, Field[]> = {
    motors: [
      { key: "code", label: "Kode unit", required: true },
      {
        key: "plate",
        label: "Nomor polisi",
        hint: "Gunakan nomor contoh pada demo.",
      },
      { key: "brand", label: "Merek", required: true },
      { key: "model", label: "Model", required: true },
      {
        key: "type",
        label: "Jenis motor",
        options: options(["Matic", "Manual", "Sport"]),
      },
      {
        key: "transmission",
        label: "Transmisi",
        options: options(["Otomatis", "Manual"]),
      },
      { key: "year", label: "Tahun", type: "number" },
      { key: "cc", label: "Kapasitas mesin (cc)", type: "number" },
      {
        key: "branchId",
        label: "Cabang",
        required: true,
        options: data.branches
          .filter((b) => b.active)
          .map((b) => ({ value: b.id, label: b.name })),
      },
      { key: "price", label: "Tarif contoh / hari (Rp)", type: "number" },
      {
        key: "status",
        label: "Status operasional",
        options: options(["Siap disewakan", "Dalam perawatan", "Nonaktif"]),
        full: true,
      },
      {
        key: "photo",
        label: "Foto motor",
        type: "image",
        full: true,
        hint: "Gunakan foto motor yang sesuai model. Maksimal 3 MB.",
      },
      { key: "notes", label: "Catatan", type: "textarea", full: true },
    ],
    branches: [
      { key: "name", label: "Nama cabang", required: true },
      { key: "hours", label: "Jam operasional" },
      { key: "address", label: "Alamat", type: "textarea", full: true },
      {
        key: "whatsapp",
        label: "Nomor WhatsApp",
        hint: "Kosongkan untuk memakai nomor utama CMS.",
      },
      {
        key: "mapUrl",
        label: "Link peta",
        type: "url",
        hint: "Kosongkan sampai lokasi nyata tersedia.",
      },
      { key: "active", label: "Cabang aktif", type: "checkbox", full: true },
    ],
    customers: [
      { key: "name", label: "Nama pelanggan", required: true },
      { key: "phone", label: "Telepon / WhatsApp", type: "tel" },
      { key: "email", label: "Email (opsional)", type: "email" },
      { key: "address", label: "Alamat singkat (opsional)" },
      { key: "notes", label: "Catatan", type: "textarea", full: true },
    ],
    rentals: [
      { key: "code", label: "Kode sewa", required: true },
      {
        key: "customerId",
        label: "Pelanggan",
        required: true,
        options: data.customers.map((c) => ({ value: c.id, label: c.name })),
      },
      {
        key: "motorId",
        label: "Motor & cabang",
        required: true,
        options: motorOptions,
        full: true,
        hint: "Cabang mengikuti unit motor yang dipilih.",
      },
      {
        key: "start",
        label: "Mulai sewa",
        type: "datetime-local",
        required: true,
      },
      {
        key: "end",
        label: "Pengembalian",
        type: "datetime-local",
        required: true,
      },
      {
        key: "status",
        label: "Status sewa",
        options: options(["Dipesan", "Aktif", "Selesai", "Dibatalkan"]),
      },
      { key: "price", label: "Tarif contoh / hari (Rp)", type: "number" },
      { key: "notes", label: "Catatan", type: "textarea", full: true },
    ],
    maintenance: [
      {
        key: "motorId",
        label: "Motor",
        required: true,
        options: motorOptions,
        full: true,
        readOnly: !!existing,
      },
      {
        key: "issue",
        label: "Keluhan / jenis perawatan",
        required: true,
        full: true,
      },
      {
        key: "start",
        label: "Tanggal masuk",
        type: "datetime-local",
        required: true,
      },
      {
        key: "end",
        label: "Estimasi selesai",
        type: "datetime-local",
        required: true,
      },
      {
        key: "status",
        label: "Status perawatan",
        options: options(["Dalam proses", "Selesai"]),
        full: true,
      },
      { key: "notes", label: "Catatan", type: "textarea", full: true },
    ],
  }
  function submit(e: FormEvent) {
    e.preventDefault()
    const result = saveEntity(data, kind, values, id || crypto.randomUUID())
    if (typeof result === "string") {
      setError(result)
      return
    }
    update(() => result)
    notify(
      `${labels[kind][0].toUpperCase() + labels[kind].slice(1)} berhasil ${id ? "diperbarui" : "ditambahkan"}.`
    )
    onClose()
  }
  return (
    <Modal
      title={`${id ? "Edit" : "Tambah"} ${labels[kind]}`}
      subtitle="Perubahan data demo langsung digunakan pada prototype."
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <EditorFields
          fields={fields[kind]}
          values={values}
          setValues={(v) => {
            setValues(v)
            setError("")
          }}
        />
        {kind === "rentals" && (
          <p className="notice">
            {dateTime(String(values.start))} → {dateTime(String(values.end))}.
            Jadwal akan diperiksa agar tidak bertabrakan.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-primary">
            <IconDeviceFloppy size={18} /> Simpan {labels[kind]}
          </button>
        </div>
      </form>
    </Modal>
  )
}
