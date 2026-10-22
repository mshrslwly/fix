import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  PlusCircle,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Trash2,
  MessageSquare,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Santri, Peraturan, Pelanggaran, Perizinan, KelasSantri } from '../types';
import { aiService, AiChatActionSantri, AiChatActionPelanggaran } from '../services/aiService';
import { useToast } from './Toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  actionType?: 'none' | 'create_santri' | 'create_pelanggaran';
  santriData?: AiChatActionSantri[];
  pelanggaranData?: AiChatActionPelanggaran;
  saved?: boolean;
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  peraturanList: Peraturan[];
  pelanggaranList: Pelanggaran[];
  perizinanList?: Perizinan[];
  onSaveSantri: (data: Omit<Santri, 'id' | 'kodeAkses' | 'createdAt' | 'updatedAt'>) => Promise<Santri>;
  onSavePelanggaran: (data: Omit<Pelanggaran, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Pelanggaran>;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  santriList,
  peraturanList,
  pelanggaranList,
  perizinanList,
  onSaveSantri,
  onSavePelanggaran
}) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'model',
      text: 'Assalamu\'alaikum Ustadz / Pengurus! Saya Asisten AI SiPontren. Saya bisa bantu:\n• Input data santri baru\n• Pelanggaran & sanksi\n• Membuat ringkasan dan menjawab pertanyaan\n\nApa yang ingin Anda kerjakan sekarang?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savingActionId, setSavingActionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = 'usr-' + Date.now();
    const newMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: textToSend.trim()
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

      const res = await aiService.sendChatMessage(
        textToSend.trim(),
        history,
        {
          santri: santriList,
          peraturan: peraturanList,
          pelanggaran: pelanggaranList,
          perizinan: perizinanList
        }
      );

      const botMsgId = 'bot-' + Date.now();
      const botMsg: ChatMessage = {
        id: botMsgId,
        role: 'model',
        text: res.reply || 'Data berhasil diproses.',
        actionType: res.actionType || 'none',
        santriData: res.santriData,
        pelanggaranData: res.pelanggaranData,
        saved: false
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghubungi Asisten AI', 'error');
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'model',
          text: 'Afwan Ustadz, terjadi kendala saat memproses permintaan AI. Pastikan koneksi internet stabil dan silakan coba lagi.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSaveSantri = async (msgId: string, items: AiChatActionSantri[]) => {
    setSavingActionId(msgId);
    try {
      for (const item of items) {
        await onSaveSantri({
          nama: item.nama,
          kelas: item.kelas || '1',
          alamat: item.alamat || '-',
          namaWali: item.namaWali || '-',
          noHpWali: item.noHpWali || ''
        });
      }
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, saved: true } : m))
      );
      showToast(`Alhamdulillah, ${items.length} santri berhasil disimpan ke database!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan santri', 'error');
    } finally {
      setSavingActionId(null);
    }
  };

  const handleExecuteSavePelanggaran = async (msgId: string, data: AiChatActionPelanggaran) => {
    setSavingActionId(msgId);
    try {
      // Cari santri yang cocok jika santriId belum ada
      let targetSantri = santriList.find(s => s.id === data.santriId);
      if (!targetSantri && data.santriNama) {
        targetSantri = santriList.find(s =>
          s.nama.toLowerCase().includes(data.santriNama.toLowerCase()) ||
          data.santriNama.toLowerCase().includes(s.nama.toLowerCase())
        );
      }

      if (!targetSantri) {
        showToast(`Santri "${data.santriNama}" tidak ditemukan di database. Silakan pastikan nama santri.`, 'error');
        setSavingActionId(null);
        return;
      }

      // Cari peraturan yang cocok jika peraturanId belum ada
      let targetPer = peraturanList.find(p => p.id === data.peraturanId);
      if (!targetPer && data.namaPeraturan) {
        targetPer = peraturanList.find(p =>
          p.nama.toLowerCase().includes(data.namaPeraturan.toLowerCase()) ||
          data.namaPeraturan.toLowerCase().includes(p.nama.toLowerCase())
        );
      }

      await onSavePelanggaran({
        santriId: targetSantri.id,
        santriNama: targetSantri.nama,
        peraturanId: targetPer?.id || 'per-umum',
        tanggal: data.tanggal || new Date().toISOString().slice(0, 10),
        keterangan: data.catatan || data.namaPeraturan,
        sanksi: data.sanksi || targetPer?.sanksi || 'Teguran lisan & pembinaan',
        statusSanksi: 'belum'
      });

      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, saved: true } : m))
      );
      showToast(`Alhamdulillah, pelanggaran santri ${targetSantri.nama} berhasil dicatat!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pelanggaran', 'error');
    } finally {
      setSavingActionId(null);
    }
  };

  const quickPrompts = [
    '✨ Daftarkan santri baru: Muhammad Farhan kelas 2 alamat Magelang wali Bapak Ahmad 081234567890',
    '🚨 Catat pelanggaran: Santri terlambat sholat subuh berjamaah',
    '📊 Siapa saja santri yang paling banyak poin pelanggaran?',
    '📱 Buatkan draf WhatsApp untuk wali santri yang anaknya sakit'
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md sm:max-w-lg bg-[#FAF5EE] h-full shadow-2xl flex flex-col border-l border-[#E8D5C4] animate-slide-left">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8D5C4] flex items-center justify-between bg-[#F4ECE1]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5F8F6B] text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-heading font-black text-base text-[#2E251E] flex items-center gap-1.5">
                <span>Asisten AI SiPontren</span>
                <span className="px-2 py-0.5 rounded-full bg-[#5F8F6B]/15 text-[#3F6B4D] font-bold text-[10px]">
                  Online
                </span>
              </h2>
              <p className="text-[11px] text-[#7A6959]">
                Input santri &amp; pelanggaran lewat bahasa santai
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#7A6959] hover:bg-black/5 hover:text-[#2E251E] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-lg bg-[#5F8F6B]/20 text-[#3F6B4D] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2.5 ${
                  msg.role === 'user'
                    ? 'bg-[#5F8F6B] text-white shadow-sm'
                    : 'bg-white border border-[#E8D5C4] text-[#2E251E] shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Action Card: Input Santri */}
                {msg.actionType === 'create_santri' && msg.santriData && msg.santriData.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#5F8F6B]/30 space-y-2 text-[#2E251E]">
                    <div className="flex items-center justify-between border-b border-[#E8D5C4] pb-1.5 font-bold text-[11px] text-[#3F6B4D]">
                      <span className="flex items-center gap-1">
                        <PlusCircle className="w-3.5 h-3.5" />
                        Konfirmasi Data Santri ({msg.santriData.length})
                      </span>
                      {msg.saved ? (
                        <span className="text-[#3F6B4D] flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Tersimpan
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8C7A6B]">Siap Disimpan</span>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {msg.santriData.map((s, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-white border border-[#EFE7DC] text-[11px] space-y-0.5">
                          <div className="font-black text-sm text-[#2E251E]">{s.nama}</div>
                          <div className="text-[#6D5D4E]">Kelas: <strong className="text-[#5F8F6B]">{s.kelas}</strong> • Alamat: {s.alamat || '-'}</div>
                          <div className="text-[#7A6A5A]">Wali: {s.namaWali || '-'} ({s.noHpWali || 'Tanpa No. HP'})</div>
                        </div>
                      ))}
                    </div>

                    {!msg.saved ? (
                      <button
                        type="button"
                        disabled={savingActionId === msg.id}
                        onClick={() => handleExecuteSaveSantri(msg.id, msg.santriData!)}
                        className="w-full clay-btn clay-btn-primary py-2 text-xs font-bold gap-1.5 cursor-pointer mt-1"
                      >
                        {savingActionId === msg.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyimpan ke Database...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ Simpan Santri ke Database</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="text-[11px] text-[#3F6B4D] font-bold text-center py-1 bg-[#5F8F6B]/10 rounded-lg">
                        ✓ Berhasil tersimpan ke database pesantren!
                      </div>
                    )}
                  </div>
                )}

                {/* Action Card: Input Pelanggaran */}
                {msg.actionType === 'create_pelanggaran' && msg.pelanggaranData && (
                  <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#D98E75]/40 space-y-2 text-[#2E251E]">
                    <div className="flex items-center justify-between border-b border-[#E8D5C4] pb-1.5 font-bold text-[11px] text-[#8C341E]">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Konfirmasi Catatan Pelanggaran
                      </span>
                      {msg.saved ? (
                        <span className="text-[#3F6B4D] flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Tersimpan
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8C7A6B]">Verifikasi Draf</span>
                      )}
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div>
                        Santri:{' '}
                        <strong className="text-sm font-black text-[#2E251E]">
                          {msg.pelanggaranData.santriNama}
                        </strong>
                      </div>
                      <div>
                        Pelanggaran:{' '}
                        <strong>{msg.pelanggaranData.namaPeraturan}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-[#D98E75]/20 text-[#8C341E] font-bold text-[10px] uppercase">
                          {msg.pelanggaranData.kategori}
                        </span>
                        <span className="font-bold text-[#8C341E]">
                          +{msg.pelanggaranData.poin} Poin
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white border border-[#EFE7DC] text-[#6D5D4E] mt-1">
                        <strong>Saran Sanksi:</strong> {msg.pelanggaranData.sanksi}
                      </div>
                    </div>

                    {!msg.saved ? (
                      <button
                        type="button"
                        disabled={savingActionId === msg.id}
                        onClick={() => handleExecuteSavePelanggaran(msg.id, msg.pelanggaranData!)}
                        className="w-full clay-btn clay-btn-accent py-2 text-xs font-bold gap-1.5 cursor-pointer mt-1"
                      >
                        {savingActionId === msg.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mencatat Pelanggaran...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#8A450D]" />
                            <span>✓ Simpan Pelanggaran ke Database</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="text-[11px] text-[#3F6B4D] font-bold text-center py-1 bg-[#5F8F6B]/10 rounded-lg">
                        ✓ Catatan pelanggaran telah tersimpan di sistem!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[#5F8F6B] text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-[#7A6959]">
              <div className="w-7 h-7 rounded-lg bg-[#5F8F6B]/20 text-[#3F6B4D] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-[#E8D5C4] px-3 py-2 rounded-2xl shadow-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5F8F6B]" />
                <span>Asisten AI sedang berpikir &amp; mencocokkan data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-t border-[#E8D5C4]/60 bg-[#F4ECE1]/60">
          <div className="text-[10px] font-bold text-[#7A6959] mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#5F8F6B]" />
            <span>Contoh Perintah Cepat:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleSendMessage(q)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-[#E8D5C4] text-[#6D5D4E] hover:bg-[#FAF5EE] hover:text-[#2E251E] font-medium transition-colors cursor-pointer text-left truncate max-w-full"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 border-t border-[#E8D5C4] bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Tulis perintah atau nama santri..."
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF5EE] border border-[#E8D5C4] text-[#2E251E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="clay-btn clay-btn-primary p-2.5 rounded-xl cursor-pointer disabled:opacity-50 shrink-0"
            title="Kirim pesan"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
