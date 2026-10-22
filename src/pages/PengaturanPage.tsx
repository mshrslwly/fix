import React, { useState } from 'react';
import {
  Database,
  LogOut,
  Upload,
  MessageCircle,
  Save,
  RotateCcw as ResetIcon,
  Sparkles,
  Users,
  ShieldAlert,
  FileCheck
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { useToast } from '../components/Toast';
import { Santri, Pelanggaran } from '../types';

interface PengaturanPageProps {
  santriList?: Santri[];
  pelanggaranList?: Pelanggaran[];
  onOpenImportModal: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export const PengaturanPage: React.FC<PengaturanPageProps> = ({
  santriList = [],
  pelanggaranList = [],
  onOpenImportModal,
  onLogout,
  userEmail
}) => {
  const { showToast } = useToast();

  // Template Pesan WhatsApp
  const [waTemplate, setWaTemplate] = useState<string>(() => dataService.getWhatsAppTemplate());
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isExportingSantri, setIsExportingSantri] = useState(false);
  const [isExportingPelanggaran, setIsExportingPelanggaran] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handleSyncToCloud = async () => {
    try {
      setIsSyncingCloud(true);
      const res = await dataService.syncAllToCloudNow();
      showToast(`Berhasil menyinkronkan ${res.santriCount} santri & ${res.pelanggaranCount} pelanggaran ke Cloud!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Gagal menyinkronkan data ke cloud', 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleSaveWaTemplate = () => {
    setIsSavingTemplate(true);
    dataService.saveWhatsAppTemplate(waTemplate);
    setTimeout(() => {
      setIsSavingTemplate(false);
      showToast('Format pesan WhatsApp berhasil disimpan!', 'success');
    }, 200);
  };

  const handleResetWaTemplate = () => {
    const defaultVal = dataService.resetWhatsAppTemplate();
    setWaTemplate(defaultVal);
    showToast('Format pesan WhatsApp dikembalikan ke bawaan.', 'info');
  };

  // Unduh Cadangan Data Santri (Asli sesuai input sistem)
  const handleExportSantriJson = async () => {
    try {
      setIsExportingSantri(true);
      const json = await dataService.exportSantriJson(santriList);
      const parsed = JSON.parse(json);
      const totalItems = Array.isArray(parsed) ? parsed.length : 0;

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cadangan_Data_Santri_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Berhasil mengunduh cadangan ${totalItems} data santri asli!`, 'success');
    } catch {
      showToast('Gagal mengekspor data santri', 'error');
    } finally {
      setIsExportingSantri(false);
    }
  };

  // Unduh Cadangan Data Pelanggaran (Asli sesuai input sistem)
  const handleExportPelanggaranJson = async () => {
    try {
      setIsExportingPelanggaran(true);
      const json = await dataService.exportPelanggaranJson(pelanggaranList);
      const parsed = JSON.parse(json);
      const totalItems = Array.isArray(parsed) ? parsed.length : 0;

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cadangan_Data_Pelanggaran_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Berhasil mengunduh cadangan ${totalItems} data pelanggaran asli!`, 'success');
    } catch {
      showToast('Gagal mengekspor data pelanggaran', 'error');
    } finally {
      setIsExportingPelanggaran(false);
    }
  };

  // Impor / Pulihkan Database JSON
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const msg = await dataService.importDatabaseJson(text);
        showToast(msg, 'success');
      } catch (err: any) {
        showToast(err.message || 'File cadangan tidak valid', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#2E2721]">
          Pengaturan
        </h2>
        <p className="text-xs sm:text-sm text-[#7D6B5A] mt-0.5">
          Manajemen akun pengurus, format pesan wali, dan cadangan data asli pesantren.
        </p>
      </div>

      {/* Card: Status Database Online Terpusat */}
      <div className="clay-card p-5 border border-[#5F8F6B]/30 space-y-3 bg-[#5F8F6B]/5 hover-lift">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-sm text-[#2E251E] flex items-center gap-2">
                <span>Database Online Terpusat Aktif</span>
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Cloud Realtime
              </span>
            </div>
            <p className="text-xs text-[#7F6E5E] leading-relaxed">
              Data otomatis sinkron di semua Browser &amp; HP (Android/iOS). Input di satu perangkat akan langsung muncul di perangkat lain.
            </p>
          </div>

          <button
            type="button"
            disabled={isSyncingCloud}
            onClick={handleSyncToCloud}
            className="clay-btn clay-btn-primary py-2 px-3 text-xs font-bold gap-1.5 cursor-pointer shrink-0 hover-lift active:scale-95"
            title="Pastikan semua data lokal terkirim ke Cloud Firestore"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSyncingCloud ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Card 1: Akun Pengurus */}
      <div className="clay-card p-5 border border-[#E8D5C4]/70 space-y-4 hover-lift">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5F8F6B]/15 text-[#5F8F6B] flex items-center justify-center font-bold text-base shadow-sm">
              P
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2E251E]">
                Akun Pengurus Pesantren
              </h3>
              <p className="text-xs text-[#7F6E5E]">
                {userEmail || 'Pengurus Terdaftar'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="clay-btn clay-btn-danger py-2 px-3.5 text-xs font-bold gap-1.5 cursor-pointer hover-lift active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </div>

      {/* Card 2: Pengaturan Template Pesan WhatsApp */}
      <div className="clay-card p-5 border border-[#25D366]/40 space-y-4 bg-[#25D366]/5 hover-lift">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-[#2E251E] flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#1EBE5D]" />
              <span>Format Template Pesan WhatsApp Wali</span>
            </h3>
            <p className="text-xs text-[#7F6E5E] mt-0.5 leading-relaxed">
              Sesuaikan kata-kata pesan otomatis saat tombol <strong>"Kirim via WhatsApp"</strong> ditekan dari Kartu Akses Santri.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetWaTemplate}
            className="text-xs text-[#8C7B6D] hover:text-[#5F4E40] font-bold flex items-center gap-1 cursor-pointer shrink-0"
            title="Kembalikan ke template default"
          >
            <ResetIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Bawaan</span>
          </button>
        </div>

        {/* Textarea Template */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#4B3C2F]">
            Teks Template WhatsApp:
          </label>
          <textarea
            rows={7}
            value={waTemplate}
            onChange={(e) => setWaTemplate(e.target.value)}
            className="w-full p-3 text-xs sm:text-sm font-sans rounded-xl bg-white border border-[#E8D5C4] text-[#2E251E] focus:outline-none focus:ring-2 focus:ring-[#25D366] leading-relaxed resize-y font-mono"
            placeholder="Ketik format template pesan WhatsApp..."
          />
        </div>

        {/* Variabel Helper Tags */}
        <div className="p-3 rounded-xl bg-white/70 border border-[#E8D5C4]/70 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#5A4839]">
            <Sparkles className="w-3.5 h-3.5 text-[#1EBE5D]" />
            <span>Variabel Otomatis yang Dapat Digunakan:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { tag: '{nama_santri}', desc: 'Nama lengkap santri' },
              { tag: '{kelas}', desc: 'Tingkat kelas santri' },
              { tag: '{nama_wali}', desc: 'Nama orang tua/wali' },
              { tag: '{kode_akses}', desc: 'Kode akses 10 digit' },
              { tag: '{link_portal}', desc: 'Tautan resmi portal wali' }
            ].map(v => (
              <button
                key={v.tag}
                type="button"
                onClick={() => {
                  setWaTemplate(prev => prev + ` ${v.tag}`);
                  showToast(`Variabel ${v.tag} ditambahkan!`, 'info');
                }}
                className="px-2 py-1 rounded-lg bg-[#FAF3EA] border border-[#E8D5C4] text-[11px] font-mono text-[#5F8F6B] font-bold hover:bg-[#5F8F6B]/10 cursor-pointer transition-colors"
                title={`Klik untuk menyisipkan ke pesan (${v.desc})`}
              >
                {v.tag} <span className="font-sans text-[10px] text-[#8C7A6B] font-normal">({v.desc})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={isSavingTemplate}
            onClick={handleSaveWaTemplate}
            className="clay-btn py-2 px-4 bg-[#25D366] text-white hover:bg-[#1EBE5D] shadow-[3px_3px_10px_rgba(37,211,102,0.35)] text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingTemplate ? 'Menyimpan...' : 'Simpan Format Template'}</span>
          </button>
        </div>
      </div>

      {/* Card 3: Cadangan & Pemulihan Data (Data Nyata Asli dari Website) */}
      <div className="clay-card p-5 border border-[#E8D5C4]/70 space-y-4 hover-lift">
        <div>
          <h3 className="font-bold text-sm text-[#2E251E] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#5F8F6B]" />
            <span>Cadangan & Pemulihan Data Santri & Pelanggaran</span>
          </h3>
          <p className="text-xs text-[#7F6E5E] mt-0.5">
            File cadangan diambil langsung dari seluruh data nyata yang telah diinput dan tersimpan di sistem.
          </p>
        </div>

        {/* 2 Tombol Unduh Cadangan: Santri & Pelanggaran */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            disabled={isExportingSantri}
            onClick={handleExportSantriJson}
            className="clay-btn clay-btn-secondary py-3 px-4 text-xs font-bold flex items-center justify-between gap-2 cursor-pointer border border-[#E0C7B0] hover-lift active:scale-95 text-left"
            title="Unduh seluruh data santri yang telah diinput ke dalam format JSON"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#5F8F6B] shrink-0" />
              <div>
                <div className="font-bold text-[#2A231C]">Cadangan Data Santri</div>
                <div className="text-[10px] text-[#7A6A5A] font-normal">
                  {isExportingSantri ? 'Menyiapkan file...' : `${santriList.length} Santri Terdaftar`}
                </div>
              </div>
            </div>
            <FileCheck className="w-4 h-4 text-[#5F8F6B] shrink-0" />
          </button>

          <button
            type="button"
            disabled={isExportingPelanggaran}
            onClick={handleExportPelanggaranJson}
            className="clay-btn clay-btn-secondary py-3 px-4 text-xs font-bold flex items-center justify-between gap-2 cursor-pointer border border-[#E0C7B0] hover-lift active:scale-95 text-left"
            title="Unduh seluruh catatan pelanggaran dan sanksi yang telah dicatat ke dalam format JSON"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D98E75] shrink-0" />
              <div>
                <div className="font-bold text-[#2A231C]">Cadangan Data Pelanggaran</div>
                <div className="text-[10px] text-[#7A6A5A] font-normal">
                  {isExportingPelanggaran ? 'Menyiapkan file...' : `${pelanggaranList.length} Catatan Pelanggaran`}
                </div>
              </div>
            </div>
            <FileCheck className="w-4 h-4 text-[#D98E75] shrink-0" />
          </button>
        </div>

        {/* Opsi Pulihkan Database & Impor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8D5C4]/50">
          <label className="clay-btn clay-btn-secondary py-2.5 px-4 text-xs font-bold gap-2 cursor-pointer hover-lift active:scale-95">
            <Upload className="w-4 h-4 text-[#8A5021]" />
            <span>Pulihkan Data dari JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onOpenImportModal}
            className="clay-btn clay-btn-primary py-2.5 px-4 text-xs font-bold gap-2 cursor-pointer hover-lift active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Impor Santri (.js / Excel)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
