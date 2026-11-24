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
const mobile = load("lib/mobile-rental.ts", { "./rental": rental })
const tenant = load("lib/tenant-form.ts", {
  "./rental": rental,
  "./mobile-rental": mobile,
})
const actions = load("lib/demo-actions.ts", { "./rental": rental })
const data = rental.createDemoData()
const document = {
  name: "document-demo.jpg",
  dataUrl: "data:image/jpeg;base64,ZGVtbw==",
}
const form = {
  ...tenant.initialTenantForm(data),
  name: "Pelanggan Uji",
  phone: "081200000000",
  profession: "Karyawan",
  ktpAddress: "Alamat KTP demo",
  currentAddress: "Alamat sekarang demo",
  motorId: "1",
  purpose: "Operasional",
  ktp: document,
  sim: document,
  acceptedTerms: true,
}
assert.ok(tenant.validateTenantStep({ ...form, name: "" }, 0, data))
assert.ok(tenant.validateTenantStep({ ...form, phone: "abc" }, 0, data))
assert.ok(tenant.validateTenantStep({ ...form, end: form.start }, 1, data))
assert.ok(tenant.validateTenantStep({ ...form, motorId: "3" }, 1, data))
assert.ok(tenant.validateTenantStep({ ...form, motorId: "4" }, 1, data))
assert.ok(tenant.validateTenantStep({ ...form, ktp: null }, 2, data))
assert.ok(tenant.validateTenantStep({ ...form, acceptedTerms: false }, 2, data))
assert.ok(
  tenant.validateTenantStep(
    { ...form, ktp: { ...document, dataUrl: "javascript:alert(1)" } },
    2,
    data
  )
)
const saved = tenant.saveTenantForm(data, form, "request-one")
assert.equal(typeof saved, "object")
assert.equal(saved.data.submissions.length, 1)
assert.equal(saved.submission.status, "Menunggu konfirmasi")
assert.equal(saved.data.customers.length, data.customers.length + 1)
assert.equal(saved.data.rentals.length, data.rentals.length)
assert.equal(
  rental.isAvailable(
    saved.data.motors[0],
    saved.data.rentals,
    form.start,
    form.end
  ),
  true,
  "Form submission is not a confirmed reservation"
)
assert.ok(saved.submission.message.startsWith("*꧁ID RENTAL MOTOR꧂*"))
assert.ok(saved.submission.message.includes("*Nama* : Pelanggan Uji"))
assert.ok(
  saved.submission.message.includes("JAM OPERASIONAL KAMI 08:00 -- 22:00")
)
assert.ok(
  saved.submission.message.includes("foto dikirim terpisah di WhatsApp")
)
assert.ok(!saved.submission.message.includes("data:image"))
const duplicate = tenant.saveTenantForm(saved.data, form, "request-one")
assert.equal(
  duplicate.data.submissions.length,
  1,
  "Repeated submit is idempotent"
)
assert.equal(duplicate.data.customers.length, saved.data.customers.length)
const reserved = actions.saveEntity(
  saved.data,
  "rentals",
  {
    code: "SWA-FORM",
    customerId: saved.submission.customerId,
    motorId: form.motorId,
    start: form.start,
    end: form.end,
    status: "Dipesan",
    price: "150000",
    notes: "Dari formulir",
  },
  "rental-request-one"
)
assert.equal(typeof reserved, "object")
assert.equal(
  rental.isAvailable(
    reserved.motors[0],
    reserved.rentals,
    form.start,
    form.end
  ),
  false
)
assert.equal(
  typeof tenant.saveTenantForm(reserved, form, "request-two"),
  "string",
  "New form is checked against updated availability"
)
const short = {
  ...tenant.initialTenantForm(data),
  formMode: "short",
  vehicleKind: "motor",
  motorId: "1",
  name: "Tamu Ambil Sendiri",
  phone: "081200000000",
  acceptedTerms: true,
}
const pickup = tenant.saveTenantForm(data, short, "pickup")
assert.equal(typeof pickup, "object")
assert.equal(pickup.submission.ktp, null)
assert.ok(pickup.submission.message.includes("akan mengambilnya langsung"))
assert.ok(pickup.submission.message.includes("Cabang:"))
assert.equal(
  typeof tenant.saveTenantForm(
    data,
    { ...short, delivery: tenant.PICKUP_OPTIONS[1].value },
    "bad-delivery"
  ),
  "string"
)
assert.equal(
  typeof tenant.saveTenantForm(
    data,
    {
      ...form,
      formMode: "complete",
      delivery: tenant.PICKUP_OPTIONS[1].value,
      deliveryAddress: "",
    },
    "missing-address"
  ),
  "string"
)
const delivery = tenant.saveTenantForm(
  data,
  {
    ...form,
    formMode: "complete",
    delivery: tenant.PICKUP_OPTIONS[1].value,
    deliveryAddress: "Alamat tujuan uji",
  },
  "delivery"
)
assert.equal(typeof delivery, "object")
assert.ok(delivery.submission.message.includes("Alamat tujuan uji"))
assert.ok(delivery.submission.message.startsWith("*꧁ID RENTAL MOTOR꧂*"))
const car = {
  ...short,
  vehicleKind: "car",
  motorId: "car-1",
  company: "Instansi Uji",
  purpose: "Operasional instansi",
  carTermsAccepted: true,
}
assert.equal(
  typeof tenant.saveTenantForm(data, { ...car, company: "" }, "no-company"),
  "string"
)
assert.equal(
  typeof tenant.saveTenantForm(
    data,
    { ...car, carTermsAccepted: false },
    "unread-terms"
  ),
  "string"
)
const carRequest = tenant.saveTenantForm(data, car, "car")
assert.equal(typeof carRequest, "object")
assert.ok(carRequest.submission.message.includes("Instansi: Instansi Uji"))
assert.equal(carRequest.data.rentals.length, data.rentals.length)
const filters = mobile.initialMobileFilters(data)
assert.equal(mobile.filterMobileVehicles(data, filters).length, 2)
assert.equal(
  mobile.filterMobileVehicles(data, { ...filters, end: filters.start }).length,
  0
)
assert.ok(
  mobile
    .filterMobileVehicles(data, { ...filters, kind: "car" })
    .every((v) => v.kind === "car")
)
assert.equal(
  mobile
    .mobileVehicles({ ...data, cms: { ...data.cms, carEnabled: false } })
    .filter((v) => v.kind === "car").length,
  0
)
console.log(
  "PASS: availability/filtering, short pickup, required delivery fields/documents, institutional car consultation, WhatsApp messages, pending submissions, and reservation validation."
)
