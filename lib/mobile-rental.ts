import {
  isAvailable,
  validPeriod,
  type DemoData,
  type TenantForm,
} from "./rental"

export interface MobileVehicle {
  id: string
  kind: "motor" | "car"
  name: string
  brand: string
  category: string
  transmission: string
  specification: string
  branchId: string
  price: number
  photo: string
  description: string
}
export interface MobileFilters {
  branch: string
  start: string
  end: string
  kind: string
  type: string
  brand: string
  maxPrice: string
  sort: string
}
export const DEMO_CARS: MobileVehicle[] = [
  {
    id: "car-1",
    kind: "car",
    name: "Toyota Veloz",
    brand: "Toyota",
    category: "MPV",
    transmission: "Automatic",
    specification: "7 kursi · unit ilustrasi",
    branchId: "banda-aceh",
    price: 0,
    photo: "/images/veloz.png",
    description:
      "Pilihan kendaraan untuk perjalanan operasional instansi. Model yang ditampilkan merupakan contoh; unit dan ketersediaan aktual dikonfirmasi admin.",
  },
  {
    id: "car-2",
    kind: "car",
    name: "Toyota Veloz",
    brand: "Toyota",
    category: "MPV",
    transmission: "Automatic",
    specification: "7 kursi · unit ilustrasi",
    branchId: "aceh-besar",
    price: 0,
    photo: "/images/veloz.png",
    description:
      "Contoh pilihan mobil untuk kebutuhan instansi di Aceh Besar. Hubungi admin untuk membahas unit, wilayah penggunaan, dan ketentuan.",
  },
]
export const CAR_TERMS = [
  [
    "Untuk kebutuhan instansi",
    "Pengajuan sewa mobil dilakukan atas nama instansi atau perusahaan, bukan pemesanan pribadi.",
  ],
  [
    "Ada penanggung jawab",
    "Cantumkan nama instansi, kontak penanggung jawab, dan rencana penggunaan agar admin dapat membantu.",
  ],
  [
    "Konfirmasi sebelum perjalanan",
    "Ketersediaan, biaya, pengambilan atau pengantaran, dan dokumen instansi dibahas dengan admin terlebih dahulu.",
  ],
]
export function mobileVehicles(data: DemoData): MobileVehicle[] {
  const motors: MobileVehicle[] = data.motors
    .filter((m) => m.status === "Siap disewakan")
    .map((m) => ({
      id: m.id,
      kind: "motor",
      name: `${m.brand} ${m.model}`,
      brand: m.brand,
      category: m.type,
      transmission: m.transmission,
      specification: m.cc ? `${m.cc} cc` : "Motor rental",
      branchId: m.branchId,
      price: m.price,
      photo: m.photo,
      description:
        "Pilihan motor untuk aktivitas harian dan perjalanan Anda. Periksa jadwal, pilih cara pengambilan, lalu konfirmasikan kebutuhan bersama admin.",
    }))
  return [...motors, ...(data.cms.carEnabled ? DEMO_CARS : [])].filter((v) =>
    data.branches.some((b) => b.id === v.branchId && b.active)
  )
}
export function initialMobileFilters(data: DemoData): MobileFilters {
  return {
    branch: data.branches.find((b) => b.active)?.id || "",
    start: data.demoStart,
    end: data.demoEnd,
    kind: "motor",
    type: "",
    brand: "",
    maxPrice: "",
    sort: "recommended",
  }
}
export function filterMobileVehicles(data: DemoData, filters: MobileFilters) {
  if (!validPeriod(filters.start, filters.end)) return []
  return mobileVehicles(data)
    .filter((v) => {
      if (filters.branch && v.branchId !== filters.branch) return false
      if (filters.kind !== "all" && filters.kind && v.kind !== filters.kind)
        return false
      if (filters.type && v.category !== filters.type) return false
      if (filters.brand && v.brand !== filters.brand) return false
      if (filters.maxPrice && v.price > Number(filters.maxPrice)) return false
      if (v.kind === "car") return true
      const motor = data.motors.find((m) => m.id === v.id)!
      return isAvailable(motor, data.rentals, filters.start, filters.end)
    })
    .sort((a, b) =>
      a.kind !== b.kind
        ? a.kind === "car"
          ? 1
          : -1
        : filters.sort === "low"
          ? a.price - b.price
          : filters.sort === "high"
            ? b.price - a.price
            : 0
    )
}
export function pickupMap(data: DemoData, branchId: string) {
  const url =
    data.branches.find((b) => b.id === branchId)?.mapUrl ||
    (branchId === "banda-aceh" ? "https://g.co/kgs/8WGhZwH" : "")
  return /^https?:\/\//.test(url) ? url : ""
}
export interface MobileAccount {
  id: string
  email: string
  password: string
  details: Partial<TenantForm>
}
export function profileDetails(form: TenantForm): Partial<TenantForm> {
  return Object.fromEntries(
    [
      "name",
      "phone",
      "phone2",
      "profession",
      "company",
      "ktpAddress",
      "currentAddress",
      "facebook",
      "instagram",
      "tiktok",
    ]
      .filter((key) => typeof form[key as keyof TenantForm] === "string")
      .map((key) => [key, form[key as keyof TenantForm]])
  )
}
