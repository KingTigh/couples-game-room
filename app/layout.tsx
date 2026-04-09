import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Couples Game Room',
  description: 'Play games together across the miles',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}