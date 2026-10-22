import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Santri, Perizinan, Pelanggaran, Peraturan } from '../types';
import { formatDateDMY } from './date';

export function exportSantriToPdf(santriList: Santri[], currentOrigin?: string) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setTextColor(95, 143, 107);
  doc.text('SiPontren - Data Santri', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Dicetak pada: ${formatDateDMY(new Date())} | Total: ${santriList.length} Santri`, 14, 25);

  const head = [['No', 'Nama Santri', 'Kelas', 'Alamat', 'Nama Wali', 'No. HP', 'Kode Akses']];
  const body = santriList.map((s, idx) => [
    idx + 1,
    s.nama,
    s.kelas === 'Salaf' ? 'Salaf' : `Kelas ${s.kelas}`,
    s.alamat,
    s.namaWali,
    s.noHpWali || '-',
    s.kodeAkses
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 30,
    headStyles: { fillColor: [95, 143, 107], textColor: 255 },
    alternateRowStyles: { fillColor: [251, 245, 234] },
    styles: { fontSize: 8 }
  });

  doc.save(`Data_Santri_SiPontren_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportPerizinanToPdf(list: Perizinan[], santriMap: Map<string, Santri>) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(95, 143, 107);
  doc.text('SiPontren - Rekap Perizinan Santri', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Dicetak pada: ${formatDateDMY(new Date())} | Total: ${list.length} Catatan`, 14, 25);

  const head = [['No', 'Nama Santri', 'Jenis', 'Mulai', 'Selesai', 'Alasan', 'Catatan Tambahan', 'Status']];
  const body = list.map((p, idx) => {
    const s = santriMap.get(p.santriId);
    return [
      idx + 1,
      p.santriNama || s?.nama || '-',
      p.jenis.toUpperCase(),
      formatDateDMY(p.tanggalMulai),
      formatDateDMY(p.tanggalSelesai),
      p.alasan,
      p.catatanTambahan || '-',
      p.status.toUpperCase()
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 30,
    headStyles: { fillColor: [95, 143, 107], textColor: 255 },
    alternateRowStyles: { fillColor: [251, 245, 234] },
    styles: { fontSize: 8 }
  });

  doc.save(`Data_Perizinan_SiPontren_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportPelanggaranToPdf(
  list: Pelanggaran[],
  santriMap: Map<string, Santri>,
  peraturanMap: Map<string, Peraturan>
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(95, 143, 107);
  doc.text('SiPontren - Buku Catatan Pelanggaran Santri', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Dicetak pada: ${formatDateDMY(new Date())} | Total: ${list.length} Pelanggaran`, 14, 25);

  const head = [['No', 'Tanggal', 'Nama Santri', 'Tata Tertib', 'Bentuk Sanksi', 'Status']];
  const body = list.map((item, idx) => {
    const s = santriMap.get(item.santriId);
    const per = peraturanMap.get(item.peraturanId);
    return [
      idx + 1,
      formatDateDMY(item.tanggal),
      item.santriNama || s?.nama || '-',
      per ? `${per.kode} - ${per.nama}` : '-',
      item.sanksi || per?.sanksi || 'Teguran',
      item.statusSanksi.toUpperCase()
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 30,
    headStyles: { fillColor: [95, 143, 107], textColor: 255 },
    alternateRowStyles: { fillColor: [251, 245, 234] },
    styles: { fontSize: 8 }
  });

  doc.save(`Catatan_Pelanggaran_SiPontren_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportPeraturanToPdf(list: Peraturan[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(95, 143, 107);
  doc.text('SiPontren - Buku Tata Tertib & Sanksi', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Dicetak pada: ${formatDateDMY(new Date())} | Total: ${list.length} Aturan`, 14, 25);

  const head = [['No', 'Kode', 'Tata Tertib', 'Sanksi yang Dikenakan', 'Kategori', 'Keterangan']];
  const body = list.map((p, idx) => [
    idx + 1,
    p.kode,
    p.nama,
    p.sanksi,
    p.kategori,
    p.keterangan || '-'
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 30,
    headStyles: { fillColor: [95, 143, 107], textColor: 255 },
    alternateRowStyles: { fillColor: [251, 245, 234] },
    styles: { fontSize: 8 }
  });

  doc.save(`Buku_Tata_Tertib_SiPontren_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportSemuaKartuAksesPdf(santriList: Santri[], currentOrigin?: string) {
  const origin = currentOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const cardsPerPage = 8;
  const cardW = 90;
  const cardH = 65;
  const startX = 10;
  const startY = 12;
  const gapX = 10;
  const gapY = 5;

  for (let i = 0; i < santriList.length; i++) {
    const cardIndexInPage = i % cardsPerPage;

    if (i > 0 && cardIndexInPage === 0) {
      doc.addPage();
    }

    const col = cardIndexInPage % 2;
    const row = Math.floor(cardIndexInPage / 2);

    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    const santri = santriList[i];
    const linkWali = `${origin}/?k=${santri.kodeAkses}`;

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(linkWali, {
        margin: 1,
        width: 140,
        color: {
          dark: '#3F6B4D',
          light: '#FFFFFF'
        }
      });
    } catch (e) {
      console.error('Failed to generate QR for card:', e);
    }

    // Outer Card Border
    doc.setDrawColor(217, 185, 155);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'S');

    // Header bar
    doc.setFillColor(95, 143, 107);
    doc.roundedRect(x, y, cardW, 9, 3, 3, 'F');
    doc.rect(x, y + 6, cardW, 3, 'F');

    // Header Title
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('KARTU AKSES WALI SANTRI', x + 5, y + 6);
    doc.setFontSize(7);
    const kelasStr = santri.kelas === 'Salaf' ? 'Salaf' : `Kls ${santri.kelas}`;
    doc.text(kelasStr, x + cardW - 14, y + 6);

    // QR Code on right side
    if (qrDataUrl) {
      const qrSize = 25;
      doc.addImage(qrDataUrl, 'PNG', x + cardW - qrSize - 4, y + 13, qrSize, qrSize);
    }

    // Content Text
    doc.setTextColor(50, 45, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const displayName = santri.nama.length > 22 ? santri.nama.substring(0, 20) + '...' : santri.nama;
    doc.text(displayName, x + 4, y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 90, 80);
    doc.text(`Wali: ${santri.namaWali}`, x + 4, y + 21);
    doc.text(`Alamat: ${santri.alamat.length > 25 ? santri.alamat.substring(0, 23) + '..' : santri.alamat}`, x + 4, y + 25);

    // Kode Akses Box
    doc.setFillColor(245, 237, 228);
    doc.roundedRect(x + 4, y + 29, 54, 11, 2, 2, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 100, 90);
    doc.text('KODE AKSES PRIBADI:', x + 6, y + 33);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(63, 107, 77);
    doc.text(santri.kodeAkses, x + 6, y + 38);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(120, 110, 100);
    doc.text('• Pindai QR kamera HP atau buka tautan pribadi', x + 4, y + 46);
    doc.text('• Akses langsung tanpa kata sandi / ketik kode', x + 4, y + 50);
    doc.text('• Informasi kehadiran, izin, & takzir disiplin', x + 4, y + 54);

    doc.setDrawColor(200, 190, 180);
    doc.setLineDashPattern([1, 2], 0);
    doc.line(x + 4, y + 57, x + cardW - 4, y + 57);
    doc.setLineDashPattern([], 0);

    doc.setFontSize(5.5);
    doc.setTextColor(140, 130, 120);
    doc.text(`Tautan: ${linkWali.length > 48 ? linkWali.substring(0, 46) + '..' : linkWali}`, x + 4, y + 61);
  }

  doc.save(`Semua_Kartu_Akses_Santri_SiPontren_${new Date().toISOString().slice(0, 10)}.pdf`);
}
