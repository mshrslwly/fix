import * as XLSX from 'xlsx';
import { Santri, Perizinan, Pelanggaran, Peraturan } from '../types';
import { formatDateDMY } from './date';

export function exportSantriToExcel(santriList: Santri[], currentOrigin?: string) {
  const origin = currentOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  const data = santriList.map((s, idx) => ({
    'No': idx + 1,
    'Nama Santri': s.nama,
    'Kelas': s.kelas === 'Salaf' ? 'Salaf' : `Kelas ${s.kelas}`,
    'Alamat': s.alamat,
    'Nama Wali': s.namaWali,
    'No. HP Wali': s.noHpWali || '-',
    'Kode Akses': s.kodeAkses,
    'Link Portal Wali': `${origin}/?k=${s.kodeAkses}`
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Santri');
  XLSX.writeFile(workbook, `Data_Santri_SiPontren_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportPerizinanToExcel(
  list: Perizinan[],
  santriMap: Map<string, Santri>
) {
  const data = list.map((p, idx) => {
    const santri = santriMap.get(p.santriId);
    return {
      'No': idx + 1,
      'Nama Santri': p.santriNama || santri?.nama || 'Santri',
      'Kelas': santri?.kelas ? (santri.kelas === 'Salaf' ? 'Salaf' : `Kelas ${santri.kelas}`) : '-',
      'Jenis Izin': p.jenis.toUpperCase(),
      'Tanggal Mulai': formatDateDMY(p.tanggalMulai),
      'Tanggal Selesai': formatDateDMY(p.tanggalSelesai),
      'Alasan': p.alasan,
      'Catatan Tambahan': p.catatanTambahan || '-',
      'Status': p.status.toUpperCase()
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Perizinan');
  XLSX.writeFile(workbook, `Data_Perizinan_SiPontren_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportPelanggaranToExcel(
  list: Pelanggaran[],
  santriMap: Map<string, Santri>,
  peraturanMap: Map<string, Peraturan>
) {
  const data = list.map((item, idx) => {
    const s = santriMap.get(item.santriId);
    const per = peraturanMap.get(item.peraturanId);
    return {
      'No': idx + 1,
      'Nama Santri': item.santriNama || s?.nama || '-',
      'Kelas': s?.kelas ? (s.kelas === 'Salaf' ? 'Salaf' : `Kelas ${s.kelas}`) : '-',
      'Tanggal': formatDateDMY(item.tanggal),
      'Tata Tertib': per ? `${per.kode} - ${per.nama}` : '-',
      'Keterangan Pelanggaran': item.keterangan,
      'Bentuk Sanksi': item.sanksi || per?.sanksi || 'Teguran',
      'Status Sanksi': item.statusSanksi.toUpperCase()
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pelanggaran');
  XLSX.writeFile(workbook, `Data_Pelanggaran_SiPontren_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportPeraturanToExcel(list: Peraturan[]) {
  const data = list.map((p, idx) => ({
    'No': idx + 1,
    'Kode': p.kode,
    'Nama Tata Tertib': p.nama,
    'Sanksi yang Dikenakan': p.sanksi,
    'Kategori': p.kategori,
    'Keterangan': p.keterangan
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tata Tertib');
  XLSX.writeFile(wb, `Tata_Tertib_SiPontren_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadTemplateSantriExcel() {
  const template = [
    {
      'Nama Santri': 'Ahmad Fauzi',
      'Kelas': '1',
      'Alamat': 'Cirebon, Jawa Barat',
      'Nama Wali': 'H. Abdullah',
      'No. HP Wali': '081234567890'
    },
    {
      'Nama Santri': 'Muhammad Ridwan',
      'Kelas': '2',
      'Alamat': 'Kuningan, Jawa Barat',
      'Nama Wali': 'Ibu Maryam',
      'No. HP Wali': '081987654321'
    },
    {
      'Nama Santri': 'Siti Nurhaliza',
      'Kelas': 'Salaf',
      'Alamat': 'Majalengka, Jawa Barat',
      'Nama Wali': 'Bpk. Suhendar',
      'No. HP Wali': '085712345678'
    }
  ];
  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Santri');
  XLSX.writeFile(wb, 'Template_Impor_Santri_SiPontren.xlsx');
}

export function downloadTemplateSantriJs() {
  const content = `/**
 * Template File Data Santri (.js) untuk Aplikasi SiPontren
 * 
 * Anda dapat mengunggah file ini langsung ke aplikasi SiPontren
 * melalui menu "Impor Data Santri" -> "Unggah File .js".
 */
const dataSantri = [
  {
    nama: "Ahmad Fauzi Ramadhan",
    kelas: "1",
    alamat: "Cirebon, Jawa Barat",
    namaWali: "H. Abdullah",
    noHpWali: "081234567890"
  },
  {
    nama: "Muhammad Ridwan Kamil",
    kelas: "2",
    alamat: "Kuningan, Jawa Barat",
    namaWali: "Ibu Maryam",
    noHpWali: "081987654321"
  },
  {
    nama: "Siti Nurhaliza Azzahra",
    kelas: "3",
    alamat: "Majalengka, Jawa Barat",
    namaWali: "Bpk. Suhendar",
    noHpWali: "085712345678"
  },
  {
    nama: "Danial Arkan Hakim",
    kelas: "6",
    alamat: "Indramayu, Jawa Barat",
    namaWali: "Bpk. Drs. Hakim",
    noHpWali: "082199887766"
  },
  {
    nama: "Zulfa Naura Salsabila",
    kelas: "Salaf",
    alamat: "Sumedang, Jawa Barat",
    namaWali: "Ibu Hj. Aminah",
    noHpWali: "087811223344"
  }
];

// Opsi ekspor modul (opsional, keduanya didukung):
// export default dataSantri;
// module.exports = dataSantri;
`;

  const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contoh_data_santri_lama.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
