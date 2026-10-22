import { Santri, Peraturan, Pelanggaran, Perizinan, PortalWaliData } from '../types';

export const INITIAL_PERATURAN: Peraturan[] = [
  {
    id: 'per-001',
    kode: 'TAT-01',
    nama: 'Kabur / Keluar Pesantren Tanpa Izin Bagian Keamanan',
    sanksi: 'Gundul & Piket Selasar 3 Hari',
    kategori: 'Ketertiban',
    keterangan: 'Meninggalkan area pondok tanpa izin resmi.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'per-002',
    kode: 'TAT-02',
    nama: 'Membawa HP / Elektronik Tanpa Izin Pengurus',
    sanksi: 'Penyitaan HP Sampai Liburan & Hafalan Surat Al-Waqi\'ah',
    kategori: 'Ketertiban',
    keterangan: 'Menyimpan gawai di lemari atau asrama santri.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'per-003',
    kode: 'TAT-03',
    nama: 'Terlambat / Masbuk Shalat Berjamaah di Masjid',
    sanksi: 'Tadarus Al-Qur\'an 1 Juz di Serambi Masjid',
    kategori: 'Ibadah',
    keterangan: 'Tidak hadir takbiratul ihram bersama imam.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'per-004',
    kode: 'TAT-04',
    nama: 'Terlambat Masuk Jam Masuk Asrama / Halaqah',
    sanksi: 'Membersihkan Tempat Wudhu & Selasar Masjid',
    kategori: 'Kedisiplinan',
    keterangan: 'Terlambat lebih dari 10 menit tanpa alasan udzur syar\'i.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'per-005',
    kode: 'TAT-05',
    nama: 'Merokok atau Membawa Rokok / Vape',
    sanksi: 'Piket Dapur 3 Hari & Surat Peringatan Tertulis',
    kategori: 'Akhlak',
    keterangan: 'Menghisap rokok/vape di lingkungan pondok.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'per-006',
    kode: 'TAT-06',
    nama: 'Perkelahian Antar Santri',
    sanksi: 'Pemanggilan Wali Santri & Takzir Berdiri',
    kategori: 'Akhlak',
    keterangan: 'Tindakan kekerasan fisik atau perkelahian.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z'
  }
];

export const INITIAL_SANTRI: Santri[] = [
  {
    id: 'san-101',
    nama: 'Muhammad Al-Fatih Pratama',
    kelas: '1',
    alamat: 'Cirebon, Jawa Barat',
    namaWali: 'Bpk. H. Rahmat Pratama',
    noHpWali: '081234567890',
    kodeAkses: 'K7N4M9X2WP',
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-10-10T09:00:00Z'
  },
  {
    id: 'san-102',
    nama: 'Ahmad Zaki Mubarak',
    kelas: '2',
    alamat: 'Kuningan, Jawa Barat',
    namaWali: 'Ibu Hj. Siti Maryam',
    noHpWali: '081398765432',
    kodeAkses: 'B3H6Y8D4VT',
    createdAt: '2026-08-15T10:30:00Z',
    updatedAt: '2026-10-11T14:00:00Z'
  },
  {
    id: 'san-103',
    nama: 'Fathir Azzam Robbani',
    kelas: '3',
    alamat: 'Majalengka, Jawa Barat',
    namaWali: 'Bpk. Ust. Ahmad Munawir',
    noHpWali: '085712344321',
    kodeAkses: 'R9E2Q7C5GA',
    createdAt: '2026-08-16T09:00:00Z',
    updatedAt: '2026-10-09T11:00:00Z'
  },
  {
    id: 'san-104',
    nama: 'Bilal Habibi Syahril',
    kelas: '4',
    alamat: 'Indramayu, Jawa Barat',
    namaWali: 'Bpk. Syahril Efendi',
    noHpWali: '082165437890',
    kodeAkses: 'W4T8M2P6LK',
    createdAt: '2026-08-16T11:00:00Z',
    updatedAt: '2026-10-08T15:00:00Z'
  },
  {
    id: 'san-105',
    nama: 'Salman Farisi Nurhuda',
    kelas: '5',
    alamat: 'Tasikmalaya, Jawa Barat',
    namaWali: 'Bpk. H. Nurhuda S.Ag',
    noHpWali: '087855443322',
    kodeAkses: 'F5J9X3B7NA',
    createdAt: '2026-08-17T08:00:00Z',
    updatedAt: '2026-10-12T08:00:00Z'
  },
  {
    id: 'san-106',
    nama: 'Ihsan Maulana Yusuf',
    kelas: '6',
    alamat: 'Brebes, Jawa Tengah',
    namaWali: 'Bpk. H. Yusuf Mansur',
    noHpWali: '081299887766',
    kodeAkses: 'X4H7M3Q9TR',
    createdAt: '2026-08-17T09:00:00Z',
    updatedAt: '2026-10-12T08:00:00Z'
  },
  {
    id: 'san-107',
    nama: 'Habibullah Al-Banjari',
    kelas: 'Salaf',
    alamat: 'Banjarmasin, Kalsel',
    namaWali: 'KH. Abdurrahman',
    noHpWali: '085244332211',
    kodeAkses: 'J8P2W5N7KY',
    createdAt: '2026-08-18T09:00:00Z',
    updatedAt: '2026-10-12T08:00:00Z'
  }
];

export const INITIAL_PERIZINAN: Perizinan[] = [];

export const INITIAL_PELANGGARAN: Pelanggaran[] = [];

export function buildPortalSnapshot(
  santri: Santri,
  allPerizinan: Perizinan[],
  allPelanggaran: Pelanggaran[],
  allPeraturan: Peraturan[]
): PortalWaliData {
  const santriPerizinan = allPerizinan
    .filter(p => p.santriId === santri.id)
    .sort((a, b) => new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime())
    .map(p => ({
      id: p.id,
      jenis: p.jenis,
      tanggalMulai: p.tanggalMulai,
      tanggalSelesai: p.tanggalSelesai,
      alasan: p.alasan,
      catatanTambahan: p.catatanTambahan || '',
      status: p.status
    }));

  const santriPelanggaran = allPelanggaran
    .filter(p => p.santriId === santri.id)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .map(p => {
      const per = allPeraturan.find(item => item.id === p.peraturanId);
      return {
        id: p.id,
        peraturanKode: per?.kode || 'TAT',
        peraturanNama: per?.nama || 'Pelanggaran Tata Tertib',
        kategori: per?.kategori || 'Ketertiban',
        tanggal: p.tanggal,
        keterangan: p.keterangan,
        sanksi: p.sanksi || per?.sanksi || 'Teguran & Pembinaan',
        statusSanksi: p.statusSanksi,
        sanksiCompletedItems: p.sanksiCompletedItems || []
      };
    });

  return {
    kodeAkses: santri.kodeAkses,
    santriId: santri.id,
    nama: santri.nama,
    kelas: santri.kelas,
    alamat: santri.alamat,
    namaWali: santri.namaWali,
    noHpWali: santri.noHpWali,
    perizinan: santriPerizinan,
    pelanggaran: santriPelanggaran,
    updatedAt: new Date().toISOString()
  };
}
