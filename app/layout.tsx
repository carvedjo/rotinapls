import { Poppins } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme-context'
import './globals.css'
import type { Metadata } from 'next'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'RotinaPls',
  description: 'Monitoriza as tuas rotinas e hábitos com um calendário visual.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={poppins.variable}>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}