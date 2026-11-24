"use client"
import { useEffect, useState } from "react"
import {
  IconUser,
  IconHistory,
  IconChevronRight,
  IconArrowLeft,
  IconBrandWhatsapp,
  IconLogout,
  IconShieldLock,
  IconHelpCircle,
  IconInfoCircle,
} from "@tabler/icons-react"
import { useRental } from "./rental-provider"
import { AppField } from "./mobile-fields"
import {
  dateTime,
  normalizeWhatsapp,
  type TenantForm,
  type TenantSubmission,
} from "@/lib/rental"
import { profileDetails, type MobileAccount } from "@/lib/mobile-rental"

const ACCOUNT_KEY = "id-rental-mobile-accounts-v1"
const SESSION_KEY = "id-rental-mobile-account"
export function useMobileAccount() {
  const [accounts, setAccounts] = useState<MobileAccount[]>([])
  const [active, setActive] = useState("")
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "[]")
        if (Array.isArray(stored)) setAccounts(stored)
        setActive(sessionStorage.getItem(SESSION_KEY) || "")
      } catch {}
    })
  }, [])
  const account = accounts.find((a) => a.id === active) || null
  function authenticate(
    email: string,
    password: string,
    name: string,
    register: boolean
  ) {
    const mail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) || password.length < 6)
      return "Isi email valid dan kata sandi minimal 6 karakter."
    if (register && !name.trim()) return "Isi nama Anda."
    const existing = accounts.find((a) => a.email === mail)
    if (register && existing)
      return "Email sudah terdaftar pada demo ini. Silakan masuk."
    if (!register && (!existing || existing.password !== password))
      return "Email atau kata sandi belum sesuai."
    const chosen = register
      ? {
          id: crypto.randomUUID(),
          email: mail,
          password,
          details: { name: name.trim() },
        }
      : existing!
    const next = register ? [...accounts, chosen] : accounts
    try {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next))
      sessionStorage.setItem(SESSION_KEY, chosen.id)
    } catch {
      return "Penyimpanan browser belum tersedia. Coba lagi."
    }
    setAccounts(next)
    setActive(chosen.id)
    return ""
  }
  function updateDetails(form: TenantForm | Partial<TenantForm>) {
    if (!account) return ""
    const next = accounts.map((a) =>
      a.id === account.id
        ? {
            ...a,
            details: { ...a.details, ...profileDetails(form as TenantForm) },
          }
        : a
    )
    try {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next))
    } catch {
      return "Profil belum dapat disimpan di browser."
    }
    setAccounts(next)
    return ""
  }
  function logout() {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {}
    setActive("")
  }
  return { account, authenticate, updateDetails, logout }
}
export function MobileProfile({
  session,
  onOpenSubmission,
  scrollTop,
}: {
  session: ReturnType<typeof useMobileAccount>
  onOpenSubmission: (s: TenantSubmission) => void
  scrollTop: () => void
}) {
  const { data, notify } = useRental()
  const { account } = session
  const [page, setPage] = useState("profile")
  const [register, setRegister] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [details, setDetails] = useState<Partial<TenantForm>>({})
  const history = account
    ? data.submissions.filter((s) => s.accountId === account.id)
    : []
  const wa = normalizeWhatsapp(data.cms.whatsapp)
  function go(view: string) {
    setPage(view)
    setError("")
    scrollTop()
  }
  if (page === "account")
    return (
      <div className="app-form-content">
        <button className="app-back" onClick={() => go("profile")}>
          <IconArrowLeft size={16} />
          Profil
        </button>
        <div className="app-form-heading">
          <span>AKUN ID RENTAL</span>
          <h2>{register ? "Buat akun" : "Selamat datang kembali"}</h2>
          <p>
            Akun memudahkan pengisian data berikutnya dan menyimpan riwayat
            permintaan pribadi.
          </p>
        </div>
        <form
          className="app-form-fields"
          onSubmit={(e) => {
            e.preventDefault()
            const issue = session.authenticate(email, password, name, register)
            if (issue) {
              setError(issue)
              return
            }
            setPassword("")
            notify(
              register ? "Akun demo dibuat." : "Berhasil masuk ke akun demo."
            )
            go("profile")
          }}
        >
          {register && (
            <AppField label="Nama lengkap" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                maxLength={100}
              />
            </AppField>
          )}
          <AppField label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              maxLength={150}
            />
          </AppField>
          <AppField label="Kata sandi" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={register ? "new-password" : "current-password"}
            />
          </AppField>
          {error && (
            <p className="app-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="app-btn primary">
            {register ? "Buat Akun Demo" : "Masuk Akun"}
          </button>
          <button
            type="button"
            className="app-btn secondary"
            onClick={() => {
              setRegister(!register)
              setError("")
            }}
          >
            {register ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
          </button>
          <p className="app-hint">
            Simulasi akun lokal untuk presentasi. Gunakan email dan kata sandi
            contoh. Akun ini hanya tersedia pada browser ini.
          </p>
        </form>
      </div>
    )
  if (page === "edit" && account)
    return (
      <div className="app-form-content">
        <button className="app-back" onClick={() => go("profile")}>
          <IconArrowLeft size={16} />
          Profil
        </button>
        <div className="app-form-heading">
          <span>DATA TERSIMPAN</span>
          <h2>Data pribadi</h2>
          <p>Data ini akan mengisi formulir pemesanan Anda berikutnya.</p>
        </div>
        <form
          className="app-form-fields"
          onSubmit={(e) => {
            e.preventDefault()
            if (
              !details.name?.trim() ||
              (details.phone && !normalizeWhatsapp(details.phone))
            ) {
              setError("Isi nama dan nomor WhatsApp yang valid.")
              return
            }
            const issue = session.updateDetails(details)
            if (issue) {
              setError(issue)
              return
            }
            notify("Profil diperbarui.")
            go("profile")
          }}
        >
          {(
            [
              ["name", "Nama lengkap"],
              ["phone", "No. HP / WhatsApp utama"],
              ["phone2", "No. HP / WhatsApp kedua"],
              ["profession", "Pekerjaan"],
              ["company", "Nama instansi"],
              ["ktpAddress", "Alamat KTP"],
              ["currentAddress", "Alamat sekarang"],
              ["facebook", "Facebook"],
              ["instagram", "Instagram"],
              ["tiktok", "TikTok"],
            ] as const
          ).map(([key, label]) => (
            <AppField key={key} label={label} required={key === "name"}>
              <input
                value={details[key] || ""}
                onChange={(e) =>
                  setDetails((d) => ({ ...d, [key]: e.target.value }))
                }
                maxLength={500}
              />
            </AppField>
          ))}
          {error && (
            <p className="app-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="app-btn primary">
            Simpan Profil
          </button>
        </form>
      </div>
    )
  if (page === "history" && account)
    return (
      <div className="app-form-content">
        <button className="app-back" onClick={() => go("profile")}>
          <IconArrowLeft size={16} />
          Profil
        </button>
        <div className="app-form-heading">
          <span>AKTIVITAS ANDA</span>
          <h2>Riwayat pemesanan</h2>
          <p>Permintaan yang dibuat saat Anda masuk ke akun ini.</p>
        </div>
        {history.length ? (
          history.map((s) => (
            <button
              key={s.id}
              className="app-history-card"
              onClick={() => onOpenSubmission(s)}
            >
              <div>
                <strong>{s.code}</strong>
                <span>{s.status}</span>
              </div>
              <h3>{s.motorName}</h3>
              <p>
                {s.branchName} · {dateTime(s.start)}
              </p>
              <small>
                {s.delivery}
                <IconChevronRight size={15} />
              </small>
            </button>
          ))
        ) : (
          <div className="app-empty">
            <IconHistory size={35} />
            <h3>Belum ada riwayat</h3>
            <p>
              Pesanan pertama Anda akan muncul di sini setelah permintaan
              disimpan.
            </p>
          </div>
        )}
      </div>
    )
  return (
    <div className="app-profile app-home-content">
      <div className="app-profile-heading">
        <span className="app-avatar">
          <IconUser size={30} />
        </span>
        <div>
          <small>{account ? "AKUN ID RENTAL" : "SELAMAT DATANG"}</small>
          <h2>{account?.details.name || "Halo, Teman Perjalanan"}</h2>
          <p>{account?.email || "Jelajahi dan pesan sebagai tamu."}</p>
        </div>
      </div>
      {!account && (
        <div className="app-account-card">
          <h3>Perjalanan berikutnya lebih mudah.</h3>
          <p>
            Buat akun untuk mengisi data otomatis dan melihat riwayat pemesanan
            pribadi. Tetap bisa menyewa tanpa akun.
          </p>
          <button
            className="app-btn primary"
            onClick={() => {
              setRegister(true)
              go("account")
            }}
          >
            Buat Akun
          </button>
          <button
            className="app-login-link"
            onClick={() => {
              setRegister(false)
              go("account")
            }}
          >
            Sudah punya akun? Masuk
          </button>
        </div>
      )}
      <div className="app-profile-menu">
        {account && (
          <>
            <button
              onClick={() => {
                setDetails(account.details)
                go("edit")
              }}
            >
              <IconUser size={20} />
              <span>
                Data pribadi<small>Kelola data untuk pengisian otomatis</small>
              </span>
              <IconChevronRight size={17} />
            </button>
            <button onClick={() => go("history")}>
              <IconHistory size={20} />
              <span>
                Riwayat pemesanan
                <small>{history.length} permintaan pada akun ini</small>
              </span>
              <IconChevronRight size={17} />
            </button>
          </>
        )}
        <details>
          <summary>
            <IconHelpCircle size={20} />
            <span>Pertanyaan umum</span>
            <IconChevronRight size={17} />
          </summary>
          <div className="app-profile-detail">
            {data.cms.faqs.map((f) => (
              <details key={f.question}>
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        </details>
        <details>
          <summary>
            <IconBrandWhatsapp size={20} />
            <span>Hubungi ID Rental</span>
            <IconChevronRight size={17} />
          </summary>
          <div className="app-profile-detail">
            <p>
              Butuh bantuan memilih unit atau mengatur pengambilan? Admin akan
              membantu mengonfirmasi kebutuhan Anda.
            </p>
            {wa ? (
              <a
                className="app-btn primary"
                href={`https://wa.me/${wa}?text=${encodeURIComponent("Halo, Admin ID Rental. Saya ingin bertanya mengenai layanan rental kendaraan.")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Hubungi Admin
              </a>
            ) : (
              <p>Nomor WhatsApp admin belum diatur.</p>
            )}
          </div>
        </details>
        <details>
          <summary>
            <IconInfoCircle size={20} />
            <span>Tentang ID Rental</span>
            <IconChevronRight size={17} />
          </summary>
          <div className="app-profile-detail">
            <p>{data.cms.footerDescription}</p>
            <p>{data.cms.contact}</p>
          </div>
        </details>
        <details>
          <summary>
            <IconShieldLock size={20} />
            <span>Privasi & data</span>
            <IconChevronRight size={17} />
          </summary>
          <div className="app-profile-detail">
            <p>
              Formulir diterima admin untuk menindaklanjuti permintaan Anda.
              Data akun membantu pengisian ulang dan riwayat pribadi.
            </p>
            <p>
              Pada demo ini, data disimpan di browser ini. Riwayat pribadi hanya
              tersedia bagi akun yang masuk saat pemesanan. Gunakan identitas
              dan lampiran contoh.
            </p>
          </div>
        </details>
        {account && (
          <button
            onClick={() => {
              session.logout()
              notify("Anda sekarang menggunakan aplikasi sebagai tamu.")
            }}
          >
            <IconLogout size={20} />
            <span>Keluar akun</span>
            <IconChevronRight size={17} />
          </button>
        )}
      </div>
      <p className="app-profile-version">ID Rental · Preview aplikasi 1.0</p>
    </div>
  )
}
