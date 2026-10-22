import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Calendar, ShieldAlert, TrendingUp, Sparkles, Filter, Info } from 'lucide-react';
import { Perizinan, Pelanggaran } from '../types';

interface SeasonalTrendChartProps {
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
}

interface MonthlyData {
  key: string;
  bulan: string;
  fullName: string;
  izin: number;
  pelanggaran: number;
  izinPulang: number;
  izinSakit: number;
  izinKeluar: number;
  musimInfo: string;
}

export const SeasonalTrendChart: React.FC<SeasonalTrendChartProps> = ({
  perizinanList,
  pelanggaranList
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'izin' | 'pelanggaran'>('all');

  // Generate 6 months data window (current month back 5 months)
  const chartData = useMemo(() => {
    const months: MonthlyData[] = [];
    const now = new Date();

    const monthNamesShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    const monthNamesFull = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Build chronological array for the past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const labelShort = `${monthNamesShort[monthIdx]} '${String(year).slice(-2)}`;
      const labelFull = `${monthNamesFull[monthIdx]} ${year}`;

      // Typical pesantren seasonal context
      let musimInfo = 'Aktivitas Normal Belajar & Halaqah';
      if (monthIdx === 3 || monthIdx === 4) {
        musimInfo = 'Musim Liburan Idul Fitri & Ramadhan (Puncak Izin Pulang)';
      } else if (monthIdx === 5 || monthIdx === 6) {
        musimInfo = 'Libur Akhir Tahun Ajaran / Santri Baru Masuk';
      } else if (monthIdx === 11 || monthIdx === 0) {
        musimInfo = 'Ujian Semester & Libur Pertengahan Tahun';
      }

      months.push({
        key,
        bulan: labelShort,
        fullName: labelFull,
        izin: 0,
        pelanggaran: 0,
        izinPulang: 0,
        izinSakit: 0,
        izinKeluar: 0,
        musimInfo
      });
    }

    const monthMap = new Map<string, MonthlyData>(months.map(m => [m.key, m]));

    // Aggregate Perizinan
    perizinanList.forEach(p => {
      const dateStr = p.tanggalMulai || p.createdAt || '';
      if (!dateStr) return;
      const key = dateStr.slice(0, 7);
      const entry = monthMap.get(key);
      if (entry) {
        entry.izin += 1;
        if (p.jenis === 'pulang') entry.izinPulang += 1;
        else if (p.jenis === 'sakit') entry.izinSakit += 1;
        else entry.izinKeluar += 1;
      }
    });

    // Aggregate Pelanggaran
    pelanggaranList.forEach(pl => {
      const dateStr = pl.tanggal || pl.createdAt || '';
      if (!dateStr) return;
      const key = dateStr.slice(0, 7);
      const entry = monthMap.get(key);
      if (entry) {
        entry.pelanggaran += 1;
      }
    });

    return months;
  }, [perizinanList, pelanggaranList]);

  // Insights calculation
  const totalIzin6Bulan = useMemo(() => chartData.reduce((acc, c) => acc + c.izin, 0), [chartData]);
  const totalPelanggaran6Bulan = useMemo(() => chartData.reduce((acc, c) => acc + c.pelanggaran, 0), [chartData]);
  const rataRataIzinPerBulan = Math.round(totalIzin6Bulan / 6);

  // Peak month for leave
  const peakLeaveMonth = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b.izin - a.izin)[0];
  }, [chartData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item: MonthlyData | undefined = chartData.find(d => d.bulan === label);
      return (
        <div className="bg-[#FAF5EE] border-2 border-[#D9B99B] p-3.5 rounded-2xl shadow-xl text-xs space-y-2 max-w-xs text-[#2E251E]">
          <div className="border-b border-[#E8D5C4] pb-1.5 flex items-center justify-between gap-2">
            <span className="font-heading font-black text-sm text-[#2E251E]">
              {item?.fullName || label}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#5F8F6B]/15 text-[#3F6B4D] font-bold text-[10px]">
              6 Bulan Terakhir
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-[#3E6F4B]">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-md bg-[#5F8F6B] shrink-0" />
                Total Izin Santri:
              </span>
              <span className="font-black text-sm">{item?.izin || 0} izin</span>
            </div>

            {item && item.izin > 0 && (
              <div className="pl-4 text-[11px] text-[#6A5A4A] space-y-0.5">
                <div>• Pulang: {item.izinPulang}</div>
                <div>• Sakit: {item.izinSakit}</div>
                <div>• Keluar: {item.izinKeluar}</div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 text-[#B35237]">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-md bg-[#D98E75] shrink-0" />
                Catatan Pelanggaran:
              </span>
              <span className="font-black text-sm">{item?.pelanggaran || 0} kasus</span>
            </div>
          </div>

          {item?.musimInfo && (
            <div className="pt-1.5 border-t border-[#E8D5C4]/70 flex items-start gap-1.5 text-[10px] text-[#786756] leading-relaxed">
              <Info className="w-3 h-3 text-[#786756] shrink-0 mt-0.5" />
              <span>{item.musimInfo}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="clay-card p-5 sm:p-6 border border-[#E8D5C4]/70 space-y-5 animate-slide-up delay-100">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E8D5C4]/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5F8F6B]/15 text-[#5F8F6B] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base sm:text-lg text-[#2F2720] flex items-center gap-2">
                <span>Izn &amp; Pelanggaran Santri</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFE4D4] text-[#6E5A47] font-bold">
                  6 Bulan Terakhir
                </span>
              </h3>
              <p className="text-xs text-[#7A6A5A]">
                Visualisasi frekuensi izin pulang santri &amp; catatan disiplin.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toggle Buttons */}
        <div className="flex items-center gap-1 bg-[#FAF3EA] p-1 rounded-xl border border-[#E8D5C4] shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#5F8F6B] text-white shadow-xs'
                : 'text-[#6F5E4F] hover:bg-[#EFE4D4]'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('izin')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              filterMode === 'izin'
                ? 'bg-[#5F8F6B] text-white shadow-xs'
                : 'text-[#6F5E4F] hover:bg-[#EFE4D4]'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Izin</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pelanggaran')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              filterMode === 'pelanggaran'
                ? 'bg-[#D98E75] text-white shadow-xs'
                : 'text-[#6F5E4F] hover:bg-[#EFE4D4]'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Pelanggaran</span>
          </button>
        </div>
      </div>

      {/* 4 Mini Insight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-[#5F8F6B]/10 border border-[#5F8F6B]/30 space-y-1">
          <span className="text-[11px] font-bold text-[#446E4F] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Total Izin (6 Bln)
          </span>
          <div className="text-xl sm:text-2xl font-black font-heading text-[#2A4833]">
            {totalIzin6Bulan} <span className="text-xs font-normal text-[#5A7863]">perizinan</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#D98E75]/10 border border-[#D98E75]/30 space-y-1">
          <span className="text-[11px] font-bold text-[#8C432E] flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Total Pelanggaran
          </span>
          <div className="text-xl sm:text-2xl font-black font-heading text-[#6B2E1E]">
            {totalPelanggaran6Bulan} <span className="text-xs font-normal text-[#8A4F3F]">kasus</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#F6B98A]/15 border border-[#F6B98A]/40 space-y-1">
          <span className="text-[11px] font-bold text-[#944D12] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Rata-rata Izin / Bulan
          </span>
          <div className="text-xl sm:text-2xl font-black font-heading text-[#6E3508]">
            {rataRataIzinPerBulan} <span className="text-xs font-normal text-[#8E5A33]">izin / bln</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#6FA8DC]/15 border border-[#6FA8DC]/40 space-y-1">
          <span className="text-[11px] font-bold text-[#1E5283] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Izin Terbanyak
          </span>
          <div className="text-sm sm:text-base font-black font-heading text-[#103A60] truncate">
            {peakLeaveMonth && peakLeaveMonth.izin > 0
              ? `${peakLeaveMonth.bulan} (${peakLeaveMonth.izin} izin)`
              : 'Belum Ada Puncak'}
          </div>
        </div>
      </div>

      {/* Main Recharts Bar Chart */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 15, left: -15, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E8D5C4"
              opacity={0.7}
              vertical={false}
            />
            <XAxis
              dataKey="bulan"
              stroke="#7A6856"
              tickLine={false}
              axisLine={{ stroke: '#E8D5C4' }}
              tick={{ fontSize: 11, fill: '#6D5B4B', fontWeight: 600 }}
            />
            <YAxis
              stroke="#7A6856"
              tickLine={false}
              axisLine={{ stroke: '#E8D5C4' }}
              tick={{ fontSize: 11, fill: '#6D5B4B' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 'bold' }}
            />

            {(filterMode === 'all' || filterMode === 'izin') && (
              <Bar
                dataKey="izin"
                name="Frekuensi Izin Santri"
                fill="#5F8F6B"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            )}

            {(filterMode === 'all' || filterMode === 'pelanggaran') && (
              <Bar
                dataKey="pelanggaran"
                name="Catatan Pelanggaran"
                fill="#D98E75"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Seasonal Leave Tracking Explanation Footer */}
      <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#EFE7DC] text-xs text-[#7F6E5E] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#5F8F6B]" />
          <span>
            <strong>Analisis:</strong> Puncak perizinan dan manajemen pelanggaran santri.
          </span>
        </div>
        <div className="text-[11px] text-[#8C7A6B] font-mono">
          Update otomatis secara real-time dari admin.
        </div>
      </div>
    </div>
  );
};
