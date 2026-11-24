"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  IconArrowUpRight,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconMenu2,
  IconX,
  IconMapPin,
  IconMotorbike,
  IconArrowRight,
  IconChevronDown,
} from "@tabler/icons-react"
import { useRental } from "./rental-provider"
import { normalizeWhatsapp, safeUrl, rupiah, type Motor } from "@/lib/rental"

export function Brand({ dark = false }: { dark?: boolean }) {
  const { data } = useRental()
  return (
    <Link
      href="/"
      className={`brand ${dark ? "brand-light" : ""}`}
      aria-label="ID Rental, beranda"
    >
      <span className="logo-box">
        <Image
          src={data.cms.logo || "/images/id-rental-logo.jpg"}
          alt="Logo asli ID Rental Motor"
          width={54}
          height={54}
          unoptimized
        />
      </span>
      <span>
        ID Rental<span className="brand-caption">RENTAL MOTOR ACEH</span>
      </span>
    </Link>
  )
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      aria-labelledby="modal-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          const rect = ref.current.getBoundingClientRect()
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose()
        }
      }}
    >
      <div className="modal-heading">
        <div>
          <h2 id="modal-title">{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Tutup dialog"
        >
          <IconX size={20} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
export function MessageActions({
  message,
  number,
  valid = true,
}: {
  message: string
  number: string
  valid?: boolean
}) {
  const { notify } = useRental()
  const normalized = normalizeWhatsapp(number)
  const [copyError, setCopyError] = useState("")
  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      notify("Pesan berhasil disalin.")
      setCopyError("")
    } catch {
      setCopyError(
        "Salin otomatis belum tersedia. Pilih teks pada pratinjau dan salin secara manual."
      )
    }
  }
  return (
    <>
      <details className="message-preview">
        <summary>
          Pratinjau pesan WhatsApp <IconChevronDown size={16} />
        </summary>
        <pre>{message}</pre>
      </details>
      {!normalized && (
        <p className="notice warning">
          Nomor WhatsApp admin belum diatur atau belum valid. Anda dapat
          menyalin pesan terlebih dahulu.
        </p>
      )}
      {copyError && (
        <p className="form-error" role="alert">
          {copyError}
        </p>
      )}
      <div className="modal-actions">
        <button
          className="btn btn-outline"
          onClick={copy}
          type="button"
          disabled={!valid}
        >
          Salin Pesan
        </button>
        {normalized && (
          <a
            className={`btn btn-primary ${!valid ? "disabled" : ""}`}
            href={
              valid
                ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
                : undefined
            }
            aria-disabled={!valid}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandWhatsapp size={19} /> Lanjutkan ke WhatsApp{" "}
            <IconArrowUpRight size={16} />
          </a>
        )}
      </div>
      <p className="fine-print">
        Pesan ini memulai percakapan. Reservasi final dikonfirmasi oleh admin.
      </p>
    </>
  )
}
export function ContactModal({
  mode = "general",
  onClose,
}: {
  mode?: "car" | "general"
  onClose: () => void
}) {
  const { data } = useRental()
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const message =
    mode === "car"
      ? `Halo, Admin ID Rental.\n\nSaya melihat informasi layanan ID Rental melalui website dan ingin berkonsultasi mengenai sewa mobil.${name.trim() ? `\n\nNama: ${name.trim()}` : ""}${notes.trim() ? `\nRencana penggunaan: ${notes.trim()}` : ""}\n\nMohon informasi mengenai ketersediaan mobil, biaya, serta syarat dan ketentuan sewanya.\n\nTerima kasih.`
      : `Halo, Admin ID Rental.\n\nSaya melihat layanan ID Rental melalui website dan ingin mendapatkan informasi mengenai sewa motor.${name.trim() ? `\n\nNama: ${name.trim()}` : ""}${notes.trim() ? `\nKebutuhan: ${notes.trim()}` : ""}\n\nMohon informasi mengenai ketersediaan, biaya, dan ketentuan sewa.\n\nTerima kasih.`
  return (
    <Modal
      title={
        mode === "car"
          ? "Konsultasi sewa mobil"
          : "Mari bicarakan perjalanan Anda"
      }
      subtitle={
        mode === "car"
          ? "Layanan tambahan, sesuai syarat dan ketentuan melalui admin."
          : "Admin ID Rental siap membantu kebutuhan sewa Anda."
      }
      onClose={onClose}
    >
      <div className="form-stack">
        <label>
          Nama Anda <span className="optional">opsional</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama panggilan atau nama lengkap"
            maxLength={100}
          />
        </label>
        <label>
          {mode === "car" ? "Rencana penggunaan" : "Kebutuhan Anda"}{" "}
          <span className="optional">opsional</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              mode === "car"
                ? "Ceritakan jadwal dan kebutuhan perjalanan Anda"
                : "Jadwal, lokasi, atau pertanyaan Anda"
            }
            rows={3}
            maxLength={1000}
          />
        </label>
      </div>
      <MessageActions message={message} number={data.cms.whatsapp} />
    </Modal>
  )
}
export function PublicHeader() {
  const [menu, setMenu] = useState(false)
  const [contact, setContact] = useState(false)
  return (
    <>
      <div className="top-strip">
        <div className="container">
          <span>
            <IconMapPin size={14} /> Banda Aceh · Aceh Besar · Sabang
          </span>
          <span className="strip-right">Perjalanan & transportasi</span>
        </div>
      </div>
      <header className="public-header">
        <div className="nav-wrap container">
          <Brand />
          <nav
            className={menu ? "public-nav open" : "public-nav"}
            aria-label="Navigasi utama"
          >
            {[
              ["Beranda", "/"],
              ["Pilihan Motor", "/motor"],
              ["Cara Sewa", "/#cara-sewa"],
              ["Lokasi Cabang", "/#lokasi"],
              ["Hubungi Kami", "/#kontak"],
              ["Aplikasi Mobile", "/mobile"],
            ].map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMenu(false)}>
                {label}
              </Link>
            ))}
          </nav>
          <button
            className="btn btn-primary header-contact"
            onClick={() => setContact(true)}
          >
            <IconBrandWhatsapp size={18} /> Hubungi Admin{" "}
            <IconArrowUpRight size={16} />
          </button>
          <button
            className="icon-button menu-toggle"
            aria-label={menu ? "Tutup navigasi" : "Buka navigasi"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <IconX /> : <IconMenu2 />}
          </button>
        </div>
      </header>
      {contact && <ContactModal onClose={() => setContact(false)} />}
    </>
  )
}
export function PublicFooter() {
  const { data } = useRental()
  const [contact, setContact] = useState(false)
  return (
    <footer id="kontak" className="public-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Brand dark />
            <p>{data.cms.footerDescription}</p>
            <a
              className="social-link"
              href={
                safeUrl(data.cms.instagram) ||
                "https://www.instagram.com/idrentalmotor/"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandInstagram size={18} /> @idrentalmotor{" "}
              <IconArrowUpRight size={16} />
            </a>
          </div>
          <div>
            <h3>Jelajahi ID Rental</h3>
            <Link href="/">Beranda</Link>
            <Link href="/motor">Pilihan Motor</Link>
            <Link href="/#cara-sewa">Cara Sewa</Link>
            <Link href="/#lokasi">Lokasi Cabang</Link>
            <Link href="/mobile">Aplikasi Mobile</Link>
          </div>
          <div>
            <h3>Mari terhubung</h3>
            <p>
              <IconMapPin size={18} />
              {data.cms.contact}
            </p>
            <button className="footer-contact" onClick={() => setContact(true)}>
              <IconBrandWhatsapp size={18} />
              {data.cms.whatsapp || "Hubungi Admin"}
              <IconArrowUpRight size={16} />
            </button>
            {data.cms.email && (
              <a href={`mailto:${data.cms.email}`}>{data.cms.email}</a>
            )}
            <span className="footer-note">
              Ketersediaan dan ketentuan melalui konfirmasi admin.
            </span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} ID Rental. Semua hak dilindungi.
          </span>
          <span>Prototype presentasi · Data armada & tarif simulasi</span>
          <Link href="/login">
            Login Admin <IconArrowUpRight size={13} />
          </Link>
        </div>
      </div>
      {contact && <ContactModal onClose={() => setContact(false)} />}
    </footer>
  )
}
export function MotorCard({
  motor,
  available = false,
  onBook,
}: {
  motor: Motor
  available?: boolean
  onBook?: () => void
}) {
  const { data } = useRental()
  const branch = data.branches.find((b) => b.id === motor.branchId)
  return (
    <article className="motor-card">
      <div className="motor-photo">
        <span className="motor-type">{motor.type}</span>
        <Image
          src={motor.photo || "/images/nmax.png"}
          alt={`${motor.brand} ${motor.model}, foto ilustrasi motor demo`}
          width={450}
          height={340}
          unoptimized
        />
        <span className="photo-demo">Unit contoh</span>
      </div>
      <div className="motor-card-body">
        <div className="motor-brand">{motor.brand}</div>
        <h3>{motor.model}</h3>
        <div className="motor-specs">
          <span>{motor.transmission}</span>
          {motor.cc && (
            <>
              <i /> <span>{motor.cc} cc</span>
            </>
          )}
        </div>
        <div className="motor-location">
          <IconMapPin size={15} />
          {branch?.name || "Lokasi belum diatur"}
        </div>
        {available && (
          <span className="availability">
            <span />
            Tersedia sesuai jadwal
          </span>
        )}
        <div className="motor-card-bottom">
          <div>
            {motor.price > 0 ? (
              <>
                <strong>{rupiah(motor.price)}</strong>
                <span> / hari</span>
              </>
            ) : (
              <strong>Hubungi admin</strong>
            )}
            <small>Tarif contoh prototype</small>
          </div>
          {onBook ? (
            <button
              className="btn btn-primary btn-small"
              onClick={onBook}
              aria-label={`Pesan ${motor.brand} ${motor.model} via WhatsApp`}
            >
              <IconBrandWhatsapp size={17} /> Pesan
            </button>
          ) : (
            <Link
              href="/#pencarian"
              className="card-arrow"
              aria-label={`Cari jadwal ${motor.model}`}
            >
              <IconArrowRight size={21} />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
export function LoadingView() {
  return (
    <div className="loading-view" role="status">
      <span className="spinner" />
      <p>Menyiapkan perjalanan Anda…</p>
    </div>
  )
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  )
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <IconMotorbike size={34} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="empty-actions">{children}</div>
    </div>
  )
}
