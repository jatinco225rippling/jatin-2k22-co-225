import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="w-full max-w-md px-4">
        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl shadow-xl p-8 backdrop-blur">
          <h1 className="text-2xl font-semibold text-center text-slate-50 mb-2">
            Boostly
          </h1>
          <p className="text-sm text-slate-400 text-center mb-6">
            Boost morale, one kudos at a time ✨
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
