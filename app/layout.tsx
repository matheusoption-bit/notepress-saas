import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Notepress - O sistema operacional da inovação',
  description: 'Transforme teses e soluções em aprovações de editais com IA.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" className="dark">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
