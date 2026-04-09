import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-100">
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
              {user?.displayName?.slice(0, 1) ?? 'み'}
            </div>
            <div>
              <p className="font-semibold">{user?.displayName ?? 'みいたん'}</p>
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

      <main className="flex-1">
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
              <p className="font-semibold text-slate-800">{user?.displayName ?? 'みいたん'}</p>
              <p className="text-sm text-slate-500">Admin</p>
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
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