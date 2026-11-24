import assert from "node:assert/strict"
import fs from "node:fs/promises"
import { pathToFileURL } from "node:url"

// Use an existing Playwright module: node scripts/browser-check.mjs <path-to-playwright/index.mjs>
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const base = process.env.DEMO_URL || "http://localhost:3002"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "id-ID",
  permissions: ["clipboard-read", "clipboard-write"],
})
const page = await context.newPage()
const errors = []
page.on("pageerror", (error) => errors.push(error.message))
await fs.mkdir(".qa", { recursive: true })
const readData = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("id-rental-demo-v1")))
const assertNoOverflow = async () =>
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    ),
    "No horizontal page overflow"
  )
try {
  await page.goto(base)
  await page.getByRole("heading", { name: /Sewa motor,/ }).waitFor()
  await page.screenshot({ path: ".qa/landing-desktop.png", fullPage: true })
  await assertNoOverflow()
  await page
    .getByLabel("Lokasi pengambilan", { exact: true })
    .selectOption("banda-aceh")
  await page.getByRole("button", { name: "Cari Motor Tersedia" }).click()
  await page.waitForURL(/\/motor\?/)
  await page.getByText("2 motor", { exact: true }).waitFor()
  const searchUrl = page.url()
  await page.reload()
  await page.getByText("2 motor", { exact: true }).waitFor()
  assert.equal(page.url(), searchUrl)
  await page.getByRole("button", { name: "Cari Motor Tersedia" }).click()
  await page.getByRole("button", { name: "Cari Motor Tersedia" }).waitFor()
  assert.equal(
    await page.getByRole("button", { name: "Cari Motor Tersedia" }).isEnabled(),
    true,
    "Searching the same URL remains usable"
  )
  await assertNoOverflow()
  await page.screenshot({ path: ".qa/results-desktop.png", fullPage: true })
  await page
    .getByRole("button", { name: "Pesan Yamaha NMAX via WhatsApp" })
    .click()
  await page.getByLabel(/Nama pelanggan/).fill("Alim Demo")
  await page.getByRole("button", { name: "Lihat Pratinjau Pesan" }).click()
  const link = page.getByRole("link", { name: /Lanjutkan ke WhatsApp/ })
  const href = await link.getAttribute("href")
  assert.ok(href.startsWith("https://wa.me/6285373311711?text="))
  assert.ok(decodeURIComponent(href).includes("Nama: Alim Demo"))
  assert.ok(!decodeURIComponent(href).includes("Catatan:"))
  const beforeWa = (await readData()).rentals.length
  await page.getByRole("button", { name: "Salin Pesan", exact: true }).click()
  assert.ok(
    (await page.evaluate(() => navigator.clipboard.readText())).includes(
      "Nama: Alim Demo"
    )
  )
  assert.equal((await readData()).rentals.length, beforeWa)
  await page.screenshot({ path: ".qa/booking-modal.png" })
  await page.getByRole("button", { name: "Tutup dialog" }).click()
  await page.locator(".result-filters select").first().selectOption("Sport")
  await page
    .getByRole("heading", {
      name: "Belum ada motor yang sesuai dengan pencarian Anda.",
    })
    .waitFor()
  await page.goto(`${base}/admin`)
  await page.waitForURL(/\/login/)
  await page.getByRole("button", { name: "Gunakan akun demo" }).click()
  await page.getByRole("button", { name: "Masuk Dashboard" }).click()
  await page.waitForURL(/\/admin$/)
  await page
    .getByRole("heading", { name: "Perjalanan yang tertata, dimulai di sini." })
    .waitFor()
  await page.screenshot({ path: ".qa/admin-desktop.png", fullPage: true })
  await assertNoOverflow()
  await page.getByRole("link", { name: "Data Motor", exact: true }).click()
  await page.getByRole("button", { name: "Tambah Motor", exact: true }).click()
  await page.getByRole("textbox", { name: /^Model/ }).fill("Fazzio Presentasi")
  await page.getByLabel(/Tarif contoh/).fill("100000")
  await page.getByRole("button", { name: "Simpan motor" }).click()
  await page.getByText("Yamaha Fazzio Presentasi", { exact: true }).waitFor()
  await page.getByRole("link", { name: "Cabang", exact: true }).click()
  await page.getByRole("button", { name: "Tambah Cabang", exact: true }).click()
  await page.getByLabel("Nama cabang").fill("Cabang Presentasi (Demo)")
  await page.getByRole("button", { name: "Simpan cabang" }).click()
  await page
    .getByRole("cell", { name: "Cabang Presentasi (Demo)", exact: true })
    .waitFor()
  let data = await readData()
  const addedMotor = data.motors.find((m) => m.model === "Fazzio Presentasi")
  const q = new URLSearchParams({
    branch: "banda-aceh",
    start: data.demoStart,
    end: data.demoEnd,
    type: "",
  })
  await page.goto(`${base}/motor?${q}`)
  await page.getByText("3 motor", { exact: true }).waitFor()
  await page.goto(`${base}/admin?tab=rentals`)
  await page.getByRole("button", { name: "Tambah Sewa", exact: true }).click()
  await page
    .getByLabel("Motor & cabang", { exact: false })
    .selectOption(addedMotor.id)
  await page.getByRole("button", { name: "Simpan penyewaan" }).click()
  await page.getByText("SWA-004", { exact: true }).waitFor()
  await page.goto(`${base}/motor?${q}`)
  await page.getByText("2 motor", { exact: true }).waitFor()
  await page.goto(`${base}/admin?tab=rentals`)
  await page.getByRole("button", { name: "Tambah Sewa", exact: true }).click()
  await page
    .getByLabel("Motor & cabang", { exact: false })
    .selectOption(addedMotor.id)
  await page.getByRole("button", { name: "Simpan penyewaan" }).click()
  await page
    .getByRole("alert")
    .filter({ hasText: "jadwal bertabrakan" })
    .waitFor()
  await page.getByRole("button", { name: "Tutup dialog" }).click()
  await page.goto(`${base}/admin?tab=maintenance`)
  await page
    .getByRole("button", { name: "Tambah Perawatan", exact: true })
    .click()
  await page.getByLabel("Motor", { exact: false }).selectOption("1")
  await page
    .getByLabel("Keluhan / jenis perawatan", { exact: false })
    .fill("Servis presentasi")
  await page.getByRole("button", { name: "Simpan perawatan" }).click()
  await page.getByText("Servis presentasi", { exact: true }).waitFor()
  await page.goto(`${base}/motor?${q}`)
  await page.getByText("1 motor", { exact: true }).waitFor()
  await page.goto(`${base}/admin?tab=landing`)
  await page
    .getByLabel("Judul hero", { exact: false })
    .fill("Perjalanan Anda dimulai bersama ID Rental.")
  await page.getByRole("button", { name: "Simpan Perubahan" }).click()
  await page.goto(base)
  await page
    .getByRole("heading", {
      name: "Perjalanan Anda dimulai bersama ID Rental.",
    })
    .waitFor()
  await page.getByRole("button", { name: "Konsultasikan Sewa Mobil" }).click()
  assert.ok(
    decodeURIComponent(
      await page
        .getByRole("link", { name: /Lanjutkan ke WhatsApp/ })
        .getAttribute("href")
    ).includes("ingin berkonsultasi mengenai sewa mobil")
  )
  await page.getByRole("button", { name: "Tutup dialog" }).click()
  // Configure the no-number fallback on every branch and CMS.
  data = await readData()
  data.cms.whatsapp = ""
  data.branches = data.branches.map((b) => ({ ...b, whatsapp: "" }))
  await page.evaluate(
    (d) => localStorage.setItem("id-rental-demo-v1", JSON.stringify(d)),
    data
  )
  await page.goto(`${base}/motor?${q}`)
  await page
    .getByRole("button", { name: "Pesan Yamaha Fazzio via WhatsApp" })
    .click()
  await page.getByLabel(/Nama pelanggan/).fill("Tamu Demo")
  await page.getByRole("button", { name: "Lihat Pratinjau Pesan" }).click()
  await page.getByText(/Nomor WhatsApp admin belum diatur/).waitFor()
  assert.equal(
    await page.getByRole("link", { name: /Lanjutkan ke WhatsApp/ }).count(),
    0
  )
  await page.getByRole("button", { name: "Salin Pesan", exact: true }).click()
  await page.getByRole("button", { name: "Tutup dialog" }).click()
  await page.goto(`${base}/admin`)
  await page
    .getByRole("button", { name: "Reset data demo", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Reset data demo", exact: true })
    .last()
    .click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(base)
  await page.getByRole("heading", { name: /Sewa motor,/ }).waitFor()
  await assertNoOverflow()
  assert.ok(
    await page.evaluate(
      () =>
        document.querySelector(".hero-copy").getBoundingClientRect().right <=
        innerWidth
    ),
    "Mobile hero content is not clipped"
  )
  await page.screenshot({ path: ".qa/landing-mobile.png", fullPage: true })
  await page.getByRole("button", { name: "Buka navigasi" }).click()
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "Pilihan Motor" })
    .click()
  await page
    .getByRole("heading", { name: "Mulai dengan lokasi dan jadwal Anda." })
    .waitFor()
  await assertNoOverflow()
  data = await readData()
  await page.goto(
    `${base}/motor?${new URLSearchParams({ branch: "banda-aceh", start: data.demoStart, end: data.demoEnd, type: "" })}`
  )
  await page.getByText("2 motor", { exact: true }).waitFor()
  await assertNoOverflow()
  await page.screenshot({ path: ".qa/results-mobile.png", fullPage: true })
  await page.goto(`${base}/admin`)
  await page
    .getByRole("heading", { name: "Perjalanan yang tertata, dimulai di sini." })
    .waitFor()
  await assertNoOverflow()
  await page.screenshot({ path: ".qa/admin-mobile.png", fullPage: true })
  await page.getByRole("button", { name: "Buka menu admin" }).click()
  await page.getByRole("button", { name: "Keluar", exact: true }).click()
  await page.waitForURL(/\/login/)
  await assertNoOverflow()
  await page.screenshot({ path: ".qa/login-mobile.png", fullPage: true })
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(base)
    await page.getByRole("heading", { name: /Sewa motor,/ }).waitFor()
    await assertNoOverflow()
    assert.ok(
      await page.evaluate(
        () =>
          document.querySelector(".hero-copy").getBoundingClientRect().right <=
          innerWidth
      ),
      `Hero fits at ${width}px`
    )
  }
  assert.deepEqual(errors, [])
  console.log(
    "PASS: browser flows, WhatsApp and copy fallback, login/logout/protection, motor and branch CRUD, double booking, rental/maintenance availability, CMS, car consultation, refresh, mobile navigation and overflow."
  )
} finally {
  await browser.close()
}
