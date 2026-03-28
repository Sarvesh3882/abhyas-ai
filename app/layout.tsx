import type { Metadata } from 'next'
import './globals.css'
import ChatBot from '@/components/chat/ChatBot'

export const metadata: Metadata = {
  title: 'Abhyas AI — Level Up Your Prep',
  description: 'Adaptive mock test platform for JEE/NEET students',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@300;400;500;600;700;800&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="pixel-scanline">
        {children}
        <ChatBot />
      </body>
    </html>
  )
}
