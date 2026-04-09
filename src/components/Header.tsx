import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user } = useAuth();

  const displayName = user?.displayName || user?.email || 'みいたん';

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
      <input
        type="text"
        placeholder="配送先、荷物IDを検索..."
        className="w-full max-w-xl rounded-2xl border border-slate-200 px-4 py-3 outline-none"
      />

      <div className="ml-6 flex items-center gap-6">
        <span>🔔</span>
        <span>❔</span>
        <div className="text-right">
          <p className="font-semibold text-slate-800">{displayName}</p>
          <p className="text-sm text-slate-500">Admin</p>
        </div>
      </div>
    </header>
  );
}