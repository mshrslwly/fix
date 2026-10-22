import React from 'react';
import {
  Users,
  CalendarCheck,
  AlertOctagon,
  Clock,
  ArrowRight,
  PlusCircle,
  ShieldAlert
} from 'lucide-react';
import { Santri, Perizinan, Pelanggaran, Peraturan } from '../types';
import { formatDatePretty, formatDateDMY } from '../utils/date';
import { StatusPerizinanBadge, StatusSanksiBadge, KelasBadge } from '../components/Badge';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { SeasonalTrendChart } from '../components/SeasonalTrendChart';

interface DashboardPageProps {
  santriList: Santri[];
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  peraturanList: Peraturan[];
  onNavigate: (tab: string) => void;
  onOpenAddSantri: () => void;
  onOpenAddPerizinan: () => void;
  onOpenAddPelanggaran: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  santriList,
  perizinanList,
  pelanggaranList,
  peraturanList,
  onNavigate,
  onOpenAddSantri,
  onOpenAddPerizinan,
  onOpenAddPelanggaran
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // 1. Izin yang sedang berjalan
  const izinBerjalan = perizinanList.filter(p => {
    if (p.status !== 'disetujui') return false;
    return p.tanggalMulai <= todayStr && p.tanggalSelesai >= todayStr;
  });

  // 2. Pelanggaran bulan ini
  const pelanggaranBulanIni = pelanggaranList.filter(p => {
    const d = new Date(p.tanggal);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // 3. Sanksi belum selesai
  const sanksiBelumSelesai = pelanggaranList.filter(p => p.statusSanksi !== 'selesai');

  // Map helpers
  const santriMap = new Map(santriList.map(s => [s.id, s]));
  const peraturanMap = new Map(peraturanList.map(p => [p.id, p]));

  // 5 Pelanggaran terbaru
  const latestPelanggaran = [...pelanggaranList]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 5);

  // 5 Izin terbaru
  const latestPerizinan = [...perizinanList]
    .sort((a, b) => new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#2E2721] tracking-tight">
            Sistem Informasi Pondok Pesantren
          </h2>
          <p className="text-sm text-[#7D6B5A] mt-0.5">
            Ringkasan data harian santri, perizinan, dan kedisiplinan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddSantri}
            className="clay-btn clay-btn-primary py-2.5 px-4 text-xs font-bold gap-1.5 cursor-pointer hover-lift active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Santri</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddPerizinan}
            className="clay-btn clay-btn-secondary py-2.5 px-4 text-xs font-bold gap-1.5 cursor-pointer hover-lift active:scale-95"
          >
            <CalendarCheck className="w-4 h-4 text-[#5F8F6B]" />
            <span>+ Izin</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddPelanggaran}
            className="clay-btn clay-btn-accent py-2.5 px-4 text-xs font-bold gap-1.5 cursor-pointer hover-lift active:scale-95"
          >
            <ShieldAlert className="w-4 h-4 text-[#8A450D]" />
            <span>+ Pelanggaran</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Clay Cards (TIDAK ADA tulisan kecil di bawah angka) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Total Santri */}
        <div
          onClick={() => onNavigate('santri')}
          className="clay-card p-5 cursor-pointer hover-lift animate-slide-up border border-[#E8D5C4]/70 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#6D5D4E]">Total Santri</span>
            <div className="w-9 h-9 rounded-xl bg-[#5F8F6B]/15 text-[#5F8F6B] flex items-center justify-center transition-transform hover:scale-110">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading text-[#2D251F]">
            <AnimatedNumber value={santriList.length} />
          </div>
        </div>

        {/* Izin Sedang Berjalan */}
        <div
          onClick={() => onNavigate('perizinan')}
          className="clay-card p-5 cursor-pointer hover-lift animate-slide-up delay-75 border border-[#E8D5C4]/70 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#6D5D4E]">Izin Aktif Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-[#6FA8DC]/20 text-[#184673] flex items-center justify-center transition-transform hover:scale-110">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading text-[#2D251F]">
            <AnimatedNumber value={izinBerjalan.length} />
          </div>
        </div>

        {/* Pelanggaran Bulan Ini */}
        <div
          onClick={() => onNavigate('pelanggaran')}
          className="clay-card p-5 cursor-pointer hover-lift animate-slide-up delay-150 border border-[#E8D5C4]/70 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#6D5D4E]">Pelanggaran Bulan Ini</span>
            <div className="w-9 h-9 rounded-xl bg-[#F6B98A]/25 text-[#964B0A] flex items-center justify-center transition-transform hover:scale-110">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading text-[#2D251F]">
            <AnimatedNumber value={pelanggaranBulanIni.length} />
          </div>
        </div>

        {/* Sanksi Belum Selesai */}
        <div
          onClick={() => onNavigate('pelanggaran')}
          className="clay-card p-5 cursor-pointer hover-lift animate-slide-up delay-200 border border-[#E8D5C4]/70 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#6D5D4E]">Sanksi Belum Selesai</span>
            <div className="w-9 h-9 rounded-xl bg-[#D98E75]/25 text-[#8C2E17] flex items-center justify-center transition-transform hover:scale-110">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading text-[#2D251F]">
            <AnimatedNumber value={sanksiBelumSelesai.length} />
          </div>
        </div>
      </div>

      {/* Komponen Visualisasi Data Recharts: Izn & Pelanggaran Santri */}
      <SeasonalTrendChart
        perizinanList={perizinanList}
        pelanggaranList={pelanggaranList}
      />

      {/* Grid: 5 Pelanggaran Terbaru & 5 Izin Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 5 Pelanggaran Terbaru */}
        <div className="clay-card p-5 sm:p-6 border border-[#E8D5C4]/70 flex flex-col justify-between animate-slide-up delay-250">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8D5C4]/60">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#D98E75]" />
                <h3 className="font-heading font-black text-base sm:text-lg text-[#2F2720]">
                  5 Pelanggaran Terbaru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('pelanggaran')}
                className="text-xs font-bold text-[#5F8F6B] hover:text-[#497053] flex items-center gap-1 cursor-pointer transition-transform hover:translate-x-0.5"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#EFE7DC] mt-2 max-h-[360px] overflow-y-auto pr-1">
              {latestPelanggaran.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8A7A6C]">
                  Alhamdulillah, belum ada catatan pelanggaran.
                </div>
              ) : (
                latestPelanggaran.map(item => {
                  const s = santriMap.get(item.santriId);
                  const per = peraturanMap.get(item.peraturanId);
                  return (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-3 hover:bg-[#FAF5EE]/70 rounded-xl px-2 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2F261E]">
                            {item.santriNama || s?.nama || 'Santri'}
                          </span>
                          {s?.kelas && <KelasBadge kelas={s.kelas} />}
                        </div>
                        <p className="text-xs text-[#635547] line-clamp-1">
                          {per?.nama || item.keterangan}
                        </p>
                        <div className="text-[11px] text-[#86592D] font-semibold">
                          Sanksi: {item.sanksi || per?.sanksi || '-'}
                        </div>
                        <span className="text-[10px] text-[#938272] block">
                          {formatDatePretty(item.tanggal)}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <StatusSanksiBadge status={item.statusSanksi} size="sm" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 5 Izin Terbaru */}
        <div className="clay-card p-5 sm:p-6 border border-[#E8D5C4]/70 flex flex-col justify-between animate-slide-up delay-300">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8D5C4]/60">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#5F8F6B]" />
                <h3 className="font-heading font-black text-base sm:text-lg text-[#2F2720]">
                  5 Izin Terbaru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('perizinan')}
                className="text-xs font-bold text-[#5F8F6B] hover:text-[#497053] flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#EFE7DC] mt-2 max-h-[360px] overflow-y-auto pr-1">
              {latestPerizinan.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8A7A6C]">
                  Belum ada permohonan izin santri.
                </div>
              ) : (
                latestPerizinan.map(item => {
                  const s = santriMap.get(item.santriId);
                  return (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2F261E]">
                            {item.santriNama || s?.nama || 'Santri'}
                          </span>
                          {s?.kelas && <KelasBadge kelas={s.kelas} />}
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F8F6B]">
                            {item.jenis}
                          </span>
                        </div>
                        <p className="text-xs text-[#635547] line-clamp-1">
                          {item.alasan}
                        </p>
                        {item.catatanTambahan && (
                          <p className="text-[11px] text-[#8A450D] bg-[#F6B98A]/20 px-2 py-0.5 rounded-lg inline-block line-clamp-1">
                            Catatan: {item.catatanTambahan}
                          </p>
                        )}
                        <span className="text-[10px] text-[#938272] block">
                          {formatDateDMY(item.tanggalMulai)} s/d {formatDateDMY(item.tanggalSelesai)}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <StatusPerizinanBadge status={item.status} size="sm" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
