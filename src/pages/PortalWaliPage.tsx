import React, { useState } from 'react';
import {
  User,
  CalendarCheck,
  ShieldAlert,
  MapPin,
  Heart,
  Phone,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
  Building
} from 'lucide-react';
import { PortalWaliData } from '../types';
import { formatDatePretty, formatDateDMY } from '../utils/date';
import { StatusPerizinanBadge, StatusSanksiBadge, JenisPerizinanBadge, KelasBadge } from '../components/Badge';
import { Logo } from '../components/Logo';
import { parseSanksiItems } from './PelanggaranPage';
import { AnimatedNumber } from '../components/AnimatedNumber';

interface PortalWaliPageProps {
  portalData: PortalWaliData | null;
  isLoading: boolean;
  isInvalidCode: boolean;
  onBackToLanding: () => void;
}

export const PortalWaliPage: React.FC<PortalWaliPageProps> = ({
  portalData,
  isLoading,
  isInvalidCode,
  onBackToLanding
}) => {
  const [activeTab, setActiveTab] = useState<'biodata' | 'perizinan' | 'pelanggaran'>('biodata');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    if (!portalData?.kodeAkses) return;
    try {
      await navigator.clipboard.writeText(portalData.kodeAkses);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF5EA] flex items-center justify-center p-6 text-center">
        <div className="clay-card p-8 max-w-sm w-full space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#5F8F6B] border-t-transparent animate-spin mx-auto" />
          <h3 className="font-heading font-black text-lg text-[#322922]">
            Memuat Data Santri...
          </h3>
          <p className="text-xs text-[#7A6A5A]">
            Mohon tunggu sebentar, sedang menyiapkan informasi ananda.
          </p>
        </div>
      </div>
    );
  }

  if (isInvalidCode || !portalData) {
    return (
      <div className="min-h-screen bg-[#FBF5EA] flex items-center justify-center p-6 text-center">
        <div className="clay-card p-8 max-w-md w-full space-y-5 border border-[#D98E75]/40 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#D98E75]/20 text-[#8C2E17] flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="font-heading font-black text-xl text-[#352B23]">
              Link Portal Tidak Berlaku
            </h3>
            <p className="text-sm text-[#6C5B4C] leading-relaxed">
              Tautan portal santri mungkin telah di-reset, santri sudah tidak aktif/dihapus, atau kode tidak sesuai.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F5EDE4] text-xs text-[#7A6A5A] space-y-1 text-left border border-[#E8D5C4]">
            <p className="font-bold text-[#4A3B2D] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#5F8F6B]" /> Keamanan Data Santri:
            </p>
            <p>
              Jika santri telah keluar dari pesantren dan datanya dihapus oleh pengurus, link pribadi ini otomatis dinonaktifkan secara permanen untuk menjaga privasi.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onBackToLanding}
              className="clay-btn clay-btn-primary w-full py-3 text-sm font-bold gap-2 cursor-pointer flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Depan</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF5EA] text-[#2C241E] pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#FBF5EA]/90 backdrop-blur-md border-b border-[#E8D5C4]/60 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Logo size="sm" showSubtitle={false} />
          
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A4B3D] hover:text-[#2A2018] px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 transition-colors cursor-pointer"
            title="Keluar dari mode wali santri dan kembali ke halaman utama"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pt-5 space-y-4">
        {/* Greeting Banner Card */}
        <div className="clay-card p-5 sm:p-6 bg-gradient-to-br from-[#FAF5EE] to-[#EFE2D4] border-2 border-[#D9B99B]/50 relative overflow-hidden shadow-sm">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#5F8F6B]/15 text-[#3F6B4D] text-[11px] font-extrabold tracking-wide uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Portal Resmi Wali Santri</span>
              </div>
              <KelasBadge kelas={portalData.kelas} size="md" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-heading text-[#29221C] leading-snug">
              {portalData.nama}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs text-[#6C5B4C]">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#5F8F6B] shrink-0" />
                <span>Wali: <strong className="text-[#382D24]">{portalData.namaWali}</strong></span>
              </div>
              {portalData.noHpWali && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#5F8F6B] shrink-0" />
                  <span className="font-mono">{portalData.noHpWali}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-[#D98E75] shrink-0" />
                <span className="truncate">{portalData.alamat}</span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-[#D9B99B]/40 flex items-center justify-between text-[11px] text-[#7D6B5A]">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Santri Aktif Pondok Pesantren
            </span>
            <span>Diperbarui: {formatDatePretty(portalData.updatedAt)}</span>
          </div>
        </div>

        {/* 3 Big Navigation Tabs */}
        <div className="flex gap-1.5 p-1.5 rounded-2xl bg-[#EFE7DC] shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('biodata')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'biodata'
                ? 'bg-white text-[#2F261E] shadow-sm scale-[1.01]'
                : 'text-[#6C5A4A] hover:text-[#2F261E]'
            }`}
          >
            <User className="w-4 h-4 text-[#5F8F6B]" />
            <span>Biodata</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('perizinan')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'perizinan'
                ? 'bg-white text-[#2F261E] shadow-sm scale-[1.01]'
                : 'text-[#6C5A4A] hover:text-[#2F261E]'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-[#5F8F6B]" />
            <span>Izin (<AnimatedNumber value={portalData.perizinan.length} />)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pelanggaran')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pelanggaran'
                ? 'bg-white text-[#2F261E] shadow-sm scale-[1.01]'
                : 'text-[#6C5A4A] hover:text-[#2F261E]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-[#D98E75]" />
            <span>Disiplin (<AnimatedNumber value={portalData.pelanggaran.length} />)</span>
          </button>
        </div>

        {/* TAB 1: BIODATA */}
        {activeTab === 'biodata' && (
          <div className="space-y-4 animate-fade-in">
            <div className="clay-card p-5 border border-[#E8D5C4]/80 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8D5C4]/60">
                <h3 className="font-heading font-black text-base text-[#322922]">
                  Informasi Lengkap Santri
                </h3>
                <span className="text-xs text-[#7A6A5A] font-medium">Data Terverifikasi</span>
              </div>

              <div className="space-y-3 text-sm divide-y divide-[#E8D5C4]/40">
                <div className="flex justify-between items-center pt-2 first:pt-0">
                  <span className="text-[#7F6E5E] font-medium text-xs sm:text-sm">
                    Nama Lengkap
                  </span>
                  <span className="font-bold text-[#2A221B] text-right">
                    {portalData.nama}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[#7F6E5E] font-medium text-xs sm:text-sm">
                    Jenjang / Tingkat
                  </span>
                  <div className="text-right">
                    <KelasBadge kelas={portalData.kelas} />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[#7F6E5E] font-medium text-xs sm:text-sm">
                    Nama Wali Santri
                  </span>
                  <span className="font-bold text-[#2A221B] text-right">
                    {portalData.namaWali}
                  </span>
                </div>

                {portalData.noHpWali && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#7F6E5E] font-medium text-xs sm:text-sm">
                      No. Kontak Wali
                    </span>
                    <span className="font-mono font-bold text-[#3F6B4D] text-right">
                      {portalData.noHpWali}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start pt-2">
                  <span className="text-[#7F6E5E] font-medium text-xs sm:text-sm">
                    Alamat Domisili
                  </span>
                  <span className="font-medium text-[#3E3329] text-right max-w-[240px]">
                    {portalData.alamat}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[#7F6E5E] font-medium text-xs sm:text-sm">
                    Kode Akses Pribadi
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-[#5F8F6B]/15 text-[#3F6B4D] tracking-wider">
                      {portalData.kodeAkses}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg bg-[#EFE7DC] hover:bg-[#E2D5C4] text-[#6B5A4B] transition-colors cursor-pointer"
                      title="Salin Kode Akses"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Panduan & Pesan Wali */}
            <div className="clay-card p-5 border border-[#E8D5C4]/80 space-y-2.5 bg-[#FAF4EC]">
              <h4 className="font-bold text-sm text-[#382F26] flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#D98E75]" />
                <span>Pesan untuk Wali Santri</span>
              </h4>
              <p className="text-xs text-[#6F5E4E] leading-relaxed">
                Halaman ini diperbarui secara berkala oleh pengurus pesantren setiap ada pengajuan perizinan atau catatan kedisiplinan ananda. Simpan tautan ini untuk selalu memantau ananda secara aman dan langsung.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: PERIZINAN */}
        {activeTab === 'perizinan' && (
          <div className="space-y-3 animate-fade-in">
            {portalData.perizinan.length === 0 ? (
              <div className="clay-card p-8 text-center text-[#7F6E5E] space-y-2 border border-[#E8D5C4]/70">
                <CalendarCheck className="w-10 h-10 mx-auto text-[#5F8F6B] opacity-60" />
                <h4 className="font-bold text-base text-[#382F26]">
                  Belum Ada Catatan Izin
                </h4>
                <p className="text-xs">
                  Ananda belum pernah mengajukan izin keluar atau kepulangan.
                </p>
              </div>
            ) : (
              <div className="max-h-[560px] overflow-y-auto pr-1 space-y-3">
                {portalData.perizinan.map((izin) => (
                  <div
                    key={izin.id}
                    className="clay-card p-4 sm:p-5 border border-[#E8D5C4]/80 space-y-2.5 hover:border-[#5F8F6B]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <JenisPerizinanBadge jenis={izin.jenis} size="md" />
                      <StatusPerizinanBadge status={izin.status} size="md" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#2A221A]">
                        {izin.alasan}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#7B6A5A]">
                        <Calendar className="w-3.5 h-3.5 text-[#5F8F6B]" />
                        <span>
                          {formatDateDMY(izin.tanggalMulai)} s/d {formatDateDMY(izin.tanggalSelesai)}
                        </span>
                      </div>

                      {izin.catatanTambahan && (
                        <div className="mt-2 p-2.5 rounded-xl bg-[#FAF0E4] border border-[#E8D5C4] text-xs text-[#844A18] flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[#D98E75] shrink-0 mt-0.5" />
                          <span><strong>Catatan Pengurus:</strong> {izin.catatanTambahan}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PELANGGARAN & SANKSI */}
        {activeTab === 'pelanggaran' && (
          <div className="space-y-3 animate-fade-in">
            {portalData.pelanggaran.length === 0 ? (
              <div className="clay-card p-8 text-center text-[#7F6E5E] space-y-2 border border-[#E8D5C4]/70">
                <Sparkles className="w-10 h-10 mx-auto text-[#5F8F6B]" />
                <h4 className="font-bold text-base text-[#382F26]">
                  Alhamdulillah, Bersih dari Pelanggaran
                </h4>
                <p className="text-xs">
                  Ananda senantiasa mematuhi tata tertib dan disiplin pondok pesantren dengan baik.
                </p>
              </div>
            ) : (
              <div className="max-h-[560px] overflow-y-auto pr-1 space-y-3">
                {portalData.pelanggaran.map((p) => (
                  <div
                    key={p.id}
                    className="clay-card p-4 sm:p-5 border border-[#E8D5C4]/80 space-y-3 hover:border-[#D98E75]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[#E8D5C4] text-[#4F3F32]">
                        {p.peraturanKode}
                      </span>
                      <span className="text-xs font-medium text-[#847262]">
                        {formatDatePretty(p.tanggal)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#2D241C]">
                        {p.peraturanNama}
                      </h4>
                      <p className="text-xs text-[#6A5A4A] mt-1">
                        {p.keterangan}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF3EA] border border-[#E8D5C4]/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#7A6959] uppercase tracking-wider">
                          Sanksi:
                        </span>
                        <StatusSanksiBadge status={p.statusSanksi} size="sm" />
                      </div>
                      <div className="space-y-1.5">
                        {parseSanksiItems(p.sanksi).map((sItem, sIdx) => {
                          const isDone = p.statusSanksi === 'selesai' || (p.sanksiCompletedItems && p.sanksiCompletedItems.includes(sItem));
                          return (
                            <div key={sIdx} className="flex items-start gap-2 text-xs">
                              <span className={`w-3.5 h-3.5 mt-0.5 rounded flex items-center justify-center text-[10px] shrink-0 ${
                                isDone
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'border border-amber-500 bg-white text-transparent'
                              }`}>
                                {isDone ? '✓' : '•'}
                              </span>
                              <span className={`leading-snug ${isDone ? 'line-through text-emerald-800 font-medium' : 'font-bold text-[#865322]'}`}>
                                {sItem}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
