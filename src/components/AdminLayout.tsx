import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ShieldAlert,
  BookOpen,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
import { Logo } from './Logo';
import { UserAdmin } from '../types';

interface AdminLayoutProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserAdmin | null;
  onLogout: () => void;
  onOpenAiAssistant?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  onOpenAiAssistant,
  children
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'santri', label: 'Data Santri', icon: Users },
    { id: 'perizinan', label: 'Perizinan', icon: CalendarCheck },
    { id: 'pelanggaran', label: 'Pelanggaran', icon: ShieldAlert },
    { id: 'peraturan', label: 'Tata Tertib & Sanksi', icon: BookOpen },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#2C241E] flex flex-col md:flex-row">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-[#F4EBE0]/90 backdrop-blur-md border-r border-[#E8D5C4]/70 p-5 h-screen sticky top-0 justify-between">
        <div className="space-y-6">
          <div className="px-2 space-y-2">
            <Logo size="md" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-300 text-[11px] font-bold w-fit shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online Terpusat</span>
            </div>
          </div>

          {/* AI Assistant Button */}
          {onOpenAiAssistant && (
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-[#5F8F6B]/20 via-[#5F8F6B]/10 to-[#5F8F6B]/5 border border-[#5F8F6B]/40 text-[#2D5237] hover:bg-[#5F8F6B]/25 transition-all cursor-pointer font-bold text-xs shadow-xs hover-lift"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#5F8F6B] animate-pulse" />
                <span>Butuh Asisten?</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5F8F6B] text-white font-bold">
                Buka
              </span>
            </button>
          )}

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#5F8F6B] text-white shadow-[4px_4px_12px_rgba(95,143,107,0.35)] translate-x-1'
                      : 'text-[#5B4C3E] hover:bg-[#E8D5C4]/60 hover:text-[#2A221C]'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & footer */}
        <div className="pt-4 border-t border-[#E8D5C4]/60 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-[#5F8F6B]/20 text-[#5F8F6B] flex items-center justify-center font-bold text-xs shrink-0">
              P
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-[#322820] block truncate">
                {currentUser?.email || 'Pengurus'}
              </span>
              <span className="text-[10px] text-[#867566] block">
                Pengurus Pesantren
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-[#8C2E17] hover:bg-[#D98E75]/15 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="md:hidden sticky top-0 z-30 bg-[#FBF5EA]/90 backdrop-blur-md border-b border-[#E8D5C4]/70 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size="sm" showSubtitle={false} />
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAiAssistant && (
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#5F8F6B]/15 text-[#3F6B4D] border border-[#5F8F6B]/30 text-xs font-bold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5F8F6B]" />
              <span>AI</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            title="Keluar"
            className="p-2 rounded-xl text-[#8C2E17] hover:bg-black/5"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto pb-24 md:pb-8 overflow-y-auto">
        {children}
      </main>

      {/* FLOATING ACTION BUTTON ASISTEN AI */}
      {onOpenAiAssistant && (
        <button
          type="button"
          onClick={onOpenAiAssistant}
          className="fixed bottom-20 md:bottom-7 right-4 md:right-7 z-30 clay-btn clay-btn-primary py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2 font-black text-xs sm:text-sm hover-lift active:scale-95 cursor-pointer border-2 border-white/40"
          title="Buka Chatbot & Asisten AI SiPontren"
        >
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
          <span>Butuh Asisten</span>
        </button>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (HP Dulu, 6 Menu) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F4EBE0]/95 backdrop-blur-lg border-t border-[#E8D5C4]/70 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#5F8F6B] font-black scale-105'
                  : 'text-[#7D6B5A] font-semibold'
              }`}
            >
              <div className={`p-1 rounded-xl ${isActive ? 'bg-[#5F8F6B]/15' : ''}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span className="text-[9px] mt-0.5 leading-none">
                {item.id === 'peraturan' ? 'Aturan' : item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
