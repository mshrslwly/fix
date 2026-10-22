import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  User,
  Clock,
  Lock,
  Check,
  AlertTriangle,
  LayoutGrid,
  List,
  Calendar,
  Info
} from 'lucide-react';
import { Pelanggaran, Santri, Peraturan, StatusSanksi } from '../types';
import { formatDatePretty, formatDateDMY, toInputDateFormat } from '../utils/date';
import { exportPelanggaranToExcel } from '../utils/exportExcel';
import { exportPelanggaranToPdf } from '../utils/exportPdf';
import { KelasBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { AnimatedNumber } from '../components/AnimatedNumber';

interface PelanggaranPageProps {
  pelanggaranList: Pelanggaran[];
  santriList: Santri[];
  peraturanList: Peraturan[];
  onAddPelanggaran: (data: Omit<Pelanggaran, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Pelanggaran>;
  onEditPelanggaran: (id: string, data: Partial<Pelanggaran>) => Promise<void>;
  onDeletePelanggaran: (id: string) => Promise<void>;
}

interface ConfirmCheckTarget {
  pelanggaran: Pelanggaran;
  itemText: string;
  itemIndex: number;
}

/**
 * Memecah teks sanksi menjadi butir-butir terpisah jika memiliki beberapa tugas sanksi
 * (contoh: "Membersihkan Tempat Wudhu & Selasar Masjid" -> ["Membersihkan Tempat Wudhu", "Selasar Masjid"])
 */
export function parseSanksiItems(sanksiText: string): string[] {
  if (!sanksiText || !sanksiText.trim()) return ['Teguran & Pembinaan'];
  const text = sanksiText.trim();

  // Pisahkan jika memiliki newline
  if (text.includes('\n')) {
    const lines = text
      .split('\n')
      .map(s => s.trim().replace(/^[\d+•\-*.]+\s*/, ''))
      .filter(Boolean);
    if (lines.length > 0) return lines;
  }

  // Pisahkan jika menggunakan simbol ampersand ' & ' (standar umum pesantren)
  if (text.includes(' & ')) {
    const parts = text
      .split(' & ')
      .map(s => s.trim().replace(/^[\d+•\-*.]+\s*/, ''))
      .filter(Boolean);
    if (parts.length > 0) return parts;
  }

  // Pisahkan jika menggunakan koma ', '
  if (text.includes(', ')) {
    const parts = text
      .split(', ')
      .map(s => s.trim().replace(/^[\d+•\-*.]+\s*/, ''))
      .filter(Boolean);
    if (parts.length > 0) return parts;
  }

  // Pisahkan jika menggunakan titik koma ';'
  if (text.includes(';')) {
    const parts = text
      .split(';')
      .map(s => s.trim().replace(/^[\d+•\-*.]+\s*/, ''))
      .filter(Boolean);
    if (parts.length > 0) return parts;
  }

  return [text];
}

export const PelanggaranPage: React.FC<PelanggaranPageProps> = ({
  pelanggaranList,
  santriList,
  peraturanList,
  onAddPelanggaran,
  onEditPelanggaran,
  onDeletePelanggaran
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusSanksiFilter, setStatusSanksiFilter] = useState<'semua' | 'belum' | 'selesai'>('semua');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pelanggaran | null>(null);
  const [deletingItem, setDeletingItem] = useState<Pelanggaran | null>(null);
  
  // Konfirmasi Ceklis Sanksi per Butir
  const [confirmCheckTarget, setConfirmCheckTarget] = useState<ConfirmCheckTarget | null>(null);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [typedSantriName, setTypedSantriName] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    santriId: '',
    santriNama: '',
    peraturanId: '',
    tanggal: toInputDateFormat(),
    keterangan: '',
    sanksi: '',
    statusSanksi: 'belum' as StatusSanksi
  });

  const santriMap = useMemo(() => new Map(santriList.map(s => [s.id, s])), [santriList]);
  const peraturanMap = useMemo(() => new Map(peraturanList.map(p => [p.id, p])), [peraturanList]);

  // Autocomplete matching students
  const filteredStudentSuggestions = useMemo(() => {
    if (!typedSantriName.trim()) return [];
    const q = typedSantriName.toLowerCase().trim();
    return santriList.filter(s =>
      s.nama.toLowerCase().includes(q) ||
      s.alamat.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [santriList, typedSantriName]);

  // Fungsi pengecekan apakah suatu butir sanksi sudah dicentang
  const isItemCompleted = (item: Pelanggaran, sItem: string): boolean => {
    if (item.statusSanksi === 'selesai') return true;
    if (item.sanksiCompletedItems && item.sanksiCompletedItems.includes(sItem)) return true;
    try {
      const isStored = localStorage.getItem(`sipontren_sanksi_item_${item.id}_${encodeURIComponent(sItem)}`);
      if (isStored === 'true') return true;
    } catch {
      // ignore
    }
    return false;
  };

  const filteredList = useMemo(() => {
    return pelanggaranList.filter(item => {
      const per = peraturanMap.get(item.peraturanId);
      const s = santriMap.get(item.santriId);

      if (statusSanksiFilter === 'belum') {
        if (item.statusSanksi === 'selesai') return false;
      } else if (statusSanksiFilter === 'selesai') {
        if (item.statusSanksi !== 'selesai') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const santriMatch = (item.santriNama || s?.nama || '').toLowerCase().includes(q);
        const perMatch = (per?.nama || '').toLowerCase().includes(q) || (per?.kode || '').toLowerCase().includes(q);
        const sanksiMatch = (item.sanksi || '').toLowerCase().includes(q);
        const ketMatch = (item.keterangan || '').toLowerCase().includes(q);
        if (!santriMatch && !perMatch && !sanksiMatch && !ketMatch) return false;
      }

      if (filterStartDate && item.tanggal < filterStartDate) return false;
      if (filterEndDate && item.tanggal > filterEndDate) return false;

      return true;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [pelanggaranList, statusSanksiFilter, searchQuery, filterStartDate, filterEndDate, peraturanMap, santriMap]);

  // Stats calculation
  const totalPelanggaran = pelanggaranList.length;
  const belumCount = pelanggaranList.filter(p => p.statusSanksi !== 'selesai').length;
  const selesaiCount = pelanggaranList.filter(p => p.statusSanksi === 'selesai').length;
  const percentDone = totalPelanggaran > 0 ? Math.round((selesaiCount / totalPelanggaran) * 100) : 100;

  const handleOpenAdd = () => {
    const firstPer = peraturanList[0];
    setTypedSantriName('');
    setSelectedSantri(null);
    setShowSuggestions(false);
    setFormData({
      santriId: '',
      santriNama: '',
      peraturanId: firstPer?.id || '',
      tanggal: toInputDateFormat(),
      keterangan: '',
      sanksi: firstPer?.sanksi || '',
      statusSanksi: 'belum'
    });
    setIsAddOpen(true);
  };

  const handleSelectRule = (peraturanId: string) => {
    const per = peraturanMap.get(peraturanId);
    setFormData(prev => ({
      ...prev,
      peraturanId,
      sanksi: per?.sanksi || prev.sanksi
    }));
  };

  const handleSelectSantriSuggestion = (santri: Santri) => {
    setSelectedSantri(santri);
    setTypedSantriName(santri.nama);
    setFormData(prev => ({
      ...prev,
      santriId: santri.id,
      santriNama: santri.nama
    }));
    setShowSuggestions(false);
  };

  const handleOpenEdit = (item: Pelanggaran) => {
    const s = santriMap.get(item.santriId);
    setSelectedSantri(s || null);
    setTypedSantriName(item.santriNama || s?.nama || '');
    setShowSuggestions(false);
    setFormData({
      santriId: item.santriId,
      santriNama: item.santriNama || s?.nama || '',
      peraturanId: item.peraturanId,
      tanggal: toInputDateFormat(item.tanggal),
      keterangan: item.keterangan,
      sanksi: item.sanksi,
      statusSanksi: item.statusSanksi
    });
    setEditingItem(item);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = (typedSantriName || formData.santriNama).trim();
    if (!cleanName) {
      showToast('Ketik nama lengkap santri terlebih dahulu', 'error');
      return;
    }
    const matchedSantri = santriList.find(s => s.nama.trim().toLowerCase() === cleanName.toLowerCase());
    const finalSantriId = matchedSantri ? matchedSantri.id : (formData.santriId || `san-${Date.now().toString(36)}`);
    const finalSantriNama = matchedSantri?.nama || cleanName;

    if (!formData.peraturanId) {
      showToast('Pilih aturan pelanggaran yang dilakukan santri', 'error');
      return;
    }
    if (!formData.keterangan.trim()) {
      showToast('Keterangan / kronologi pelanggaran wajib diisi', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddPelanggaran({
        santriId: finalSantriId,
        santriNama: finalSantriNama,
        peraturanId: formData.peraturanId,
        tanggal: formData.tanggal,
        keterangan: formData.keterangan.trim(),
        sanksi: formData.sanksi.trim() || 'Teguran & Pembinaan',
        statusSanksi: formData.statusSanksi
      });
      showToast('Pelanggaran santri berhasil dicatat!', 'success');
      setIsAddOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pelanggaran', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const cleanName = (typedSantriName || formData.santriNama).trim();
    if (!cleanName) {
      showToast('Nama santri tidak boleh kosong', 'error');
      return;
    }
    const matchedSantri = santriList.find(s => s.nama.trim().toLowerCase() === cleanName.toLowerCase());
    const finalSantriId = matchedSantri ? matchedSantri.id : (formData.santriId || editingItem.santriId);
    const finalSantriNama = matchedSantri?.nama || cleanName;

    try {
      setIsSubmitting(true);
      const finalStatusSanksi = editingItem.statusSanksi === 'selesai' ? 'selesai' : formData.statusSanksi;

      await onEditPelanggaran(editingItem.id, {
        santriId: finalSantriId,
        santriNama: finalSantriNama,
        peraturanId: formData.peraturanId,
        tanggal: formData.tanggal,
        keterangan: formData.keterangan.trim(),
        sanksi: formData.sanksi.trim(),
        statusSanksi: finalStatusSanksi
      });
      showToast('Catatan pelanggaran berhasil diperbarui!', 'success');
      setEditingItem(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui catatan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Memicu Modal Pop-up Konfirmasi Ceklis Sanksi untuk butir spesifik
  const handleTriggerItemChecklist = (item: Pelanggaran, sItem: string, idx: number) => {
    if (isItemCompleted(item, sItem)) {
      showToast(`Sanksi "${sItem}" sudah dicentang dan tidak dapat dibatalkan kembali.`, 'info');
      return;
    }
    setConfirmCheckTarget({
      pelanggaran: item,
      itemText: sItem,
      itemIndex: idx
    });
    setHasAcknowledged(false);
  };

  // Eksekusi Konfirmasi Permanen Ceklis Sanksi Butir Terpilih
  const handleConfirmExecuteItemChecklist = async () => {
    if (!confirmCheckTarget) return;
    try {
      setIsSubmitting(true);
      const { pelanggaran, itemText } = confirmCheckTarget;
      const allItems = parseSanksiItems(pelanggaran.sanksi);
      const currentCompleted = pelanggaran.sanksiCompletedItems || [];
      const newCompleted = Array.from(new Set([...currentCompleted, itemText]));

      // Jika seluruh butir sanksi sudah dicentang, tandai statusSanksi = 'selesai'
      const isAllCompleted = allItems.every(it => newCompleted.includes(it));
      const newStatus: StatusSanksi = isAllCompleted ? 'selesai' : 'belum';

      await onEditPelanggaran(pelanggaran.id, {
        sanksiCompletedItems: newCompleted,
        statusSanksi: newStatus
      });

      // Simpan status konfirmasi permanen di localStorage
      try {
        localStorage.setItem(
          `sipontren_sanksi_item_${pelanggaran.id}_${encodeURIComponent(itemText)}`,
          'true'
        );
        if (isAllCompleted) {
          localStorage.setItem(`sipontren_sanksi_confirmed_${pelanggaran.id}`, 'true');
        }
      } catch {
        // ignore
      }

      showToast(
        `Alhamdulillah! Sanksi "${itemText}" untuk ananda "${pelanggaran.santriNama}" telah dicentang & terkunci selesai!`,
        'success'
      );
      setConfirmCheckTarget(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengonfirmasi penyelesaian sanksi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const target = deletingItem;
    setDeletingItem(null);
    showToast('Catatan pelanggaran berhasil dihapus', 'success');
    try {
      await onDeletePelanggaran(target.id);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus catatan', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#D98E75]/20 text-[#8C2E17]">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#2E2721] tracking-tight">
              Catatan Pelanggaran & Sanksi
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7D6B5A] mt-1">
            Pencatatan pelanggaran santri dengan ceklis mandiri per butir sanksi secara permanen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <button
            type="button"
            onClick={handleOpenAdd}
            className="clay-btn clay-btn-primary py-2.5 px-4 text-xs font-bold gap-2 cursor-pointer self-start sm:self-auto shadow-md hover-lift active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Pelanggaran</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="clay-card p-4 border border-[#E8D5C4]/70 bg-gradient-to-br from-white to-[#FAF4EC] hover-lift animate-slide-up transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7D6C5D]">Total Pelanggaran</span>
            <span className="p-1.5 rounded-lg bg-[#FAF0E4] text-[#8C4A1F]">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-heading text-[#2E251E]">
              <AnimatedNumber value={totalPelanggaran} />
            </span>
            <span className="text-xs text-[#8C7A6B]">Kasus</span>
          </div>
        </div>

        <div className="clay-card p-4 border border-amber-300/80 bg-gradient-to-br from-amber-50/60 to-white hover-lift animate-slide-up delay-75 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Perlu Ceklis Sanksi</span>
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-heading text-amber-900">
              <AnimatedNumber value={belumCount} />
            </span>
            <span className="text-xs font-medium text-amber-800">Belum Tuntas</span>
          </div>
        </div>

        <div className="clay-card p-4 border border-emerald-300/80 bg-gradient-to-br from-emerald-50/60 to-white hover-lift animate-slide-up delay-150 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Sanksi Dituntaskan</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-heading text-emerald-900">
              <AnimatedNumber value={selesaiCount} />
            </span>
            <span className="text-xs font-medium text-emerald-800">Tuntas & Terkunci</span>
          </div>
        </div>

        <div className="clay-card p-4 border border-[#E8D5C4]/70 bg-gradient-to-br from-white to-[#F4F8F4] hover-lift animate-slide-up delay-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5F8F6B]">Tingkat Penyelesaian</span>
            <span className="p-1.5 rounded-lg bg-[#5F8F6B]/15 text-[#5F8F6B]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-heading text-[#3B6645]">
              <AnimatedNumber value={percentDone} suffix="%" />
            </span>
            <span className="text-xs text-[#6F8873]">Kepatuhan</span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Search, Filters, and View Switcher */}
      <div className="clay-card p-4 border border-[#E8D5C4]/70 space-y-3.5 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F7D6D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari santri, pelanggaran (contoh: Terlambat), sanksi (contoh: Wudhu), kronologi..."
              className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#EFE7DC] self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setStatusSanksiFilter('semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusSanksiFilter === 'semua'
                  ? 'bg-white text-[#2C241E] shadow-sm'
                  : 'text-[#6C5B4C] hover:text-[#2C241E]'
              }`}
            >
              Semua ({totalPelanggaran})
            </button>
            <button
              type="button"
              onClick={() => setStatusSanksiFilter('belum')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusSanksiFilter === 'belum'
                  ? 'bg-amber-100 text-amber-900 shadow-sm'
                  : 'text-[#6C5B4C] hover:text-[#2C241E]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Perlu Ceklis ({belumCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusSanksiFilter('selesai')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusSanksiFilter === 'selesai'
                  ? 'bg-emerald-100 text-emerald-900 shadow-sm'
                  : 'text-[#6C5B4C] hover:text-[#2C241E]'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>Selesai ({selesaiCount})</span>
            </button>
          </div>

          {/* View Toggle & Export */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <div className="flex items-center p-1 rounded-xl bg-[#EFE7DC]">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Tampilan Tabel"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#2C241E] shadow-sm' : 'text-[#7D6B5A]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                title="Tampilan Kartu"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'card' ? 'bg-white text-[#2C241E] shadow-sm' : 'text-[#7D6B5A]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => exportPelanggaranToExcel(filteredList, santriMap, peraturanMap)}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer border border-emerald-200"
              title="Ekspor Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exportPelanggaranToPdf(filteredList, santriMap, peraturanMap)}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 transition-colors cursor-pointer border border-rose-200"
              title="Cetak PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#E8D5C4]/40 text-xs text-[#7A6858]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#9C8A79]" />
            <span>Filter Tanggal:</span>
          </div>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E] text-xs"
          />
          <span>s/d</span>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E] text-xs"
          />
          {(filterStartDate || filterEndDate) && (
            <button
              type="button"
              onClick={() => {
                setFilterStartDate('');
                setFilterEndDate('');
              }}
              className="text-xs text-rose-700 hover:underline cursor-pointer font-bold ml-1"
            >
              Reset Tanggal
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA (TABLE OR CARD VIEW) */}
      {filteredList.length === 0 ? (
        <div className="clay-card p-12 text-center text-[#7F6E5E] space-y-3 border border-[#E8D5C4]/70">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF0E4] text-[#D98E75] flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8 opacity-70" />
          </div>
          <h4 className="font-heading font-black text-lg text-[#382F26]">
            Tidak Ada Catatan Pelanggaran
          </h4>
          <p className="text-xs text-[#7D6B5A] max-w-md mx-auto">
            {searchQuery || statusSanksiFilter !== 'semua'
              ? 'Tidak ditemukan pelanggaran yang cocok dengan kriteria filter pencarian Anda.'
              : 'Alhamdulillah seluruh santri mematuhi tata tertib pesantren dengan tertib.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* ======================== TABEL REDESIGN ======================== */
        <div className="clay-card p-0 overflow-hidden border border-[#E8D5C4]/80 shadow-md">
          <div className="max-h-[580px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF2E8] sticky top-0 z-20 border-b border-[#E8D5C4]/80 text-[#4E3E30] shadow-sm font-heading">
                <tr>
                  <th className="py-3.5 px-4 font-black whitespace-nowrap">Tanggal</th>
                  <th className="py-3.5 px-4 font-black">Santri</th>
                  <th className="py-3.5 px-4 font-black min-w-[220px]">Pelanggaran</th>
                  <th className="py-3.5 px-4 font-black min-w-[280px]">Sanksi</th>
                  <th className="py-3.5 px-4 font-black text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DC] bg-white">
                {filteredList.map((item) => {
                  const s = santriMap.get(item.santriId);
                  const per = peraturanMap.get(item.peraturanId);
                  const isDone = item.statusSanksi === 'selesai';
                  const sanksiRaw = item.sanksi || per?.sanksi || 'Teguran & Pembinaan';
                  const sanksiItems = parseSanksiItems(sanksiRaw);
                  const completedItems = item.sanksiCompletedItems || [];
                  const completedCount = isDone
                    ? sanksiItems.length
                    : sanksiItems.filter(si => isItemCompleted(item, si)).length;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-[#FAF5EE]/70 ${
                        isDone ? 'bg-white' : 'bg-amber-50/15'
                      }`}
                    >
                      {/* Tanggal */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <div className="font-bold text-[#2E251E] font-mono text-xs">
                          {formatDateDMY(item.tanggal)}
                        </div>
                        <div className="text-[11px] text-[#867566] mt-0.5">
                          {formatDatePretty(item.tanggal)}
                        </div>
                      </td>

                      {/* Santri */}
                      <td className="py-3.5 px-4 align-top min-w-[200px]">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#5F8F6B]/15 text-[#3A6B46] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                            {(item.santriNama || s?.nama || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-[#2A231C] text-sm">
                                {item.santriNama || s?.nama || 'Santri'}
                              </span>
                              {s?.kelas && <KelasBadge kelas={s.kelas} />}
                            </div>
                            <div className="text-[11px] text-[#7C6A5A] mt-0.5 flex items-center gap-1">
                              <User className="w-3 h-3 text-[#9D8876]" />
                              <span>Wali: {s?.namaWali || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Pelanggaran (Tata Tertib & Kronologi) */}
                      <td className="py-3.5 px-4 align-top max-w-[280px]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-[#E8D5C4] font-mono text-[10px] font-bold text-[#4B3B2E]">
                            {per?.kode || 'TAT'}
                          </span>
                          <span className="font-black text-[#2E251E] text-xs sm:text-sm">
                            {per?.nama || 'Pelanggaran Tata Tertib'}
                          </span>
                        </div>
                        <p className="text-xs text-[#6E5D4E] leading-relaxed bg-[#FAF5EE] p-2 rounded-lg border border-[#E8D5C4]/50">
                          {item.keterangan}
                        </p>
                      </td>

                      {/* Sanksi (Setiap Sanksi Memiliki Kolom Ceklis Sendiri-Sendiri Kecil & Mempermudah) */}
                      <td className="py-3.5 px-4 align-top min-w-[270px] max-w-[360px]">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-white to-[#FAF5EE] border border-[#E8D5C4]/80 shadow-xs space-y-2">
                          <div className="flex items-center justify-between gap-1 pb-1 border-b border-[#E8D5C4]/40">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#9C5820]">
                              Daftar Sanksi ({completedCount}/{sanksiItems.length})
                            </span>
                            {completedCount === sanksiItems.length ? (
                              <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Tuntas Terkunci</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded-md">
                                Perlu Ceklis
                              </span>
                            )}
                          </div>

                          {/* List Butir Sanksi dengan Ceklis Kecil Sendiri-Sendiri */}
                          <div className="space-y-1.5">
                            {sanksiItems.map((sItem, idx) => {
                              const isItemDone = isItemCompleted(item, sItem);
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-start gap-2 p-1.5 rounded-lg border transition-all text-xs ${
                                    isItemDone
                                      ? 'bg-emerald-50/70 border-emerald-300/80 text-emerald-950'
                                      : 'bg-white hover:bg-amber-50/60 border-amber-300/80 hover:border-amber-400 text-[#3C3026]'
                                  }`}
                                >
                                  {/* Ceklis Kecil */}
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerItemChecklist(item, sItem, idx)}
                                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                      isItemDone
                                        ? 'bg-emerald-600 border-emerald-600 text-white cursor-not-allowed shadow-inner'
                                        : 'bg-white border-amber-400 hover:border-emerald-600 hover:bg-emerald-50 active:scale-95'
                                    }`}
                                    title={
                                      isItemDone
                                        ? 'Sanksi ini telah dicentang permanen (tidak dapat dibatalkan)'
                                        : `Klik untuk mencentang sanksi: "${sItem}"`
                                    }
                                  >
                                    {isItemDone ? (
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-xs bg-transparent" />
                                    )}
                                  </button>

                                  {/* Teks Sanksi */}
                                  <div
                                    onClick={() => {
                                      if (!isItemDone) handleTriggerItemChecklist(item, sItem, idx);
                                      else showToast(`Sanksi "${sItem}" telah dicentang permanen.`, 'info');
                                    }}
                                    className={`flex-1 leading-snug cursor-pointer select-none ${
                                      isItemDone
                                        ? 'line-through text-emerald-900/80 font-medium'
                                        : 'font-bold text-[#443528]'
                                    }`}
                                  >
                                    <span>{sItem}</span>
                                  </div>

                                  {/* Ikon Gembok jika Selesai */}
                                  {isItemDone && (
                                    <span title="Terkunci permanen">
                                      <Lock className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 rounded-xl bg-[#FAF0E4] hover:bg-[#E8D5C4] text-[#524133] transition-colors cursor-pointer"
                            title="Edit Catatan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ======================== CARD VIEW REDESIGN ======================== */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => {
            const s = santriMap.get(item.santriId);
            const per = peraturanMap.get(item.peraturanId);
            const isDone = item.statusSanksi === 'selesai';
            const sanksiRaw = item.sanksi || per?.sanksi || 'Teguran & Pembinaan';
            const sanksiItems = parseSanksiItems(sanksiRaw);
            const completedCount = isDone
              ? sanksiItems.length
              : sanksiItems.filter(si => isItemCompleted(item, si)).length;

            return (
              <div
                key={item.id}
                className={`clay-card p-5 border transition-all space-y-4 ${
                  isDone
                    ? 'border-[#E8D5C4]/80 bg-white'
                    : 'border-amber-300/80 bg-gradient-to-br from-white to-amber-50/20 shadow-md'
                }`}
              >
                {/* Header Card: Santri & Tanggal */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#5F8F6B]/15 text-[#3A6B46] font-black text-sm flex items-center justify-center shrink-0 shadow-inner">
                      {(item.santriNama || s?.nama || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-[#2E251E] text-sm sm:text-base">
                          {item.santriNama || s?.nama || 'Santri'}
                        </h4>
                        {s?.kelas && <KelasBadge kelas={s.kelas} size="sm" />}
                      </div>
                      <p className="text-xs text-[#7A6959] mt-0.5">
                        Wali: <strong>{s?.namaWali || '-'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-[#2E251E] block">
                      {formatDateDMY(item.tanggal)}
                    </span>
                    <span className="text-[11px] text-[#8C7A6B]">
                      {formatDatePretty(item.tanggal)}
                    </span>
                  </div>
                </div>

                {/* Body: Pelanggaran */}
                <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#E8D5C4]/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7A6959]">
                      Pelanggaran:
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#E8D5C4] font-mono text-[10px] font-bold text-[#4B3B2E]">
                      {per?.kode || 'TAT'}
                    </span>
                  </div>
                  <h5 className="font-extrabold text-[#2E251E] text-xs sm:text-sm">
                    {per?.nama || 'Pelanggaran Tata Tertib'}
                  </h5>
                  <p className="text-xs text-[#6A5848] leading-relaxed">
                    {item.keterangan}
                  </p>
                </div>

                {/* Sanksi & Ceklis Tiap Butir Sanksi */}
                <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                  isDone
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-amber-50/60 border-amber-300'
                }`}>
                  <div className="flex items-center justify-between pb-1 border-b border-black/5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#9C5820]">
                      Sanksi ({completedCount}/{sanksiItems.length}):
                    </span>
                    {completedCount === sanksiItems.length ? (
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Tuntas Terkunci</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        Centang Butir Sanksi
                      </span>
                    )}
                  </div>

                  {/* Daftar Butir Sanksi */}
                  <div className="space-y-1.5">
                    {sanksiItems.map((sItem, idx) => {
                      const isItemDone = isItemCompleted(item, sItem);
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all ${
                            isItemDone
                              ? 'bg-emerald-100/60 border-emerald-300 text-emerald-950'
                              : 'bg-white hover:bg-amber-100/50 border-amber-300 text-[#443528]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleTriggerItemChecklist(item, sItem, idx)}
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isItemDone
                                ? 'bg-emerald-600 border-emerald-600 text-white cursor-not-allowed shadow-inner'
                                : 'bg-white border-amber-400 hover:border-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={
                              isItemDone
                                ? 'Sanksi telah dicentang permanen'
                                : `Klik untuk mencentang: "${sItem}"`
                            }
                          >
                            {isItemDone ? (
                              <Check className="w-3 h-3 stroke-[3]" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-xs bg-transparent" />
                            )}
                          </button>
                          <span
                            onClick={() => {
                              if (!isItemDone) handleTriggerItemChecklist(item, sItem, idx);
                              else showToast(`Sanksi "${sItem}" telah dicentang permanen.`, 'info');
                            }}
                            className={`flex-1 text-xs cursor-pointer select-none leading-snug ${
                              isItemDone ? 'line-through text-emerald-900/80 font-medium' : 'font-extrabold text-[#443528]'
                            }`}
                          >
                            {sItem}
                          </span>
                          {isItemDone && (
                            <Lock className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E8D5C4]/40">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="clay-btn clay-btn-secondary py-1.5 px-3 text-xs font-bold gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingItem(item)}
                    className="px-3 py-1.5 rounded-xl text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. POP-UP MODAL KONFIRMASI CEKLIS SANKSI (TIDAK BISA BATAL) */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(confirmCheckTarget)}
        onClose={() => setConfirmCheckTarget(null)}
        title="Konfirmasi Ceklis Sanksi"
        subtitle="Verifikasi penyelesaian butir sanksi santri"
        maxWidth="md"
      >
        {confirmCheckTarget && (
          <div className="space-y-4">
            {/* Warning Callout Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 text-sm font-black text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Peringatan: Tindakan Ini Permanen!</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Sanksi yang sudah dicentang <strong>tidak dapat lagi dibatalkan kembali</strong> demi menjaga integritas ketertiban dan kedisiplinan catatan santri.
              </p>
            </div>

            {/* Rincian Sanksi yang Dikonfirmasi */}
            <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E8D5C4] space-y-2.5">
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E8D5C4]/70">
                <div>
                  <span className="text-[11px] text-[#7F6E5E] block font-medium">Santri:</span>
                  <span className="text-sm font-black text-[#2E251E]">
                    {confirmCheckTarget.pelanggaran.santriNama}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#7F6E5E] block font-medium">Tanggal:</span>
                  <span className="text-xs font-bold text-[#2E251E] font-mono">
                    {formatDateDMY(confirmCheckTarget.pelanggaran.tanggal)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#7F6E5E] block font-medium">Pelanggaran:</span>
                <span className="text-xs font-bold text-[#4B3C2F]">
                  {peraturanMap.get(confirmCheckTarget.pelanggaran.peraturanId)?.nama || 'Pelanggaran Tata Tertib'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-emerald-300 shadow-inner space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                  Butir Sanksi yang Dicentang Selesai:
                </span>
                <p className="text-sm font-black text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>{confirmCheckTarget.itemText}</span>
                </p>
              </div>
            </div>

            {/* Checkbox Pernyataan Admin */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#E8D5C4] cursor-pointer hover:bg-[#FAF8F5] transition-colors">
              <input
                type="checkbox"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
              />
              <span className="text-xs text-[#4E3E30] leading-snug">
                Saya menyatakan dengan sungguh-sungguh bahwa ananda <strong>{confirmCheckTarget.pelanggaran.santriNama}</strong> telah tuntas melaksanakan sanksi <strong>"{confirmCheckTarget.itemText}"</strong> di bawah pengawasan pengurus.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmCheckTarget(null)}
                className="px-4 py-2.5 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                disabled={!hasAcknowledged || isSubmitting}
                onClick={handleConfirmExecuteItemChecklist}
                className="clay-btn clay-btn-success py-2.5 px-5 text-xs font-bold gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isSubmitting ? 'Memproses...' : 'Ya, Ceklis Selesai (Permanen)'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* 6. MODAL TAMBAH PELANGGARAN */}
      {/* ========================================================= */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Catat Pelanggaran Santri"
        subtitle="Pilih santri, aturan pelanggaran, serta tentukan sanksinya"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {/* Autocomplete Input Nama Santri */}
          <div className="relative">
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Nama Santri *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={typedSantriName}
                onChange={(e) => {
                  setTypedSantriName(e.target.value);
                  setShowSuggestions(true);
                  if (selectedSantri && selectedSantri.nama !== e.target.value) {
                    setSelectedSantri(null);
                    setFormData(prev => ({ ...prev, santriId: '', santriNama: '' }));
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ketik nama santri (contoh: Muhammad Al-Fatih Pratama)..."
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              />
              {selectedSantri && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold text-[#3B6645] bg-[#5F8F6B]/15 px-2 py-0.5 rounded-lg">
                  <Check className="w-3 h-3" />
                  <span>Terpilih</span>
                </div>
              )}
            </div>

            {/* Saran santri dropdown */}
            {showSuggestions && filteredStudentSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-[#E8D5C4] shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-[#FAF0E4]">
                {filteredStudentSuggestions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSantriSuggestion(s)}
                    className="p-2.5 hover:bg-[#FAF5EE] cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-[#2C241E]">{s.nama}</span>
                      <span className="text-[#847262] text-[11px] block">{s.alamat}</span>
                    </div>
                    {s.kelas && <KelasBadge kelas={s.kelas} size="sm" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Pelanggaran Tata Tertib *
              </label>
              <select
                required
                value={formData.peraturanId}
                onChange={(e) => handleSelectRule(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
              >
                <option value="">-- Pilih Aturan --</option>
                {peraturanList.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.kode}] {p.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Tanggal Kejadian *
              </label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                className="w-full p-2.5 text-xs rounded-xl bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Sanksi *
            </label>
            <input
              type="text"
              required
              value={formData.sanksi}
              onChange={(e) => setFormData(prev => ({ ...prev, sanksi: e.target.value }))}
              placeholder="Contoh: Membersihkan Tempat Wudhu & Selasar Masjid"
              className="w-full p-2.5 text-xs rounded-xl bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
            />
            <p className="text-[11px] text-[#867566] mt-1 flex items-center gap-1">
              <Info className="w-3 h-3 text-[#9D8876]" />
              <span>Gunakan tanda ' & ' atau koma jika sanksi memiliki beberapa butir tugas agar memiliki ceklis sendiri-sendiri.</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Kronologi / Keterangan Kejadian *
            </label>
            <textarea
              rows={3}
              required
              value={formData.keterangan}
              onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
              placeholder="Ceritakan singkat kronologi kejadian pelanggaran santri..."
              className="w-full p-2.5 text-xs rounded-xl bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="clay-btn clay-btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* 7. MODAL EDIT PELANGGARAN */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Edit Catatan Pelanggaran"
        subtitle="Perbarui rincian sanksi atau kronologi pelanggaran"
        maxWidth="lg"
      >
        {editingItem && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#E8D5C4]">
              <span className="text-[11px] text-[#7E6D5D] block">Santri yang Dicatat:</span>
              <span className="text-sm font-black text-[#2E251E]">
                {editingItem.santriNama}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                  Pelanggaran Tata Tertib *
                </label>
                <select
                  required
                  value={formData.peraturanId}
                  onChange={(e) => setFormData(prev => ({ ...prev, peraturanId: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
                >
                  {peraturanList.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.kode}] {p.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                  Tanggal Kejadian *
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Sanksi *
              </label>
              <input
                type="text"
                required
                value={formData.sanksi}
                onChange={(e) => setFormData(prev => ({ ...prev, sanksi: e.target.value }))}
                className="w-full p-2.5 text-xs rounded-xl bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Kronologi / Keterangan Kejadian *
              </label>
              <textarea
                rows={3}
                required
                value={formData.keterangan}
                onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                className="w-full p-2.5 text-xs rounded-xl bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="clay-btn clay-btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan...' : 'Perbarui Catatan'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* 8. MODAL KONFIRMASI HAPUS */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Hapus Catatan Pelanggaran"
        maxWidth="sm"
      >
        {deletingItem && (
          <div className="space-y-4">
            <p className="text-xs text-[#524335] leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan pelanggaran untuk ananda{' '}
              <strong>{deletingItem.santriNama}</strong>?
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
              >
                Batalkan
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
        )}
      </Modal>

    </div>
  );
};
