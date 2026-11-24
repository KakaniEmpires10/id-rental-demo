"use client"
import { useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconMapPin,
  IconAdjustmentsHorizontal,
  IconArrowRight,
  IconBrandWhatsapp,
  IconCheck,
  IconInfoCircle,
} from "@tabler/icons-react"
import Link from "next/link"
import { useRental } from "./rental-provider"
import { SearchForm } from "./search-form"
import {
  PublicHeader,
  PublicFooter,
  MotorCard,
  Modal,
  MessageActions,
  LoadingView,
  EmptyState,
  ContactModal,
} from "./rental-ui"
import {
  dateTime,
  days,
  isAvailable,
  rupiah,
  validPeriod,
  whatsappMessage,
  type Motor,
  type SearchFilters,
} from "@/lib/rental"
function BookingModal({
  motor,
  filters,
  onClose,
}: {
  motor: Motor
  filters: SearchFilters
  onClose: () => void
}) {
  const { data } = useRental()
  const branch = data.branches.find((b) => b.id === motor.branchId)!
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState("")
  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError("Masukkan nama pelanggan.")
      return
    }
    setError("")
    setPreview(true)
  }
  const stillAvailable = isAvailable(
    motor,
    data.rentals,
    filters.start,
    filters.end
  )
  return (
    <Modal
      title={
        preview ? "Pilihan Anda siap dikonfirmasi" : "Ajukan pemesanan motor"
      }
      subtitle="Konfirmasi ketersediaan dan biaya bersama admin ID Rental."
      onClose={onClose}
    >
      <div className="booking-summary">
        <div className="booking-title">
          <IconCheck size={19} />
          <strong>
            {motor.brand} {motor.model}
          </strong>
          <span>{motor.type}</span>
        </div>
        <dl>
          <div>
            <dt>Lokasi pengambilan</dt>
            <dd>{branch.name}</dd>
          </div>
          <div>
            <dt>Alamat</dt>
            <dd>{branch.address || "Dikonfirmasi admin"}</dd>
          </div>
          <div>
            <dt>Mulai sewa</dt>
            <dd>{dateTime(filters.start)}</dd>
          </div>
          <div>
            <dt>Pengembalian</dt>
            <dd>{dateTime(filters.end)}</dd>
          </div>
          <div>
            <dt>Durasi</dt>
            <dd>{days(filters.start, filters.end)} hari</dd>
          </div>
          {motor.price > 0 && (
            <>
              <div>
                <dt>Tarif contoh / hari</dt>
                <dd>{rupiah(motor.price)}</dd>
              </div>
              <div className="summary-total">
                <dt>Estimasi sewa dasar</dt>
                <dd>
                  {rupiah(motor.price * days(filters.start, filters.end))}
                </dd>
              </div>
            </>
          )}
        </dl>
        <p className="fine-print">
          Durasi dibulatkan ke atas per 24 jam. Tarif contoh; biaya final
          dikonfirmasi admin.
        </p>
      </div>
      {!stillAvailable && (
        <p className="form-error">
          Unit tidak lagi tersedia pada jadwal ini. Tutup dialog dan ubah
          pencarian.
        </p>
      )}
      {!preview ? (
        <form className="form-stack" onSubmit={submit}>
          <label>
            Nama pelanggan <span className="required">*</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama Anda"
              required
              maxLength={100}
            />
          </label>
          <label>
            Catatan kebutuhan <span className="optional">opsional</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Ada kebutuhan khusus untuk perjalanan Anda?"
            />
          </label>
          <p className="notice">
            Data dan persyaratan lengkap dapat dilengkapi saat datang ke lokasi.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary" disabled={!stillAvailable}>
            Lihat Pratinjau Pesan <IconArrowRight size={18} />
          </button>
        </form>
      ) : (
        <>
          <p className="notice">
            Atas nama <strong>{name}</strong>. Data dan persyaratan lengkap
            dapat dilengkapi saat datang ke lokasi.
          </p>
          <MessageActions
            message={whatsappMessage(name, notes, motor, branch, filters)}
            number={branch.whatsapp || data.cms.whatsapp}
            valid={stillAvailable}
          />
          <button className="text-button" onClick={() => setPreview(false)}>
            <IconArrowLeft size={16} /> Ubah nama atau catatan
          </button>
        </>
      )}
    </Modal>
  )
}
export function MotorResults() {
  const { data, ready } = useRental()
  const search = useSearchParams()
  const router = useRouter()
  const [selected, setSelected] = useState<Motor | null>(null)
  const [contact, setContact] = useState(false)
  const filters: SearchFilters = {
    branch: search.get("branch") || "",
    start: search.get("start") || "",
    end: search.get("end") || "",
    type: search.get("type") || "",
  }
  const branch = data.branches.find((b) => b.id === filters.branch && b.active)
  const valid =
    !!branch &&
    validPeriod(filters.start, filters.end) &&
    ["", "Matic", "Manual", "Sport"].includes(filters.type)
  const brand = search.get("brand") || ""
  const sort = search.get("sort") || "low"
  const minRaw = Number(search.get("min") || 0)
  const maxRaw = Number(search.get("max") || Infinity)
  const min = Number.isFinite(minRaw) && minRaw >= 0 ? minRaw : 0
  const max = maxRaw >= min ? maxRaw : Infinity
  const available = valid
    ? data.motors.filter(
        (m) =>
          m.branchId === filters.branch &&
          isAvailable(m, data.rentals, filters.start, filters.end)
      )
    : []
  const results = available
    .filter(
      (m) =>
        (!filters.type || m.type === filters.type) &&
        (!brand || m.brand === brand) &&
        m.price >= min &&
        m.price <= max
    )
    .sort((a, b) => (sort === "high" ? b.price - a.price : a.price - b.price))
  const queryChange = (key: string, value: string) => {
    const q = new URLSearchParams(search.toString())
    if (value) q.set(key, value)
    else q.delete(key)
    router.replace(`/motor?${q.toString()}`, { scroll: false })
  }
  function priceFilter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const q = new URLSearchParams(search.toString())
    ;["min", "max"].forEach((k) => {
      const v = String(f.get(k) || "")
      if (v) q.set(k, v)
      else q.delete(k)
    })
    router.replace(`/motor?${q.toString()}`, { scroll: false })
  }
  return (
    <>
      <PublicHeader />
      <main className="results-page">
        <div className="container">
          <Link href="/" className="back-link">
            <IconArrowLeft size={16} /> Kembali ke beranda
          </Link>
          <div className="results-heading">
            <span className="eyebrow">TEMUKAN TEMAN PERJALANAN ANDA</span>
            <h1>Pilihan motor untuk Anda.</h1>
            <p>Pilih yang sesuai, lalu konfirmasikan bersama admin.</p>
          </div>
          {!ready ? (
            <LoadingView />
          ) : (
            <>
              <SearchForm
                key={`${filters.branch}|${filters.start}|${filters.end}|${filters.type}`}
                initial={
                  valid
                    ? filters
                    : {
                        branch: branch?.id || "",
                        start: filters.start || data.demoStart,
                        end: filters.end || data.demoEnd,
                        type: ["Matic", "Manual", "Sport"].includes(
                          filters.type
                        )
                          ? filters.type
                          : "",
                      }
                }
                compact
              />
              {!valid ? (
                <EmptyState
                  title="Mulai dengan lokasi dan jadwal Anda."
                  description="Pilih cabang, tanggal mulai, dan pengembalian pada form di atas untuk melihat motor sesuai jadwal."
                />
              ) : (
                <>
                  <div className="search-summary">
                    <span>
                      <IconMapPin size={19} />
                      <strong>{branch.name}</strong>
                    </span>
                    <span>
                      <IconCalendarEvent size={18} />
                      {dateTime(filters.start)} <IconArrowRight size={15} />{" "}
                      {dateTime(filters.end)}
                    </span>
                    <span className="duration-pill">
                      {days(filters.start, filters.end)} hari
                    </span>
                  </div>
                  <div className="results-layout">
                    <aside className="result-filters">
                      <h2>
                        <IconAdjustmentsHorizontal size={19} /> Filter motor
                      </h2>
                      <label>
                        Jenis motor
                        <select
                          value={filters.type}
                          onChange={(e) => queryChange("type", e.target.value)}
                        >
                          <option value="">Semua jenis</option>
                          {["Matic", "Manual", "Sport"].map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Merek
                        <select
                          value={brand}
                          onChange={(e) => queryChange("brand", e.target.value)}
                        >
                          <option value="">Semua merek</option>
                          {Array.from(
                            new Set(data.motors.map((m) => m.brand))
                          ).map((b) => (
                            <option key={b}>{b}</option>
                          ))}
                        </select>
                      </label>
                      <form onSubmit={priceFilter} key={`${min}|${max}`}>
                        <span className="filter-label">
                          Tarif contoh per hari
                        </span>
                        <label>
                          <span className="sr-only">Harga minimum</span>
                          <input
                            type="number"
                            name="min"
                            min={0}
                            placeholder="Minimum (Rp)"
                            defaultValue={min || ""}
                          />
                        </label>
                        <label>
                          <span className="sr-only">Harga maksimum</span>
                          <input
                            type="number"
                            name="max"
                            min={min}
                            placeholder="Maksimum (Rp)"
                            defaultValue={Number.isFinite(max) ? max : ""}
                          />
                        </label>
                        <button className="btn btn-outline btn-small">
                          Terapkan Harga
                        </button>
                      </form>
                      <button
                        className="text-button"
                        onClick={() => {
                          const q = new URLSearchParams({
                            ...filters,
                            type: "",
                          })
                          router.replace(`/motor?${q}`)
                        }}
                      >
                        Reset filter tambahan
                      </button>
                      <p className="filter-note">
                        <IconInfoCircle size={17} />
                        Harga dan unit merupakan data simulasi untuk presentasi.
                      </p>
                    </aside>
                    <div className="results-content">
                      <div className="result-toolbar">
                        <span>
                          <strong>{results.length} motor</strong> sesuai
                          pencarian
                        </span>
                        <label>
                          <span>Urutkan</span>
                          <select
                            value={sort}
                            onChange={(e) =>
                              queryChange("sort", e.target.value)
                            }
                          >
                            <option value="low">Harga terendah</option>
                            <option value="high">Harga tertinggi</option>
                          </select>
                        </label>
                      </div>
                      {results.length ? (
                        <div className="motor-grid results-grid">
                          {results.map((m) => (
                            <MotorCard
                              key={m.id}
                              motor={m}
                              available
                              onBook={() => setSelected(m)}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          title="Belum ada motor yang sesuai dengan pencarian Anda."
                          description="Coba jadwal, jenis motor, atau cabang lain. Admin juga dapat membantu pilihan perjalanan Anda."
                        >
                          <a
                            className="btn btn-primary"
                            href="#pencarian"
                            onClick={() =>
                              document
                                .querySelector<HTMLInputElement>(
                                  'input[type="datetime-local"]'
                                )
                                ?.focus()
                            }
                          >
                            Ubah jadwal
                          </a>
                          <a
                            className="btn btn-outline"
                            href="#pencarian"
                            onClick={() =>
                              document
                                .querySelector<HTMLSelectElement>(
                                  'select[aria-label="Lokasi pengambilan"]'
                                )
                                ?.focus()
                            }
                          >
                            Pilih cabang lain
                          </a>
                          <button
                            className="text-button"
                            onClick={() => setContact(true)}
                          >
                            <IconBrandWhatsapp size={17} /> Hubungi admin
                          </button>
                        </EmptyState>
                      )}
                      <p className="simulation-note">
                        <IconInfoCircle size={17} />
                        Ketersediaan pada prototype bersifat simulasi. Pemesanan
                        final dikonfirmasi oleh admin.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      <PublicFooter />
      {selected && (
        <BookingModal
          motor={selected}
          filters={filters}
          onClose={() => setSelected(null)}
        />
      )}
      {contact && <ContactModal onClose={() => setContact(false)} />}
    </>
  )
}
