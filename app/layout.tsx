import type { Metadata } from 'next'
import TopBar from '@/components/TopBar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Coeus',
  description: 'Discover events across Singapore',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-bg-base text-text-primary min-h-screen">
        <TopBar />
        <div className="pt-[53px]">
          {children}
        </div>
      </body>
    </html>
  )
}
