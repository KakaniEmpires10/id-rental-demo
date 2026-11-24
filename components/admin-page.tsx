"use client"
import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import {
  IconLayoutDashboard,
  IconMotorbike,
  IconBuildingStore,
  IconCalendarEvent,
  IconTool,
  IconUsers,
  IconLayout,
  IconChartBar,
  IconHelpCircle,
  IconBrandWhatsapp,
  IconCar,
  IconLogout,
  IconArrowUpRight,
  IconPlus,
  IconSearch,
  IconPencil,
  IconArchive,
  IconPlayerPlay,
  IconCheck,
  IconX,
  IconMenu2,
  IconRefresh,
  IconInfoCircle,
  IconClock,
  IconMapPin,
  IconClipboardText,
} from "@tabler/icons-react"
import { Brand, Modal, LoadingView, EmptyState } from "./rental-ui"
import { useRental } from "./rental-provider"
import { EntityEditor } from "./admin-editor"
import { CmsEditor, type CmsTab } from "./admin-cms"
import { IncomingForms } from "./admin-submissions"
import {
  saveEntity,
  type EntityKind,
  type FormValues,
} from "@/lib/demo-actions"
import {
  dateTime,
  days,
  motorStatus,
  rupiah,
  rentalBlocks,
  type DemoData,
} from "@/lib/rental"
const nav = [
  { key: "dashboard", title: "Dashboard", icon: IconLayoutDashboard },
  {
    key: "motors",
    title: "Data Motor",
    icon: IconMotorbike,
    group: "Inventori & Operasional",
  },
  { key: "branches", title: "Cabang", icon: IconBuildingStore },
  { key: "rentals", title: "Penyewaan", icon: IconCalendarEvent },
  { key: "submissions", title: "Formulir Penyewa", icon: IconClipboardText },
  { key: "maintenance", title: "Perawatan", icon: IconTool },
  { key: "customers", title: "Pelanggan", icon: IconUsers },
  {
    key: "landing",
    title: "Konten Landing Page",
    icon: IconLayout,
    group: "Pengaturan CMS",
  },
  { key: "stats", title: "Statistik", icon: IconChartBar },
  { key: "faq", title: "FAQ", icon: IconHelpCircle },
  { key: "contact", title: "Kontak & WhatsApp", icon: IconBrandWhatsapp },
  { key: "car", title: "Informasi Sewa Mobil", icon: IconCar },
]
const descriptions: Record<string, string> = {
  dashboard: "Ringkasan armada dan aktivitas operasional hari ini.",
  motors: "Kelola unit, tarif contoh, dan status operasional motor.",
  branches: "Atur area pengambilan, kontak admin, dan informasi lokasi.",
  rentals: "Catat reservasi, pengambilan, dan pengembalian motor.",
  submissions:
    "Formulir aplikasi, dokumen, dan template WhatsApp dari satu kali pengisian.",
  maintenance: "Pantau perawatan dan kesiapan armada.",
  customers: "Kelola kontak pelanggan dan lihat riwayat sewanya.",
  landing: "Sesuaikan identitas dan pesan utama website ID Rental.",
  stats: "Perbarui label dan angka bisnis yang telah dikonfirmasi.",
  faq: "Bantu pelanggan memahami alur sewa dan konfirmasi admin.",
  contact: "Atur nomor WhatsApp dan kontak yang digunakan website.",
  car: "Kelola layanan tambahan melalui konsultasi admin.",
}
export function StatusBadge({ status }: { status: string }) {
  const color = ["Tersedia", "Selesai", "Siap disewakan"].includes(status)
    ? "positive"
    : ["Dipesan", "Dalam proses", "Di bengkel", "Dalam perawatan"].includes(
          status
        )
      ? "amber"
      : ["Dipakai", "Aktif"].includes(status)
        ? "teal"
        : "neutral"
  return (
    <span className={`badge ${color}`}>
      <span className="badge-dot" />
      {status}
    </span>
  )
}
function DataTable({ heads, rows }: { heads: string[]; rows: ReactNode[][] }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {heads.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i}>
              {cells.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function Dashboard({ branch }: { branch: string }) {
  const { data } = useRental()
  const now = new Date()
  const motors = data.motors.filter((m) => !branch || m.branchId === branch)
  const rentals = data.rentals.filter((r) => !branch || r.branchId === branch)
  const returns = rentals
    .filter((r) => r.status === "Aktif")
    .sort((a, b) => new Date(a.end).getTime() - new Date(b.end).getTime())
  const availableNow = motors.filter(
    (m) =>
      m.status === "Siap disewakan" &&
      !rentals.some(
        (r) =>
          r.motorId === m.id &&
          rentalBlocks(r) &&
          new Date(r.start) <= now &&
          new Date(r.end) > now
      )
  ).length
  const metrics = [
    {
      label: "Total motor",
      value: motors.length,
      icon: IconMotorbike,
      color: "teal",
    },
    {
      label: "Tersedia saat ini",
      value: availableNow,
      icon: IconCheck,
      color: "green",
    },
    {
      label: "Motor dipakai",
      value: motors.filter((m) => motorStatus(m, rentals, now) === "Dipakai")
        .length,
      icon: IconKeyIcon,
      color: "blue",
    },
    {
      label: "Dalam perawatan",
      value: motors.filter((m) => m.status === "Dalam perawatan").length,
      icon: IconTool,
      color: "yellow",
    },
  ]
  return (
    <>
      <div className="dashboard-metrics">
        {metrics.map((m) => (
          <article className="metric-card" key={m.label}>
            <span className={`metric-icon ${m.color}`}>
              <m.icon size={24} stroke={1.6} />
            </span>
            <span>{m.label}</span>
            <strong>
              {m.value}
              <small>unit demo</small>
            </strong>
          </article>
        ))}
      </div>
      <IncomingForms branch={branch} compact />
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Pengembalian terdekat</h2>
              <p>
                {rentals.filter((r) => r.status === "Aktif").length} sewa aktif
                pada data demo
              </p>
            </div>
            <Link className="text-button" href="/admin?tab=rentals">
              Lihat semua <IconArrowUpRight size={16} />
            </Link>
          </div>
          {returns.length ? (
            <DataTable
              heads={["Motor & pelanggan", "Pengembalian", "Status"]}
              rows={returns.map((r) => [
                <div key="motor" className="cell-main">
                  <strong>
                    {data.motors.find((m) => m.id === r.motorId)?.model}
                  </strong>
                  <small>
                    {data.customers.find((c) => c.id === r.customerId)?.name} ·{" "}
                    {r.code}
                  </small>
                </div>,
                <span
                  key="date"
                  className={new Date(r.end) < now ? "danger-text" : ""}
                >
                  {dateTime(r.end)}
                  {new Date(r.end) < now && (
                    <small className="cell-sub">Lewat jadwal</small>
                  )}
                </span>,
                <StatusBadge key="status" status={r.status} />,
              ])}
            />
          ) : (
            <EmptyState
              title="Belum ada pengembalian."
              description="Sewa aktif akan tampil di sini."
            />
          )}
        </section>
        <section className="panel fleet-panel">
          <div className="panel-heading">
            <div>
              <h2>Status armada</h2>
              <p>Kesiapan unit di lokasi terpilih</p>
            </div>
          </div>
          {["Tersedia", "Dipesan", "Dipakai", "Di bengkel", "Nonaktif"].map(
            (status) => (
              <div className="fleet-row" key={status}>
                <StatusBadge status={status} />
                <strong>
                  {
                    motors.filter(
                      (m) => motorStatus(m, rentals, now) === status
                    ).length
                  }
                  <small>unit</small>
                </strong>
              </div>
            )
          )}
          <p className="fine-print">
            Status mengikuti jadwal dan waktu saat ini.
          </p>
        </section>
      </div>
      <section className="demo-scenario panel">
        <span className="scenario-icon">
          <IconInfoCircle size={24} />
        </span>
        <div>
          <h3>Coba alur presentasi</h3>
          <p>
            Cari motor di Banda Aceh untuk {dateTime(data.demoStart)} hingga{" "}
            {dateTime(data.demoEnd)}. NMAX dan Fazzio muncul; unit di bengkel
            dan jadwal bentrok tidak muncul.
          </p>
          <div>
            <Link
              className="btn btn-primary btn-small"
              href={`/motor?${new URLSearchParams({ branch: "banda-aceh", start: data.demoStart, end: data.demoEnd, type: "" })}`}
            >
              Coba pencarian <IconArrowUpRight size={16} />
            </Link>
            <Link
              className="btn btn-outline btn-small"
              href={`/motor?${new URLSearchParams({ branch: "banda-aceh", start: data.demoStart, end: data.demoEnd, type: "Sport" })}`}
            >
              Coba hasil kosong <IconArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
function IconKeyIcon(props: { size: number; stroke: number }) {
  return <IconClock {...props} />
}
function EntityList({ kind, branch }: { kind: EntityKind; branch: string }) {
  const { data, update, notify } = useRental()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [editing, setEditing] = useState<{ id?: string } | null>(null)
  const [confirm, setConfirm] = useState<{
    title: string
    text: string
    action: () => void
  } | null>(null)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<string | null>(null)
  const branchName = (id: string) =>
    data.branches.find((b) => b.id === id)?.name || "—"
  const motorName = (id: string) => {
    const m = data.motors.find((m) => m.id === id)
    return m ? `${m.brand} ${m.model}` : "—"
  }
  const edit = (id: string) => (
    <button
      className="icon-button"
      aria-label={`Edit ${id}`}
      title="Edit"
      onClick={() => setEditing({ id })}
    >
      <IconPencil size={18} />
    </button>
  )
  function apply(result: DemoData | string) {
    if (typeof result === "string") {
      setError(result)
      setConfirm(null)
      return
    }
    update(() => result)
    notify("Data operasional berhasil diperbarui.")
    setError("")
    setConfirm(null)
  }
  function action(kind: EntityKind, id: string, patch: FormValues) {
    const old = data[kind].find((i) => i.id === id)!
    const values = Object.fromEntries(
      Object.entries(old).map(([k, v]) => [
        k,
        typeof v === "boolean" ? v : String(v),
      ])
    )
    apply(saveEntity(data, kind, { ...values, ...patch }, id))
  }
  const ask = (title: string, text: string, action: () => void) =>
    setConfirm({ title, text, action })
  const searchMatches = (value: unknown) =>
    JSON.stringify(value).toLowerCase().includes(query.toLowerCase())
  let heads: string[] = []
  let rows: ReactNode[][] = []
  if (kind === "motors") {
    heads = [
      "Unit motor",
      "Cabang",
      "Tarif / hari",
      "Operasional",
      "Status saat ini",
      "Aksi",
    ]
    rows = data.motors
      .filter(
        (m) =>
          (!branch || m.branchId === branch) &&
          (!status || m.status === status) &&
          searchMatches(m)
      )
      .map((m) => [
        <div className="table-motor" key="unit">
          <Image
            src={m.photo}
            width={68}
            height={52}
            alt={m.model}
            unoptimized
          />
          <div>
            <strong>
              {m.brand} {m.model}
            </strong>
            <small>
              {m.code} · {m.plate}
            </small>
          </div>
        </div>,
        branchName(m.branchId),
        rupiah(m.price),
        <span key="op" className="cell-sub">
          {m.status}
        </span>,
        <StatusBadge key="status" status={motorStatus(m, data.rentals)} />,
        <div className="row-actions" key="actions">
          {edit(m.id)}
          {m.status !== "Nonaktif" && (
            <button
              className="icon-button"
              title="Nonaktifkan"
              aria-label={`Nonaktifkan ${m.code}`}
              onClick={() =>
                ask(
                  "Nonaktifkan motor?",
                  `${m.brand} ${m.model} tidak akan muncul di pencarian. Unit dengan jadwal sewa aktif tidak dapat dinonaktifkan.`,
                  () => action("motors", m.id, { status: "Nonaktif" })
                )
              }
            >
              <IconArchive size={18} />
            </button>
          )}
        </div>,
      ])
  } else if (kind === "branches") {
    heads = ["Cabang", "Alamat", "Kontak WhatsApp", "Status", "Aksi"]
    rows = data.branches
      .filter((b) => (!branch || b.id === branch) && searchMatches(b))
      .map((b) => [
        <strong key="name">{b.name}</strong>,
        <span key="address" className="address-cell">
          {b.address || "Belum diatur"}
        </span>,
        b.whatsapp || "Mengikuti CMS",
        <StatusBadge key="status" status={b.active ? "Aktif" : "Nonaktif"} />,
        <div className="row-actions" key="actions">
          {edit(b.id)}
          {b.active && (
            <button
              className="icon-button"
              title="Nonaktifkan cabang"
              aria-label={`Nonaktifkan ${b.name}`}
              onClick={() =>
                ask(
                  "Nonaktifkan cabang?",
                  `${b.name} tidak lagi ditampilkan pada pencarian dan lokasi publik.`,
                  () => action("branches", b.id, { active: false })
                )
              }
            >
              <IconArchive size={18} />
            </button>
          )}
        </div>,
      ])
  } else if (kind === "rentals") {
    heads = [
      "Sewa & pelanggan",
      "Motor / cabang",
      "Jadwal",
      "Estimasi dasar",
      "Status",
      "Aksi",
    ]
    rows = data.rentals
      .filter(
        (r) =>
          (!branch || r.branchId === branch) &&
          (!status || r.status === status) &&
          searchMatches({
            ...r,
            name: data.customers.find((c) => c.id === r.customerId)?.name,
            motor: motorName(r.motorId),
          })
      )
      .map((r) => [
        <div className="cell-main" key="name">
          <strong>{r.code}</strong>
          <small>
            {data.customers.find((c) => c.id === r.customerId)?.name}
          </small>
        </div>,
        <div className="cell-main" key="motor">
          <strong>{motorName(r.motorId)}</strong>
          <small>{branchName(r.branchId)}</small>
        </div>,
        <div className="cell-main" key="dates">
          <span>{dateTime(r.start)}</span>
          <small>s/d {dateTime(r.end)}</small>
        </div>,
        rupiah(r.price * days(r.start, r.end)),
        <StatusBadge key="status" status={r.status} />,
        <div className="row-actions" key="actions">
          {edit(r.id)}
          {r.status === "Dipesan" && (
            <button
              className="icon-button positive-text"
              title="Catat pengambilan"
              aria-label={`Catat pengambilan ${r.code}`}
              onClick={() =>
                ask(
                  "Catat pengambilan motor?",
                  "Status sewa berubah menjadi Aktif. Ketersediaan akan diperiksa kembali.",
                  () => action("rentals", r.id, { status: "Aktif" })
                )
              }
            >
              <IconPlayerPlay size={18} />
            </button>
          )}
          {r.status === "Aktif" && (
            <button
              className="icon-button positive-text"
              title="Catat pengembalian"
              aria-label={`Catat pengembalian ${r.code}`}
              onClick={() =>
                ask(
                  "Catat pengembalian motor?",
                  "Status sewa berubah menjadi Selesai dan jadwal ini tidak lagi memblokir unit.",
                  () => action("rentals", r.id, { status: "Selesai" })
                )
              }
            >
              <IconCheck size={18} />
            </button>
          )}
          {r.status === "Dipesan" && (
            <button
              className="icon-button danger-text"
              title="Batalkan reservasi"
              aria-label={`Batalkan ${r.code}`}
              onClick={() =>
                ask(
                  "Batalkan reservasi?",
                  "Reservasi dibatalkan dan tidak lagi memblokir ketersediaan motor.",
                  () => action("rentals", r.id, { status: "Dibatalkan" })
                )
              }
            >
              <IconX size={18} />
            </button>
          )}
        </div>,
      ])
  } else if (kind === "maintenance") {
    heads = [
      "Motor",
      "Keluhan / perawatan",
      "Tanggal masuk",
      "Estimasi selesai",
      "Status",
      "Aksi",
    ]
    rows = data.maintenance
      .filter(
        (p) =>
          (!branch ||
            data.motors.find((m) => m.id === p.motorId)?.branchId === branch) &&
          (!status || p.status === status) &&
          searchMatches({ ...p, motor: motorName(p.motorId) })
      )
      .map((p) => [
        <div className="cell-main" key="motor">
          <strong>{motorName(p.motorId)}</strong>
          <small>
            {branchName(
              data.motors.find((m) => m.id === p.motorId)?.branchId || ""
            )}
          </small>
        </div>,
        p.issue,
        dateTime(p.start),
        dateTime(p.end),
        <StatusBadge key="status" status={p.status} />,
        <div className="row-actions" key="actions">
          {edit(p.id)}
          {p.status === "Dalam proses" && (
            <button
              className="icon-button positive-text"
              title="Selesaikan perawatan"
              aria-label={`Selesaikan perawatan ${p.id}`}
              onClick={() =>
                ask(
                  "Selesaikan perawatan?",
                  "Motor kembali ke status operasional sebelum perawatan ini.",
                  () => action("maintenance", p.id, { status: "Selesai" })
                )
              }
            >
              <IconCheck size={18} />
            </button>
          )}
        </div>,
      ])
  } else {
    heads = ["Pelanggan", "Telepon / WhatsApp", "Email", "Jumlah sewa", "Aksi"]
    rows = data.customers.filter(searchMatches).map((c) => [
      <div className="cell-main" key="name">
        <strong>{c.name}</strong>
        <small>{c.address || "Data pelanggan demo"}</small>
      </div>,
      c.phone || "—",
      c.email || "—",
      data.rentals.filter((r) => r.customerId === c.id).length,
      <div className="row-actions" key="actions">
        {edit(c.id)}
        <button className="text-button" onClick={() => setHistory(c.id)}>
          Riwayat <IconArrowUpRight size={15} />
        </button>
      </div>,
    ])
  }
  const statusOptions =
    kind === "motors"
      ? ["Siap disewakan", "Dalam perawatan", "Nonaktif"]
      : kind === "rentals"
        ? ["Dipesan", "Aktif", "Selesai", "Dibatalkan"]
        : kind === "maintenance"
          ? ["Dalam proses", "Selesai"]
          : []
  return (
    <>
      <section className="panel entity-panel">
        <div className="entity-toolbar">
          <div className="table-search">
            <IconSearch size={18} />
            <input
              aria-label="Cari data"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Cari ${nav.find((n) => n.key === kind)?.title.toLowerCase()}…`}
            />
          </div>
          {statusOptions.length > 0 && (
            <select
              aria-label="Filter status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua status</option>
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
          <span className="record-count">{rows.length} data</span>
          <button
            className="btn btn-primary btn-small"
            onClick={() => setEditing({})}
          >
            <IconPlus size={17} /> Tambah{" "}
            {kind === "motors"
              ? "Motor"
              : kind === "branches"
                ? "Cabang"
                : kind === "rentals"
                  ? "Sewa"
                  : kind === "maintenance"
                    ? "Perawatan"
                    : "Pelanggan"}
          </button>
        </div>
        {error && (
          <p className="form-error table-error" role="alert">
            {error}
          </p>
        )}
        {rows.length ? (
          <DataTable heads={heads} rows={rows} />
        ) : (
          <EmptyState
            title="Belum ada data yang sesuai."
            description="Ubah pencarian atau tambahkan data demo baru."
          />
        )}
        <div className="table-footer">
          <span>Data simulasi · dapat diubah untuk presentasi</span>
          <span>{rows.length} data ditampilkan</span>
        </div>
      </section>
      {editing && (
        <EntityEditor
          kind={kind}
          id={editing.id}
          onClose={() => setEditing(null)}
        />
      )}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p>{confirm.text}</p>
          <div className="modal-actions">
            <button
              className="btn btn-outline"
              onClick={() => setConfirm(null)}
            >
              Batal
            </button>
            <button className="btn btn-primary" onClick={confirm.action}>
              Ya, lanjutkan
            </button>
          </div>
        </Modal>
      )}
      {history && (
        <Modal
          title={`Riwayat ${data.customers.find((c) => c.id === history)?.name}`}
          onClose={() => setHistory(null)}
          wide
        >
          {data.rentals.filter((r) => r.customerId === history).length ? (
            <DataTable
              heads={["Kode sewa", "Motor", "Jadwal", "Status"]}
              rows={data.rentals
                .filter((r) => r.customerId === history)
                .map((r) => [
                  r.code,
                  motorName(r.motorId),
                  dateTime(r.start),
                  <StatusBadge key="s" status={r.status} />,
                ])}
            />
          ) : (
            <EmptyState
              title="Belum ada riwayat sewa."
              description="Penyewaan pelanggan akan tampil di sini."
            />
          )}
        </Modal>
      )}
    </>
  )
}
export function AdminPage() {
  const { data, ready, authenticated, logout, reset } = useRental()
  const router = useRouter()
  const search = useSearchParams()
  const requestedTab = search.get("tab") || "dashboard"
  const tab = nav.some((n) => n.key === requestedTab)
    ? requestedTab
    : "dashboard"
  const [branch, setBranch] = useState("")
  const [mobile, setMobile] = useState(false)
  const [help, setHelp] = useState(false)
  const [resetting, setResetting] = useState(false)
  useEffect(() => {
    if (ready && !authenticated) router.replace("/login")
  }, [ready, authenticated, router])
  if (!ready || !authenticated) return <LoadingView />
  const title = nav.find((n) => n.key === tab)!.title
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobile ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand dark />
          <button
            className="icon-button sidebar-close"
            aria-label="Tutup menu admin"
            onClick={() => setMobile(false)}
          >
            <IconX size={20} />
          </button>
        </div>
        <span className="workspace-label">WORKSPACE DEMO</span>
        <nav aria-label="Menu admin">
          {nav.map((item) => (
            <div key={item.key}>
              {item.group && <span className="nav-group">{item.group}</span>}
              <Link
                href={`/admin${item.key === "dashboard" ? "" : `?tab=${item.key}`}`}
                className={tab === item.key ? "active" : ""}
                onClick={() => setMobile(false)}
              >
                <item.icon size={19} stroke={1.7} />
                <span>{item.title}</span>
                {tab === item.key && <span className="nav-active-dot" />}
              </Link>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setHelp(true)}>
            <IconHelpCircle size={18} /> Panduan prototype
          </button>
          <button
            onClick={() => {
              logout()
              router.replace("/login")
            }}
          >
            <IconLogout size={18} /> Keluar
          </button>
          <div className="admin-user">
            <span>AD</span>
            <div>
              <strong>Admin ID Rental</strong>
              <small>Akun presentasi</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-overlay"
          aria-label="Tutup navigasi"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <button
              className="icon-button admin-menu-toggle"
              aria-label="Buka menu admin"
              onClick={() => setMobile(true)}
            >
              <IconMenu2 size={21} />
            </button>
            <span>
              ID Rental <span className="breadcrumb-slash">/</span>{" "}
              <strong>{title}</strong>
            </span>
          </div>
          <div>
            <span className="badge neutral">PROTOTYPE</span>
            <Link href="/" className="btn btn-outline btn-small">
              Lihat Website <IconArrowUpRight size={16} />
            </Link>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-page-heading">
            <div>
              <span className="eyebrow">
                {tab === "dashboard"
                  ? "SELAMAT DATANG, ADMIN"
                  : [
                        "motors",
                        "branches",
                        "rentals",
                        "maintenance",
                        "customers",
                        "submissions",
                      ].includes(tab)
                    ? "INVENTORI & OPERASIONAL"
                    : "PENGATURAN CMS"}
              </span>
              <h1>
                {tab === "dashboard"
                  ? "Perjalanan yang tertata, dimulai di sini."
                  : title}
              </h1>
              <p>{descriptions[tab]}</p>
            </div>
            {[
              "dashboard",
              "motors",
              "branches",
              "rentals",
              "maintenance",
              "submissions",
            ].includes(tab) && (
              <label className="admin-branch-filter">
                <IconMapPin size={17} />
                <span className="sr-only">Filter cabang</span>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                >
                  <option value="">Semua cabang</option>
                  {data.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {tab === "submissions" ? (
            <IncomingForms branch={branch} />
          ) : tab === "dashboard" ? (
            <Dashboard branch={branch} />
          ) : [
              "motors",
              "branches",
              "rentals",
              "maintenance",
              "customers",
            ].includes(tab) ? (
            <EntityList key={tab} kind={tab as EntityKind} branch={branch} />
          ) : (
            <CmsEditor key={tab} tab={tab as CmsTab} />
          )}
          <div className="admin-bottom-note">
            <span>
              <IconInfoCircle size={15} />
              Prototype presentasi. Data disimpan lokal di browser ini.
            </span>
            <button onClick={() => setResetting(true)}>
              <IconRefresh size={15} /> Reset data demo
            </button>
          </div>
        </main>
      </div>
      {resetting && (
        <Modal
          title="Kembalikan data demo awal?"
          onClose={() => setResetting(false)}
        >
          <p>
            Perubahan inventori dan CMS pada browser ini akan diganti dengan
            data demo awal. Jadwal simulasi diperbarui mulai besok.
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-outline"
              onClick={() => setResetting(false)}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                reset()
                setResetting(false)
                setBranch("")
              }}
            >
              Reset data demo
            </button>
          </div>
        </Modal>
      )}
      {help && (
        <Modal
          title="Panduan singkat presentasi"
          subtitle="Alur utama untuk menunjukkan layanan yang akan dibangun."
          onClose={() => setHelp(false)}
          wide
        >
          <ol className="guide-list">
            <li>
              <strong>Pencarian motor.</strong> Gunakan cabang Banda Aceh,{" "}
              {dateTime(data.demoStart)}–{dateTime(data.demoEnd)}. NMAX dan
              Fazzio tersedia pada simulasi awal.
            </li>
            <li>
              <strong>Jadwal bentrok.</strong> Pilih Sport pada jadwal yang
              sama: XSR sedang dipesan sehingga hasil kosong. Motor Gear di
              bengkel juga tidak muncul.
            </li>
            <li>
              <strong>WhatsApp.</strong> Pilih motor, isi nama, lihat pratinjau.
              Klik WhatsApp memulai percakapan dan tidak membuat reservasi.
            </li>
            <li>
              <strong>Operasional.</strong> Tambah pelanggan, buat sewa, lalu
              coba pencarian yang sama. Catat pengambilan dan pengembalian
              melalui tombol aksi.
            </li>
            <li>
              <strong>Perawatan & CMS.</strong> Masukkan motor ke perawatan atau
              ubah judul landing page, simpan, lalu lihat website.
            </li>
            <li>
              <strong>Kontak.</strong> Nomor utama mengikuti bio Instagram:
              085373311711. Atur melalui Kontak & WhatsApp atau Cabang.
              Kosongkan keduanya untuk mencoba salin pesan.
            </li>
          </ol>
          <p className="notice">
            Area layanan mengikuti profil Instagram; lokasi cabang, armada,
            tarif, pelanggan, dan jadwal merupakan data demo. Penginapan belum
            dimasukkan. Mobil hanya melalui konsultasi.
          </p>
        </Modal>
      )}
    </div>
  )
}
