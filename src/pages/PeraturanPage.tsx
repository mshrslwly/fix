import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  Gavel
} from 'lucide-react';
import { Peraturan } from '../types';
import { exportPeraturanToExcel } from '../utils/exportExcel';
import { exportPeraturanToPdf } from '../utils/exportPdf';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { AnimatedNumber } from '../components/AnimatedNumber';

interface PeraturanPageProps {
  peraturanList: Peraturan[];
  onAddPeraturan: (data: Omit<Peraturan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Peraturan>;
  onEditPeraturan: (id: string, data: Partial<Peraturan>) => Promise<void>;
  onDeletePeraturan: (id: string) => Promise<void>;
}

export const PeraturanPage: React.FC<PeraturanPageProps> = ({
  peraturanList,
  onAddPeraturan,
  onEditPeraturan,
  onDeletePeraturan
}) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Peraturan | null>(null);
  const [deletingItem, setDeletingItem] = useState<Peraturan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    sanksi: '',
    kategori: 'Ketertiban',
    keterangan: ''
  });

  const filtered = peraturanList.filter(p => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        p.nama.toLowerCase().includes(q) ||
        p.kode.toLowerCase().includes(q) ||
        p.sanksi.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    const nextNum = peraturanList.length + 1;
    setFormData({
      kode: `TAT-${String(nextNum).padStart(2, '0')}`,
      nama: '',
      sanksi: '',
      kategori: 'Ketertiban',
      keterangan: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (p: Peraturan) => {
    setFormData({
      kode: p.kode,
      nama: p.nama,
      sanksi: p.sanksi,
      kategori: p.kategori,
      keterangan: p.keterangan
    });
    setEditingItem(p);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.sanksi.trim()) {
      showToast('Nama peraturan dan bentuk sanksi wajib diisi', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      await onAddPeraturan({
        kode: formData.kode.trim().toUpperCase(),
        nama: formData.nama.trim(),
        sanksi: formData.sanksi.trim(),
        kategori: formData.kategori.trim(),
        keterangan: formData.keterangan.trim()
      });
      showToast('Tata tertib & sanksi berhasil disimpan!', 'success');
      setIsAddOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan peraturan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setIsSubmitting(true);
      await onEditPeraturan(editingItem.id, {
        kode: formData.kode.trim().toUpperCase(),
        nama: formData.nama.trim(),
        sanksi: formData.sanksi.trim(),
        kategori: formData.kategori.trim(),
        keterangan: formData.keterangan.trim()
      });
      showToast('Tata tertib berhasil diperbarui!', 'success');
      setEditingItem(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const target = deletingItem;
    setDeletingItem(null);
    showToast('Tata tertib berhasil dihapus', 'success');
    try {
      await onDeletePeraturan(target.id);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus', 'error');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#2E2721]">
            Tata Tertib & Sanksi
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6B5A] mt-0.5">
            Daftar aturan pondok pesantren lengkap beserta sanksi edukatif yang dikenakan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="clay-btn clay-btn-primary py-2.5 px-4 text-xs font-bold gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Tata Tertib</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="clay-card p-4 border border-[#E8D5C4]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8F7D6D]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tata tertib atau sanksi..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => exportPeraturanToExcel(filtered)}
            className="clay-btn clay-btn-secondary py-1.5 px-3 text-xs font-bold gap-1 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={() => exportPeraturanToPdf(filtered)}
            className="clay-btn clay-btn-secondary py-1.5 px-3 text-xs font-bold gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-rose-700" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="clay-card p-0 overflow-hidden border border-[#E8D5C4]/70">
        <div className="max-h-[480px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FAF2E8] sticky top-0 z-10 border-b border-[#E8D5C4]/60 text-[#554536] shadow-sm">
              <tr>
                <th className="py-3 px-4 font-bold">Kode</th>
                <th className="py-3 px-4 font-bold">Tata Tertib</th>
                <th className="py-3 px-4 font-bold">Sanksi yang Dikenakan</th>
                <th className="py-3 px-4 font-bold">Kategori</th>
                <th className="py-3 px-4 font-bold hidden md:table-cell">Keterangan</th>
                <th className="py-3 px-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE7DC]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-black/3 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#5F8F6B]">
                    {item.kode}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#2A231C]">
                    {item.nama}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#865322] bg-[#F6B98A]/25 px-2.5 py-1 rounded-xl text-xs inline-block">
                      {item.sanksi}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#5D4E41]">
                    {item.kategori}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-[#68584B] text-xs">
                    {item.keterangan || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
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
              ))}
            </tbody>
          </table>
        </div>
        <div className="py-2.5 px-4 bg-[#FAF5EE] border-t border-[#EFE7DC] text-xs text-[#7F6E5E] flex items-center justify-between">
          <span>
            Menampilkan <strong className="text-[#382F26] font-bold"><AnimatedNumber value={filtered.length} /></strong> tata tertib & sanksi
          </span>
          <span className="text-[11px] text-[#A08F80]">
            Total aturan: <strong className="text-[#5F8F6B] font-bold"><AnimatedNumber value={peraturanList.length} /></strong>
          </span>
        </div>
      </div>

      {/* Modal Add */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Tata Tertib & Sanksi"
        subtitle="Masukkan nama aturan beserta sanksi langsungnya (contoh: Kabur ➔ Gundul)"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Kode *
              </label>
              <input
                type="text"
                required
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                placeholder="Contoh: TAT-07"
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Kategori
              </label>
              <input
                type="text"
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                placeholder="Ketertiban / Ibadah / Akhlak"
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Nama Tata Tertib / Pelanggaran *
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Kabur dari pondok tanpa izin bagian keamanan"
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#865322] mb-1">
              Bentuk Sanksi yang Dikenakan *
            </label>
            <input
              type="text"
              required
              value={formData.sanksi}
              onChange={(e) => setFormData({ ...formData, sanksi: e.target.value })}
              placeholder="Contoh: Gundul & Takzir Bersihkan Selasar 3 Hari"
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FAF3EA] border-2 border-[#D9B99B] text-[#2C241E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Keterangan & Batasan
            </label>
            <textarea
              rows={2}
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Keterangan tambahan jika diperlukan..."
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Ubah Tata Tertib & Sanksi"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Kode *
              </label>
              <input
                type="text"
                required
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Kategori
              </label>
              <input
                type="text"
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Nama Tata Tertib *
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#865322] mb-1">
              Bentuk Sanksi *
            </label>
            <input
              type="text"
              required
              value={formData.sanksi}
              onChange={(e) => setFormData({ ...formData, sanksi: e.target.value })}
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FAF3EA] border-2 border-[#D9B99B] text-[#2C241E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
              Keterangan & Batasan
            </label>
            <textarea
              rows={2}
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full p-2.5 text-sm rounded-2xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E]"
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

      {/* Modal Delete */}
      <Modal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Hapus Tata Tertib"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#4E3F32]">
            Hapus peraturan <strong>{deletingItem?.nama}</strong>?
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
