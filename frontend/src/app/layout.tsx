import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import './globals.css';
import AntdProvider from '@/components/providers/AntdProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Тендерна система',
  description: 'Система управління переможцями тендерів',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        <AntdProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AntdProvider>
      </body>
    </html>
  );
}

