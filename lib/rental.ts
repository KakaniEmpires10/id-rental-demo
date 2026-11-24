export type MotorType = "Matic" | "Manual" | "Sport"
export type OperationalStatus =
  "Siap disewakan" | "Dalam perawatan" | "Nonaktif"
export type RentalStatus = "Dipesan" | "Aktif" | "Selesai" | "Dibatalkan"
export interface Motor {
  id: string
  code: string
  brand: string
  model: string
  plate: string
  type: MotorType
  year: string
  cc: string
  transmission: string
  branchId: string
  price: number
  photo: string
  status: OperationalStatus
  notes: string
}
export interface Branch {
  id: string
  name: string
  address: string
  hours: string
  whatsapp: string
  mapUrl: string
  active: boolean
}
export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  notes: string
}
export interface Rental {
  id: string
  code: string
  customerId: string
  motorId: string
  branchId: string
  start: string
  end: string
  status: RentalStatus
  price: number
  notes: string
}
export interface Maintenance {
  id: string
  motorId: string
  issue: string
  start: string
  end: string
  status: "Dalam proses" | "Selesai"
  notes: string
  previousStatus: OperationalStatus
}
export interface Cms {
  heroTitle: string
  heroDescription: string
  logo: string
  footerDescription: string
  contact: string
  whatsapp: string
  email: string
  instagram: string
  stats: { label: string; value: string }[]
  faqs: { question: string; answer: string }[]
  carEnabled: boolean
  carTitle: string
  carDescription: string
}
export interface DemoData {
  version: number
  motors: Motor[]
  branches: Branch[]
  rentals: Rental[]
  maintenance: Maintenance[]
  customers: Customer[]
  submissions: TenantSubmission[]
  cms: Cms
  demoStart: string
  demoEnd: string
}
export interface TenantDocument {
  name: string
  dataUrl: string
}
export interface TenantForm {
  vehicleKind?: "motor" | "car"
  formMode?: "short" | "complete"
  deliveryAddress?: string
  carTermsAccepted?: boolean
  accountId?: string
  name: string
  phone: string
  phone2: string
  profession: string
  company: string
  ktpAddress: string
  currentAddress: string
  motorId: string
  branchId: string
  helmets: number
  start: string
  end: string
  purpose: string
  facebook: string
  instagram: string
  tiktok: string
  guarantor: string
  guarantorPhone: string
  guarantorRelationship: string
  delivery: string
  equipment: string[]
  ktp: TenantDocument | null
  sim: TenantDocument | null
  acceptedTerms: boolean
}
export interface TenantSubmission extends TenantForm {
  id: string
  code: string
  createdAt: string
  customerId: string
  status: "Menunggu konfirmasi" | "Ditindaklanjuti" | "Dibatalkan"
  rentalId?: string
  motorName: string
  plate: string
  branchName: string
  dailyRate: number
  message: string
}
export interface SearchFilters {
  branch: string
  start: string
  end: string
  type: string
}
export const DEMO_EMAIL = "admin@idrental.demo"
export const DEMO_PASSWORD = "DemoID123!"
export const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
export const dateTime = (value: string) =>
  value && Number.isFinite(new Date(value).getTime())
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        hourCycle: "h23",
      }).format(new Date(value))
    : "Belum dipilih"
export function localDate(date: Date) {
  const pad = (v: number) => String(v).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
export function days(start: string, end: string) {
  return Math.max(
    1,
    Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000
    )
  )
}
export function validPeriod(start: string, end: string) {
  return (
    Number.isFinite(new Date(start).getTime()) &&
    Number.isFinite(new Date(end).getTime()) &&
    new Date(end) > new Date(start)
  )
}
export function overlaps(
  start: string,
  end: string,
  otherStart: string,
  otherEnd: string
) {
  return (
    new Date(start) < new Date(otherEnd) && new Date(end) > new Date(otherStart)
  )
}
export function rentalBlocks(rental: Rental) {
  return rental.status === "Dipesan" || rental.status === "Aktif"
}
export function isAvailable(
  motor: Motor,
  rentals: Rental[],
  start: string,
  end: string,
  exceptId?: string
) {
  return (
    validPeriod(start, end) &&
    motor.status === "Siap disewakan" &&
    !rentals.some(
      (r) =>
        r.id !== exceptId &&
        r.motorId === motor.id &&
        rentalBlocks(r) &&
        overlaps(r.start, r.end, start, end)
    )
  )
}
export function motorStatus(motor: Motor, rentals: Rental[], now = new Date()) {
  if (motor.status === "Dalam perawatan") return "Di bengkel"
  if (motor.status === "Nonaktif") return "Nonaktif"
  const current = rentals.find(
    (r) =>
      r.motorId === motor.id &&
      rentalBlocks(r) &&
      new Date(r.start) <= now &&
      new Date(r.end) > now
  )
  if (current) return current.status === "Aktif" ? "Dipakai" : "Dipesan"
  if (
    rentals.some(
      (r) =>
        r.motorId === motor.id &&
        r.status === "Dipesan" &&
        new Date(r.start) > now
    )
  )
    return "Dipesan"
  return "Tersedia"
}
export function normalizeWhatsapp(input: string) {
  let n = input.replace(/[\s()+.-]/g, "")
  if (n.startsWith("08")) n = `62${n.slice(1)}`
  if (n.startsWith("8")) n = `62${n}`
  return /^\d{8,15}$/.test(n) && !n.startsWith("0") ? n : ""
}
export function safeUrl(input: string) {
  try {
    const url = new URL(input)
    return ["https:", "http:"].includes(url.protocol) ? url.href : ""
  } catch {
    return ""
  }
}
export function whatsappMessage(
  name: string,
  notes: string,
  motor: Motor,
  branch: Branch,
  filters: SearchFilters
) {
  return `Halo, Admin ID Rental.\n\nSaya melihat layanan ID Rental melalui website dan bermaksud mengajukan pemesanan motor dengan rincian berikut:\n\nNama: ${name.trim()}\nMotor: ${motor.brand} ${motor.model}\nCabang pengambilan: ${branch.name}\nAlamat pengambilan: ${branch.address || "Akan dikonfirmasi admin"}\nMulai sewa: ${dateTime(filters.start)}\nPengembalian: ${dateTime(filters.end)}\nDurasi: ${days(filters.start, filters.end)} hari (pembulatan per 24 jam)${notes.trim() ? `\nCatatan: ${notes.trim()}` : ""}\n\nSaya berencana mengambil motor langsung di lokasi dan melengkapi data serta persyaratan sewa di sana.\n\nMohon konfirmasi ketersediaan unit, total biaya, serta syarat dan ketentuan sewanya.\n\nTerima kasih.`
}
export function createDemoData(now = new Date()): DemoData {
  const at = (offset: number, hour = 9) => {
    const d = new Date(now)
    d.setDate(d.getDate() + offset)
    d.setHours(hour, 0, 0, 0)
    return localDate(d)
  }
  const branches: Branch[] = [
    {
      id: "banda-aceh",
      name: "Banda Aceh",
      address: "Alamat lokasi pengambilan akan dikonfirmasi admin (demo).",
      hours: "Jam operasional akan dikonfirmasi",
      whatsapp: "085373311711",
      mapUrl: "",
      active: true,
    },
    {
      id: "aceh-besar",
      name: "Aceh Besar",
      address: "Alamat lokasi pengambilan akan dikonfirmasi admin (demo).",
      hours: "Jam operasional akan dikonfirmasi",
      whatsapp: "",
      mapUrl: "",
      active: true,
    },
    {
      id: "sabang",
      name: "Sabang",
      address: "Alamat lokasi pengambilan akan dikonfirmasi admin (demo).",
      hours: "Jam operasional akan dikonfirmasi",
      whatsapp: "",
      mapUrl: "",
      active: true,
    },
  ]
  const unit = (
    id: string,
    model: string,
    type: MotorType,
    branchId: string,
    price: number,
    photo: string,
    status: OperationalStatus = "Siap disewakan"
  ): Motor => ({
    id,
    code: `MTR-${id.padStart(3, "0")}`,
    brand: "Yamaha",
    model,
    plate: `DEMO-${id.padStart(3, "0")}`,
    type,
    branchId,
    price,
    photo: `/images/${photo}.png`,
    status,
    transmission: type === "Matic" ? "Otomatis" : "Manual",
    year: "2025",
    cc: model.includes("Gear") || model.includes("Fazzio") ? "125" : "155",
    notes:
      "Unit dan tarif contoh untuk demonstrasi, bukan inventori aktual ID Rental.",
  })
  return {
    version: 1,
    demoStart: at(1),
    demoEnd: at(3),
    branches,
    submissions: [],
    motors: [
      unit("1", "NMAX", "Matic", "banda-aceh", 150000, "nmax"),
      unit("2", "Fazzio", "Matic", "banda-aceh", 100000, "fazzio"),
      unit(
        "3",
        "Gear 125",
        "Matic",
        "banda-aceh",
        80000,
        "gear",
        "Dalam perawatan"
      ),
      unit("4", "XSR 155", "Sport", "banda-aceh", 175000, "xsr"),
      unit("5", "Fazzio", "Matic", "sabang", 110000, "fazzio"),
      unit("6", "Gear 125", "Matic", "aceh-besar", 80000, "gear"),
      unit("7", "XSR 155", "Manual", "aceh-besar", 150000, "xsr", "Nonaktif"),
      unit("8", "NMAX", "Matic", "banda-aceh", 150000, "nmax"),
    ],
    customers: [
      {
        id: "c1",
        name: "Pelanggan Demo",
        phone: "",
        email: "",
        address: "",
        notes: "Data simulasi untuk presentasi.",
      },
      {
        id: "c2",
        name: "Tamu Demo",
        phone: "",
        email: "",
        address: "",
        notes: "Data simulasi.",
      },
    ],
    rentals: [
      {
        id: "r1",
        code: "SWA-001",
        customerId: "c1",
        motorId: "4",
        branchId: "banda-aceh",
        start: at(1),
        end: at(4),
        status: "Dipesan",
        price: 175000,
        notes: "Contoh jadwal bentrok saat mencari besok.",
      },
      {
        id: "r2",
        code: "SWA-002",
        customerId: "c2",
        motorId: "8",
        branchId: "banda-aceh",
        start: at(-1),
        end: at(2, 17),
        status: "Aktif",
        price: 150000,
        notes: "Contoh motor sedang dipakai.",
      },
      {
        id: "r3",
        code: "SWA-003",
        customerId: "c1",
        motorId: "2",
        branchId: "banda-aceh",
        start: at(1),
        end: at(3),
        status: "Dibatalkan",
        price: 100000,
        notes: "Pembatalan tidak memblokir ketersediaan.",
      },
    ],
    maintenance: [
      {
        id: "p1",
        motorId: "3",
        issue: "Servis berkala (demo)",
        start: at(0),
        end: at(2),
        status: "Dalam proses",
        previousStatus: "Siap disewakan",
        notes: "Contoh motor di bengkel.",
      },
    ],
    cms: {
      heroTitle: "Sewa motor, lebih leluasa di perjalanan.",
      heroDescription:
        "Temukan motor untuk aktivitas harian dan perjalanan Anda bersama ID Rental. Pilih lokasi dan tanggal sewa, lalu konfirmasikan pilihan Anda dengan admin.",
      logo: "/images/id-rental-logo.jpg",
      footerDescription:
        "ID Rental menyediakan layanan sewa motor untuk kebutuhan perjalanan Anda. Layanan mobil tersedia dengan syarat dan ketentuan tertentu melalui konfirmasi admin.",
      contact: "Banda Aceh, Aceh Besar & Sabang",
      whatsapp: "085373311711",
      email: "",
      instagram: "https://www.instagram.com/idrentalmotor/",
      stats: [
        { label: "Motor dalam armada", value: "—" },
        { label: "Pelanggan dilayani", value: "—" },
        { label: "Tahun beroperasi", value: "—" },
      ],
      carEnabled: true,
      carTitle: "Butuh mobil untuk perjalanan Anda?",
      carDescription:
        "ID Rental juga melayani kebutuhan sewa mobil dengan syarat dan ketentuan tertentu. Hubungi admin untuk membahas kebutuhan, ketersediaan, dan ketentuan sewanya.",
      faqs: [
        {
          question: "Bagaimana cara memesan motor?",
          answer:
            "Pilih lokasi dan jadwal sewa, cari motor, lalu kirim pilihan Anda melalui WhatsApp. Admin akan membantu mengonfirmasi pemesanan Anda.",
        },
        {
          question: "Bagaimana memastikan ketersediaan motor?",
          answer:
            "Hasil pencarian menunjukkan ketersediaan berdasarkan data simulasi. Ketersediaan unit yang sebenarnya perlu dikonfirmasi bersama admin ID Rental.",
        },
        {
          question: "Bagaimana mengetahui harga dan ketentuan sewa?",
          answer:
            "Harga yang ditampilkan pada demo merupakan contoh. Hubungi admin untuk memperoleh total biaya serta syarat dan ketentuan sewa yang berlaku.",
        },
        {
          question: "Di mana motor diambil dan dikembalikan?",
          answer:
            "Lokasi pengambilan dan pengembalian disepakati bersama admin. Pilih area layanan Anda, lalu konfirmasikan alamat serta waktunya sebelum datang.",
        },
        {
          question: "Apakah ID Rental menyediakan mobil?",
          answer:
            "Layanan sewa mobil tersedia sebagai layanan tambahan dengan syarat dan ketentuan tertentu. Silakan berkonsultasi dengan admin mengenai kebutuhan Anda.",
        },
      ],
    },
  }
}
