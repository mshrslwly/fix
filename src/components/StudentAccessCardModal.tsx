import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy,
  Printer,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  Check,
  Edit3,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Santri } from '../types';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { KelasBadge } from './Badge';
import { dataService } from '../services/dataService';

interface StudentAccessCardModalProps {
  santri: Santri | null;
  isOpen: boolean;
  onClose: () => void;
  onResetCode: (santriId: string) => Promise<void>;
}

export const StudentAccessCardModal: React.FC<StudentAccessCardModalProps> = ({
  santri,
  isOpen,
  onClose,
  onResetCode
}) => {
  const { showToast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEditMessage, setShowEditMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isCopiedText, setIsCopiedText] = useState(false);

  useEffect(() => {
    if (santri) {
      const template = dataService.getWhatsAppTemplate();
      const appOrigin = typeof window !== 'undefined'
        ? (import.meta.env.VITE_APP_URL || window.location.origin)
        : '';
      const url = `${appOrigin}/?k=${santri.kodeAkses}`;
      const formatted = dataService.formatWhatsAppMessage(template, santri, url);
      setCustomMessage(formatted);
    }
  }, [santri]);

  if (!santri) return null;

  const appOrigin = typeof window !== 'undefined'
    ? (import.meta.env.VITE_APP_URL || window.location.origin)
    : '';
  const portalUrl = `${appOrigin}/?k=${santri.kodeAkses}`;

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('0')) {
      p = '62' + p.substring(1);
    }
    return p;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      showToast('Tautan portal wali berhasil disalin!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Gagal menyalin tautan', 'error');
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setIsCopiedText(true);
      showToast('Teks pesan WhatsApp berhasil disalin!', 'success');
      setTimeout(() => setIsCopiedText(false), 2000);
    } catch {
      showToast('Gagal menyalin pesan WhatsApp', 'error');
    }
  };

  const handleKirimWhatsApp = () => {
    const phone = cleanPhone(santri.noHpWali);
    const pesan = encodeURIComponent(customMessage);

    const waLink = phone
      ? `https://wa.me/${phone}?text=${pesan}`
      : `https://wa.me/?text=${pesan}`;

    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  const handleResetToDefaultMessage = () => {
    const defaultTpl = dataService.getWhatsAppTemplate();
    const formatted = dataService.formatWhatsAppMessage(defaultTpl, santri, portalUrl);
    setCustomMessage(formatted);
    showToast('Pesan dikembalikan ke format bawaan template', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmReset = async () => {
    try {
      setIsResetting(true);
      await onResetCode(santri.id);
      showToast('Kode akses berhasil di-reset. Link lama telah dinonaktifkan.', 'success');
      setShowConfirmReset(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal mereset kode', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kartu Akses Portal Wali"
      subtitle={`Tautan & Kode Akses Pribadi untuk ${santri.nama}`}
      maxWidth="md"
    >
      <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
        {/* Claymorphism Preview Card */}
        <div className="clay-card p-5 sm:p-6 bg-gradient-to-b from-[#FAF5EE] to-[#EFE4D7] border-2 border-[#D9B99B]/50 text-center relative overflow-hidden shadow-sm hover-lift transition-transform">
          {/* Header Kartu */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D9B99B]/50">
            <div className="text-left">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#5F8F6B]">
                KARTU AKSES WALI
              </span>
              <h4 className="font-heading font-black text-lg text-[#352D26] leading-tight">
                SiPontren
              </h4>
            </div>
            <KelasBadge kelas={santri.kelas} size="md" />
          </div>

          {/* QR Code Container */}
          <div className="inline-block p-3.5 rounded-2xl bg-white shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06),3px_3px_10px_rgba(180,160,140,0.3)] my-1 transition-transform hover:scale-105 duration-200">
            <QRCodeSVG
              value={portalUrl}
              size={160}
              level="M"
              fgColor="#3F6B4D"
              bgColor="#FFFFFF"
            />
          </div>

          {/* Santri Info */}
          <div className="mt-3">
            <h3 className="text-xl font-black font-heading text-[#2C241E]">
              {santri.nama}
            </h3>
            <p className="text-xs text-[#705E4E] font-medium mt-0.5">
              Wali: <strong className="text-[#3F332A]">{santri.namaWali}</strong> • {santri.alamat}
            </p>
          </div>

          {/* Big Clay Access Code Pill */}
          <div className="mt-3.5 inline-flex flex-col items-center justify-center px-6 py-2 rounded-2xl bg-[#5F8F6B]/15 border border-[#5F8F6B]/30 hover-lift">
            <span className="text-[10px] font-bold text-[#5F8F6B] uppercase tracking-wider">
              Kode Akses Pribadi
            </span>
            <span className="font-mono text-2xl font-black tracking-widest text-[#3F6B4D]">
              {santri.kodeAkses}
            </span>
          </div>

          <p className="text-[11px] text-[#8C7A6B] mt-2.5">
            Pindai menggunakan kamera ponsel atau kirim langsung melalui WhatsApp.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleKirimWhatsApp}
            className="clay-btn py-2.5 px-4 bg-[#25D366] text-white hover:bg-[#1EBE5D] shadow-[3px_3px_10px_rgba(37,211,102,0.35)] flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm font-bold hover-lift active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim via WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="clay-btn clay-btn-secondary py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm font-bold hover-lift active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin!' : 'Salin Tautan'}</span>
          </button>

          <a
            href={portalUrl}
            target="_blank"
            rel="noreferrer"
            className="clay-btn clay-btn-secondary py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm font-bold"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Informasi</span>
          </a>

          <button
            type="button"
            onClick={handlePrint}
            className="clay-btn clay-btn-secondary py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm font-bold"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Ini</span>
          </button>
        </div>

        {/* Fitur Kustomisasi Pesan WhatsApp */}
        <div className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#1EBE5D]" />
              <span className="text-xs font-bold text-[#2E251E]">
                Pesan WhatsApp Wali
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowEditMessage(!showEditMessage)}
              className="text-xs font-bold text-[#1EBE5D] hover:text-[#179649] flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{showEditMessage ? 'Tutup Pratinjau' : 'Sesuaikan Pesan'}</span>
            </button>
          </div>

          {showEditMessage ? (
            <div className="space-y-2 pt-1">
              <div className="relative">
                <textarea
                  rows={6}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-2.5 text-xs font-sans rounded-xl bg-white border border-[#E8D5C4] text-[#2E251E] focus:outline-none focus:ring-2 focus:ring-[#25D366] leading-relaxed resize-y"
                  placeholder="Ketik isi pesan WhatsApp di sini..."
                />
              </div>
              <div className="flex items-center justify-between text-[11px] gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleResetToDefaultMessage}
                  className="text-[#8C7B6D] hover:text-[#6D5D4E] flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ke Bawaan</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="clay-btn clay-btn-secondary py-1 px-2.5 text-[11px] font-bold flex items-center gap-1"
                  >
                    {isCopiedText ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopiedText ? 'Teks Tersalin!' : 'Salin Teks'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleKirimWhatsApp}
                    className="clay-btn py-1 px-3 bg-[#25D366] text-white hover:bg-[#1EBE5D] text-[11px] font-bold flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Kirim WA</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-[#7A6A5C] line-clamp-2 leading-relaxed bg-white/70 p-2 rounded-xl border border-[#25D366]/20">
              {customMessage}
            </p>
          )}
        </div>

        {/* Keamanan & Reset Link Option */}
        <div className="pt-2 border-t border-[#E8D5C4]/50 flex flex-col items-center gap-2">
          <p className="text-[11px] text-[#8C7B6D] text-center">
            🔒 Jika data santri ini dihapus, link portal otomatis hangus dan tidak dapat dibuka kembali.
          </p>

          {!showConfirmReset ? (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="text-xs text-[#B25942] hover:text-[#8F3722] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Link / Buat Kode Baru</span>
            </button>
          ) : (
            <div className="w-full p-3.5 rounded-2xl bg-[#D98E75]/15 border border-[#D98E75]/40 space-y-2">
              <div className="flex items-start gap-2 text-xs text-[#8F3722]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Konfirmasi Reset:</strong> Link dan kode lama ({santri.kodeAkses}) akan langsung nonaktif seketika. Wali harus diberikan link baru.
                </span>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#6B5A4E] hover:bg-black/5"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleConfirmReset}
                  className="clay-btn clay-btn-danger text-xs px-3.5 py-1.5"
                >
                  {isResetting ? 'Mereset...' : 'Ya, Reset Sekarang'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
