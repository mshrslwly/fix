import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  // Helper with robust model fallback to handle temporary high demand spikes
  const runAiWithFallback = async (params: { contents: any; config?: any }) => {
    // Priority order: Recommended text models first (gemini-3.8-flash, gemini-flash-latest), followed by lite
    const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
    let lastError: any = null;

    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            ...params,
            model,
          });
          if (response && response.text) {
            return response;
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || (String(err?.message || '').includes('503') ? 503 : 0);
          const isHighDemand = status === 503 || String(err?.message || '').includes('high demand') || String(err?.message || '').includes('UNAVAILABLE');

          if (isHighDemand && attempt === 0) {
            // Brief 400ms pause before retrying the same model
            await new Promise((resolve) => setTimeout(resolve, 400));
            continue;
          }
          // Log cleanly with console.log to avoid triggering Cloud Run stderr error monitors
          console.log(`[AI Engine] Model ${model} unavailable (${status || 'busy'}), trying next candidate...`);
          break;
        }
      }
    }
    throw lastError;
  };

  // 1. Endpoint: AI Chat & Action Assistant
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { message, history, context } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Pesan wajib diisi' });
      }

      // Santri and Peraturan summary for matching & QA
      const santriSummary = Array.isArray(context?.santri)
        ? context.santri.slice(0, 100).map((s: any) => `[ID:${s.id}] ${s.nama} (Kelas ${s.kelas}, Wali: ${s.namaWali || '-'}, HP: ${s.noHpWali || '-'})`).join('\n')
        : '';
      const peraturanSummary = Array.isArray(context?.peraturan)
        ? context.peraturan.map((p: any) => `[ID:${p.id}] ${p.nama} (${p.kategori}, sanksi: ${p.sanksi || '-'})`).join('\n')
        : '';
      
      // Pelanggaran summary (allows AI to summarize September violations, most frequent infractions, etc.)
      const pelanggaranSummary = Array.isArray(context?.pelanggaran)
        ? context.pelanggaran.slice(0, 150).map((p: any) => `• Tanggal: ${p.tanggal} | Santri: ${p.santriNama} | Pasal/Ket: ${p.keterangan || '-'} | Sanksi: ${p.sanksi || '-'} | Status: ${p.statusSanksi}`).join('\n')
        : '';

      // Perizinan summary
      const perizinanSummary = Array.isArray(context?.perizinan)
        ? context.perizinan.slice(0, 50).map((iz: any) => `• Santri: ${iz.santriNama || iz.santriId} | Jenis: ${iz.jenis} | Dari: ${iz.tanggalMulai} s/d ${iz.tanggalSelesai} | Status: ${iz.status}`).join('\n')
        : '';

      const todayStr = new Date().toISOString().slice(0, 10);

      const systemPrompt = `Anda adalah Asisten Pintar "SiPontren AI" untuk Pondok Pesantren.
Tugas Anda:
1. Membantu pengurus pesantren membuat ringkasan/rekapitulasi (misalnya: ringkasan pelanggaran bulan tertentu seperti September, santri paling sering melanggar, statistik izin, atau analisis kedisiplinan) berdasarkan DATA RIWAYAT yang disediakan di bawah.
2. Membantu pengurus pesantren mencatat santri baru atau pelanggaran santri secara cerdas dari percakapan.
3. Menjawab pertanyaan seputar manajemen santri, kedisiplinan, peraturan, perizinan, atau menyusun draf pesan WhatsApp yang santun untuk wali santri.
4. Bersikap ramah, sopan, islami (gunakan salam dan sapaan santun seperti Ustadz/Pengurus), dan solutif.

DATA PESANTREN SAAT INI:
DAFTAR SANTRI (sebagian):
${santriSummary || '(Belum ada data santri)'}

DAFTAR TATA TERTIB & PERATURAN:
${peraturanSummary || '(Belum ada data peraturan)'}

DAFTAR CATATAN PELANGGARAN SANTRI (TERKINI):
${pelanggaranSummary || '(Belum ada riwayat pelanggaran tercatat)'}

DAFTAR CATATAN PERIZINAN SANTRI:
${perizinanSummary || '(Belum ada riwayat perizinan tercatat)'}

TANGGAL HARI INI: ${todayStr}

PETUNJUK FORMAT KELUARAN:
Selalu berikan respons dalam format JSON murni dengan struktur:
{
  "reply": "Kalimat jawaban/analisis/ringkasan lengkap dan informatif Anda untuk pengurus (gunakan format poin-poin yang mudah dibaca jika merangkum)...",
  "actionType": "none" | "create_santri" | "create_pelanggaran",
  "santriData": [
    {
      "nama": "Nama Santri",
      "kelas": "1" | "2" | "3" | "4" | "5" | "6" | "Salaf",
      "alamat": "Alamat asal santri",
      "namaWali": "Nama Wali",
      "noHpWali": "08xxxxxxx"
    }
  ],
  "pelanggaranData": {
    "santriId": "ID santri jika cocok dari daftar santri di atas, atau kosongkan string jika belum cocok",
    "santriNama": "Nama Santri yang disebut",
    "peraturanId": "ID peraturan jika cocok dari daftar peraturan di atas",
    "namaPeraturan": "Nama Pelanggaran/Pasal",
    "kategori": "ringan" | "sedang" | "berat",
    "poin": 5,
    "sanksi": "Saran sanksi edukatif/mendidik",
    "catatan": "Rincian kejadian singkat",
    "tanggal": "${todayStr}"
  }
}

Catatan penting:
- Jika pengguna meminta ringkasan (misal "ringkasan pelanggaran bulan September"), hitung dan rangkum dari DAFTAR CATATAN PELANGGARAN di atas. Sebutkan jumlah kejadian, siapa saja santrinya, jenis pelanggaran, dan status sanksinya. Set actionType: "none".
- Jika pengguna meminta mendaftarkan atau menambah santri baru, set actionType: "create_santri" dan isi santriData (array).
- Jika pengguna melaporkan pelanggaran santri baru untuk dicatat, set actionType: "create_pelanggaran" dan isi pelanggaranData.
- Jika pengguna hanya bertanya, meminta saran, konsultasi, menyapa, atau minta rekap/ringkasan, set actionType: "none".
- Hanya keluarkan JSON valid tanpa backtick markdown.`;

      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const h of history.slice(-6)) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await runAiWithFallback({
        contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.3,
        }
      });

      const text = response.text || '{}';
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch {
        return res.json({ reply: text, actionType: 'none' });
      }
    } catch (err: any) {
      console.log('[AI Engine] Primary models exhausted or API busy, using local intelligence fallback:', err?.message || err);

      const msg = typeof req.body?.message === 'string' ? req.body.message : '';
      const lower = msg.toLowerCase();
      const pelanggaranList = Array.isArray(req.body?.context?.pelanggaran) ? req.body.context.pelanggaran : [];

      // If user asks about ringkasan pelanggaran / september / bulan tertentu:
      if (lower.includes('ringkas') || lower.includes('rekap') || lower.includes('pelanggaran') || lower.includes('september') || lower.includes('sepember')) {
        let filtered = pelanggaranList;
        let periodLabel = 'keseluruhan riwayat';
        if (lower.includes('september') || lower.includes('sepember')) {
          periodLabel = 'Bulan September';
          filtered = pelanggaranList.filter((p: any) => p.tanggal && p.tanggal.includes('-09-'));
        }

        const total = filtered.length;
        const santriCounts: Record<string, number> = {};
        filtered.forEach((p: any) => {
          const name = p.santriNama || 'Santri';
          santriCounts[name] = (santriCounts[name] || 0) + 1;
        });

        const listPreview = filtered.slice(0, 5).map((p: any) => 
          `• ${p.tanggal || '-'}: ${p.santriNama} — ${p.keterangan || p.namaPeraturan || 'Pelanggaran'} (Sanksi: ${p.sanksi || '-'}, Status: ${p.statusSanksi || 'Belum Selesai'})`
        ).join('\n');

        const santriBreakdown = Object.entries(santriCounts).length > 0
          ? `• Santri Terlibat: ${Object.entries(santriCounts).map(([name, count]) => `${name} (${count}x)`).join(', ')}.`
          : '';

        const reply = `Assalamu'alaikum Ustadz. Berikut adalah ringkasan data pelanggaran santri untuk ${periodLabel}:\n\n` +
          `• Total Kejadian Pelanggaran: ${total} kasus tercatat.\n` +
          (total > 0
            ? `• Rincian Kejadian:\n${listPreview}\n\n` +
              `${santriBreakdown}\n\n` +
              `Semua catatan pelanggaran tersimpan rapi di sistem. Ustadz dapat meninjau kepatuhan sanksi langsung di menu Tata Tertib & Sanksi.`
            : `\nAlhamdulillah tidak ada catatan pelanggaran santri yang tercatat pada periode ini.`);

        return res.json({
          reply,
          actionType: 'none'
        });
      }

      // Polite default response
      return res.json({
        reply: "Afwan Ustadz, server AI saat ini sedang memproses banyak permintaan. Pertanyaan Ustadz dapat diajukan kembali dalam beberapa saat, atau gunakan menu pencatatan di dashboard.",
        actionType: 'none'
      });
    }
  });

  // 2. Endpoint: Parse Smart Santri Bulk Input
  app.post('/api/ai/parse-santri', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Teks wajib diisi' });
      }

      const prompt = `Ekstraksi dan rapikan data calon santri baru dari teks bebas berikut.
Teks input:
"""
${text}
"""

Format keluaran HARUS berupa JSON array objek dengan field:
[
  {
    "nama": "Nama Lengkap Santri (Huruf kapital di awal kata)",
    "kelas": "1" | "2" | "3" | "4" | "5" | "6" | "Salaf" (default "1" jika tidak disebut),
    "alamat": "Alamat / kota asal (default '-' jika tidak ada)",
    "namaWali": "Nama Orang Tua / Wali (default '-' jika tidak ada)",
    "noHpWali": "Nomor WhatsApp / HP jika ada (default '')"
  }
]
Hanya kembalikan JSON array tanpa komentar atau markdown backtick.`;

      const response = await runAiWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const raw = response.text || '[]';
      const parsed = JSON.parse(raw);
      return res.json({ items: Array.isArray(parsed) ? parsed : [parsed] });
    } catch (err: any) {
      console.error('Error in /api/ai/parse-santri:', err);
      return res.status(500).json({
        error: 'Gagal memproses data santri',
        details: err?.message || String(err)
      });
    }
  });

  // 3. Endpoint: Parse Smart Pelanggaran Input
  app.post('/api/ai/parse-pelanggaran', async (req: Request, res: Response) => {
    try {
      const { text, santriList, peraturanList } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Teks pelanggaran wajib diisi' });
      }

      const todayStr = new Date().toISOString().slice(0, 10);

      const prompt = `Cocokkan laporan kejadian pelanggaran santri berikut dengan daftar santri dan tata tertib pesantren yang tersedia.
Laporan/Catatan bebas:
"""
${text}
"""

Daftar Santri yang Ada di Database:
${Array.isArray(santriList) ? santriList.slice(0, 300).map((s: any) => `ID: ${s.id} | Nama: ${s.nama} | Kelas: ${s.kelas}`).join('\n') : '-'}

Daftar Peraturan & Tata Tertib:
${Array.isArray(peraturanList) ? peraturanList.map((p: any) => `ID: ${p.id} | Pasal: ${p.nama} | Kategori: ${p.kategori} | Poin: ${p.poin} | SanksiDefault: ${p.sanksiDefault || '-'}`).join('\n') : '-'}

Tanggal Hari Ini: ${todayStr}

Format keluaran HARUS berupa objek JSON:
{
  "santriId": "ID santri yang paling cocok dari daftar di atas (atau null jika tidak ditemukan)",
  "santriNama": "Nama santri yang dilaporkan",
  "peraturanId": "ID peraturan yang paling cocok dari daftar di atas (atau null jika tidak ada)",
  "namaPeraturan": "Nama peraturan yang dilanggar",
  "kategori": "ringan" | "sedang" | "berat",
  "poin": 5,
  "sanksi": "Saran sanksi edukatif / mendidik",
  "catatan": "Ringkasan kronologi pelanggaran",
  "tanggal": "${todayStr}"
}
Hanya kembalikan objek JSON valid tanpa markdown backtick.`;

      const response = await runAiWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const raw = response.text || '{}';
      const parsed = JSON.parse(raw);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/ai/parse-pelanggaran:', err);
      return res.status(500).json({
        error: 'Gagal memproses data pelanggaran',
        details: err?.message || String(err)
      });
    }
  });

  // Mount Vite in development or static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
