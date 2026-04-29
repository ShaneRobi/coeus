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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg-base text-text-primary min-h-screen">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('coeus-theme')==='light')document.documentElement.classList.add('theme-light')}catch(e){}`,
          }}
        />
        <TopBar />
        <div className="pt-[53px]">
          {children}
        </div>
      </body>
    </html>
  )
}
