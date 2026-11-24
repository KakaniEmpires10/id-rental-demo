import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import ts from "typescript"

function load(file, imports = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const testModule = { exports: {} }
  vm.runInNewContext(source, {
    exports: testModule.exports,
    module: testModule,
    require: (name) => imports[name],
    Date,
    Intl,
    URL,
  })
  return testModule.exports
}
const rental = load("lib/rental.ts")
const { saveEntity } = load("lib/demo-actions.ts", { "./rental": rental })
const data = rental.createDemoData(new Date("2026-11-23T12:00:00"))
const available = data.motors.filter(
  (m) =>
    m.branchId === "banda-aceh" &&
    rental.isAvailable(m, data.rentals, data.demoStart, data.demoEnd)
)
assert.deepEqual(
  Array.from(available, (m) => m.id),
  ["1", "2"],
  "Maintenance, overlapping bookings, active rentals, other branches, and inactive units are excluded"
)
assert.equal(
  rental.overlaps(
    "2026-11-24T09:00",
    "2026-11-25T09:00",
    "2026-11-25T09:00",
    "2026-11-26T09:00"
  ),
  false,
  "Adjacent schedules do not overlap"
)
assert.equal(rental.validPeriod(data.demoStart, data.demoStart), false)
assert.equal(rental.days("2026-11-24T09:00", "2026-11-25T10:00"), 2)
assert.equal(rental.normalizeWhatsapp("0853 7331-1711"), "6285373311711")
assert.equal(rental.normalizeWhatsapp("+62 853 7331 1711"), "6285373311711")
assert.equal(rental.normalizeWhatsapp("not-configured"), "")
assert.equal(rental.safeUrl("javascript:alert(1)"), "")
const values = {
  code: "SWA-NEW",
  customerId: "c1",
  motorId: "1",
  start: data.demoStart,
  end: data.demoEnd,
  status: "Dipesan",
  price: "150000",
  notes: "",
}
const reserved = saveEntity(data, "rentals", values, "r-new")
assert.equal(typeof reserved, "object")
assert.equal(
  rental.isAvailable(
    reserved.motors[0],
    reserved.rentals,
    data.demoStart,
    data.demoEnd
  ),
  false
)
assert.equal(
  typeof saveEntity(
    reserved,
    "rentals",
    { ...values, code: "SWA-DUP" },
    "r-dup"
  ),
  "string",
  "Double booking is rejected"
)
assert.equal(
  typeof saveEntity(data, "rentals", { ...values, motorId: "3" }, "r-workshop"),
  "string"
)
const cancelled = saveEntity(
  reserved,
  "rentals",
  { ...values, status: "Dibatalkan" },
  "r-new"
)
assert.equal(
  rental.isAvailable(
    cancelled.motors[0],
    cancelled.rentals,
    data.demoStart,
    data.demoEnd
  ),
  true
)
const maintenance = {
  motorId: "1",
  issue: "Servis demo",
  start: data.demoStart,
  end: data.demoEnd,
  status: "Dalam proses",
  notes: "",
}
const workshop = saveEntity(data, "maintenance", maintenance, "p-new")
assert.equal(workshop.motors[0].status, "Dalam perawatan")
assert.equal(
  rental.isAvailable(
    workshop.motors[0],
    workshop.rentals,
    data.demoStart,
    data.demoEnd
  ),
  false
)
const repaired = saveEntity(
  workshop,
  "maintenance",
  { ...maintenance, status: "Selesai" },
  "p-new"
)
assert.equal(repaired.motors[0].status, "Siap disewakan")
assert.equal(
  typeof saveEntity(
    data,
    "maintenance",
    { ...maintenance, motorId: "8" },
    "p-active"
  ),
  "string",
  "Active rental cannot enter maintenance"
)
const message = rental.whatsappMessage(
  "Alim",
  "",
  data.motors[0],
  data.branches[0],
  { branch: "banda-aceh", start: data.demoStart, end: data.demoEnd, type: "" }
)
assert.ok(
  message.includes("Nama: Alim") &&
    message.includes("Mohon konfirmasi") &&
    !message.includes("Catatan:")
)
assert.equal(
  data.rentals.length,
  3,
  "WhatsApp message creation does not mutate reservations"
)
console.log(
  "PASS: availability, adjacent schedules, double booking, cancellation, maintenance lifecycle, active-rental guard, duration, WhatsApp normalization and message."
)
