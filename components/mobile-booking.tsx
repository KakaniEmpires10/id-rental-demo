"use client"
import { useRef, useState, type ReactNode } from "react"
import {
  IconArrowLeft,
  IconArrowRight,
  IconBuildingStore,
  IconTruckDelivery,
  IconCheck,
} from "@tabler/icons-react"
import { useRental } from "./rental-provider"
import {
  AppField,
  DocumentField,
  SummaryRows,
  LocationCard,
  exampleDocument,
} from "./mobile-fields"
import {
  initialTenantForm,
  validateTenantStep,
  RENTAL_TERMS,
  PICKUP_OPTIONS,
} from "@/lib/tenant-form"
import {
  dateTime,
  days,
  rupiah,
  validPeriod,
  type TenantForm,
  type TenantSubmission,
} from "@/lib/rental"
import {
  type MobileVehicle,
  type MobileFilters,
  type MobileAccount,
  CAR_TERMS,
} from "@/lib/mobile-rental"

export function MobileBooking({
  vehicle,
  filters,
  account,
  onBack,
  onSaved,
  scrollTop,
}: {
  vehicle: MobileVehicle
  filters: MobileFilters
  account: MobileAccount | null
  onBack: () => void
  onSaved: (s: TenantSubmission) => void
  scrollTop: () => void
}) {
  const { data, submitTenantForm } = useRental()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<TenantForm>(() => ({
    ...initialTenantForm(data),
    ...account?.details,
    vehicleKind: vehicle.kind,
    formMode: "short",
    motorId: vehicle.id,
    branchId: vehicle.branchId,
    start: filters.start,
    end: filters.end,
    carTermsAccepted: vehicle.kind === "car",
    accountId: account?.id,
    deliveryAddress: "",
  }))
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const lock = useRef(false)
  const requestId = useRef("")
  const complete = form.formMode === "complete"
  const delivery = form.delivery !== "Ambil di lokasi"
  const setField = <K extends keyof TenantForm>(
    key: K,
    value: TenantForm[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }))
    setError("")
  }
  function advance() {
    const issue =
      step === 0
        ? validateTenantStep(form, 1, data)
        : validateTenantStep(form, 0, data) || validateTenantStep(form, 2, data)
    if (issue) {
      setError(issue)
      return
    }
    setStep((s) => s + 1)
    setError("")
    scrollTop()
  }
  function save() {
    if (lock.current) return
    lock.current = true
    setSaving(true)
    requestId.current ||= crypto.randomUUID()
    const result = submitTenantForm(
      { ...form, accountId: account?.id },
      requestId.current
    )
    if (typeof result === "string") {
      setError(result)
      lock.current = false
      setSaving(false)
      return
    }
    onSaved(result)
  }
  function sample() {
    setForm((f) => ({
      ...f,
      name: "Pelanggan Demo",
      phone: "081200000000",
      profession: "Karyawan",
      company: "Instansi Demo",
      ktpAddress: "Alamat KTP contoh",
      currentAddress: "Alamat tinggal contoh, Banda Aceh",
      purpose: "Kebutuhan operasional (demo)",
      deliveryAddress: "Alamat tujuan demo, Banda Aceh",
      ktp: complete ? exampleDocument("KTP") : null,
      sim: complete ? exampleDocument("SIM") : null,
      acceptedTerms: true,
    }))
    setError("")
  }
  const rows: [string, ReactNode][] = [
    ["Kendaraan", vehicle.name],
    ["Cabang", data.branches.find((b) => b.id === form.branchId)?.name],
    ["Mulai", dateTime(form.start)],
    ["Selesai", dateTime(form.end)],
    [
      "Durasi",
      validPeriod(form.start, form.end)
        ? `${days(form.start, form.end)} hari`
        : "—",
    ],
    ["Pengambilan", form.delivery],
    ["Alamat antar", delivery ? form.deliveryAddress : "—"],
  ]
  return (
    <div className="app-form-content">
      <button
        className="app-back"
        onClick={() => {
          if (step) {
            setStep(step - 1)
            setError("")
            scrollTop()
          } else onBack()
        }}
      >
        <IconArrowLeft size={16} />
        {step ? "Langkah sebelumnya" : "Detail kendaraan"}
      </button>
      <div className="app-form-heading">
        <span>PEMESANAN · {step + 1} DARI 3</span>
        <h2>
          {["Cara pengambilan", "Data pemesan", "Periksa permintaan"][step]}
        </h2>
        <p>
          {
            [
              "Ambil langsung atau ajukan layanan antar. Jadwal dan biaya final dikonfirmasi admin.",
              complete
                ? "Lengkapi data untuk membantu admin menyiapkan pengantaran."
                : "Cukup nama dan kontak. Data lengkap dapat diisi saat datang ke lokasi.",
              "Permintaan akan masuk ke admin. Lanjutkan konfirmasi melalui WhatsApp.",
            ][step]
          }
        </p>
      </div>
      <div className="app-progress">
        {[0, 1, 2].map((n) => (
          <span key={n} className={n <= step ? "done" : ""} />
        ))}
      </div>
      <div className="app-form-fields">
        {step === 0 && (
          <>
            <div className="app-methods">
              <button
                className={!delivery ? "selected" : ""}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    delivery: "Ambil di lokasi",
                    formMode: "short",
                  }))
                }
              >
                <IconBuildingStore size={23} />
                <strong>Ambil sendiri</strong>
                <small>Datang ke lokasi rental</small>
              </button>
              <button
                className={delivery ? "selected" : ""}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    delivery: PICKUP_OPTIONS[1].value,
                    formMode: "complete",
                  }))
                }
              >
                <IconTruckDelivery size={23} />
                <strong>Diantarkan</strong>
                <small>Lengkapi formulir & alamat</small>
              </button>
            </div>
            {!delivery ? (
              <>
                <LocationCard data={data} branchId={form.branchId} />
                <label className="app-consent">
                  <input
                    type="checkbox"
                    checked={complete}
                    onChange={(e) =>
                      setField(
                        "formMode",
                        e.target.checked ? "complete" : "short"
                      )
                    }
                  />
                  <span>
                    Isi formulir lengkap sekarang{" "}
                    <small>
                      Opsional. Anda juga dapat melengkapinya saat datang.
                    </small>
                  </span>
                </label>
              </>
            ) : (
              <>
                <AppField label="Area layanan antar" required>
                  <select
                    value={form.delivery}
                    onChange={(e) => setField("delivery", e.target.value)}
                  >
                    {PICKUP_OPTIONS.slice(1).map((o) => (
                      <option key={o.value}>{o.value}</option>
                    ))}
                  </select>
                </AppField>
                <AppField label="Alamat tujuan pengantaran" required>
                  <textarea
                    rows={3}
                    value={form.deliveryAddress}
                    onChange={(e) =>
                      setField("deliveryAddress", e.target.value)
                    }
                    placeholder="Alamat dan patokan lokasi"
                    maxLength={600}
                  />
                </AppField>
                <p className="app-hint">
                  {vehicle.kind === "motor"
                    ? `Tarif antar contoh sesuai informasi ID Rental: ${rupiah(PICKUP_OPTIONS.find((o) => o.value === form.delivery)?.fee || 0)}. `
                    : "Tarif dan jangkauan antar mobil dibahas dengan admin. "}
                  Pengantaran dilakukan setelah admin mengonfirmasi permintaan.
                </p>
              </>
            )}
            <AppField label="Tanggal & jam mulai" required>
              <input
                type="datetime-local"
                value={form.start}
                onChange={(e) => setField("start", e.target.value)}
                required
              />
            </AppField>
            <AppField label="Tanggal & jam selesai" required>
              <input
                type="datetime-local"
                value={form.end}
                onChange={(e) => setField("end", e.target.value)}
                required
              />
            </AppField>
            {validPeriod(form.start, form.end) && (
              <p className="app-duration">
                {days(form.start, form.end)} hari · pembulatan per 24 jam
              </p>
            )}
            <AppField
              label="Tujuan / keperluan sewa"
              required={complete || vehicle.kind === "car"}
            >
              <textarea
                rows={2}
                value={form.purpose}
                onChange={(e) => setField("purpose", e.target.value)}
                placeholder="Contoh: kebutuhan operasional"
                maxLength={500}
              />
            </AppField>
            {vehicle.kind === "motor" && (
              <AppField label="Jumlah helm">
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={form.helmets}
                  onChange={(e) => setField("helmets", Number(e.target.value))}
                />
              </AppField>
            )}
          </>
        )}
        {step === 1 && (
          <>
            <button className="app-sample" onClick={sample}>
              Gunakan data demo <IconArrowRight size={15} />
            </button>
            {account && (
              <div className="app-info-banner">
                <IconCheck size={16} />
                Data diisi dari profil Anda. Silakan periksa kembali.
              </div>
            )}
            <AppField
              label={
                vehicle.kind === "car"
                  ? "Nama penanggung jawab"
                  : "Nama lengkap"
              }
              required
            >
              <input
                autoComplete="name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                maxLength={100}
              />
            </AppField>
            <AppField label="No. HP / WhatsApp utama" required>
              <input
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="08…"
                maxLength={25}
              />
            </AppField>
            {(complete || vehicle.kind === "car") && (
              <AppField label="Nama instansi" required={vehicle.kind === "car"}>
                <input
                  value={form.company}
                  onChange={(e) => setField("company", e.target.value)}
                  maxLength={150}
                />
              </AppField>
            )}
            {complete && (
              <>
                <AppField label="No. HP / WhatsApp kedua">
                  <input
                    type="tel"
                    value={form.phone2}
                    onChange={(e) => setField("phone2", e.target.value)}
                    maxLength={25}
                  />
                </AppField>
                <AppField label="Pekerjaan" required>
                  <input
                    value={form.profession}
                    onChange={(e) => setField("profession", e.target.value)}
                    maxLength={100}
                  />
                </AppField>
                <AppField label="Alamat KTP" required>
                  <textarea
                    rows={2}
                    value={form.ktpAddress}
                    onChange={(e) => setField("ktpAddress", e.target.value)}
                    maxLength={500}
                  />
                </AppField>
                <AppField label="Alamat sekarang" required>
                  <textarea
                    rows={2}
                    value={form.currentAddress}
                    onChange={(e) => setField("currentAddress", e.target.value)}
                    maxLength={500}
                  />
                </AppField>
                <details className="app-extra">
                  <summary>
                    Media sosial & penjamin <span>opsional</span>
                  </summary>
                  <div>
                    {(
                      [
                        ["facebook", "Facebook"],
                        ["instagram", "Instagram"],
                        ["tiktok", "TikTok"],
                        ["guarantor", "Nama penjamin"],
                        ["guarantorPhone", "HP penjamin"],
                        ["guarantorRelationship", "Hubungan penjamin"],
                      ] as const
                    ).map(([key, label]) => (
                      <AppField key={key} label={label}>
                        <input
                          value={form[key]}
                          onChange={(e) => setField(key, e.target.value)}
                          maxLength={300}
                        />
                      </AppField>
                    ))}
                  </div>
                </details>
                <DocumentField
                  label="KTP"
                  value={form.ktp}
                  onChange={(v) => setField("ktp", v)}
                />
                <DocumentField
                  label="SIM"
                  value={form.sim}
                  onChange={(v) => setField("sim", v)}
                />
                <p className="app-hint">
                  Lampiran diterima admin melalui dashboard. Foto tetap perlu
                  dilampirkan terpisah di WhatsApp.
                </p>
              </>
            )}
            <details className="app-terms">
              <summary>Ketentuan & konfirmasi admin</summary>
              <ul>
                {(vehicle.kind === "car"
                  ? CAR_TERMS.map(([, text]) => text)
                  : RENTAL_TERMS
                ).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </details>
            <label className="app-consent">
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={(e) => setField("acceptedTerms", e.target.checked)}
              />
              <span>
                Saya menyetujui pengiriman data ini kepada admin dan memahami
                pemesanan perlu dikonfirmasi.
              </span>
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <div className="app-review-card">
              <h3>Ringkasan kendaraan</h3>
              <SummaryRows rows={rows} />
              {vehicle.price > 0 && (
                <div className="app-estimate">
                  <span>Estimasi sewa dasar · tarif demo</span>
                  <strong>
                    {rupiah(vehicle.price * days(form.start, form.end))}
                  </strong>
                  <p>
                    Belum termasuk antar/jemput dan biaya lain. Biaya final
                    dikonfirmasi admin.
                  </p>
                </div>
              )}
            </div>
            <div className="app-review-card">
              <h3>Data pemesan</h3>
              <SummaryRows
                rows={[
                  ["Nama", form.name],
                  ["WhatsApp", form.phone],
                  ["Instansi", form.company],
                  [
                    "Formulir",
                    complete ? "Lengkap" : "Singkat · ambil sendiri",
                  ],
                  [
                    "Lampiran",
                    complete
                      ? `${form.ktp?.name}, ${form.sim?.name}`
                      : "Dilengkapi di lokasi",
                  ],
                ]}
              />
            </div>
            {!delivery && <LocationCard data={data} branchId={form.branchId} />}
            <div className="app-info-banner">
              {vehicle.kind === "car"
                ? "Pengajuan mobil diteruskan sebagai konsultasi instansi."
                : "Admin akan menerima pemberitahuan pemesanan Anda."}{" "}
              Jadwal belum terblokir sampai admin membuat reservasi.
            </div>
          </>
        )}
        {error && (
          <p className="app-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="app-btn primary"
          disabled={saving}
          onClick={step < 2 ? advance : save}
        >
          {saving
            ? "Menyimpan…"
            : step < 2
              ? "Lanjutkan"
              : "Simpan & Lanjutkan"}
          <IconArrowRight size={17} />
        </button>
      </div>
    </div>
  )
}
