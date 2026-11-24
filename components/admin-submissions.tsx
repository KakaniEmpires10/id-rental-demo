"use client"
import Image from "next/image"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import {
  IconClipboardText,
  IconArrowUpRight,
  IconSearch,
  IconCheck,
  IconBrandWhatsapp,
  IconArrowRight,
} from "@tabler/icons-react"
import { useRental } from "./rental-provider"
import { Modal, EmptyState } from "./rental-ui"
import {
  dateTime,
  days,
  rupiah,
  normalizeWhatsapp,
  type TenantSubmission,
} from "@/lib/rental"
import { saveEntity } from "@/lib/demo-actions"
import { PICKUP_OPTIONS } from "@/lib/tenant-form"

function DetailRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="submission-detail-rows">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || "—"}</dd>
        </div>
      ))}
    </dl>
  )
}
export function IncomingForms({
  branch = "",
  compact = false,
}: {
  branch?: string
  compact?: boolean
}) {
  const { data, update, notify } = useRental()
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [confirming, setConfirming] = useState(false)
  const submission = data.submissions.find((s) => s.id === selected)
  const filtered = data.submissions.filter(
    (s) =>
      (!branch || s.branchId === branch) &&
      (!status || s.status === status) &&
      `${s.code} ${s.name} ${s.phone} ${s.motorName}`
        .toLowerCase()
        .includes(query.toLowerCase())
  )
  const rows = compact ? filtered.slice(0, 4) : filtered
  function reserve(s: TenantSubmission) {
    if (
      s.status !== "Menunggu konfirmasi" ||
      s.rentalId ||
      s.vehicleKind === "car"
    )
      return
    const rentalId = `rental-${s.id}`
    const result = saveEntity(
      data,
      "rentals",
      {
        code: `SWA-${String(data.rentals.length + 1).padStart(3, "0")}`,
        customerId: s.customerId,
        motorId: s.motorId,
        start: s.start,
        end: s.end,
        status: "Dipesan",
        price: String(s.dailyRate),
        notes: `Dari aplikasi ${s.code}. Tujuan: ${s.purpose}. Helm: ${s.helmets}. ${s.delivery}.`,
      },
      rentalId
    )
    if (typeof result === "string") {
      setError(result)
      setConfirming(false)
      return
    }
    update(() => ({
      ...result,
      submissions: result.submissions.map((item) =>
        item.id === s.id
          ? { ...item, status: "Ditindaklanjuti", rentalId }
          : item
      ),
    }))
    notify("Reservasi dibuat dari formulir. Ketersediaan motor diperbarui.")
    setConfirming(false)
    setError("")
  }
  async function copy(s: TenantSubmission) {
    try {
      await navigator.clipboard.writeText(s.message)
      notify("Template WhatsApp disalin.")
    } catch {
      setError(
        "Salin otomatis belum tersedia. Salin teks dari pratinjau pesan."
      )
    }
  }
  const whatsapp = submission
    ? normalizeWhatsapp(
        data.branches.find((b) => b.id === submission.branchId)?.whatsapp ||
          data.cms.whatsapp
      )
    : ""
  return (
    <>
      <section
        className={`panel incoming-forms ${compact ? "incoming-compact" : ""}`}
      >
        <div className="panel-heading">
          <div>
            <h2>
              <IconClipboardText size={18} />
              Formulir penyewa dari aplikasi
            </h2>
            <p>
              {
                data.submissions.filter(
                  (s) =>
                    s.status === "Menunggu konfirmasi" &&
                    (!branch || s.branchId === branch)
                ).length
              }{" "}
              formulir menunggu konfirmasi · data terhubung ke pelanggan
            </p>
          </div>
          {compact ? (
            <Link href="/admin?tab=submissions" className="text-button">
              Lihat semua <IconArrowUpRight size={16} />
            </Link>
          ) : (
            <span className="badge teal">MOBILE → ADMIN</span>
          )}
        </div>
        {!compact && (
          <div className="entity-toolbar">
            <div className="table-search">
              <IconSearch size={18} />
              <input
                aria-label="Cari formulir penyewa"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama, kode, atau motor…"
              />
            </div>
            <select
              aria-label="Filter status formulir"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua status</option>
              {["Menunggu konfirmasi", "Ditindaklanjuti", "Dibatalkan"].map(
                (v) => (
                  <option key={v}>{v}</option>
                )
              )}
            </select>
            <Link href="/mobile" className="btn btn-outline btn-small">
              Coba Aplikasi <IconArrowUpRight size={15} />
            </Link>
          </div>
        )}
        {rows.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {[
                    "Formulir & penyewa",
                    "Motor / cabang",
                    "Jadwal",
                    "Status",
                    "Aksi",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-main">
                        <strong>{s.name}</strong>
                        <small>
                          {s.code} · {s.phone}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="cell-main">
                        <strong>{s.motorName}</strong>
                        <small>{s.branchName}</small>
                      </div>
                    </td>
                    <td>
                      <div className="cell-main">
                        <span>{dateTime(s.start)}</span>
                        <small>s/d {dateTime(s.end)}</small>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${s.status === "Menunggu konfirmasi" ? "amber" : s.status === "Ditindaklanjuti" ? "positive" : "neutral"}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => {
                          setSelected(s.id)
                          setError("")
                          setConfirming(false)
                        }}
                      >
                        Lihat formulir <IconArrowUpRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Belum ada formulir penyewa."
            description="Form yang disimpan dari simulasi aplikasi mobile akan muncul di sini."
          >
            <Link href="/mobile" className="btn btn-primary btn-small">
              Coba isi formulir <IconArrowUpRight size={16} />
            </Link>
          </EmptyState>
        )}
      </section>
      {submission && (
        <Modal
          title={`Formulir ${submission.code}`}
          subtitle={`${submission.status} · Disimpan ${dateTime(submission.createdAt)}`}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="submission-detail">
            <section>
              <h3>Data penyewa</h3>
              <DetailRows
                rows={[
                  ["Nama", submission.name],
                  ["HP / WhatsApp 1", submission.phone],
                  ["HP / WhatsApp 2", submission.phone2],
                  ["Pekerjaan", submission.profession],
                  ["Nama instansi", submission.company],
                  ["Alamat KTP", submission.ktpAddress],
                  ["Alamat sekarang", submission.currentAddress],
                  [
                    "Jenis formulir",
                    submission.formMode === "short"
                      ? "Singkat · ambil sendiri"
                      : "Lengkap",
                  ],
                  ["Saksi / penjamin", submission.guarantor],
                  ["Hubungan", submission.guarantorRelationship],
                  ["HP penjamin", submission.guarantorPhone],
                ]}
              />
            </section>
            <section>
              <h3>Kendaraan & jadwal</h3>
              <DetailRows
                rows={[
                  ["Kendaraan", submission.motorName],
                  ["Nomor polisi", submission.plate],
                  ["Lokasi", submission.branchName],
                  ["Mulai", dateTime(submission.start)],
                  ["Selesai", dateTime(submission.end)],
                  [
                    "Lama sewa",
                    `${days(submission.start, submission.end)} hari`,
                  ],
                  ["Keperluan", submission.purpose],
                  ["Jumlah helm", String(submission.helmets)],
                  ["Pengambilan", submission.delivery],
                  ["Alamat antar", submission.deliveryAddress],
                  ["Kelengkapan", submission.equipment.join(", ")],
                ]}
              />
            </section>
            <section>
              <h3>Rincian biaya awal</h3>
              <DetailRows
                rows={[
                  [
                    "Sewa dasar (tarif demo)",
                    submission.dailyRate
                      ? rupiah(
                          submission.dailyRate *
                            days(submission.start, submission.end)
                        )
                      : "Dikonfirmasi admin",
                  ],
                  [
                    "Antar / jemput",
                    submission.vehicleKind === "car"
                      ? "Dikonfirmasi admin"
                      : submission.delivery === "Ambil di lokasi"
                        ? "Ambil di lokasi"
                        : rupiah(
                            PICKUP_OPTIONS.find(
                              (o) => o.value === submission.delivery
                            )?.fee || 0
                          ),
                  ],
                  ["BBM / lain-lain", "Dikonfirmasi saat serah-terima"],
                  ["Panjar / total final", "Diisi dan dikonfirmasi oleh admin"],
                ]}
              />
              <p className="fine-print">
                Durasi dibulatkan per 24 jam. Rincian ini belum merupakan bukti
                pembayaran atau sewa terkonfirmasi.
              </p>
            </section>
            <section>
              <h3>Media sosial & persetujuan</h3>
              <DetailRows
                rows={[
                  ["Facebook", submission.facebook],
                  ["Instagram", submission.instagram],
                  ["TikTok", submission.tiktok],
                  [
                    "Persetujuan",
                    submission.acceptedTerms
                      ? "Data dan ketentuan disetujui penyewa"
                      : "Belum disetujui",
                  ],
                ]}
              />
            </section>
            <section>
              <h3>Dokumen penyewa</h3>
              {!submission.ktp && !submission.sim && (
                <p className="fine-print">
                  Formulir singkat untuk pengambilan langsung. Data dan dokumen
                  lengkap dilengkapi saat penyewa datang.
                </p>
              )}
              <div className="submission-documents">
                {[
                  ["KTP", submission.ktp],
                  ["SIM", submission.sim],
                ].map(([label, document]) => {
                  const doc = document as TenantSubmission["ktp"]
                  return doc ? (
                    <figure key={String(label)}>
                      <Image
                        src={doc.dataUrl}
                        alt={`Foto ${label} pada formulir penyewa`}
                        width={280}
                        height={180}
                        unoptimized
                      />
                      <figcaption>
                        {String(label)} · {doc.name}
                      </figcaption>
                    </figure>
                  ) : null
                })}
              </div>
            </section>
          </div>
          <details className="message-preview">
            <summary>
              Template WhatsApp yang sama <IconArrowRight size={15} />
            </summary>
            <pre>{submission.message}</pre>
          </details>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {submission.status === "Menunggu konfirmasi" &&
            submission.vehicleKind === "car" && (
              <div className="submission-followup">
                <p>
                  Pengajuan mobil melalui instansi. Ketersediaan dan ketentuan
                  dibahas melalui konsultasi admin.
                </p>
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => {
                    update((d) => ({
                      ...d,
                      submissions: d.submissions.map((s) =>
                        s.id === submission.id
                          ? { ...s, status: "Ditindaklanjuti" }
                          : s
                      ),
                    }))
                    notify("Konsultasi mobil ditandai sudah ditindaklanjuti.")
                  }}
                >
                  Tandai Sudah Ditindaklanjuti
                </button>
              </div>
            )}
          {submission.status === "Menunggu konfirmasi" &&
            submission.vehicleKind !== "car" && (
              <div className="submission-followup">
                {confirming ? (
                  <>
                    <p>
                      Jadwal diperiksa kembali. Membuat reservasi akan memblokir
                      ketersediaan motor pada periode ini.
                    </p>
                    <div>
                      <button
                        className="btn btn-outline btn-small"
                        onClick={() => setConfirming(false)}
                      >
                        Batal
                      </button>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => reserve(submission)}
                      >
                        <IconCheck size={16} />
                        Konfirmasi Reservasi
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      Form sudah tersimpan. Buat reservasi setelah kebutuhan dan
                      ketentuan disepakati dengan penyewa.
                    </p>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => setConfirming(true)}
                    >
                      Buat Reservasi dari Form <IconArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>
            )}
          {submission.rentalId && (
            <p className="notice">
              Formulir sudah terhubung ke reservasi di menu Penyewaan.
            </p>
          )}
          <div className="modal-actions">
            <button
              className="btn btn-outline"
              onClick={() => copy(submission)}
            >
              Salin Pesan
            </button>
            {whatsapp && (
              <a
                className="btn btn-primary"
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(submission.message)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconBrandWhatsapp size={18} />
                Buka WhatsApp
              </a>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
