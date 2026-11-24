import {
  days,
  normalizeWhatsapp,
  validPeriod,
  isAvailable,
  localDate,
  type DemoData,
  type TenantForm,
  type TenantSubmission,
} from "./rental"
import { mobileVehicles } from "./mobile-rental"

export const PICKUP_OPTIONS = [
  { value: "Ambil di lokasi", fee: 0 },
  { value: "Antar/jemput dalam Kota Banda Aceh", fee: 15000 },
  { value: "Antar/jemput Aceh Besar", fee: 30000 },
  { value: "Antar/jemput pelabuhan", fee: 25000 },
  { value: "Antar/jemput bandara", fee: 40000 },
]
export const RENTAL_TERMS = [
  "Foto KTP dan SIM asli diperlukan. Titip e-KTP asli selama masa sewa sesuai informasi ID Rental.",
  "Jasa antar/jemput: Rp15.000 dalam Kota Banda Aceh, Rp30.000 Aceh Besar, Rp25.000 pelabuhan, dan Rp40.000 bandara.",
  "Harga sewa per jam Rp15.000, minimal 5 jam. Biaya lewat jam sewa Rp10.000–Rp15.000 per jam.",
  "Tidak mengganti part original kendaraan dan menaati peraturan lalu lintas yang berlaku.",
  "Mengganti kehilangan, kerusakan fungsi/fisik, dan kerusakan akibat kelalaian pemakaian sesuai ketentuan pada form manual.",
  "Membayar tilang akibat kelalaian mengemudi. Kendaraan tidak boleh dipindahtangankan, digadai, dijual, atau dihibahkan kepada pihak lain.",
  "Form manual mencantumkan batas area Banda Aceh dan Aceh Besar. Konfirmasikan rencana penggunaan di area lain dengan admin.",
]
export function initialTenantForm(data: DemoData): TenantForm {
  return {
    name: "",
    phone: "",
    phone2: "",
    profession: "",
    company: "",
    ktpAddress: "",
    currentAddress: "",
    branchId: "banda-aceh",
    motorId: "",
    helmets: 0,
    start: data.demoStart,
    end: data.demoEnd,
    purpose: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    guarantor: "",
    guarantorPhone: "",
    guarantorRelationship: "",
    delivery: PICKUP_OPTIONS[0].value,
    equipment: [],
    ktp: null,
    sim: null,
    acceptedTerms: false,
  }
}
export function validateTenantStep(
  form: TenantForm,
  step: number,
  data: DemoData
): string {
  if (step === 0) {
    const complete = form.formMode !== "short"
    if (
      !form.name.trim() ||
      (complete &&
        (!form.profession.trim() ||
          !form.ktpAddress.trim() ||
          !form.currentAddress.trim()))
    )
      return complete
        ? "Lengkapi nama, pekerjaan, alamat KTP, dan alamat sekarang."
        : "Isi nama Anda untuk pemberitahuan ke admin."
    if (!normalizeWhatsapp(form.phone))
      return "Masukkan nomor HP/WhatsApp utama yang valid."
    if (form.phone2.trim() && !normalizeWhatsapp(form.phone2))
      return "Nomor HP/WhatsApp kedua belum valid."
    if (form.guarantorPhone.trim() && !normalizeWhatsapp(form.guarantorPhone))
      return "Nomor HP penjamin belum valid."
    if (form.vehicleKind === "car" && !form.company.trim())
      return "Cantumkan nama instansi untuk pengajuan sewa mobil."
  }
  if (step === 1) {
    const branch = data.branches.find((b) => b.id === form.branchId && b.active)
    const motor = data.motors.find(
      (m) => m.id === form.motorId && m.branchId === form.branchId
    )
    const car =
      form.vehicleKind === "car" &&
      mobileVehicles(data).find(
        (v) =>
          v.kind === "car" &&
          v.id === form.motorId &&
          v.branchId === form.branchId
      )
    if (!branch || (!motor && !car))
      return "Pilih lokasi pengambilan dan kendaraan."
    if (!validPeriod(form.start, form.end))
      return "Tanggal dan jam pengembalian harus sesudah mulai sewa."
    if (
      !car &&
      motor &&
      !isAvailable(motor, data.rentals, form.start, form.end)
    )
      return "Motor tidak tersedia pada jadwal ini. Ubah jadwal atau pilih motor lain."
    if (!Number.isInteger(form.helmets) || form.helmets < 0 || form.helmets > 5)
      return "Jumlah helm harus antara 0 dan 5."
    if ((form.formMode !== "short" || car) && !form.purpose.trim())
      return "Isi tujuan atau keperluan sewa."
    if (!PICKUP_OPTIONS.some((o) => o.value === form.delivery))
      return "Pilih metode pengambilan."
    if (form.formMode && form.delivery !== "Ambil di lokasi") {
      if (form.formMode !== "complete")
        return "Layanan antar membutuhkan formulir lengkap."
      if (!form.deliveryAddress?.trim()) return "Isi alamat tujuan pengantaran."
    }
    if (car && !form.carTermsAccepted)
      return "Baca dan pahami persyaratan sewa mobil terlebih dahulu."
  }
  if (step === 2) {
    if (form.formMode === "short")
      return form.acceptedTerms
        ? ""
        : "Setujui pengiriman permintaan dan konfirmasi admin."
    for (const [label, document] of [
      ["KTP", form.ktp],
      ["SIM", form.sim],
    ] as const) {
      if (
        !document ||
        !document.name ||
        !/^data:image\/(jpeg|png|webp);base64,/.test(document.dataUrl) ||
        document.dataUrl.length > 700000
      )
        return `Unggah foto ${label} yang valid. Gunakan foto contoh pada demo ini.`
    }
    if (!form.acceptedTerms)
      return "Centang persetujuan data dan ketentuan sewa sebelum melanjutkan."
  }
  return ""
}
function templateDate(value: string) {
  const d = new Date(value)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}, ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`
}
export function tenantWhatsappMessage(form: TenantForm, motorName: string) {
  const value = (text: string) => text.trim() || "—"
  return `*꧁ID RENTAL MOTOR꧂*
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
FORMULIR DATA PENYEWA DI ISI LENGKAP
*Nama* : ${value(form.name)}
*NO HP/WA 1* : ${value(form.phone)}
*NO HP/WA 2* : ${value(form.phone2)}
*Pekerjaan* : ${value(form.profession)}
*Nama Istansi* : ${value(form.company)}
*Alamat KTP* : ${value(form.ktpAddress)}
*Alamat Sekarang* : ${value(form.currentAddress)}

DATA MOTOR
*Type Motor* : ${motorName}
*Jumlah Helm* : ${form.helmets}
*Tgl & Jam Mulai* : ${templateDate(form.start)}
*Tgl & Jam Selesai* : ${templateDate(form.end)}
*Jumlah Hari* : ${days(form.start, form.end)} H
*Tujuan* : ${value(form.purpose)}

MEDIA SOSIAL
*FB* : ${value(form.facebook)}
*IG* : ${value(form.instagram)}
*TikTok* : ${value(form.tiktok)}

DOKUMEN WAJIB
*Foto KTP & SIM ASLI* : ${form.ktp?.name || "—"}; ${form.sim?.name || "—"} (foto dikirim terpisah di WhatsApp)
Not:
Titip ektp asli selama sewa

*NOT*
 *JASA ANTAR JEMPUT*
~15K Dalam Kota Banda Aceh
~30K Aceh Besar
~25K Pelabuhan
~40K Bandara

*Harga Sewa Perjam 15K Minimal 5 Jam*

Biaya Lewat Jam Sewa*
Perjam 10K-15K
..................
ALAMAT :
ID Rental Motor Banda Aceh
https://g.co/kgs/8WGhZwH
HP/WA:
0853-7331-1711
(JAM OPERASIONAL KAMI 08:00 -- 22:00)`
}
export function bookingWhatsappMessage(
  form: TenantForm,
  vehicleName: string,
  branchName: string,
  address: string
) {
  const destination =
    form.delivery === "Ambil di lokasi"
      ? `Saya akan datang langsung ke lokasi ID Rental ${branchName} dan melengkapi data serta persyaratan di sana. Mohon konfirmasi alamat dan jadwal sebelum saya datang.`
      : `Saya mengajukan layanan antar ke: ${form.deliveryAddress}. Mohon konfirmasi jangkauan, biaya, dan jadwal pengantaran.`
  if (form.vehicleKind !== "car" && form.formMode !== "short") {
    return `${tenantWhatsappMessage(form, vehicleName)}\n\nPENGAMBILAN\nCabang: ${branchName}\nAlamat rental: ${address}\nMetode: ${form.delivery}\n${destination}\n\nMohon konfirmasi ketersediaan unit dan total biaya. Permintaan ini belum merupakan reservasi terkonfirmasi.`
  }
  return `Halo, Admin ID Rental.\n\n${form.vehicleKind === "car" ? "Saya bermaksud mengajukan konsultasi sewa mobil atas nama instansi dengan rincian berikut:" : "Saya bermaksud memesan motor dan akan mengambilnya langsung di lokasi dengan rincian berikut:"}\n\nNama: ${form.name}\nNo. HP/WA: ${form.phone}${form.vehicleKind === "car" ? `\nInstansi: ${form.company}` : ""}\nKendaraan: ${vehicleName}\nCabang: ${branchName}\nAlamat rental: ${address}\nMulai sewa: ${templateDate(form.start)}\nPengembalian: ${templateDate(form.end)}\nDurasi: ${days(form.start, form.end)} hari${form.purpose ? `\nKeperluan: ${form.purpose}` : ""}\nMetode: ${form.delivery}\n\n${destination}\n\n${form.vehicleKind === "car" ? "Saya memahami layanan mobil hanya untuk instansi. Mohon konfirmasi ketersediaan, biaya, dokumen, serta syarat dan ketentuan sewanya." : "Mohon konfirmasi ketersediaan, total biaya, dan syarat sewa. Permintaan ini belum merupakan reservasi terkonfirmasi."}\n\nTerima kasih.`
}
export function saveTenantForm(
  data: DemoData,
  raw: TenantForm,
  id: string,
  now = new Date()
): { data: DemoData; submission: TenantSubmission } | string {
  const previous = data.submissions.find((s) => s.id === id)
  if (previous) return { data, submission: previous }
  const form = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ])
  ) as unknown as TenantForm
  for (let step = 0; step < 3; step++) {
    const error = validateTenantStep(form, step, data)
    if (error) return error
  }
  const motor = data.motors.find((m) => m.id === form.motorId)
  const vehicle = mobileVehicles(data).find((v) => v.id === form.motorId)!
  const branch = data.branches.find((b) => b.id === form.branchId)!
  const customerId = `customer-${id}`
  const submission: TenantSubmission = {
    ...form,
    id,
    code: `FRM-${String(data.submissions.length + 1).padStart(3, "0")}`,
    createdAt: localDate(now),
    customerId,
    status: "Menunggu konfirmasi",
    motorName: vehicle.name,
    plate: motor?.plate || "Unit mobil contoh",
    branchName: branch.name,
    dailyRate: vehicle.price,
    message:
      form.formMode || form.vehicleKind === "car"
        ? bookingWhatsappMessage(
            form,
            vehicle.name,
            branch.name,
            branch.address
          )
        : tenantWhatsappMessage(form, vehicle.name),
  }
  return {
    submission,
    data: {
      ...data,
      submissions: [submission, ...data.submissions],
      customers: [
        ...data.customers,
        {
          id: customerId,
          name: form.name,
          phone: form.phone,
          email: "",
          address: form.currentAddress,
          notes: `Dari formulir aplikasi ${submission.code}. Pekerjaan: ${form.profession}.`,
        },
      ],
    },
  }
}
