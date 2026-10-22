export type KelasSantri = '1' | '2' | '3' | '4' | '5' | '6' | 'Salaf';
export type StatusSanksi = 'belum' | 'sedang' | 'selesai';
export type JenisPerizinan = 'pulang' | 'keluar' | 'sakit' | 'lainnya';
export type StatusPerizinan = 'diajukan' | 'disetujui' | 'ditolak' | 'selesai';

export interface Santri {
  id: string;
  nama: string;
  kelas: KelasSantri;
  alamat: string;
  namaWali: string;
  noHpWali?: string;
  kodeAkses: string; // 10 karakter acak unik
  createdAt: string;
  updatedAt: string;
}

export interface Peraturan {
  id: string;
  kode: string;
  nama: string;
  sanksi: string; // Bentuk sanksi langsung (contoh: "Gundul", "Baca Al-Qur'an 1 Juz")
  kategori: string;
  keterangan: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pelanggaran {
  id: string;
  santriId: string;
  santriNama: string; // Nama santri
  peraturanId: string;
  tanggal: string; // YYYY-MM-DD
  keterangan: string;
  sanksi: string; // Sanksi yang dikenakan
  statusSanksi: StatusSanksi;
  sanksiCompletedItems?: string[]; // Daftar butir sanksi yang telah dicentang permanen
  createdAt: string;
  updatedAt: string;
}

export interface Perizinan {
  id: string;
  santriId: string;
  santriNama?: string;
  jenis: JenisPerizinan;
  tanggalMulai: string;
  tanggalSelesai: string;
  alasan: string;
  catatanTambahan?: string; // Catatan izin tambahan / perpanjangan bukti pulang
  status: StatusPerizinan;
  createdAt: string;
  updatedAt: string;
}

export interface PortalWaliPelanggaranItem {
  id: string;
  peraturanKode: string;
  peraturanNama: string;
  kategori: string;
  tanggal: string;
  keterangan: string;
  sanksi: string;
  statusSanksi: StatusSanksi;
  sanksiCompletedItems?: string[];
}

export interface PortalWaliPerizinanItem {
  id: string;
  jenis: JenisPerizinan;
  tanggalMulai: string;
  tanggalSelesai: string;
  alasan: string;
  catatanTambahan?: string;
  status: StatusPerizinan;
}

export interface PortalWaliData {
  kodeAkses: string;
  santriId: string;
  nama: string;
  kelas: KelasSantri;
  alamat: string;
  namaWali: string;
  noHpWali?: string;
  perizinan: PortalWaliPerizinanItem[];
  pelanggaran: PortalWaliPelanggaranItem[];
  updatedAt: string;
}

export interface UserAdmin {
  uid: string;
  email: string;
  displayName?: string;
}
