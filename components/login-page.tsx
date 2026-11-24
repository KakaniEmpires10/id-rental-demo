"use client"
import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconShieldLock,
  IconCopy,
  IconMapPin,
} from "@tabler/icons-react"
import { Brand, LoadingView } from "./rental-ui"
import { useRental } from "./rental-provider"
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/rental"
export function LoginPage() {
  const { ready, authenticated, login, notify } = useRental()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (ready && authenticated) router.replace("/admin")
  }, [ready, authenticated, router])
  function submit(e: FormEvent) {
    e.preventDefault()
    if (
      email.trim().toLowerCase() !== DEMO_EMAIL ||
      password !== DEMO_PASSWORD
    ) {
      setError("Email atau password tidak sesuai dengan akun demo.")
      return
    }
    setLoading(true)
    login()
    notify("Selamat datang di dashboard ID Rental.")
    router.replace("/admin")
  }
  return (
    <main className="login-page">
      <section className="login-visual">
        <Brand dark />
        <div>
          <span className="eyebrow">RUANG KERJA ID RENTAL</span>
          <h1>
            Kelola armada.
            <br />
            Siapkan perjalanan.
          </h1>
          <p>
            Satu tempat untuk melihat motor, jadwal sewa,
            <br />
            dan kebutuhan operasional Anda.
          </p>
        </div>
        <div className="login-motor">
          <Image
            src="/images/fazzio.png"
            width={530}
            height={430}
            alt="Ilustrasi motor Yamaha Fazzio"
            unoptimized
          />
        </div>
        <span className="login-location">
          <IconMapPin size={17} /> Banda Aceh · Aceh Besar · Sabang
        </span>
      </section>
      <section className="login-form-side">
        <Link href="/" className="back-link">
          <IconArrowLeft size={17} /> Kembali ke website
        </Link>
        <div className="login-card">
          <div className="login-mobile-brand">
            <Brand />
          </div>
          <span className="login-icon">
            <IconShieldLock size={27} />
          </span>
          <h2>Selamat datang kembali.</h2>
          <p>Masuk untuk mencoba ruang admin ID Rental.</p>
          {!ready ? (
            <LoadingView />
          ) : (
            <form onSubmit={submit} className="form-stack">
              <label>
                Email
                <input
                  type="email"
                  required
                  placeholder="Email admin"
                  value={email}
                  autoComplete="username"
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError("")
                  }}
                />
              </label>
              <label>
                Password
                <div className="password-field">
                  <input
                    type={visible ? "text" : "password"}
                    required
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError("")
                    }}
                  />
                  <button
                    type="button"
                    aria-label={
                      visible ? "Sembunyikan password" : "Tampilkan password"
                    }
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                  </button>
                </div>
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Memasuki dashboard…" : "Masuk Dashboard"}
                <IconArrowRight size={18} />
              </button>
            </form>
          )}
          <div className="demo-credentials">
            <div>
              <strong>Akun untuk presentasi</strong>
              <span className="badge neutral">DEMO</span>
            </div>
            <p>
              Email: <code>{DEMO_EMAIL}</code>
              <br />
              Password: <code>{DEMO_PASSWORD}</code>
            </p>
            <button
              className="text-button"
              onClick={() => {
                setEmail(DEMO_EMAIL)
                setPassword(DEMO_PASSWORD)
                setError("")
              }}
            >
              <IconCopy size={16} /> Gunakan akun demo
            </button>
          </div>
          <p className="fine-print">
            Login simulasi untuk prototype. Autentikasi produksi akan dibangun
            pada tahap implementasi.
          </p>
        </div>
      </section>
    </main>
  )
}
