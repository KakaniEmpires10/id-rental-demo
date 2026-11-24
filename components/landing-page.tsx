"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  IconArrowRight,
  IconArrowUpRight,
  IconMapPin,
  IconBrandWhatsapp,
  IconMotorbike,
  IconCalendarEvent,
  IconKey,
  IconCar,
  IconChevronDown,
  IconClock,
  IconRoute,
} from "@tabler/icons-react"
import { useRental } from "./rental-provider"
import {
  PublicHeader,
  PublicFooter,
  MotorCard,
  ContactModal,
  SectionHeading,
  LoadingView,
} from "./rental-ui"
import { SearchForm } from "./search-form"
import { safeUrl } from "@/lib/rental"
const steps = [
  {
    icon: IconMotorbike,
    title: "Pilih motor",
    text: "Temukan unit yang sesuai kebutuhan perjalanan Anda.",
  },
  {
    icon: IconCalendarEvent,
    title: "Tentukan jadwal",
    text: "Pilih cabang, tanggal mulai, dan tanggal pengembalian.",
  },
  {
    icon: IconBrandWhatsapp,
    title: "Konfirmasi via WhatsApp",
    text: "Kirim pilihan Anda untuk memastikan ketersediaan, biaya, dan ketentuan sewa.",
  },
  {
    icon: IconKey,
    title: "Ambil motor",
    text: "Datang ke lokasi sesuai kesepakatan dan lengkapi proses sewa bersama admin.",
  },
]
export function LandingPage() {
  const { data, ready } = useRental()
  const [contact, setContact] = useState<"car" | "general" | null>(null)
  return (
    <>
      <PublicHeader />
      <main>
        {!ready ? (
          <LoadingView />
        ) : (
          <>
            <section className="hero">
              <div className="hero-grid container">
                <div className="hero-copy">
                  <span className="eyebrow">
                    <span className="eyebrow-line" /> PERJALANAN DIMULAI DARI
                    SINI
                  </span>
                  <h1>
                    {data.cms.heroTitle ===
                    "Sewa motor, lebih leluasa di perjalanan." ? (
                      <>
                        Sewa motor,
                        <br />
                        lebih leluasa
                        <br />
                        di <span>perjalanan.</span>
                      </>
                    ) : (
                      data.cms.heroTitle
                    )}
                  </h1>
                  <p>{data.cms.heroDescription}</p>
                  <a className="hero-text-link" href="#pencarian">
                    Temukan teman perjalanan Anda <IconArrowRight size={19} />
                  </a>
                  <div className="hero-service">
                    <IconMapPin size={17} />
                    <span>
                      Banda Aceh <i /> Aceh Besar <i /> Sabang
                    </span>
                  </div>
                </div>
                <div className="hero-visual">
                  <span className="hero-orbit orbit-one" />
                  <span className="hero-orbit orbit-two" />
                  <span className="hero-spark spark-one">✳</span>
                  <span className="hero-spark spark-two">✳</span>
                  <div className="hero-destination destination-one">
                    <span className="destination-icon">
                      <IconMapPin size={19} />
                    </span>
                    <div>
                      <small>Mulai perjalanan</small>
                      <strong>Banda Aceh</strong>
                    </div>
                  </div>
                  <div className="hero-destination destination-two">
                    <IconRoute size={21} />
                    <span>
                      Lebih dekat dengan
                      <br />
                      <strong>tujuan Anda.</strong>
                    </span>
                  </div>
                  <div className="hero-motor">
                    <Image
                      src="/images/nmax.png"
                      alt="Ilustrasi Yamaha NMAX untuk layanan rental motor ID Rental"
                      width={660}
                      height={530}
                      unoptimized
                      preload
                    />
                  </div>
                  <div className="hero-visual-caption">
                    <span className="caption-dot" />
                    Pilih. Konfirmasi. Jelajahi.<span>Foto unit ilustrasi</span>
                  </div>
                </div>
              </div>
            </section>
            <div className="search-overlap container">
              <SearchForm />
            </div>
            <section className="stats-section container">
              <div className="stats-intro">
                <span className="eyebrow">KENALI ID RENTAL</span>
                <p>
                  Teman perjalanan
                  <br />
                  di setiap tujuan.
                </p>
              </div>
              {data.cms.stats.map((stat, i) => (
                <div className="stat" key={i}>
                  <strong>{stat.value || "—"}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
              <small className="stats-note">Statistik akan diperbarui.</small>
            </section>
            <section className="section section-soft" id="pilihan-motor">
              <div className="container">
                <SectionHeading
                  eyebrow="PILIHAN UNTUK PERJALANAN ANDA"
                  title="Motor yang pas, perjalanan lebih nyaman."
                  description="Dari aktivitas harian hingga menjelajahi kota, pilih motor sesuai kebutuhan Anda."
                >
                  <Link href="/motor" className="btn btn-outline">
                    Lihat Pilihan Motor <IconArrowUpRight size={18} />
                  </Link>
                </SectionHeading>
                <div className="motor-grid preview-grid">
                  {data.motors
                    .filter((m) => m.status === "Siap disewakan")
                    .slice(0, 3)
                    .map((m) => (
                      <MotorCard motor={m} key={m.id} />
                    ))}
                </div>
                <div className="preview-bottom">
                  <span>
                    Armada dan harga adalah contoh prototype. Cari jadwal untuk
                    melihat simulasi ketersediaan.
                  </span>
                  <a href="#pencarian">
                    Cari Motor Sesuai Jadwal <IconArrowRight size={17} />
                  </a>
                </div>
              </div>
            </section>
            <section className="section" id="cara-sewa">
              <div className="container">
                <SectionHeading
                  eyebrow="MUDAH DARI AWAL"
                  title="Empat langkah menuju perjalanan Anda."
                  description="Pilih lewat website, selesaikan konfirmasi bersama admin."
                />
                <div className="steps-grid">
                  {steps.map((step, i) => (
                    <article key={step.title} className="step">
                      <div className="step-top">
                        <span className="step-icon">
                          <step.icon size={27} stroke={1.5} />
                        </span>
                        <span className="step-number">0{i + 1}</span>
                      </div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
            <section className="locations-section section" id="lokasi">
              <div className="container">
                <SectionHeading
                  eyebrow="DEKAT DENGAN TUJUAN ANDA"
                  title="Pilih lokasi pengambilan."
                  description="Area layanan sesuai profil ID Rental. Detail lokasi berikut masih berupa data demo."
                />
                <div className="branch-grid">
                  {data.branches
                    .filter((b) => b.active)
                    .map((b, i) => (
                      <article key={b.id} className="branch-card">
                        <div className="branch-illustration">
                          <span className="location-number">0{i + 1}</span>
                          <IconMapPin size={56} stroke={1.2} />
                          <span className="location-label">AREA LAYANAN</span>
                        </div>
                        <div className="branch-content">
                          <div className="branch-title">
                            <h3>{b.name}</h3>
                            <span className="badge neutral">Demo</span>
                          </div>
                          <p>
                            {b.address || "Alamat akan dikonfirmasi admin."}
                          </p>
                          <div className="branch-hours">
                            <IconClock size={16} />{" "}
                            {b.hours || "Jam operasional belum diatur"}
                          </div>
                          {safeUrl(b.mapUrl) ? (
                            <a
                              className="branch-map"
                              href={safeUrl(b.mapUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Lihat Lokasi <IconArrowUpRight size={18} />
                            </a>
                          ) : (
                            <button className="branch-map" disabled>
                              Lokasi peta belum diatur <IconMapPin size={17} />
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
              </div>
            </section>
            {data.cms.carEnabled && (
              <section className="car-section container">
                <span className="car-icon">
                  <IconCar size={38} stroke={1.4} />
                </span>
                <div>
                  <span className="eyebrow">LAYANAN TAMBAHAN</span>
                  <h2>{data.cms.carTitle}</h2>
                  <p>{data.cms.carDescription}</p>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => setContact("car")}
                >
                  Konsultasikan Sewa Mobil <IconArrowUpRight size={18} />
                </button>
              </section>
            )}
            <section className="section faq-section">
              <div className="faq-grid container">
                <div>
                  <span className="eyebrow">SEBELUM ANDA BERANGKAT</span>
                  <h2>
                    Ada yang ingin
                    <br />
                    Anda tanyakan?
                  </h2>
                  <p>
                    Beberapa informasi untuk membantu
                    <br />
                    merencanakan perjalanan Anda.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setContact("general")}
                  >
                    Tanya langsung ke admin <IconArrowUpRight size={18} />
                  </button>
                </div>
                <div className="faq-list">
                  {data.cms.faqs.map((faq, i) => (
                    <details key={i}>
                      <summary>
                        {faq.question}
                        <IconChevronDown size={19} />
                      </summary>
                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
            <section className="contact-banner">
              <div className="container">
                <div>
                  <span className="eyebrow">
                    SETIAP PERJALANAN PUNYA CERITA
                  </span>
                  <h2>Mulai cerita Anda bersama ID Rental.</h2>
                  <p>
                    Pilih motor Anda. Kami bantu konfirmasikan langkah
                    berikutnya.
                  </p>
                </div>
                <button
                  className="btn btn-yellow"
                  onClick={() => setContact("general")}
                >
                  <IconBrandWhatsapp size={21} /> Hubungi Admin{" "}
                  <IconArrowUpRight size={18} />
                </button>
              </div>
            </section>
          </>
        )}
      </main>
      <PublicFooter />
      {contact && (
        <ContactModal mode={contact} onClose={() => setContact(null)} />
      )}
    </>
  )
}
