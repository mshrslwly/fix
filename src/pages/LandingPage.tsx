import React, { useState } from 'react';
import {
  KeyRound,
  LogIn,
  ArrowRight,
  Lock,
  Mail,
  Sparkles
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { dataService } from '../services/dataService';
import { UserAdmin } from '../types';

interface LandingPageProps {
  onEnterKode: (kode: string) => void;
  onLoginSuccess: (user: UserAdmin) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterKode,
  onLoginSuccess
}) => {
  const { showToast } = useToast();
  const [manualCode, setManualCode] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // Email dan password pengurus dikosongkan secara default
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmitKode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim().toUpperCase();
    if (!clean) {
      showToast('Silakan masukkan 10 karakter kode akses', 'error');
      return;
    }
    onEnterKode(clean);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showToast('Email dan kata sandi wajib diisi', 'error');
      return;
    }

    try {
      setIsLoggingIn(true);
      const user = await dataService.loginPengurus(loginEmail.trim(), loginPassword.trim());
      showToast('Selamat datang, Pengurus Pesantren!', 'success');
      setIsLoginModalOpen(false);
      onLoginSuccess(user);
    } catch (err: any) {
      showToast(err.message || 'Gagal masuk. Periksa kembali email & kata sandi.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#2C241E] flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Logo size="md" />
        <button
          type="button"
          onClick={() => {
            setLoginEmail('');
            setLoginPassword('');
            setIsLoginModalOpen(true);
          }}
          className="clay-btn clay-btn-primary py-2 px-4 text-xs sm:text-sm font-bold gap-1.5 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Masuk Pengurus</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto w-full px-5 py-6 space-y-6 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#5F8F6B]/15 text-[#3F6B4D] text-xs font-bold shadow-sm">
            <span>Sistem Manajemen Santri & Portal Wali</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-[#29221C] tracking-tight">
            Selamat Datang di <span className="text-[#5F8F6B]">SiPontren</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6F5F50] leading-relaxed">
            Portal komunikasi santri, perizinan, dan pemantauan kedisiplinan santri pesantren.
          </p>
        </div>

        {/* Card Input Kode Akses Wali */}
        <div className="clay-card p-6 sm:p-7 border-2 border-[#D9B99B]/50 space-y-4 text-left">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E8D5C4]/60">
            <div className="w-9 h-9 rounded-xl bg-[#5F8F6B]/15 text-[#5F8F6B] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-black text-base text-[#2E251E]">
                Portal Wali Santri
              </h2>
              <span className="text-[11px] text-[#7A6959]">
                Buka data ananda dengan memasukkan kode dari pengurus.
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmitKode} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Masukkan 10 Karakter Kode Akses:
              </label>
              <input
                type="text"
                maxLength={10}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Contoh: K7N4M9X2WP"
                className="w-full p-3 font-mono text-center tracking-widest text-lg font-black uppercase rounded-2xl bg-[#FBF7F0] border-2 border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              />
            </div>

            <button
              type="submit"
              className="clay-btn clay-btn-primary w-full py-3.5 text-sm font-bold gap-2 cursor-pointer shadow-md"
            >
              <span>Buka Informasi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-[11px] text-[#867566]">
          * Wali santri cukup membuka tautan langsung dari WhatsApp pengurus atau mengetik kode.
        </p>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-[#8A796A] border-t border-[#E8D5C4]/50">
        © 2026 SiPontren — Sistem Manajemen Santri & Portal Wali
      </footer>

      {/* Modal Login Pengurus */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Masuk Pengurus Pesantren"
        subtitle="Masukkan email dan kata sandi akun"
        maxWidth="sm"
      >
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7B6B]" />
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="masukkan email yang terdaftar"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Kata Sandi *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7B6B]" />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="clay-btn clay-btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer"
            >
              {isLoggingIn ? 'Memverifikasi...' : 'Masuk Sekarang'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
