"use client"
import Image from "next/image"
import Link from "next/link"
import { useRef, useState, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconBrandAndroid,
  IconBrandApple,
  IconBrandWhatsapp,
  IconDeviceMobile,
  IconWifi,
  IconBattery3,
  IconHome,
  IconUser,
  IconSearch,
  IconCheck,
  IconChevronRight,
  IconMapPin,
  IconAdjustmentsHorizontal,
  IconMotorbike,
  IconCar,
  IconBuilding,
  IconRoute,
  IconCalendar,
  IconShieldCheck,
} from "@tabler/icons-react"
import { useRental } from "./rental-provider"
import { PublicHeader, PublicFooter, LoadingView } from "./rental-ui"
import { AppField, SummaryRows, LocationCard } from "./mobile-fields"
import { MobileBooking } from "./mobile-booking"
import { MobileProfile, useMobileAccount } from "./mobile-profile"
import {
  dateTime,
  days,
  validPeriod,
  isAvailable,
  normalizeWhatsapp,
  rupiah,
  type DemoData,
  type TenantSubmission,
} from "@/lib/rental"
import {
  initialMobileFilters,
  mobileVehicles,
  filterMobileVehicles,
  CAR_TERMS,
  type MobileVehicle,
  type MobileFilters,
} from "@/lib/mobile-rental"

function SearchPanel({
  data,
  initial,
  advanced = false,
  onSearch,
}: {
  data: DemoData
  initial: MobileFilters
  advanced?: boolean
  onSearch: (filters: MobileFilters) => void
}) {
  const [filters, setFilters] = useState(initial)
  const [error, setError] = useState("")
  const set = (key: keyof MobileFilters, value: string) => {
    setFilters((f) => ({
      ...f,
      [key]: value,
      ...(key === "kind" ? { type: "", brand: "" } : {}),
    }))
    setError("")
  }
  const brands = [
    ...new Set(
      mobileVehicles(data)
        .filter((v) => filters.kind === "all" || v.kind === filters.kind)
        .map((v) => v.brand)
    ),
  ]
  return (
    <form
      className={`app-search-panel ${advanced ? "advanced" : ""}`}
      onSubmit={(e) => {
        e.preventDefault()
        if (!data.branches.some((b) => b.id === filters.branch && b.active)) {
          setError("Pilih cabang pengambilan.")
          return
        }
        if (!validPeriod(filters.start, filters.end)) {
          setError("Tanggal pengembalian harus sesudah mulai sewa.")
          return
        }
        onSearch(filters)
      }}
    >
      <div className="app-category-switch">
        {(
          [
            ["motor", "Motor", IconMotorbike],
            ["car", "Mobil", IconCar],
            ...(advanced ? [["all", "Semua", IconSearch]] : []),
          ] as [string, string, typeof IconCar][]
        )
          .filter(([value]) => value !== "car" || data.cms.carEnabled)
          .map(([value, label, Icon]) => (
            <button
              type="button"
              key={value}
              className={filters.kind === value ? "active" : ""}
              onClick={() => set("kind", value)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
      </div>
      <AppField label="Cabang pengambilan" required>
        <select
          value={filters.branch}
          onChange={(e) => set("branch", e.target.value)}
          required
        >
          <option value="">Pilih cabang</option>
          {data.branches
            .filter((b) => b.active)
            .map((b) => (
              <option value={b.id} key={b.id}>
                {b.name}
              </option>
            ))}
        </select>
      </AppField>
      <div className="app-search-dates">
        <AppField label="Mulai sewa" required>
          <input
            type="datetime-local"
            value={filters.start}
            onChange={(e) => set("start", e.target.value)}
            required
          />
        </AppField>
        <AppField label="Pengembalian" required>
          <input
            type="datetime-local"
            value={filters.end}
            onChange={(e) => set("end", e.target.value)}
            required
          />
        </AppField>
      </div>
      {advanced && (
        <>
          <div className="app-filter-grid">
            <AppField label="Jenis kendaraan">
              <select
                value={filters.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="">Semua jenis</option>
                {(filters.kind === "car"
                  ? ["MPV"]
                  : filters.kind === "all"
                    ? ["Matic", "Manual", "Sport", "MPV"]
                    : ["Matic", "Manual", "Sport"]
                ).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </AppField>
            <AppField label="Merek">
              <select
                value={filters.brand}
                onChange={(e) => set("brand", e.target.value)}
              >
                <option value="">Semua merek</option>
                {brands.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </AppField>
            <AppField label="Batas tarif harian">
              <select
                value={filters.maxPrice}
                onChange={(e) => set("maxPrice", e.target.value)}
              >
                <option value="">Semua tarif</option>
                <option value="100000">Hingga Rp100.000</option>
                <option value="150000">Hingga Rp150.000</option>
                <option value="200000">Hingga Rp200.000</option>
              </select>
            </AppField>
            <AppField label="Urutkan">
              <select
                value={filters.sort}
                onChange={(e) => set("sort", e.target.value)}
              >
                <option value="recommended">Pilihan awal</option>
                <option value="low">Harga terendah</option>
                <option value="high">Harga tertinggi</option>
              </select>
            </AppField>
          </div>
          <p className="app-hint">
            Tarif mobil dikonfirmasi admin sehingga tidak dibandingkan dengan
            tarif harian motor.
          </p>
        </>
      )}
      {filters.kind === "car" && (
        <p className="app-hint">
          Mobil untuk kebutuhan instansi. Persyaratan ditampilkan sebelum detail
          kendaraan.
        </p>
      )}
      {error && (
        <p className="app-error" role="alert">
          {error}
        </p>
      )}
      <button className="app-btn yellow" type="submit">
        <IconSearch size={17} />
        {advanced ? "Terapkan Filter" : "Cari Kendaraan"}
        <IconArrowRight size={16} />
      </button>
    </form>
  )
}
function VehicleCard({
  vehicle,
  data,
  onSelect,
  preview = false,
}: {
  vehicle: MobileVehicle
  data: DemoData
  onSelect: () => void
  preview?: boolean
}) {
  return (
    <button
      className="app-vehicle-card"
      onClick={onSelect}
      aria-label={`Lihat detail ${vehicle.name}`}
    >
      <div className="app-vehicle-image">
        <span>{vehicle.kind === "motor" ? "MOTOR" : "INSTANSI"}</span>
        <Image
          src={vehicle.photo}
          alt={vehicle.name}
          width={180}
          height={130}
          unoptimized
        />
      </div>
      <div className="app-vehicle-body">
        <h3>{vehicle.name}</h3>
        <p>
          {vehicle.category} · {vehicle.transmission}
        </p>
        <small>
          <IconMapPin size={11} />
          {data.branches.find((b) => b.id === vehicle.branchId)?.name}
        </small>
        <div className="app-vehicle-price">
          <span>
            {vehicle.price > 0 ? (
              <>
                <strong>{rupiah(vehicle.price)}</strong>
                <small>/ hari · demo</small>
              </>
            ) : (
              <strong>Konsultasi admin</strong>
            )}
          </span>
          <span className="app-card-arrow">
            <IconArrowUpRight size={16} />
          </span>
        </div>
        <span className="app-availability">
          {vehicle.kind === "car"
            ? "Ketersediaan dikonfirmasi admin"
            : preview
              ? "Unit & harga contoh"
              : "Tersedia · simulasi jadwal"}
        </span>
      </div>
    </button>
  )
}
export function MobileSimulator() {
  const { data, ready, notify } = useRental()
  const session = useMobileAccount()
  const router = useRouter()
  const search = useSearchParams()
  const [device, setDevice] = useState("android")
  const viewport = useRef<HTMLDivElement>(null)
  const [copyError, setCopyError] = useState("")
  const filters = {
    ...initialMobileFilters(data),
    ...Object.fromEntries(
      Object.keys(initialMobileFilters(data))
        .filter((key) => search.has(key))
        .map((key) => [key, search.get(key)!])
    ),
  } as MobileFilters
  const vehicles = mobileVehicles(data)
  const selected = vehicles.find((v) => v.id === search.get("vehicle"))
  const submitted = data.submissions.find(
    (s) => s.id === search.get("submitted")
  )
  const view = submitted ? "feedback" : search.get("view") || "home"
  const results = filterMobileVehicles(data, filters)
  function scrollTop() {
    viewport.current?.scrollTo({ top: 0, behavior: "instant" })
  }
  function go(
    next: string,
    extra: Record<string, string> = {},
    replace = false
  ) {
    const params = new URLSearchParams({ ...filters, view: next, ...extra })
    if (
      ["detail", "booking"].includes(next) &&
      selected?.kind === "car" &&
      search.get("carAccepted") === selected.id &&
      (!extra.vehicle || extra.vehicle === selected.id)
    )
      params.set("carAccepted", selected.id)
    if (next === "home" || next === "profile") {
      params.delete("vehicle")
      params.delete("submitted")
    }
    const url = `/mobile?${params}`
    if (replace) router.replace(url, { scroll: false })
    else router.push(url, { scroll: false })
    setCopyError("")
    scrollTop()
  }
  function choose(v: MobileVehicle) {
    go(v.kind === "car" ? "car-terms" : "detail", {
      vehicle: v.id,
      branch: v.branchId,
      kind: v.kind,
    })
  }
  function searched(next: MobileFilters) {
    go("list", { ...next })
  }
  function saved(s: TenantSubmission) {
    if (session.account) {
      const issue = session.updateDetails(s)
      if (issue) notify(issue)
    }
    notify(`${s.code} diterima dashboard admin.`)
    go("feedback", { submitted: s.id }, true)
  }
  const number = normalizeWhatsapp(
    (submitted &&
      data.branches.find((b) => b.id === submitted.branchId)?.whatsapp) ||
      data.cms.whatsapp
  )
  const available =
    selected?.kind === "car" ||
    !!(
      selected &&
      data.motors.some(
        (m) =>
          m.id === selected.id &&
          isAvailable(m, data.rentals, filters.start, filters.end)
      )
    )
  async function copy(s: TenantSubmission) {
    try {
      await navigator.clipboard.writeText(s.message)
      notify("Pesan WhatsApp disalin.")
    } catch {
      setCopyError(
        "Salin otomatis belum tersedia. Salin teks dari pratinjau pesan."
      )
    }
  }
  const selectedRows: [string, ReactNode][] = selected
    ? [
        ["Cabang", data.branches.find((b) => b.id === selected.branchId)?.name],
        ["Jenis", selected.category],
        ["Transmisi", selected.transmission],
        ["Spesifikasi", selected.specification],
        ["Mulai", dateTime(filters.start)],
        ["Selesai", dateTime(filters.end)],
      ]
    : []
  const activeTab = [
    "detail",
    "car-terms",
    "booking",
    "list",
    "feedback",
  ].includes(view)
    ? "list"
    : view
  return (
    <>
      <PublicHeader />
      <main className="simulator-page">
        <div className="simulator-layout container">
          <section className="simulator-intro">
            <span className="eyebrow">
              <IconDeviceMobile size={17} />
              PREVIEW APLIKASI MOBILE
            </span>
            <h1>
              Perjalanan Anda. <br />
              Pilihan Anda. <br />
              <span>Lebih mudah.</span>
            </h1>
            <p>
              Jelajahi kendaraan, tentukan jadwal, dan pilih cara pengambilan.
              Satu alur dari aplikasi ke admin ID Rental.
            </p>
            <div className="simulator-flow">
              {[
                [
                  "01",
                  "Cari & pilih kendaraan",
                  "Pencarian langsung dari beranda, detail sebelum memesan.",
                ],
                [
                  "02",
                  "Tentukan pengambilan",
                  "Ambil sendiri dengan data singkat atau isi lengkap untuk diantar.",
                ],
                [
                  "03",
                  "Konfirmasi bersama admin",
                  "Permintaan tersimpan dan siap diteruskan melalui WhatsApp.",
                ],
              ].map(([n, t, p]) => (
                <div key={n}>
                  <span>{n}</span>
                  <div>
                    <strong>{t}</strong>
                    <p>{p}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link className="btn btn-outline" href="/admin?tab=submissions">
              Lihat Permintaan di Dashboard <IconArrowUpRight size={17} />
            </Link>
            <p className="simulator-demo-note">
              Prototype interaktif. Data kendaraan, akun, dan riwayat merupakan
              simulasi untuk presentasi.
            </p>
          </section>
          <section className="simulator-device-area">
            <div
              className="device-switch"
              aria-label="Pilih tampilan perangkat"
            >
              <button
                className={device === "android" ? "active" : ""}
                onClick={() => setDevice("android")}
                aria-pressed={device === "android"}
              >
                <IconBrandAndroid size={17} />
                Android
              </button>
              <button
                className={device === "iphone" ? "active" : ""}
                onClick={() => setDevice("iphone")}
                aria-pressed={device === "iphone"}
              >
                <IconBrandApple size={17} />
                iPhone
              </button>
            </div>
            <div className={`phone-frame ${device}`}>
              <div className="phone-screen">
                <div className="device-statusbar">
                  <span>9:41</span>
                  <span className="device-camera" />
                  <div>
                    <IconWifi size={15} />
                    <IconBattery3 size={19} />
                  </div>
                </div>
                <div className="app-topbar">
                  <div className="app-logo">
                    <Image
                      src={data.cms.logo || "/images/id-rental-logo.jpg"}
                      width={35}
                      height={35}
                      alt="Logo ID Rental"
                      unoptimized
                    />
                  </div>
                  <div>
                    <strong>ID Rental</strong>
                    <span>Teman perjalanan Anda</span>
                  </div>
                  <span className="app-demo-badge">DEMO</span>
                </div>
                <div className="app-viewport" ref={viewport}>
                  {!ready ? (
                    <LoadingView />
                  ) : (
                    <>
                      {view === "home" && (
                        <div className="app-home">
                          <div className="app-rental-hero">
                            <div>
                              <span>JELAJAHI ACEH BERSAMA ID RENTAL</span>
                              <h2>
                                Sewa mudah.
                                <br />
                                Jalan leluasa.
                              </h2>
                              <p>
                                Temukan kendaraan untuk rencana perjalanan Anda.
                              </p>
                            </div>
                            <Image
                              src="/images/fazzio.png"
                              alt="Motor Yamaha Fazzio ilustrasi"
                              width={170}
                              height={150}
                              unoptimized
                            />
                          </div>
                          <div className="app-hero-search">
                            <SearchPanel
                              key={`home-${data.demoStart}-${search.toString()}`}
                              data={data}
                              initial={filters}
                              onSearch={searched}
                            />
                          </div>
                          <div className="app-home-content">
                            <div className="app-heading">
                              <div>
                                <h3>Pilihan motor</h3>
                                <p>Temukan teman perjalanan Anda.</p>
                              </div>
                              <button
                                onClick={() => go("list", { kind: "motor" })}
                              >
                                Lihat semua <IconChevronRight size={13} />
                              </button>
                            </div>
                            <div className="app-vehicle-grid">
                              {vehicles
                                .filter((v) => v.kind === "motor")
                                .slice(0, 4)
                                .map((v) => (
                                  <VehicleCard
                                    key={v.id}
                                    vehicle={v}
                                    data={data}
                                    onSelect={() => choose(v)}
                                    preview
                                  />
                                ))}
                            </div>
                            {data.cms.carEnabled && (
                              <>
                                <div className="app-heading section-gap">
                                  <div>
                                    <h3>Mobil untuk instansi</h3>
                                    <p>
                                      Kebutuhan operasional, konsultasikan dulu.
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      go("list", {
                                        kind: "car",
                                        type: "",
                                        brand: "",
                                      })
                                    }
                                  >
                                    Jelajahi <IconChevronRight size={13} />
                                  </button>
                                </div>
                                <div className="app-vehicle-grid">
                                  {vehicles
                                    .filter((v) => v.kind === "car")
                                    .map((v) => (
                                      <VehicleCard
                                        key={v.id}
                                        vehicle={v}
                                        data={data}
                                        onSelect={() => choose(v)}
                                        preview
                                      />
                                    ))}
                                </div>
                              </>
                            )}
                            <div className="app-travel-banner">
                              <IconRoute size={30} />
                              <div>
                                <h3>Ambil sendiri atau diantar?</h3>
                                <p>
                                  Pilih cara yang sesuai perjalanan Anda. Admin
                                  membantu mengatur detailnya.
                                </p>
                              </div>
                            </div>
                            <div className="app-heading">
                              <h3>Sewa dalam 3 langkah</h3>
                            </div>
                            <div className="app-home-steps">
                              {[
                                [
                                  IconSearch,
                                  "Pilih kendaraan",
                                  "Cari lokasi dan jadwal.",
                                ],
                                [
                                  IconCalendar,
                                  "Atur pengambilan",
                                  "Datang langsung atau diantar.",
                                ],
                                [
                                  IconBrandWhatsapp,
                                  "Konfirmasi admin",
                                  "Kirim permintaan lewat WhatsApp.",
                                ],
                              ].map(([Icon, t, p]) => {
                                const I = Icon as typeof IconSearch
                                return (
                                  <div key={String(t)}>
                                    <I size={20} />
                                    <strong>{String(t)}</strong>
                                    <small>{String(p)}</small>
                                  </div>
                                )
                              })}
                            </div>
                            <div className="app-help-card">
                              <IconShieldCheck size={23} />
                              <div>
                                <strong>Butuh bantuan memilih?</strong>
                                <p>
                                  Lihat FAQ dan kontak admin di halaman profil.
                                </p>
                                <button onClick={() => go("profile")}>
                                  Pusat bantuan <IconArrowRight size={14} />
                                </button>
                              </div>
                            </div>
                            <p className="app-hint">
                              Armada dan harga adalah data demo. Ketersediaan
                              serta pemesanan final dikonfirmasi admin.
                            </p>
                          </div>
                        </div>
                      )}
                      {view === "list" && (
                        <div className="app-home-content app-explore">
                          <div className="app-page-title">
                            <span>RENCANAKAN PERJALANAN ANDA</span>
                            <h2>Jelajahi kendaraan</h2>
                            <p>Cari pilihan yang sesuai lokasi dan jadwal.</p>
                          </div>
                          <details className="app-advanced-filters" open>
                            <summary>
                              <IconAdjustmentsHorizontal size={18} />
                              Pencarian & filter lanjutan
                              <IconChevronRight size={16} />
                            </summary>
                            <SearchPanel
                              key={`list-${search.toString()}-${data.demoStart}`}
                              data={data}
                              initial={filters}
                              advanced
                              onSearch={searched}
                            />
                          </details>
                          <div className="app-result-summary">
                            <strong>{results.length} kendaraan</strong>
                            <span>
                              {
                                data.branches.find(
                                  (b) => b.id === filters.branch
                                )?.name
                              }
                            </span>
                            <small>
                              {dateTime(filters.start)} —{" "}
                              {dateTime(filters.end)}
                            </small>
                          </div>
                          {results.length ? (
                            <div className="app-vehicle-grid">
                              {results.map((v) => (
                                <VehicleCard
                                  key={v.id}
                                  vehicle={v}
                                  data={data}
                                  onSelect={() => choose(v)}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="app-empty">
                              <IconSearch size={34} />
                              <h3>Belum ada kendaraan yang sesuai.</h3>
                              <p>
                                Ubah jadwal, jenis, atau cabang untuk melihat
                                pilihan lainnya.
                              </p>
                              <button
                                className="app-btn secondary"
                                onClick={() => {
                                  go("list", {
                                    ...initialMobileFilters(data),
                                    kind: "all",
                                  })
                                  scrollTop()
                                }}
                              >
                                Reset Filter
                              </button>
                            </div>
                          )}
                          <p className="app-hint section-gap">
                            Ketersediaan motor mengikuti inventori dan jadwal
                            simulasi. Mobil diteruskan sebagai konsultasi
                            instansi.
                          </p>
                        </div>
                      )}
                      {view === "car-terms" && selected && (
                        <div className="app-form-content">
                          <button
                            className="app-back"
                            onClick={() => go("list", { kind: "car" })}
                          >
                            <IconArrowLeft size={16} />
                            Pilihan mobil
                          </button>
                          <div className="app-terms-hero">
                            <span>
                              <IconBuilding size={30} />
                            </span>
                            <small>SEBELUM MELANJUTKAN</small>
                            <h2>
                              Mobil untuk
                              <br />
                              kebutuhan instansi.
                            </h2>
                            <p>
                              Mari pastikan layanan ini sesuai dengan kebutuhan
                              Anda.
                            </p>
                          </div>
                          <div className="app-car-requirements">
                            {CAR_TERMS.map(([title, text], i) => (
                              <div key={title}>
                                <span>0{i + 1}</span>
                                <div>
                                  <h3>{title}</h3>
                                  <p>{text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="app-info-banner">
                            Persyaratan di atas merupakan rancangan alur demo.
                            Ketentuan final ditetapkan bersama ID Rental.
                          </p>
                          <button
                            className="app-btn primary"
                            onClick={() =>
                              go("detail", {
                                vehicle: selected.id,
                                carAccepted: selected.id,
                              })
                            }
                          >
                            Saya Paham, Lihat Mobil <IconArrowRight size={17} />
                          </button>
                        </div>
                      )}
                      {view === "detail" && selected && (
                        <div className="app-detail">
                          <div className="app-detail-photo">
                            <button
                              className="app-detail-back"
                              aria-label="Kembali ke daftar kendaraan"
                              onClick={() => go("list")}
                            >
                              <IconArrowLeft size={18} />
                            </button>
                            <span className="app-detail-type">
                              {selected.kind === "car"
                                ? "MOBIL INSTANSI"
                                : "MOTOR RENTAL"}
                            </span>
                            <Image
                              src={selected.photo}
                              alt={selected.name}
                              width={360}
                              height={240}
                              unoptimized
                            />
                          </div>
                          <div className="app-home-content">
                            <div className="app-detail-heading">
                              <h2>{selected.name}</h2>
                              <p>
                                {selected.category} · {selected.transmission}
                              </p>
                            </div>
                            <div className="app-spec-grid">
                              <span>
                                {selected.kind === "car" ? (
                                  <IconCar size={20} />
                                ) : (
                                  <IconMotorbike size={20} />
                                )}
                                <strong>{selected.specification}</strong>
                              </span>
                              <span>
                                <IconMapPin size={20} />
                                <strong>
                                  {
                                    data.branches.find(
                                      (b) => b.id === selected.branchId
                                    )?.name
                                  }
                                </strong>
                              </span>
                            </div>
                            <p className="app-description">
                              {selected.description}
                            </p>
                            <div className="app-review-card">
                              <h3>Rencana sewa Anda</h3>
                              <SummaryRows rows={selectedRows} />
                              <p
                                className={`app-detail-status ${available ? "" : "warning"}`}
                              >
                                {selected.kind === "car"
                                  ? "Ketersediaan & biaya dikonfirmasi admin"
                                  : available
                                    ? "Tersedia sesuai jadwal · simulasi"
                                    : "Unit tidak tersedia pada jadwal ini"}
                              </p>
                              <button
                                className="app-edit"
                                onClick={() => go("list")}
                              >
                                Ubah jadwal atau filter{" "}
                                <IconArrowRight size={14} />
                              </button>
                            </div>
                            <div className="app-heading section-gap">
                              <h3>Lokasi pengambilan</h3>
                            </div>
                            <LocationCard
                              data={data}
                              branchId={selected.branchId}
                            />
                            <p className="app-hint">
                              Anda dapat memilih layanan antar pada langkah
                              pemesanan. Alamat tujuan diisi terpisah.
                            </p>
                            <div className="app-detail-order">
                              <div>
                                <small>
                                  {selected.price > 0
                                    ? "Tarif harian contoh"
                                    : "Layanan instansi"}
                                </small>
                                <strong>
                                  {selected.price > 0
                                    ? rupiah(selected.price)
                                    : "Konsultasi admin"}
                                </strong>
                              </div>
                              <button
                                className="app-btn primary"
                                disabled={!available}
                                onClick={() => {
                                  if (
                                    selected.kind === "car" &&
                                    search.get("carAccepted") !== selected.id
                                  ) {
                                    go("car-terms", { vehicle: selected.id })
                                    return
                                  }
                                  go("booking", { vehicle: selected.id })
                                }}
                              >
                                {selected.kind === "car"
                                  ? "Ajukan Sewa Mobil"
                                  : "Pesan Motor"}
                                <IconArrowRight size={17} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {view === "booking" &&
                        selected &&
                        (selected.kind !== "car" ||
                          search.get("carAccepted") === selected.id) && (
                          <MobileBooking
                            key={`${selected.id}-${session.account?.id || "guest"}`}
                            vehicle={selected}
                            filters={filters}
                            account={session.account}
                            onBack={() =>
                              go("detail", { vehicle: selected.id })
                            }
                            onSaved={saved}
                            scrollTop={scrollTop}
                          />
                        )}
                      {view === "booking" &&
                        selected?.kind === "car" &&
                        search.get("carAccepted") !== selected.id && (
                          <div className="app-form-content">
                            <div className="app-page-title">
                              <h2>Pahami persyaratan dulu</h2>
                              <p>Layanan mobil diajukan melalui instansi.</p>
                            </div>
                            <button
                              className="app-btn primary"
                              onClick={() =>
                                go("car-terms", { vehicle: selected.id })
                              }
                            >
                              Lihat Persyaratan
                            </button>
                          </div>
                        )}
                      {view === "profile" && (
                        <MobileProfile
                          session={session}
                          onOpenSubmission={(s) =>
                            go("feedback", { submitted: s.id })
                          }
                          scrollTop={scrollTop}
                        />
                      )}
                      {view === "feedback" && submitted && (
                        <div className="app-feedback">
                          <div className="app-success-icon">
                            <IconCheck size={31} />
                          </div>
                          <span className="app-feedback-eyebrow">
                            PERMINTAAN BERHASIL DISIMPAN
                          </span>
                          <h2>
                            Terima kasih,
                            <br />
                            {submitted.name.split(" ")[0]}.
                          </h2>
                          <p>
                            {submitted.delivery === "Ambil di lokasi"
                              ? "Admin menerima rencana Anda untuk datang mengambil kendaraan. Konfirmasikan lokasi dan jadwal sebelum berangkat."
                              : "Admin menerima formulir dan alamat tujuan. Lanjutkan untuk mengatur pengantaran melalui WhatsApp."}
                          </p>
                          <div className="app-receipt">
                            <div>
                              <strong>{submitted.code}</strong>
                              <span className="app-request-status">
                                {submitted.status}
                              </span>
                            </div>
                            <SummaryRows
                              rows={[
                                ["Kendaraan", submitted.motorName],
                                ["Cabang", submitted.branchName],
                                ["Mulai", dateTime(submitted.start)],
                                ["Selesai", dateTime(submitted.end)],
                                [
                                  "Durasi",
                                  `${days(submitted.start, submitted.end)} hari`,
                                ],
                                ["Pengambilan", submitted.delivery],
                                ["Alamat antar", submitted.deliveryAddress],
                              ]}
                            />
                          </div>
                          {submitted.delivery === "Ambil di lokasi" && (
                            <LocationCard
                              data={data}
                              branchId={submitted.branchId}
                            />
                          )}
                          <p className="app-info-banner">
                            Permintaan ini belum merupakan reservasi
                            terkonfirmasi. Lanjutkan percakapan dengan admin.
                          </p>
                          {number ? (
                            <a
                              className="app-btn primary"
                              href={`https://wa.me/${number}?text=${encodeURIComponent(submitted.message)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <IconBrandWhatsapp size={19} />
                              Lanjutkan ke WhatsApp
                              <IconArrowUpRight size={16} />
                            </a>
                          ) : (
                            <p className="app-error">
                              Nomor WhatsApp admin belum diatur. Salin pesan
                              untuk dikirim kepada admin.
                            </p>
                          )}
                          <button
                            className="app-btn secondary"
                            onClick={() => copy(submitted)}
                          >
                            Salin Pesan WhatsApp
                          </button>
                          <details className="app-message">
                            <summary>
                              Lihat template WhatsApp
                              <IconChevronRight size={16} />
                            </summary>
                            <pre>{submitted.message}</pre>
                          </details>
                          {submitted.formMode !== "short" && (
                            <p className="app-hint section-gap">
                              Foto tersimpan di dashboard. Tautan WhatsApp hanya
                              membawa teks; lampirkan foto terpisah di
                              percakapan.
                            </p>
                          )}
                          {copyError && (
                            <p className="app-error" role="alert">
                              {copyError}
                            </p>
                          )}
                          <Link
                            className="app-dashboard-link section-gap"
                            href="/admin?tab=submissions"
                          >
                            Lihat permintaan di dashboard
                            <IconArrowUpRight size={14} />
                          </Link>
                          {!session.account && (
                            <p className="app-hint section-gap">
                              Anda memesan sebagai tamu. Riwayat pribadi
                              tersedia untuk pemesanan berikutnya jika Anda
                              membuat akun.
                            </p>
                          )}
                          <button
                            className="app-btn secondary"
                            onClick={() => go("home")}
                          >
                            Kembali ke Beranda
                          </button>
                        </div>
                      )}
                      {((["detail", "booking", "car-terms"].includes(view) &&
                        !selected) ||
                        (view === "feedback" && !submitted) ||
                        ![
                          "home",
                          "list",
                          "profile",
                          "detail",
                          "booking",
                          "car-terms",
                          "feedback",
                        ].includes(view)) && (
                        <div className="app-empty">
                          <h3>Halaman belum tersedia.</h3>
                          <p>Silakan kembali untuk memilih kendaraan.</p>
                          <button
                            className="app-btn primary"
                            onClick={() => go("home")}
                          >
                            Kembali ke Beranda
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <nav className="app-bottomnav" aria-label="Navigasi aplikasi">
                  {[
                    ["home", "Beranda", IconHome],
                    ["list", "Jelajahi", IconSearch],
                    ["profile", "Profil", IconUser],
                  ].map(([v, label, Icon]) => {
                    const I = Icon as typeof IconHome
                    return (
                      <button
                        key={String(v)}
                        className={activeTab === v ? "active" : ""}
                        onClick={() => go(String(v))}
                        aria-current={activeTab === v ? "page" : undefined}
                      >
                        <I size={21} />
                        <span>{String(label)}</span>
                      </button>
                    )
                  })}
                </nav>
                <div className="device-gesture">
                  <span />
                </div>
              </div>
            </div>
            <p className="device-caption">
              {device === "android" ? "Android" : "iPhone"} · aplikasi rental ·
              demo web interaktif
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  )
}
