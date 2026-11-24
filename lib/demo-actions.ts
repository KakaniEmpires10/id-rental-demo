import {
  isAvailable,
  rentalBlocks,
  validPeriod,
  type DemoData,
  type Motor,
  type Branch,
  type Customer,
  type Rental,
  type Maintenance,
} from "./rental"
export type EntityKind =
  "motors" | "branches" | "rentals" | "maintenance" | "customers"
export type FormValues = Record<string, string | boolean>
export function saveEntity(
  data: DemoData,
  kind: EntityKind,
  values: FormValues,
  id: string
): DemoData | string {
  const text = (key: string) => String(values[key] || "").trim()
  const number = (key: string) => Number(text(key)) || 0
  const put = <T extends { id: string }>(items: T[], item: T) =>
    items.some((i) => i.id === id)
      ? items.map((i) => (i.id === id ? item : i))
      : [...items, item]
  if (kind === "motors") {
    if (!text("code") || !text("brand") || !text("model"))
      return "Isi kode unit, merek, dan model motor."
    if (
      data.motors.some(
        (m) =>
          m.id !== id && m.code.toLowerCase() === text("code").toLowerCase()
      )
    )
      return "Kode unit sudah digunakan."
    if (!data.branches.some((b) => b.id === text("branchId") && b.active))
      return "Pilih cabang aktif."
    if (
      data.maintenance.some(
        (m) => m.motorId === id && m.status === "Dalam proses"
      ) &&
      text("status") !== "Dalam perawatan"
    )
      return "Selesaikan perawatan motor terlebih dahulu sebelum mengganti status operasional."
    const existing = data.motors.find((m) => m.id === id)
    if (
      existing &&
      (existing.branchId !== text("branchId") ||
        text("status") !== "Siap disewakan") &&
      data.rentals.some(
        (r) =>
          r.motorId === id && rentalBlocks(r) && new Date(r.end) > new Date()
      )
    )
      return "Motor masih memiliki sewa atau reservasi. Selesaikan atau batalkan jadwal sebelum mengubah cabang/status."
    const motor: Motor = {
      id,
      code: text("code"),
      brand: text("brand"),
      model: text("model"),
      plate: text("plate"),
      type: text("type") as Motor["type"],
      year: text("year"),
      cc: text("cc"),
      transmission: text("transmission"),
      branchId: text("branchId"),
      price: number("price"),
      photo: text("photo") || "/images/nmax.png",
      status: text("status") as Motor["status"],
      notes: text("notes"),
    }
    return { ...data, motors: put(data.motors, motor) }
  }
  if (kind === "branches") {
    if (!text("name")) return "Isi nama cabang."
    if (
      !values.active &&
      data.rentals.some(
        (r) =>
          r.branchId === id && rentalBlocks(r) && new Date(r.end) > new Date()
      )
    )
      return "Cabang masih memiliki sewa atau reservasi. Selesaikan jadwal sebelum menonaktifkannya."
    const branch: Branch = {
      id,
      name: text("name"),
      address: text("address"),
      hours: text("hours"),
      whatsapp: text("whatsapp"),
      mapUrl: text("mapUrl"),
      active: !!values.active,
    }
    return { ...data, branches: put(data.branches, branch) }
  }
  if (kind === "customers") {
    if (!text("name")) return "Isi nama pelanggan."
    const customer: Customer = {
      id,
      name: text("name"),
      phone: text("phone"),
      email: text("email"),
      address: text("address"),
      notes: text("notes"),
    }
    return { ...data, customers: put(data.customers, customer) }
  }
  if (kind === "rentals") {
    if (!text("code")) return "Isi kode sewa."
    if (
      data.rentals.some(
        (r) =>
          r.id !== id && r.code.toLowerCase() === text("code").toLowerCase()
      )
    )
      return "Kode sewa sudah digunakan."
    if (!data.customers.some((c) => c.id === text("customerId")))
      return "Pilih pelanggan. Tambahkan pelanggan di menu Pelanggan jika belum ada."
    const motor = data.motors.find((m) => m.id === text("motorId"))
    if (!motor) return "Pilih motor."
    if (!validPeriod(text("start"), text("end")))
      return "Jadwal selesai harus sesudah jadwal mulai."
    if (["Aktif", "Dipesan"].includes(text("status"))) {
      if (!data.branches.some((b) => b.id === motor.branchId && b.active))
        return "Cabang motor tidak aktif."
      if (!isAvailable(motor, data.rentals, text("start"), text("end"), id))
        return "Motor tidak siap disewakan atau jadwal bertabrakan dengan sewa lain. Pilih motor/jadwal berbeda."
    }
    const rental: Rental = {
      id,
      code: text("code"),
      customerId: text("customerId"),
      motorId: motor.id,
      branchId: motor.branchId,
      start: text("start"),
      end: text("end"),
      status: text("status") as Rental["status"],
      price: number("price"),
      notes: text("notes"),
    }
    return { ...data, rentals: put(data.rentals, rental) }
  }
  const motor = data.motors.find((m) => m.id === text("motorId"))
  if (!motor) return "Pilih motor untuk perawatan."
  if (!text("issue")) return "Isi keluhan atau jenis perawatan."
  if (!validPeriod(text("start"), text("end")))
    return "Estimasi selesai harus sesudah tanggal masuk."
  const existing = data.maintenance.find((m) => m.id === id)
  if (existing && existing.motorId !== motor.id)
    return "Motor pada catatan perawatan tidak dapat diganti. Buat catatan baru untuk motor lain."
  if (text("status") === "Dalam proses") {
    if (
      data.maintenance.some(
        (m) =>
          m.id !== id && m.motorId === motor.id && m.status === "Dalam proses"
      )
    )
      return "Motor ini sudah memiliki perawatan dalam proses."
    if (
      data.rentals.some((r) => r.motorId === motor.id && r.status === "Aktif")
    )
      return "Motor sedang dalam sewa aktif. Catat pengembalian sebelum memasukkan motor ke perawatan."
  }
  const previousStatus =
    existing?.status === "Dalam proses" ? existing.previousStatus : motor.status
  const maintenance: Maintenance = {
    id,
    motorId: motor.id,
    issue: text("issue"),
    start: text("start"),
    end: text("end"),
    status: text("status") as Maintenance["status"],
    notes: text("notes"),
    previousStatus,
  }
  const wasBlocking =
    existing?.status === "Dalam proses" && motor.status === "Dalam perawatan"
  return {
    ...data,
    maintenance: put(data.maintenance, maintenance),
    motors: data.motors.map((m) =>
      m.id === motor.id
        ? {
            ...m,
            status:
              maintenance.status === "Dalam proses"
                ? "Dalam perawatan"
                : wasBlocking
                  ? existing.previousStatus
                  : m.status,
          }
        : m
    ),
  }
}
