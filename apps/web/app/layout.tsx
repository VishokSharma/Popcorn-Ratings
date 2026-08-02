import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Popcorn Ratings',
  description: 'Rate TV shows and movies you watch',
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