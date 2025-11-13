import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Boostly',
  description: 'Boost morale, one kudos at a time',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        {/* Simple navbar (hidden on auth routes via CSS if you want) */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/dashboard" className="font-semibold text-lg">
              Boostly
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-300">
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
              <Link href="/account" className="hover:text-white">
                Account
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
