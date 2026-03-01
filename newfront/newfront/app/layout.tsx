import type { Metadata, Viewport } from 'next'
import { Inter, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AppStoreProvider } from '@/lib/store'
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
})

export const metadata: Metadata = {
  title: 'HomeSafely - Find Safe Travel Companions',
  description: 'Never walk home alone. Find verified travel companions for your late-night commute.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a2332',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`}>
      <body className="font-sans antialiased">
        <AppStoreProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'oklch(0.22 0.012 250)',
                border: '1px solid oklch(0.26 0.015 250)',
                color: 'oklch(0.95 0.005 250)',
              },
            }}
          />
        </AppStoreProvider>
        <Analytics />
      </body>
    </html>
  )
}
