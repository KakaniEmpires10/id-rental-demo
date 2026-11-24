import assert from "node:assert/strict"
import fs from "node:fs/promises"
import { pathToFileURL } from "node:url"
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const base = process.env.DEMO_URL || "http://localhost:3002"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  locale: "id-ID",
  permissions: ["clipboard-read", "clipboard-write"],
})
const page = await context.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(e.message))
const app = page.locator(".app-viewport")
const nav = page.getByRole("navigation", { name: "Navigasi aplikasi" })
const data = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("id-rental-demo-v1")))
const click = (name) => app.getByRole("button", { name, exact: true }).click()
const noOverflow = async () => {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  )
  assert.ok(await app.evaluate((e) => e.scrollWidth <= e.clientWidth))
}
async function nmax() {
  await page.goto(`${base}/mobile?view=list`)
  await click("Lihat detail Yamaha NMAX")
  await click("Pesan Motor")
}
async function save() {
  await click("Lanjutkan")
  await click("Simpan & Lanjutkan")
  await page.waitForURL(/submitted=/)
  await app.getByText("PERMINTAAN BERHASIL DISIMPAN").waitFor()
}
try {
  await fs.mkdir(".qa", { recursive: true })
  await page.goto(base)
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "Aplikasi Mobile" })
    .click()
  await app.getByRole("heading", { name: /Sewa mudah/ }).waitFor()
  await noOverflow()
  await page.screenshot({ path: ".qa/mobile-rental-home.png", fullPage: true })
  await page.getByRole("button", { name: "iPhone", exact: true }).click()
  assert.ok(
    await page
      .locator(".phone-frame")
      .evaluate((e) => e.classList.contains("iphone"))
  )
  await page.getByRole("button", { name: "Android", exact: true }).click()
  await app.getByLabel(/Cabang pengambilan/).selectOption("banda-aceh")
  await app.getByLabel(/Pengembalian/).fill((await data()).demoStart)
  await click("Cari Kendaraan")
  await app
    .getByRole("alert")
    .filter({ hasText: /sesudah/ })
    .waitFor()
  await app.getByLabel(/Pengembalian/).fill((await data()).demoEnd)
  await click("Cari Kendaraan")
  await page.waitForURL(/view=list/)
  assert.equal(new URL(page.url()).searchParams.get("branch"), "banda-aceh")
  assert.equal(
    new URL(page.url()).searchParams.get("start"),
    (await data()).demoStart
  )
  await page.reload()
  await app.getByText("2 kendaraan", { exact: true }).waitFor()
  await app.getByLabel("Jenis kendaraan").selectOption("Sport")
  await click("Terapkan Filter")
  await app
    .getByRole("heading", { name: "Belum ada kendaraan yang sesuai." })
    .waitFor()
  await click("Reset Filter")
  await app
    .getByLabel("Cabang pengambilan", { exact: false })
    .selectOption("aceh-besar")
  await app.getByRole("button", { name: "Motor", exact: true }).click()
  await click("Terapkan Filter")
  await app.getByText("1 kendaraan", { exact: true }).waitFor()
  assert.equal(
    await app.getByRole("button", { name: /Lihat detail/ }).count(),
    1
  )
  await nmax()
  await app.getByRole("heading", { name: "Cara pengambilan" }).waitFor()
  await click("Lanjutkan")
  await app.getByRole("heading", { name: "Data pemesan" }).waitFor()
  assert.equal(await app.getByLabel("Unggah foto KTP").count(), 0)
  await click("Lanjutkan")
  await app.getByRole("alert").waitFor()
  await app.getByLabel(/Nama lengkap/).fill("Tamu Ambil Sendiri")
  await app.getByLabel(/No. HP \/ WhatsApp utama/).fill("081200000000")
  await app.getByRole("checkbox").check()
  const rentalsBefore = (await data()).rentals.length
  await save()
  let stored = await data()
  const pickup = stored.submissions[0]
  assert.equal(pickup.formMode, "short")
  assert.equal(pickup.ktp, null)
  assert.equal(stored.rentals.length, rentalsBefore)
  assert.ok(pickup.message.includes("akan mengambilnya langsung"))
  assert.equal(
    decodeURIComponent(
      (
        await app
          .getByRole("link", { name: /Lanjutkan ke WhatsApp/ })
          .getAttribute("href")
      ).split("?text=")[1]
    ),
    pickup.message
  )
  await click("Salin Pesan WhatsApp")
  assert.equal(
    (await page.evaluate(() => navigator.clipboard.readText())).replace(
      /\r\n/g,
      "\n"
    ),
    pickup.message
  )
  await page.reload()
  await app.getByText("PERMINTAAN BERHASIL DISIMPAN").waitFor()
  await page.screenshot({
    path: ".qa/mobile-pickup-feedback.png",
    fullPage: true,
  })
  await nav.getByRole("button", { name: "Profil", exact: true }).click()
  await click("Buat Akun")
  await app.getByLabel(/Nama lengkap/).fill("Pemesan Akun Demo")
  await app.getByLabel(/Email/).fill("user@example.demo")
  await app.getByLabel(/Kata sandi/).fill("Demo12345")
  await click("Buat Akun Demo")
  await app.getByRole("heading", { name: "Pemesan Akun Demo" }).waitFor()
  await app.getByRole("button", { name: /Data pribadi/ }).click()
  await app.getByLabel("No. HP / WhatsApp utama").fill("081200000000")
  await app.getByLabel("Pekerjaan").fill("Karyawan Demo")
  await app.getByLabel("Nama instansi").fill("Instansi Demo")
  await app.getByLabel("Alamat KTP").fill("Alamat KTP Demo")
  await app.getByLabel("Alamat sekarang").fill("Alamat Sekarang Demo")
  await click("Simpan Profil")
  await nmax()
  await app.getByRole("button", { name: /Diantarkan/ }).click()
  await app.getByLabel(/Tujuan \/ keperluan/).fill("Operasional instansi")
  await click("Lanjutkan")
  await app.getByRole("alert").filter({ hasText: "alamat tujuan" }).waitFor()
  await app
    .getByLabel(/Alamat tujuan pengantaran/)
    .fill("Alamat Antar Demo, Banda Aceh")
  await click("Lanjutkan")
  assert.equal(
    await app.getByLabel(/Nama lengkap/).inputValue(),
    "Pemesan Akun Demo"
  )
  assert.equal(await app.getByLabel(/Pekerjaan/).inputValue(), "Karyawan Demo")
  await app.getByRole("checkbox").check()
  await click("Lanjutkan")
  await app
    .getByRole("alert")
    .filter({ hasText: /Unggah foto/ })
    .waitFor()
  await click("Gunakan data demo")
  await app.getByLabel(/Nama lengkap/).fill("Pemesan Akun Demo")
  await app.getByRole("button", { name: "Hapus foto KTP" }).click()
  await app
    .getByLabel("Unggah foto KTP")
    .setInputFiles("public/images/nmax.png")
  await app.getByText("nmax.png", { exact: true }).waitFor()
  await save()
  stored = await data()
  const delivery = stored.submissions[0]
  assert.equal(delivery.formMode, "complete")
  assert.ok(delivery.accountId)
  assert.ok(delivery.deliveryAddress)
  assert.ok(delivery.ktp)
  assert.ok(delivery.message.startsWith("*꧁ID RENTAL MOTOR꧂*"))
  assert.ok(delivery.message.includes(delivery.deliveryAddress))
  await nav.getByRole("button", { name: "Profil", exact: true }).click()
  await app.getByRole("button", { name: /Riwayat pemesanan/ }).click()
  assert.equal(
    await app.locator(".app-history-card").count(),
    1,
    "Guest form is not claimed by account"
  )
  await page.screenshot({
    path: ".qa/mobile-account-history.png",
    fullPage: true,
  })
  await app.getByRole("button", { name: "Profil", exact: true }).click()
  await app.getByRole("button", { name: /Keluar akun/ }).click()
  assert.equal(
    await app.getByRole("button", { name: /Riwayat pemesanan/ }).count(),
    0
  )
  await nav.getByRole("button", { name: "Jelajahi", exact: true }).click()
  await click("Mobil")
  await click("Terapkan Filter")
  await click("Lihat detail Toyota Veloz")
  await app.getByRole("heading", { name: /Mobil untuk/ }).waitFor()
  await page.screenshot({
    path: ".qa/mobile-car-requirements.png",
    fullPage: true,
  })
  await click("Saya Paham, Lihat Mobil")
  await app.getByRole("heading", { name: "Toyota Veloz" }).waitFor()
  await page.screenshot({ path: ".qa/mobile-car-detail.png", fullPage: true })
  await click("Ajukan Sewa Mobil")
  await app.getByLabel(/Tujuan \/ keperluan/).fill("Kegiatan instansi")
  await click("Lanjutkan")
  await app.getByLabel(/Nama penanggung jawab/).fill("Penanggung Jawab Demo")
  await app.getByLabel(/No. HP \/ WhatsApp utama/).fill("081200000000")
  await app.getByRole("checkbox").check()
  await click("Lanjutkan")
  await app
    .getByRole("alert")
    .filter({ hasText: /nama instansi/ })
    .waitFor()
  await app.getByLabel(/Nama instansi/).fill("Instansi Rental Demo")
  await save()
  stored = await data()
  assert.equal(stored.submissions[0].vehicleKind, "car")
  assert.ok(
    stored.submissions[0].message.includes("Instansi: Instansi Rental Demo")
  )
  assert.equal(stored.rentals.length, rentalsBefore)
  await page.goto(`${base}/login`)
  await page.getByRole("button", { name: "Gunakan akun demo" }).click()
  await page.getByRole("button", { name: "Masuk Dashboard" }).click()
  await page.waitForURL(/\/admin$/)
  await page
    .getByRole("link", { name: "Formulir Penyewa", exact: true })
    .click()
  await page
    .getByRole("row")
    .filter({ hasText: "Tamu Ambil Sendiri" })
    .getByRole("button", { name: /Lihat formulir/ })
    .click()
  await page
    .getByText("Data dan dokumen lengkap dilengkapi saat penyewa datang.", {
      exact: false,
    })
    .waitFor()
  await page.getByRole("button", { name: "Buat Reservasi dari Form" }).click()
  await page.getByRole("button", { name: "Konfirmasi Reservasi" }).click()
  await page
    .getByText("Formulir sudah terhubung ke reservasi di menu Penyewaan.")
    .waitFor()
  await page.getByRole("button", { name: "Tutup dialog" }).click()
  await page
    .getByRole("row")
    .filter({ hasText: "Pemesan Akun Demo" })
    .getByRole("button", { name: /Lihat formulir/ })
    .click()
  await page.getByRole("heading", { name: "Dokumen penyewa" }).waitFor()
  assert.equal(
    await page
      .getByRole("img", { name: "Foto KTP pada formulir penyewa" })
      .count(),
    1
  )
  await page.screenshot({
    path: ".qa/admin-delivery-request.png",
    fullPage: true,
  })
  await page.getByRole("button", { name: "Buat Reservasi dari Form" }).click()
  await page.getByRole("button", { name: "Konfirmasi Reservasi" }).click()
  await page
    .getByRole("alert")
    .filter({ hasText: /bertabrakan/ })
    .waitFor()
  await page.getByRole("button", { name: "Tutup dialog" }).click()
  await page
    .getByRole("row")
    .filter({ hasText: "Penanggung Jawab Demo" })
    .getByRole("button", { name: /Lihat formulir/ })
    .click()
  assert.equal(
    await page
      .getByRole("button", { name: "Buat Reservasi dari Form" })
      .count(),
    0
  )
  await page
    .getByRole("button", { name: "Tandai Sudah Ditindaklanjuti" })
    .click()
  assert.equal((await data()).submissions[0].status, "Ditindaklanjuti")
  await page.getByRole("button", { name: "Tutup dialog" }).click()
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(`${base}/mobile`)
    await app.getByRole("heading", { name: /Sewa mudah/ }).waitFor()
    await noOverflow()
    if (width === 390)
      await page.screenshot({
        path: ".qa/mobile-rental-small-screen.png",
        fullPage: true,
      })
    await nav.getByRole("button", { name: "Jelajahi", exact: true }).click()
    await noOverflow()
    await nav.getByRole("button", { name: "Profil", exact: true }).click()
    await noOverflow()
  }
  assert.deepEqual(errors, [])
  console.log(
    "PASS: rental home/search, URL filters/refresh, availability, details, short pickup, required delivery/upload, account prefill/history isolation, institutional car terms/consultation, dashboard and reservation conflicts, and 320–1440px layouts."
  )
} finally {
  await browser.close()
}
