import React, { useState } from 'react';
import { Sparkles, Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { Santri, KelasSantri } from '../types';
import { aiService, AiChatActionSantri } from '../services/aiService';
import { useToast } from './Toast';

interface SmartAiSantriModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSantri: (data: Omit<Santri, 'id' | 'kodeAkses' | 'createdAt' | 'updatedAt'>) => Promise<Santri>;
}

export const SmartAiSantriModal: React.FC<SmartAiSantriModalProps> = ({
  isOpen,
  onClose,
  onAddSantri
}) => {
  const { showToast } = useToast();
  const [inputText, setInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedList, setExtractedList] = useState<AiChatActionSantri[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleExtract = async () => {
    if (!inputText.trim()) {
      showToast('Masukkan teks catatan calon santri terlebih dahulu', 'error');
      return;
    }

    setIsExtracting(true);
    try {
      const items = await aiService.parseSantriInput(inputText.trim());
      if (items.length === 0) {
        showToast('Tidak ada data santri yang terbaca. Coba tuliskan nama dan kelas lebih jelas.', 'error');
      } else {
        setExtractedList(items);
        showToast(`Alhamdulillah, berhasil mengekstraksi ${items.length} calon santri!`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses data dengan AI', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUpdateItem = (index: number, field: keyof AiChatActionSantri, val: string) => {
    setExtractedList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setExtractedList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (extractedList.length === 0) return;
    setIsSaving(true);
    try {
      for (const item of extractedList) {
        if (!item.nama.trim()) continue;
        await onAddSantri({
          nama: item.nama.trim(),
          kelas: (item.kelas as KelasSantri) || '1',
          alamat: item.alamat?.trim() || '-',
          namaWali: item.namaWali?.trim() || '-',
          noHpWali: item.noHpWali?.trim() || ''
        });
      }
      showToast(`Berhasil menambahkan ${extractedList.length} santri baru ke database!`, 'success');
      setInputText('');
      setExtractedList([]);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan data santri', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Input Cepat Santri via AI"
      subtitle="Tempel catatan santri dari WhatsApp / dokumen, AI akan merapikannya otomatis"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#4B3C2F] mb-1">
            Tulis / Tempel Data Santri Bebas:
          </label>
          <textarea
            rows={4}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Contoh:&#10;1. Ahmad Zaki, kelas 2, Sleman DIY, wali Bpk Ridwan 08123456789&#10;2. Budi Santoso, kelas 3, Wonosobo, wali Ibu Maryam 0876543210"
            className="w-full p-3 text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            disabled={isExtracting || !inputText.trim()}
            onClick={handleExtract}
            className="clay-btn clay-btn-primary py-2 px-4 text-xs font-bold gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mengekstraksi Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ Ekstraksi dengan AI</span>
              </>
            )}
          </button>

          {extractedList.length > 0 && (
            <span className="text-xs font-bold text-[#5F8F6B]">
              {extractedList.length} santri siap ditinjau
            </span>
          )}
        </div>

        {/* Preview Extracted Table */}
        {extractedList.length > 0 && (
          <div className="space-y-2 border-t border-[#E8D5C4] pt-3">
            <h4 className="text-xs font-bold text-[#2E251E]">
              Hasil Ekstraksi AI (Dapat Diedit Sebelum Disimpan):
            </h4>
            <div className="max-h-60 overflow-y-auto border border-[#E8D5C4] rounded-xl divide-y divide-[#EFE7DC] bg-white">
              {extractedList.map((item, idx) => (
                <div key={idx} className="p-2.5 flex items-center gap-2 hover:bg-[#FAF5EE]">
                  <span className="text-xs font-bold text-[#7A6959] w-5 text-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={item.nama}
                    onChange={e => handleUpdateItem(idx, 'nama', e.target.value)}
                    placeholder="Nama Santri"
                    className="flex-1 p-1.5 text-xs font-bold rounded-lg bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
                  />
                  <select
                    value={item.kelas}
                    onChange={e => handleUpdateItem(idx, 'kelas', e.target.value)}
                    className="p-1.5 text-xs rounded-lg bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
                  >
                    <option value="1">Kelas 1</option>
                    <option value="2">Kelas 2</option>
                    <option value="3">Kelas 3</option>
                    <option value="4">Kelas 4</option>
                    <option value="5">Kelas 5</option>
                    <option value="6">Kelas 6</option>
                    <option value="Salaf">Salaf</option>
                  </select>
                  <input
                    type="text"
                    value={item.namaWali}
                    onChange={e => handleUpdateItem(idx, 'namaWali', e.target.value)}
                    placeholder="Nama Wali"
                    className="w-28 p-1.5 text-xs rounded-lg bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
                  />
                  <input
                    type="text"
                    value={item.noHpWali}
                    onChange={e => handleUpdateItem(idx, 'noHpWali', e.target.value)}
                    placeholder="No HP"
                    className="w-28 p-1.5 text-xs rounded-lg bg-[#FAF5EE] border border-[#E8D5C4] text-[#2C241E]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    title="Hapus baris ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[#6D5D4E] hover:bg-black/5 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAll}
                className="clay-btn clay-btn-primary py-2.5 px-5 text-xs font-bold gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simpan Semua ({extractedList.length} Santri)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
