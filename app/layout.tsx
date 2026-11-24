import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import "./rental.css"
import { RentalProvider } from "@/components/rental-provider"
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})
export const metadata: Metadata = {
  title: "ID Rental — Sewa Motor Banda Aceh, Aceh Besar & Sabang",
  description:
    "Temukan motor untuk perjalanan Anda bersama ID Rental. Pilih lokasi dan jadwal, lalu konfirmasikan melalui WhatsApp. Prototype presentasi.",
  icons: { icon: "/images/id-rental-logo.jpg" },
}
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={geist.variable}>
      <body>
        <RentalProvider>{children}</RentalProvider>
      </body>
    </html>
  )
}
