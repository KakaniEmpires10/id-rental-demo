"use client"
import { useState, type FormEvent } from "react"
import {
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
  IconInfoCircle,
} from "@tabler/icons-react"
import { useRental } from "./rental-provider"
import { EditorFields, type Field } from "./admin-editor"
import type { FormValues } from "@/lib/demo-actions"
import type { Cms } from "@/lib/rental"
export type CmsTab = "landing" | "stats" | "faq" | "contact" | "car"
export function CmsEditor({ tab }: { tab: CmsTab }) {
  const { data, update, notify } = useRental()
  const [cms, setCms] = useState<Cms>(structuredClone(data.cms))
  const values = Object.fromEntries(
    Object.entries(cms).filter(
      ([, v]) => typeof v === "string" || typeof v === "boolean"
    )
  ) as FormValues
  const fields: Partial<Record<CmsTab, Field[]>> = {
    landing: [
      { key: "heroTitle", label: "Judul hero", required: true, full: true },
      {
        key: "heroDescription",
        label: "Deskripsi hero",
        type: "textarea",
        full: true,
      },
      {
        key: "logo",
        label: "Logo asli ID Rental",
        type: "image",
        full: true,
        hint: "Gambar ditampilkan utuh, dalam wadah berlatar gelap.",
      },
      {
        key: "footerDescription",
        label: "Deskripsi footer",
        type: "textarea",
        full: true,
      },
    ],
    contact: [
      { key: "contact", label: "Informasi lokasi / kontak utama", full: true },
      {
        key: "whatsapp",
        label: "Nomor WhatsApp utama",
        hint: "Nomor publik Instagram: 085373311711. Format 08… dinormalisasi menjadi 628….",
      },
      { key: "email", label: "Email (opsional)", type: "email" },
      { key: "instagram", label: "URL Instagram", type: "url", full: true },
    ],
    car: [
      {
        key: "carEnabled",
        label: "Tampilkan section layanan mobil",
        type: "checkbox",
        full: true,
      },
      { key: "carTitle", label: "Judul section", required: true, full: true },
      {
        key: "carDescription",
        label: "Deskripsi layanan mobil",
        type: "textarea",
        full: true,
        hint: "Mobil merupakan layanan tambahan melalui konsultasi admin sesuai syarat dan ketentuan.",
      },
    ],
  }
  function submit(e: FormEvent) {
    e.preventDefault()
    update((d) => ({ ...d, cms }))
    notify("Konten website berhasil diperbarui.")
  }
  return (
    <form className="cms-editor panel" onSubmit={submit}>
      <div className="panel-heading">
        <div>
          <h2>Konten yang tampil di website</h2>
          <p>Ubah konten, simpan, lalu lihat hasilnya pada halaman publik.</p>
        </div>
        <span className="badge neutral">CMS DEMO</span>
      </div>
      {fields[tab] && (
        <EditorFields
          fields={fields[tab]!}
          values={values}
          setValues={(v) => setCms((c) => ({ ...c, ...v }) as Cms)}
        />
      )}
      {tab === "stats" && (
        <>
          <p className="notice">
            <IconInfoCircle size={18} /> Gunakan “—” sampai angka bisnis
            dikonfirmasi. Statistik publik terpisah dari jumlah unit demo di
            dashboard.
          </p>
          <div className="cms-stats">
            {cms.stats.map((stat, i) => (
              <div className="editor-grid" key={i}>
                <label>
                  Label statistik {i + 1}
                  <input
                    required
                    value={stat.label}
                    onChange={(e) =>
                      setCms((c) => ({
                        ...c,
                        stats: c.stats.map((s, j) =>
                          j === i ? { ...s, label: e.target.value } : s
                        ),
                      }))
                    }
                  />
                </label>
                <label>
                  Nilai
                  <input
                    value={stat.value}
                    placeholder="—"
                    onChange={(e) =>
                      setCms((c) => ({
                        ...c,
                        stats: c.stats.map((s, j) =>
                          j === i ? { ...s, value: e.target.value } : s
                        ),
                      }))
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === "faq" && (
        <div className="cms-faq">
          {cms.faqs.map((faq, i) => (
            <div className="cms-faq-item" key={i}>
              <div>
                <span>Pertanyaan {i + 1}</span>
                <button
                  type="button"
                  className="icon-button danger-text"
                  onClick={() =>
                    setCms((c) => ({
                      ...c,
                      faqs: c.faqs.filter((_, j) => i !== j),
                    }))
                  }
                  aria-label={`Hapus pertanyaan ${i + 1}`}
                >
                  <IconTrash size={18} />
                </button>
              </div>
              <label>
                Pertanyaan
                <input
                  required
                  value={faq.question}
                  onChange={(e) =>
                    setCms((c) => ({
                      ...c,
                      faqs: c.faqs.map((f, j) =>
                        i === j ? { ...f, question: e.target.value } : f
                      ),
                    }))
                  }
                />
              </label>
              <label>
                Jawaban
                <textarea
                  required
                  rows={3}
                  value={faq.answer}
                  onChange={(e) =>
                    setCms((c) => ({
                      ...c,
                      faqs: c.faqs.map((f, j) =>
                        i === j ? { ...f, answer: e.target.value } : f
                      ),
                    }))
                  }
                />
              </label>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              setCms((c) => ({
                ...c,
                faqs: [...c.faqs, { question: "", answer: "" }],
              }))
            }
          >
            <IconPlus size={17} /> Tambah FAQ
          </button>
        </div>
      )}
      <div className="cms-save">
        <button className="btn btn-primary">
          <IconDeviceFloppy size={18} /> Simpan Perubahan
        </button>
        <span>Perubahan disimpan lokal pada browser ini.</span>
      </div>
    </form>
  )
}
