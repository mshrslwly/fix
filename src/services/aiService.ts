import { Santri, Peraturan, Pelanggaran, Perizinan, KelasSantri } from '../types';

export interface AiChatActionSantri {
  nama: string;
  kelas: KelasSantri;
  alamat: string;
  namaWali: string;
  noHpWali: string;
}

export interface AiChatActionPelanggaran {
  santriId?: string | null;
  santriNama: string;
  peraturanId?: string | null;
  namaPeraturan: string;
  kategori: 'ringan' | 'sedang' | 'berat';
  poin: number;
  sanksi: string;
  catatan: string;
  tanggal: string;
}

export interface AiChatResponse {
  reply: string;
  actionType: 'none' | 'create_santri' | 'create_pelanggaran';
  santriData?: AiChatActionSantri[];
  pelanggaranData?: AiChatActionPelanggaran;
  error?: string;
}

export interface AiChatContext {
  santri: Santri[];
  peraturan: Peraturan[];
  pelanggaran?: Pelanggaran[];
  perizinan?: Perizinan[];
}

export const aiService = {
  async sendChatMessage(
    message: string,
    history: Array<{ role: 'user' | 'model'; text: string }>,
    context: AiChatContext
  ): Promise<AiChatResponse> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, context })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Gagal menghubungi Asisten AI (${res.status})`);
    }

    return res.json();
  },

  async parseSantriInput(text: string): Promise<AiChatActionSantri[]> {
    const res = await fetch('/api/ai/parse-santri', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Gagal mengekstraksi data santri (${res.status})`);
    }

    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  },

  async parsePelanggaranInput(
    text: string,
    santriList: Santri[],
    peraturanList: Peraturan[]
  ): Promise<AiChatActionPelanggaran> {
    const res = await fetch('/api/ai/parse-pelanggaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, santriList, peraturanList })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Gagal mencocokkan pelanggaran (${res.status})`);
    }

    return res.json();
  }
};
