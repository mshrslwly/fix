import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { Perizinan, Santri, JenisPerizinan, StatusPerizinan } from '../types';
import { formatDatePretty, formatDateDMY, toInputDateFormat, isDateRangeValid } from '../utils/date';
import { exportPerizinanToExcel } from '../utils/exportExcel';
import { exportPerizinanToPdf } from '../utils/exportPdf';
import { StatusPerizinanBadge, JenisPerizinanBadge, KelasBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { AnimatedNumber } from '../components/AnimatedNumber';

interface PerizinanPageProps {
  perizinanList: Perizinan[];
  santriList: Santri[];
  onAddPerizinan: (data: Omit<Perizinan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Perizinan>;
  onEditPerizinan: (id: string, data: Partial<Perizinan>) => Promise<void>;
  onDeletePerizinan: (id: string) => Promise<void>;
}

export const PerizinanPage: React.FC<PerizinanPageProps> = ({
  perizinanList,
  santriList,
  onAddPerizinan,
  onEditPerizinan,
  onDeletePerizinan
}) => {
  const { showToast } = useToast();
  const [searchSantri, setSearchSantri] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Perizinan | null>(null);
  const [deletingItem, setDeletingItem] = useState<Perizinan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const todayStr = toInputDateFormat();
  const [formData, setFormData] = useState({
    santriId: '',
    santriNama: '',
    jenis: 'pulang' as JenisPerizinan,
    tanggalMulai: todayStr,
    tanggalSelesai: todayStr,
    alasan: '',
    catatanTambahan: '', // Catatan perpanjangan izin / bukti
    status: 'disetujui' as StatusPerizinan
  });

  const santriMap = useMemo(() => new Map(santriList.map(s => [s.id, s])), [santriList]);

  const filteredList = useMemo(() => {
    return perizinanList.filter(item => {
      if (statusFilter !== 'semua' && item.status !== statusFilter) return false;

      if (searchSantri.trim()) {
        const s = santriMap.get(item.santriId);
        const nameMatch = s?.nama.toLowerCase().includes(searchSantri.toLowerCase().trim()) ||
          item.santriNama?.toLowerCase().includes(searchSantri.toLowerCase().trim());
        const reasonMatch = item.alasan.toLowerCase().includes(searchSantri.toLowerCase().trim());
        const noteMatch = item.catatanTambahan?.toLowerCase().includes(searchSantri.toLowerCase().trim());
        if (!nameMatch && !reasonMatch && !noteMatch) return false;
      }

      if (filterStartDate && item.tanggalMulai < filterStartDate) return false;
      if (filterEndDate && item.tanggalSelesai > filterEndDate) return false;

      return true;
    }).sort((a, b) => new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime());
  }, [perizinanList, statusFilter, searchSantri, filterStartDate, filterEndDate, santriMap]);

  const handleOpenAdd = () => {
    setFormData({
      santriId: '',
      santriNama: '',
      jenis: 'pulang',
      tanggalMulai: toInputDateFormat(),
      tanggalSelesai: toInputDateFormat(),
      alasan: '',
      catatanTambahan: '',
      status: 'disetujui'
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item: Perizinan) => {
    const s = santriMap.get(item.santriId);
    setFormData({
      santriId: item.santriId,
      santriNama: item.santriNama || s?.nama || '',
      jenis: item.jenis,
      tanggalMulai: toInputDateFormat(item.tanggalMulai),
      tanggalSelesai: toInputDateFormat(item.tanggalSelesai),
      alasan: item.alasan,
      catatanTambahan: item.catatanTambahan || '',
      status: item.status
    });
    setEditingItem(item);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formData.santriNama.trim();
    if (!cleanName) {
      showToast('Ketik nama lengkap santri terlebih dahulu', 'error');
      return;
    }
    if (!isDateRangeValid(formData.tanggalMulai, formData.tanggalSelesai)) {
      showToast('Tanggal selesai tidak boleh sebelum tanggal mulai!', 'error');
      return;
    }
    if (!formData.alasan.trim()) {
      showToast('Alasan perizinan wajib diisi', 'error');
      return;
    }

    // Cari santri yang cocok dari daftar (case-insensitive) jika ada
    const matchedSantri = santriList.find(s => s.nama.trim().toLowerCase() === cleanName.toLowerCase());
    const finalSantriId = matchedSantri ? matchedSantri.id : (formData.santriId || `san-${Date.now().toString(36)}`);

    try {
      setIsSubmitting(true);
      await onAddPerizinan({
        santriId: finalSantriId,
        santriNama: matchedSantri?.nama || cleanName,
        jenis: formData.jenis,
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: formData.tanggalSelesai,
        alasan: formData.alasan.trim(),
        catatanTambahan: formData.catatanTambahan.trim(),
        status: formData.status
      });
      showToast('Izin santri berhasil dicatat!', 'success');
      setIsAddOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan izin', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const cleanName = formData.santriNama.trim();
    if (!cleanName) {
      showToast('Nama santri tidak boleh kosong', 'error');
      return;
    }
    if (!isDateRangeValid(formData.tanggalMulai, formData.tanggalSelesai)) {
      showToast('Tanggal selesai tidak boleh sebelum tanggal mulai!', 'error');
      return;
    }

    const matchedSantri = santriList.find(s => s.nama.trim().toLowerCase() === cleanName.toLowerCase());
    const finalSantriId = matchedSantri ? matchedSantri.id : (formData.santriId || editingItem.santriId);

    try {
      setIsSubmitting(true);
      await onEditPerizinan(editingItem.id, {
        santriId: finalSantriId,
        santriNama: matchedSantri?.nama || cleanName,
        jenis: formData.jenis,
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: formData.tanggalSelesai,
        alasan: formData.alasan.trim(),
        catatanTambahan: formData.catatanTambahan.trim(),
        status: formData.status
      });
      showToast('Perizinan berhasil diperbarui!', 'success');
      setEditingItem(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui izin', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const target = deletingItem;
    setDeletingItem(null);
    showToast('Catatan perizinan berhasil dihapus', 'success');
    try {
      await onDeletePerizinan(target.id);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus izin', 'error');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#2E2721] tracking-tight">
            Perizinan Santri
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6B5A] mt-0.5">
            Pencatatan izin pulang, sakit, keluar, dan bukti izin tambahan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="clay-btn clay-btn-primary py-2.5 px-4 text-xs font-bold gap-2 cursor-pointer self-start sm:self-auto hover-lift active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Izin Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="clay-card p-4 border border-[#E8D5C4]/60 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8F7D6D]" />
            <input
              type="text"
              value={searchSantri}
              onChange={(e) => setSearchSantri(e.target.value)}
              placeholder="Cari santri / catatan..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
            >
              <option value="semua">Semua Status Izin</option>
              <option value="disetujui">Disetujui (Sedang Berjalan)</option>
              <option value="diajukan">Diajukan</option>
              <option value="selesai">Selesai (Sudah Kembali)</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#6D5C4C] shrink-0">Dari:</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#6D5C4C] shrink-0">Sampai:</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E8D5C4]/40">
          <span className="text-xs text-[#7F6E5E]">
            Menampilkan <strong className="text-[#382F26] font-bold"><AnimatedNumber value={filteredList.length} /></strong> catatan perizinan
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportPerizinanToExcel(filteredList, santriMap)}
              className="clay-btn clay-btn-secondary py-1.5 px-3 text-xs font-bold gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => exportPerizinanToPdf(filteredList, santriMap)}
              className="clay-btn clay-btn-secondary py-1.5 px-3 text-xs font-bold gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-700" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* CLAY CARD MENTOK SCROLL (TIDAK SAMPAI BAWAH BANGET, HANYA ISI TABEL YANG SCROLL) */}
      <div className="clay-card p-0 overflow-hidden border border-[#E8D5C4]/70">
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
          {filteredList.length === 0 ? (
            <div className="p-10 text-center text-[#7F6E5E] space-y-2">
              <CalendarCheck className="w-10 h-10 mx-auto text-[#D9B99B] opacity-60" />
              <h4 className="font-bold text-base text-[#382F26]">
                Tidak ada perizinan yang sesuai
              </h4>
              <p className="text-xs">
                Klik tombol "+ Catat Izin Baru" untuk menambahkan izin.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF2E8] sticky top-0 z-10 border-b border-[#E8D5C4]/60 text-[#554536] shadow-sm">
                <tr>
                  <th className="py-3 px-4 font-bold">Nama Santri</th>
                  <th className="py-3 px-4 font-bold">Jenis Izin</th>
                  <th className="py-3 px-4 font-bold">Rentang Tanggal</th>
                  <th className="py-3 px-4 font-bold">Alasan & Catatan Tambahan</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7DC]">
                {filteredList.map((item) => {
                  const s = santriMap.get(item.santriId);
                  return (
                    <tr key={item.id} className="hover:bg-black/3 transition-colors">
                      {/* Santri */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#2A231C] text-sm">
                            {item.santriNama || s?.nama || 'Santri'}
                          </span>
                          {s?.kelas && <KelasBadge kelas={s.kelas} />}
                        </div>
                        <div className="text-[11px] text-[#7C6A5A]">
                          Wali: {s?.namaWali || '-'}
                        </div>
                      </td>

                      {/* Jenis */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <JenisPerizinanBadge jenis={item.jenis} size="sm" />
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#352D25]">
                          {formatDateDMY(item.tanggalMulai)} — {formatDateDMY(item.tanggalSelesai)}
                        </div>
                        <span className="text-[11px] text-[#867566]">
                          {formatDatePretty(item.tanggalMulai)}
                        </span>
                      </td>

                      {/* Alasan & Catatan Tambahan */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#2E241D] line-clamp-2">
                          {item.alasan}
                        </div>
                        {item.catatanTambahan ? (
                          <div className="mt-1 p-1.5 rounded-lg bg-[#FAF0E4] border border-[#E8D5C4] text-[11px] text-[#844A18] flex items-start gap-1">
                            <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 text-[#D98E75]" />
                            <span><strong>Catatan Tambahan:</strong> {item.catatanTambahan}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusPerizinanBadge status={item.status} size="sm" />
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 rounded-xl bg-[#E8D5C4] text-[#524133] hover:bg-[#DFC5B0] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            className="p-2 rounded-xl bg-[#D98E75]/20 text-[#8C2E17] hover:bg-[#D98E75]/35 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: Tambah Perizinan */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Catat Perizinan Santri"
        subtitle="Sertakan alasan dan catatan tambahan jika terdapat perpanjangan izin"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Nama Lengkap Santri *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                list="santri-datalist-add"
                value={formData.santriNama}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = santriList.find(s => s.nama.toLowerCase() === val.trim().toLowerCase());
                  setFormData({
                    ...formData,
                    santriNama: val,
                    santriId: matched ? matched.id : formData.santriId
                  });
                }}
                placeholder="Ketik nama santri langsung..."
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
                autoFocus
              />
              <datalist id="santri-datalist-add">
                {santriList.map(s => (
                  <option key={s.id} value={s.nama}>
                    Kelas {s.kelas} — {s.namaWali ? `Wali: ${s.namaWali}` : s.alamat}
                  </option>
                ))}
              </datalist>
            </div>
            <p className="text-[11px] text-[#8C7A6B] mt-1">
              * Tulis nama santri langsung tanpa harus memilih dari daftar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Jenis Izin *
              </label>
              <select
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value as JenisPerizinan })}
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
              >
                <option value="pulang">Pulang ke Rumah</option>
                <option value="keluar">Keluar Sebentar</option>
                <option value="sakit">Sakit / Rawat</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Status Izin *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusPerizinan })}
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
              >
                <option value="disetujui">Disetujui (Aktif)</option>
                <option value="diajukan">Diajukan</option>
                <option value="selesai">Selesai / Kembali</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#FAF3EA] border border-[#E8D5C4]/60">
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Tanggal Mulai *
              </label>
              <input
                type="date"
                required
                value={formData.tanggalMulai}
                onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                className="w-full p-2 text-xs sm:text-sm rounded-xl bg-white border border-[#D9B99B] text-[#2C241E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Tanggal Selesai *
              </label>
              <input
                type="date"
                required
                value={formData.tanggalSelesai}
                onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                className="w-full p-2 text-xs sm:text-sm rounded-xl bg-white border border-[#D9B99B] text-[#2C241E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Alasan Perizinan *
            </label>
            <textarea
              rows={2}
              required
              value={formData.alasan}
              onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
              placeholder="Contoh: Menghadiri acara pernikahan keluarga di Cirebon"
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          {/* Kolom Catatan Tambahan (Bukti / Perpanjangan) */}
          <div>
            <label className="block text-xs font-bold text-[#865322] mb-1">
              Catatan Tambahan (Izin Tambahan / Perpanjangan / Bukti Telepon Wali)
            </label>
            <textarea
              rows={2}
              value={formData.catatanTambahan}
              onChange={(e) => setFormData({ ...formData, catatanTambahan: e.target.value })}
              placeholder="Contoh: Wali telepon tanggal 12 minta tambah 2 hari karena ada urusan penting. Disetujui ustadz pengasuhan."
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FAF1E6] border border-[#E0C7B0] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="clay-btn clay-btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Izin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Ubah Perizinan */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Ubah Catatan Perizinan"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Nama Lengkap Santri *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                list="santri-datalist-edit"
                value={formData.santriNama}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = santriList.find(s => s.nama.toLowerCase() === val.trim().toLowerCase());
                  setFormData({
                    ...formData,
                    santriNama: val,
                    santriId: matched ? matched.id : formData.santriId
                  });
                }}
                placeholder="Ketik nama santri langsung..."
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              />
              <datalist id="santri-datalist-edit">
                {santriList.map(s => (
                  <option key={s.id} value={s.nama}>
                    Kelas {s.kelas} — {s.namaWali ? `Wali: ${s.namaWali}` : s.alamat}
                  </option>
                ))}
              </datalist>
            </div>
            <p className="text-[11px] text-[#8C7A6B] mt-1">
              * Tulis nama santri langsung atau ubah sesuai kebutuhan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Jenis Izin
              </label>
              <select
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value as JenisPerizinan })}
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
              >
                <option value="pulang">Pulang ke Rumah</option>
                <option value="keluar">Keluar Sebentar</option>
                <option value="sakit">Sakit / Rawat</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Status Izin
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusPerizinan })}
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
              >
                <option value="disetujui">Disetujui (Aktif)</option>
                <option value="diajukan">Diajukan</option>
                <option value="selesai">Selesai / Kembali</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#FAF3EA] border border-[#E8D5C4]/60">
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Tanggal Mulai *
              </label>
              <input
                type="date"
                required
                value={formData.tanggalMulai}
                onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                className="w-full p-2 text-xs sm:text-sm rounded-xl bg-white border border-[#D9B99B] text-[#2C241E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Tanggal Selesai *
              </label>
              <input
                type="date"
                required
                value={formData.tanggalSelesai}
                onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                className="w-full p-2 text-xs sm:text-sm rounded-xl bg-white border border-[#D9B99B] text-[#2C241E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Alasan Perizinan *
            </label>
            <textarea
              rows={2}
              required
              value={formData.alasan}
              onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#865322] mb-1">
              Catatan Tambahan (Izin Tambahan / Perpanjangan / Bukti)
            </label>
            <textarea
              rows={2}
              value={formData.catatanTambahan}
              onChange={(e) => setFormData({ ...formData, catatanTambahan: e.target.value })}
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FAF1E6] border border-[#E0C7B0] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
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

      {/* MODAL: Hapus Perizinan */}
      <Modal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Hapus Catatan Izin"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#4E3F32]">
            Hapus catatan perizinan ini? Data pada portal wali santri juga akan otomatis diperbarui.
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setDeletingItem(null)}
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
    </div>
  );
};
