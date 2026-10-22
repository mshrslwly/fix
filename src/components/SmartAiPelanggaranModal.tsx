import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Modal } from './Modal';
import { Santri, Peraturan, Pelanggaran } from '../types';
import { aiService, AiChatActionPelanggaran } from '../services/aiService';
import { useToast } from './Toast';

interface SmartAiPelanggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  peraturanList: Peraturan[];
  onAddPelanggaran: (data: Omit<Pelanggaran, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Pelanggaran>;
}

export const SmartAiPelanggaranModal: React.FC<SmartAiPelanggaranModalProps> = ({
  isOpen,
  onClose,
  santriList,
  peraturanList,
  onAddPelanggaran
}) => {
  const { showToast } = useToast();
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<AiChatActionPelanggaran | null>(null);
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [selectedPeraturanId, setSelectedPeraturanId] = useState<string>('');
  const [sanksi, setSanksi] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      showToast('Tuliskan catatan kejadian pelanggaran terlebih dahulu', 'error');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await aiService.parsePelanggaranInput(inputText.trim(), santriList, peraturanList);
      setParsedResult(res);

      // Auto-select santri if matched
      if (res.santriId) {
        setSelectedSantriId(res.santriId);
      } else if (res.santriNama) {
        const found = santriList.find(s =>
          s.nama.toLowerCase().includes(res.santriNama.toLowerCase()) ||
          res.santriNama.toLowerCase().includes(s.nama.toLowerCase())
        );
        if (found) setSelectedSantriId(found.id);
      }

      // Auto-select peraturan if matched
      if (res.peraturanId) {
        setSelectedPeraturanId(res.peraturanId);
      } else if (res.namaPeraturan) {
        const found = peraturanList.find(p =>
          p.nama.toLowerCase().includes(res.namaPeraturan.toLowerCase()) ||
          res.namaPeraturan.toLowerCase().includes(p.nama.toLowerCase())
        );
        if (found) setSelectedPeraturanId(found.id);
      }

      setSanksi(res.sanksi || '');
      setCatatan(res.catatan || inputText.trim());
      if (res.tanggal) setTanggal(res.tanggal);

      showToast('Pelanggaran berhasil dianalisis oleh AI!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menganalisis dengan AI', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriId) {
      showToast('Pilih santri yang melakukan pelanggaran', 'error');
      return;
    }
    if (!selectedPeraturanId) {
      showToast('Pilih pasal tata tertib pelanggaran', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const matchedSantri = santriList.find(s => s.id === selectedSantriId);
      await onAddPelanggaran({
        santriId: selectedSantriId,
        santriNama: matchedSantri?.nama || 'Santri',
        peraturanId: selectedPeraturanId,
        tanggal,
        keterangan: catatan.trim() || 'Catatan pelanggaran santri',
        sanksi: sanksi.trim() || 'Teguran lisan & pembinaan',
        statusSanksi: 'belum'
      });
      showToast('Pelanggaran berhasil disimpan ke database!', 'success');
      setInputText('');
      setParsedResult(null);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pelanggaran', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPeraturan = peraturanList.find(p => p.id === selectedPeraturanId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Input Cepat Pelanggaran via AI"
      subtitle="Ketik catatan kejadian bebas, AI akan mencocokkan santri, pasal, dan poin otomatis"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
            Ceritakan Kejadian Pelanggaran:
          </label>
          <textarea
            rows={3}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Contoh: Zaki kelas 2 ketahuan terlambat sholat subuh berjamaah di masjid tadi pagi."
            className="w-full p-3 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
          />
        </div>

        <button
          type="button"
          disabled={isAnalyzing || !inputText.trim()}
          onClick={handleAnalyze}
          className="clay-btn clay-btn-primary py-2 px-4 text-xs font-bold gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>AI Sedang Menganalisis &amp; Mencocokkan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Analisis Pelanggaran dengan AI</span>
            </>
          )}
        </button>

        {parsedResult && (
          <form onSubmit={handleSave} className="space-y-3 border-t border-[#E8D5C4] pt-3 animate-fade-in">
            <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#D98E75]/30 space-y-1 text-xs">
              <div className="font-bold text-[#8C341E] flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                <span>Hasil Pencocokan Cerdas AI:</span>
              </div>
              <p className="text-[11px] text-[#7A6959]">
                Silakan periksa nama santri, pasal tata tertib, dan sesuaikan bila perlu sebelum disimpan:
              </p>
            </div>

            {/* Santri Select */}
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Santri yang Melanggar *
              </label>
              <select
                required
                value={selectedSantriId}
                onChange={e => setSelectedSantriId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              >
                <option value="">-- Pilih Santri --</option>
                {santriList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nama} (Kelas {s.kelas})
                  </option>
                ))}
              </select>
            </div>

            {/* Peraturan Select */}
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Pasal / Peraturan yang Dilanggar *
              </label>
              <select
                required
                value={selectedPeraturanId}
                onChange={e => setSelectedPeraturanId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              >
                <option value="">-- Pilih Peraturan --</option>
                {peraturanList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.kategori.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {selectedPeraturan && (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-[#D98E75]/20 text-[#8C341E] font-bold text-[10px] uppercase">
                  {selectedPeraturan.kategori}
                </span>
                <span className="text-[#6E5949] text-xs">
                  Sanksi standar: <strong className="text-[#2C241E]">{selectedPeraturan.sanksi}</strong>
                </span>
              </div>
            )}

            {/* Rekomendasi Sanksi */}
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Bentuk Sanksi Edukatif
              </label>
              <input
                type="text"
                value={sanksi}
                onChange={e => setSanksi(e.target.value)}
                placeholder="Misal: Membaca Al-Qur'an 1 juz / piket masjid"
                className="w-full p-2.5 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              />
            </div>

            {/* Catatan Kronologi */}
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Catatan Kejadian
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              />
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
                Tanggal Pelanggaran
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="clay-btn clay-btn-accent py-2.5 px-5 text-xs font-bold gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>✓ Simpan Pelanggaran</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
