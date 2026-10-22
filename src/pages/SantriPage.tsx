import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  FileText,
  Printer,
  Upload,
  QrCode,
  Edit2,
  Trash2,
  Share2,
  Phone,
  MapPin,
  User,
  ArrowUpCircle,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { Santri, KelasSantri } from '../types';
import { exportSantriToExcel } from '../utils/exportExcel';
import { exportSantriToPdf, exportSemuaKartuAksesPdf } from '../utils/exportPdf';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { KelasBadge } from '../components/Badge';
import { AnimatedNumber } from '../components/AnimatedNumber';

interface SantriPageProps {
  santriList: Santri[];
  onAddSantri: (data: Omit<Santri, 'id' | 'kodeAkses' | 'createdAt' | 'updatedAt'>) => Promise<Santri>;
  onEditSantri: (id: string, data: Partial<Santri>) => Promise<Santri>;
  onDeleteSantri: (id: string) => Promise<void>;
  onNaikKelasMassal: (promotions: Array<{ santriId: string; nextKelas: KelasSantri }>) => Promise<number>;
  onOpenCardModal: (santri: Santri) => void;
  onOpenImportModal: () => void;
}

const KELAS_OPTIONS: KelasSantri[] = ['1', '2', '3', '4', '5', '6', 'Salaf'];

export const SantriPage: React.FC<SantriPageProps> = ({
  santriList,
  onAddSantri,
  onEditSantri,
  onDeleteSantri,
  onNaikKelasMassal,
  onOpenCardModal,
  onOpenImportModal
}) => {
  const { showToast } = useToast();
  const [selectedKelas, setSelectedKelas] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [deletingSantri, setDeletingSantri] = useState<Santri | null>(null);
  const [isNaikKelasModalOpen, setIsNaikKelasModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAllCards, setIsGeneratingAllCards] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    kelas: '1' as KelasSantri,
    alamat: '',
    namaWali: '',
    noHpWali: ''
  });

  // Count per class
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = { semua: santriList.length };
    KELAS_OPTIONS.forEach(k => counts[k] = 0);
    santriList.forEach(s => {
      if (counts[s.kelas] !== undefined) {
        counts[s.kelas]++;
      }
    });
    return counts;
  }, [santriList]);

  // Filtered santri
  const filteredSantri = useMemo(() => {
    return santriList.filter(s => {
      if (selectedKelas !== 'semua' && s.kelas !== selectedKelas) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          s.nama.toLowerCase().includes(q) ||
          s.namaWali.toLowerCase().includes(q) ||
          s.alamat.toLowerCase().includes(q) ||
          s.kodeAkses.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [santriList, selectedKelas, searchQuery]);

  const handleOpenAdd = () => {
    setFormData({
      nama: '',
      kelas: selectedKelas !== 'semua' ? (selectedKelas as KelasSantri) : '1',
      alamat: '',
      namaWali: '',
      noHpWali: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Santri) => {
    setFormData({
      nama: s.nama,
      kelas: s.kelas,
      alamat: s.alamat,
      namaWali: s.namaWali,
      noHpWali: s.noHpWali || ''
    });
    setEditingSantri(s);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      showToast('Nama santri wajib diisi', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      await onAddSantri({
        nama: formData.nama.trim(),
        kelas: formData.kelas,
        alamat: formData.alamat.trim() || '-',
        namaWali: formData.namaWali.trim() || '-',
        noHpWali: formData.noHpWali.trim()
      });
      showToast('Santri berhasil ditambahkan!', 'success');
      setIsAddModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan santri', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSantri) return;
    try {
      setIsSubmitting(true);
      await onEditSantri(editingSantri.id, {
        nama: formData.nama.trim(),
        kelas: formData.kelas,
        alamat: formData.alamat.trim() || '-',
        namaWali: formData.namaWali.trim() || '-',
        noHpWali: formData.noHpWali.trim()
      });
      showToast('Data santri berhasil diperbarui!', 'success');
      setEditingSantri(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui santri', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSantri) return;
    const target = deletingSantri;
    setDeletingSantri(null);
    showToast('Santri berhasil dihapus', 'success');
    try {
      await onDeleteSantri(target.id);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus santri', 'error');
    }
  };

  // Preview Naik Kelas Massal
  const plannedPromotions = useMemo(() => {
    const nextMap: Record<KelasSantri, KelasSantri> = {
      '1': '2',
      '2': '3',
      '3': '4',
      '4': '5',
      '5': '6',
      '6': 'Salaf',
      'Salaf': 'Salaf'
    };

    return santriList.map(s => ({
      santriId: s.id,
      nama: s.nama,
      currentKelas: s.kelas,
      nextKelas: nextMap[s.kelas]
    }));
  }, [santriList]);

  const handleExecuteNaikKelas = async () => {
    try {
      setIsSubmitting(true);
      const payload = plannedPromotions.map(p => ({
        santriId: p.santriId,
        nextKelas: p.nextKelas
      }));
      const count = await onNaikKelasMassal(payload);
      showToast(`Alhamdulillah! Sebanyak ${count} santri berhasil dinaikkan kelas.`, 'success');
      setIsNaikKelasModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal menaikkan kelas massal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintAllCards = async () => {
    try {
      setIsGeneratingAllCards(true);
      showToast('Sedang membuat file PDF kartu santri...', 'info');
      await exportSemuaKartuAksesPdf(santriList);
      showToast('PDF 8 kartu per halaman siap dicetak!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat PDF kartu', 'error');
    } finally {
      setIsGeneratingAllCards(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#2E2721] tracking-tight">
            Data Santri
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6B5A] mt-0.5">
            Dikelompokkan berdasarkan tingkatan Kelas 1 - 6 dan Salaf.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Naik Kelas Massal */}
          <button
            type="button"
            onClick={() => setIsNaikKelasModalOpen(true)}
            className="clay-btn py-2.5 px-4 bg-[#7A9E7E] text-white hover:bg-[#688E6D] shadow-[4px_4px_12px_rgba(122,158,126,0.35)] text-xs font-bold gap-1.5 cursor-pointer hover-lift active:scale-95"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Naik Kelas Massal</span>
          </button>


          <button
            type="button"
            onClick={handleOpenAdd}
            className="clay-btn clay-btn-primary py-2.5 px-4 text-xs font-bold gap-2 cursor-pointer hover-lift active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Santri</span>
          </button>

          <button
            type="button"
            onClick={onOpenImportModal}
            className="clay-btn clay-btn-secondary py-2.5 px-3.5 text-xs font-bold gap-1.5 cursor-pointer hover-lift active:scale-95"
            title="Impor dari data JS atau Excel"
          >
            <Upload className="w-4 h-4 text-[#5F8F6B]" />
            <span className="hidden sm:inline">Impor</span>
          </button>

          <button
            type="button"
            disabled={isGeneratingAllCards}
            onClick={handlePrintAllCards}
            className="clay-btn clay-btn-accent py-2.5 px-3.5 text-xs font-bold gap-1.5 cursor-pointer hover-lift active:scale-95"
            title="Cetak Semua Kartu Akses ke PDF (8 per lembar A4)"
          >
            <Printer className="w-4 h-4" />
            <span>{isGeneratingAllCards ? '...' : 'Cetak Kartu A4'}</span>
          </button>
        </div>
      </div>

      {/* CLAY CARDS PENGELOMPOKAN KELAS 1 - 6 & SALAF */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <button
          type="button"
          onClick={() => setSelectedKelas('semua')}
          className={`p-3 rounded-2xl text-center transition-all cursor-pointer border hover-lift active:scale-95 ${
            selectedKelas === 'semua'
              ? 'clay-card bg-[#5F8F6B] text-white border-[#5F8F6B] shadow-md scale-102'
              : 'clay-card bg-white text-[#4A3D30] border-[#E8D5C4]/70 hover:bg-[#FAF4ED]'
          }`}
        >
          <span className="text-[11px] font-bold block">Semua</span>
          <span className="text-xl font-black font-heading block mt-0.5">
            <AnimatedNumber value={classCounts.semua} />
          </span>
        </button>

        {KELAS_OPTIONS.map((k) => {
          const isActive = selectedKelas === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedKelas(k)}
              className={`p-3 rounded-2xl text-center transition-all cursor-pointer border hover-lift active:scale-95 ${
                isActive
                  ? 'clay-card bg-[#5F8F6B] text-white border-[#5F8F6B] shadow-md scale-102'
                  : 'clay-card bg-white text-[#4A3D30] border-[#E8D5C4]/70 hover:bg-[#FAF4ED]'
              }`}
            >
              <span className={`text-[11px] font-bold block ${isActive ? 'text-white/90' : 'text-[#7D6B5A]'}`}>
                {k === 'Salaf' ? 'Salaf' : `Kelas ${k}`}
              </span>
              <span className="text-xl font-black font-heading block mt-0.5">
                <AnimatedNumber value={classCounts[k] || 0} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Export Bar */}
      <div className="clay-card p-3 sm:p-4 border border-[#E8D5C4]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F7D6D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama santri, wali, alamat, atau kode..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => exportSantriToExcel(filteredSantri)}
            className="clay-btn clay-btn-secondary py-2 px-3 text-xs font-bold gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={() => exportSantriToPdf(filteredSantri)}
            className="clay-btn clay-btn-secondary py-2 px-3 text-xs font-bold gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-700" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Santri Table View */}
      {filteredSantri.length === 0 ? (
        <div className="clay-card p-12 text-center text-[#7F6E5E] space-y-2">
          <User className="w-10 h-10 mx-auto text-[#D9B99B] opacity-60" />
          <h4 className="font-bold text-base text-[#382F26]">
            Tidak ada santri ditemukan
          </h4>
          <p className="text-xs">
            {selectedKelas !== 'semua' ? `Belum ada santri terdaftar di Kelas ${selectedKelas}.` : 'Silakan tambahkan santri pertama atau impor dari file.'}
          </p>
        </div>
      ) : (
        <div className="clay-card p-0 overflow-hidden border border-[#E8D5C4]/70">
          <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF2E8] sticky top-0 z-10 border-b border-[#E8D5C4]/60 text-[#554536] shadow-sm">
                <tr>
                  <th className="py-3 px-4 font-bold">Nama Santri</th>
                  <th className="py-3 px-4 font-bold">Kelas</th>
                  <th className="py-3 px-4 font-bold">Wali Santri</th>
                  <th className="py-3 px-4 font-bold hidden md:table-cell">Alamat</th>
                  <th className="py-3 px-4 font-bold">Kode Akses</th>
                  <th className="py-3 px-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DC]">
                {filteredSantri.map((santri) => (
                  <tr key={santri.id} className="hover:bg-black/3 transition-colors">
                    {/* Nama Santri */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2A231C] text-sm">
                        {santri.nama}
                      </div>
                      <div className="text-[11px] text-[#7C6A5A] md:hidden">
                        {santri.alamat}
                      </div>
                    </td>

                    {/* Kelas */}
                    <td className="py-3 px-4">
                      <KelasBadge kelas={santri.kelas} />
                    </td>

                    {/* Wali */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#382F26]">
                        {santri.namaWali}
                      </div>
                      {santri.noHpWali && (
                        <div className="text-[11px] font-mono text-[#5F8F6B] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{santri.noHpWali}</span>
                        </div>
                      )}
                    </td>

                    {/* Alamat */}
                    <td className="py-3 px-4 hidden md:table-cell text-[#5E5043]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[#9C8A79]" />
                        <span className="line-clamp-1">{santri.alamat}</span>
                      </div>
                    </td>

                    {/* Kode Akses */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onOpenCardModal(santri)}
                        className="font-mono text-xs font-black tracking-wider px-2.5 py-1 rounded-xl bg-[#5F8F6B]/15 text-[#3F6B4D] hover:bg-[#5F8F6B]/25 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Klik untuk membuka QR & link wali"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{santri.kodeAkses}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenCardModal(santri)}
                          className="p-2 rounded-xl bg-[#E8D5C4] text-[#524133] hover:bg-[#DFC5B0] transition-colors cursor-pointer"
                          title="Portal Wali / Kartu Akses QR"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(santri)}
                          className="p-2 rounded-xl bg-[#E8D5C4] text-[#524133] hover:bg-[#DFC5B0] transition-colors cursor-pointer"
                          title="Ubah data"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingSantri(santri)}
                          className="p-2 rounded-xl bg-[#D98E75]/20 text-[#8C2E17] hover:bg-[#D98E75]/35 transition-colors cursor-pointer"
                          title="Hapus santri"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="py-2.5 px-4 bg-[#FAF5EE] border-t border-[#EFE7DC] text-xs text-[#7F6E5E] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>
              Menampilkan <strong className="text-[#382F26] font-bold"><AnimatedNumber value={filteredSantri.length} /></strong> santri
            </span>
            <span className="text-[11px] text-[#A08F80]">
              Total terdaftar di sistem: <strong className="text-[#5F8F6B] font-bold"><AnimatedNumber value={santriList.length} /></strong>
            </span>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Santri */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Santri Baru"
        subtitle="Pilih tingkatan kelas dan masukkan biodata santri"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Nama Lengkap Santri *
              </label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Muhammad Al-Fatih"
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Kelas *
              </label>
              <select
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value as KelasSantri })}
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] font-bold"
              >
                {KELAS_OPTIONS.map(k => (
                  <option key={k} value={k}>
                    {k === 'Salaf' ? 'Salaf' : `Kelas ${k}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Nama Wali / Orang Tua *
            </label>
            <input
              type="text"
              required
              value={formData.namaWali}
              onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
              placeholder="Contoh: H. Rahmat Pratama"
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              No. Handphone / WhatsApp Wali (Opsional)
            </label>
            <input
              type="text"
              value={formData.noHpWali}
              onChange={(e) => setFormData({ ...formData, noHpWali: e.target.value })}
              placeholder="Contoh: 081234567890"
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Alamat Asal Santri *
            </label>
            <textarea
              rows={2}
              required
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              placeholder="Contoh: Cirebon, Jawa Barat"
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="clay-btn clay-btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Santri'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Ubah Santri */}
      <Modal
        isOpen={Boolean(editingSantri)}
        onClose={() => setEditingSantri(null)}
        title="Ubah Data Santri"
        subtitle={`Mengubah data ${editingSantri?.nama}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Nama Lengkap Santri *
              </label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Kelas *
              </label>
              <select
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value as KelasSantri })}
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] font-bold"
              >
                {KELAS_OPTIONS.map(k => (
                  <option key={k} value={k}>
                    {k === 'Salaf' ? 'Salaf' : `Kelas ${k}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Nama Wali / Orang Tua *
            </label>
            <input
              type="text"
              required
              value={formData.namaWali}
              onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              No. Handphone / WhatsApp Wali
            </label>
            <input
              type="text"
              value={formData.noHpWali}
              onChange={(e) => setFormData({ ...formData, noHpWali: e.target.value })}
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Alamat Asal Santri *
            </label>
            <textarea
              rows={2}
              required
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setEditingSantri(null)}
              className="px-4 py-2 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="clay-btn clay-btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Hapus Santri */}
      <Modal
        isOpen={Boolean(deletingSantri)}
        onClose={() => setDeletingSantri(null)}
        title="Hapus Data Santri"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#4E3F32]">
            Apakah Anda yakin ingin menghapus <strong>{deletingSantri?.nama}</strong>? Seluruh catatan izin dan pelanggaran ananda akan dihapus dari sistem.
          </p>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-[#8C4A15] space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Keamanan Link Wali Santri:
            </span>
            <p>
              Setelah dihapus, tautan/link portal wali santri akan <strong>otomatis hangus seketika</strong> dan tidak akan bisa diakses lagi oleh wali santri.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setDeletingSantri(null)}
              className="px-4 py-2 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmDelete}
              className="clay-btn clay-btn-danger py-2 px-4 text-xs font-bold cursor-pointer"
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Naik Kelas Massal */}
      <Modal
        isOpen={isNaikKelasModalOpen}
        onClose={() => setIsNaikKelasModalOpen(false)}
        title="Naik Kelas Massal Santri"
        subtitle="Menaikkan jenjang kelas seluruh santri ke tingkat berikutnya"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#E8D5C4]/30 border border-[#D9B99B] space-y-2 text-xs text-[#524133]">
            <div className="flex items-center gap-2 font-bold text-sm text-[#3A2D22]">
              <GraduationCap className="w-5 h-5 text-[#5F8F6B]" />
              <span>Aturan Kenaikan Kelas Tahun Ajaran Baru:</span>
            </div>
            <ul className="space-y-1 list-disc list-inside ml-2">
              <li>Kelas 1 ➔ Kelas 2</li>
              <li>Kelas 2 ➔ Kelas 3</li>
              <li>Kelas 3 ➔ Kelas 4</li>
              <li>Kelas 4 ➔ Kelas 5</li>
              <li>Kelas 5 ➔ Kelas 6</li>
              <li>Kelas 6 ➔ Salaf</li>
              <li>Kelas Salaf ➔ Tetap Salaf</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#4B3C2F] block">
              Pratinjau Kenaikan ({plannedPromotions.length} Santri):
            </span>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-[#E8D5C4] divide-y divide-[#EFE7DC] text-xs">
              {plannedPromotions.map(item => (
                <div key={item.santriId} className="p-2.5 flex items-center justify-between">
                  <span className="font-bold text-[#2A231C]">{item.nama}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-bold text-[11px]">
                      {item.currentKelas === 'Salaf' ? 'Salaf' : `Kelas ${item.currentKelas}`}
                    </span>
                    <span className="text-[#5F8F6B] font-bold">➔</span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#5F8F6B]/20 text-[#386144] font-black text-[11px]">
                      {item.nextKelas === 'Salaf' ? 'Salaf' : `Kelas ${item.nextKelas}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsNaikKelasModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleExecuteNaikKelas}
              className="clay-btn clay-btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Naikkan Semua Santri'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
