import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Companion App',
  description: 'Your personal companion',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-[#ededed] antialiased">
        {children}
      </body>
    </html>
  )
}

