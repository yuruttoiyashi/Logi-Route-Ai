import React from 'react';
import { Search, Bell, User, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

const Header = () => {
  const { profile } = useAuth();

  return (
   <header className="fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-16 lg:left-64 lg:px-8">
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="配送先、荷物IDを検索..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4 ml-auto">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block">
          <HelpCircle size={20} />
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900">{profile?.displayName}</p>
            <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            {profile?.displayName?.[0] || <User size={20} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
