import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const displayName = user?.displayName || user?.email || 'みいたん';
  const initial = displayName.slice(0, 1);

  return (
    <aside className="flex w-64 flex-col justify-between bg-slate-950 text-white">
      <div>
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-8">
          <div className="rounded-2xl bg-blue-600 p-3 text-xl">📦</div>
          <div className="text-3xl font-bold">LogiRoute AI</div>
        </div>

        <nav className="px-4 py-6">
          <div className="space-y-2">
            <SidebarLink to="/dashboard" label="ダッシュボード" />
            <SidebarLink to="/deliveries" label="配送先一覧" />
            <SidebarLink to="/map" label="地図ビュー" />
            <SidebarLink to="/driver-stats" label="ドライバー統計" />
          </div>
        </nav>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold">
            {initial}
          </div>
          <div>
            <p className="font-semibold">{displayName}</p>
            <p className="text-sm text-slate-400">Admin</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl border border-white/10 px-4 py-3 text-left transition hover:bg-white/5"
        >
          ログアウト
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-2xl px-4 py-3 font-medium transition ${
          isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  );
}