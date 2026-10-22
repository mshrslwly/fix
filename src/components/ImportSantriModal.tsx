import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileCode,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  FileText,
  X,
  Code2,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { downloadTemplateSantriExcel, downloadTemplateSantriJs } from '../utils/exportExcel';
import { KelasSantri } from '../types';

interface ImportSantriModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportDone: (items: Array<{ nama: string; kelas?: KelasSantri; alamat: string; namaWali: string; noHpWali?: string }>) => Promise<{ importedCount: number; duplicatesCount: number }>;
}

interface ParsedRow {
  nama: string;
  kelas?: KelasSantri;
  alamat: string;
  namaWali: string;
  noHpWali?: string;
}

const SAMPLE_JS_CODE = `// Data Santri Lama
const dataSantri = [
  { "nama": "Ahmad Fauzi Ramadhan", "kelas": "1", "alamat": "Cirebon, Jawa Barat", "namaWali": "H. Abdullah", "noHpWali": "081234567890" },
  { "nama": "Muhammad Ridwan Kamil", "kelas": "2", "alamat": "Kuningan, Jawa Barat", "namaWali": "Ibu Maryam", "noHpWali": "081987654321" },
  { "nama": "Siti Nurhaliza Azzahra", "kelas": "3", "alamat": "Majalengka, Jawa Barat", "namaWali": "Bpk. Suhendar", "noHpWali": "085712345678" },
  { "nama": "Danial Arkan Hakim", "kelas": "6", "alamat": "Indramayu, Jawa Barat", "namaWali": "Bpk. Drs. Hakim", "noHpWali": "082199887766" },
  { "nama": "Zulfa Naura Salsabila", "kelas": "Salaf", "alamat": "Sumedang, Jawa Barat", "namaWali": "Ibu Hj. Aminah", "noHpWali": "087811223344" }
];

export default dataSantri;`;

export const ImportSantriModal: React.FC<ImportSantriModalProps> = ({
  isOpen,
  onClose,
  onImportDone
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'js' | 'excel'>('js');
  const [uploadedJsFileName, setUploadedJsFileName] = useState<string | null>(null);
  const [uploadedJsFileSize, setUploadedJsFileSize] = useState<string | null>(null);
  const [isJsDragging, setIsJsDragging] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [jsInput, setJsInput] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const jsFileInputRef = useRef<HTMLInputElement | null>(null);

  const resetAll = () => {
    setUploadedJsFileName(null);
    setUploadedJsFileSize(null);
    setJsInput('');
    setParsedData([]);
    setErrorMsg(null);
    setShowCodeEditor(false);
    if (jsFileInputRef.current) {
      jsFileInputRef.current.value = '';
    }
  };

  const parseJsContent = (code: string, fileName?: string) => {
    setErrorMsg(null);
    if (!code || !code.trim()) {
      setParsedData([]);
      return;
    }

    try {
      let rawResult: any = null;

      // 1. Coba eksekusi kode JS dengan fungsi aman
      try {
        let sanitized = code.trim();
        // Bersihkan sintaks export / module.exports agar bisa dievaluasi oleh Function()
        sanitized = sanitized
          .replace(/export\s+default\s+/g, 'return ')
          .replace(/export\s+(const|let|var)\s+/g, '$1 ')
          .replace(/module\.exports\s*=\s*/g, 'return ');

        if (!sanitized.includes('return ')) {
          // Cari variabel yang di-assign
          const varMatch = sanitized.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/);
          if (varMatch && varMatch[1]) {
            sanitized = `${sanitized};\nreturn ${varMatch[1]};`;
          } else {
            const matchArray = sanitized.match(/\[[\s\S]*\]/);
            if (matchArray) {
              sanitized = `return ${matchArray[0]};`;
            } else {
              sanitized = `return ${sanitized};`;
            }
          }
        }

        // eslint-disable-next-line no-new-func
        const fn = new Function(sanitized);
        rawResult = fn();
      } catch (err1) {
        // Fallback: ambil blok array [ ... ]
        try {
          const matchArray = code.match(/\[[\s\S]*\]/);
          if (matchArray) {
            // eslint-disable-next-line no-new-func
            const fn = new Function(`return ${matchArray[0]};`);
            rawResult = fn();
          }
        } catch (err2) {
          // Fallback JSON.parse
          try {
            const matchArray = code.match(/\[[\s\S]*\]/);
            if (matchArray) {
              rawResult = JSON.parse(matchArray[0]);
            }
          } catch (err3) {
            throw new Error('Gagal membaca struktur array dari file .js tersebut. Pastikan file berisi data array santri [...] atau variabel data santri.');
          }
        }
      }

      if (!rawResult) {
        throw new Error('Tidak ditemukan data santri yang dapat diproses di dalam file.');
      }

      // Format data: bisa berupa array langsung atau object bertingkat
      let list: any[] = [];
      if (Array.isArray(rawResult)) {
        list = rawResult;
      } else if (typeof rawResult === 'object') {
        if (Array.isArray(rawResult.santri)) {
          list = rawResult.santri;
        } else if (Array.isArray(rawResult.data)) {
          list = rawResult.data;
        } else if (Array.isArray(rawResult.students)) {
          list = rawResult.students;
        } else if (Array.isArray(rawResult.items)) {
          list = rawResult.items;
        } else {
          const arrProp = Object.values(rawResult).find((v) => Array.isArray(v));
          if (Array.isArray(arrProp)) {
            list = arrProp;
          } else {
            throw new Error('Format di dalam file harus berupa array santri [...] atau objek { santri: [...] }');
          }
        }
      }

      const rows: ParsedRow[] = list
        .map((item: any) => ({
          nama: String(item.nama || item.Nama || item.name || item.namaSantri || item.nama_santri || '').trim(),
          kelas: (item.kelas || item.Kelas || item.tingkat || item.grade || '1').toString() as KelasSantri,
          alamat: String(item.alamat || item.Alamat || item.address || item.domisili || '-').trim(),
          namaWali: String(item.namaWali || item.wali || item.NamaWali || item.orangTua || item.nama_wali || item.waliSantri || '-').trim(),
          noHpWali: String(item.noHpWali || item.hpWali || item.noHp || item.no_hp || item.telepon || item.hp || item.whatsapp || '').trim()
        }))
        .filter((item: ParsedRow) => item.nama.length > 0);

      if (rows.length === 0) {
        throw new Error('Tidak ditemukan data santri yang memiliki kolom "nama"');
      }

      setParsedData(rows);
      showToast(
        `Berhasil membaca ${rows.length} santri${fileName ? ` dari file "${fileName}"` : ''}!`,
        'success'
      );
    } catch (e: any) {
      setErrorMsg('Gagal memproses file JavaScript: ' + (e.message || 'Format tidak valid'));
      setParsedData([]);
    }
  };

  const handleJsFile = (file: File) => {
    if (!file) return;
    setErrorMsg(null);

    setUploadedJsFileName(file.name);
    setUploadedJsFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsInput(content);
      parseJsContent(content, file.name);
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca isi file dari perangkat Anda.');
    };
    reader.readAsText(file);
  };

  const handleJsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleJsFile(file);
    }
  };

  const handleJsDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsJsDragging(true);
  };

  const handleJsDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsJsDragging(false);
  };

  const handleJsDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsJsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleJsFile(file);
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (!data || data.length === 0) {
          throw new Error('File Excel kosong');
        }

        const rows: ParsedRow[] = data
          .map((item: any) => ({
            nama: String(item['Nama Santri'] || item['nama'] || item['Nama'] || '').trim(),
            kelas: (item['Kelas'] || item['kelas'] || '1').toString() as KelasSantri,
            alamat: String(item['Alamat'] || item['alamat'] || '-').trim(),
            namaWali: String(item['Nama Wali'] || item['namaWali'] || item['Wali'] || '-').trim(),
            noHpWali: String(item['No. HP Wali'] || item['noHpWali'] || item['No HP'] || item['HP'] || '').trim()
          }))
          .filter((item: ParsedRow) => item.nama.length > 0);

        setParsedData(rows);
        showToast(`Berhasil membaca ${rows.length} data dari file Excel "${file.name}"`, 'success');
      } catch (err: any) {
        setErrorMsg('Gagal membaca file Excel: ' + (err.message || 'Format tidak didukung'));
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async () => {
    if (parsedData.length === 0) return;

    try {
      setIsSaving(true);
      const res = await onImportDone(parsedData);
      showToast(
        `Sukses mengimpor ${res.importedCount} santri baru!${res.duplicatesCount > 0 ? ` (${res.duplicatesCount} santri duplikat dilewati)` : ''}`,
        'success'
      );
      resetAll();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan data impor', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetAll();
        onClose();
      }}
      title="Impor Data Santri"
      subtitle="Unggah file .js (data lama) atau file Excel secara instan"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Tab Selection */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-[#EFE7DC]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('js');
              resetAll();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'js'
                ? 'bg-white text-[#332A22] shadow-sm'
                : 'text-[#7B6A5B] hover:text-[#332A22]'
            }`}
          >
            <FileCode className="w-4 h-4 text-[#5F8F6B]" />
            <span>Unggah File .JS (Data Lama)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('excel');
              resetAll();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'excel'
                ? 'bg-white text-[#332A22] shadow-sm'
                : 'text-[#7B6A5B] hover:text-[#332A22]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#5F8F6B]" />
            <span>File Excel / Spreadsheet</span>
          </button>
        </div>

        {/* Tab JS Form: UPLOAD .JS FILE (Bukan sekadar ketik kode) */}
        {activeTab === 'js' && (
          <div className="space-y-3">
            {/* Area Unggah File .JS (Drag & Drop / Tombol Pilih File) */}
            {!uploadedJsFileName ? (
              <div
                onDragOver={handleJsDragOver}
                onDragLeave={handleJsDragLeave}
                onDrop={handleJsDrop}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center ${
                  isJsDragging
                    ? 'border-[#5F8F6B] bg-[#5F8F6B]/10 scale-[1.01]'
                    : 'border-[#D9B99B] bg-[#FAF5EE] hover:bg-[#FAF3EA]'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#5F8F6B]/15 text-[#5F8F6B] flex items-center justify-center mb-3 shadow-inner">
                  <FileCode className="w-8 h-8" />
                </div>

                <p className="text-sm font-bold text-[#3E3024]">
                  Unggah File JavaScript (.js)
                </p>
                <p className="text-xs text-[#7F6E5E] mt-1 max-w-md leading-relaxed">
                  Tarik & letakkan file <strong>.js</strong> data lama Anda ke sini, atau klik tombol di bawah untuk memilih file dari perangkat.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <label className="clay-btn clay-btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md">
                    <Upload className="w-4 h-4" />
                    <span>Pilih File .js</span>
                    <input
                      ref={jsFileInputRef}
                      type="file"
                      accept=".js,.mjs,.ts,.txt,.json"
                      onChange={handleJsFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setJsInput(SAMPLE_JS_CODE);
                      setUploadedJsFileName('contoh_data_santri_demo.js');
                      setUploadedJsFileSize('1.2 KB');
                      parseJsContent(SAMPLE_JS_CODE, 'contoh_data_santri_demo.js');
                    }}
                    className="clay-btn clay-btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#5F8F6B]" />
                    <span>Uji Coba Data Contoh</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8D5C4]/70 w-full flex items-center justify-center gap-1">
                  <span className="text-[11px] text-[#8C7A6B]">
                    Belum punya formatnya?
                  </span>
                  <button
                    type="button"
                    onClick={downloadTemplateSantriJs}
                    className="text-[11px] text-[#5F8F6B] hover:text-[#457050] font-bold inline-flex items-center gap-1 cursor-pointer underline underline-offset-2 ml-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Unduh Contoh Template File .js</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Kartu Informasi File .JS yang Telah Dipilih */
              <div className="p-4 rounded-2xl bg-white border border-[#5F8F6B]/30 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#5F8F6B]/15 text-[#5F8F6B] flex items-center justify-center shrink-0">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2E251E] break-all">
                          {uploadedJsFileName}
                        </span>
                        {uploadedJsFileSize && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF3EA] text-[#7F6E5E] font-mono border border-[#E8D5C4]">
                            {uploadedJsFileSize}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5F8F6B] font-medium mt-0.5 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>File berhasil dimuat & siap diimpor</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="px-2.5 py-1.5 text-xs font-bold text-[#5F8F6B] hover:bg-[#5F8F6B]/10 rounded-lg cursor-pointer transition-colors">
                      <span>Ganti File</span>
                      <input
                        ref={jsFileInputRef}
                        type="file"
                        accept=".js,.mjs,.ts,.txt,.json"
                        onChange={handleJsFileChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={resetAll}
                      className="p-1.5 text-[#8C7A6B] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      title="Hapus file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Toggle Lihat / Edit Kode JS dari File (Opsional) */}
                <div className="pt-2 border-t border-[#E8D5C4]/50">
                  <button
                    type="button"
                    onClick={() => setShowCodeEditor(!showCodeEditor)}
                    className="text-xs text-[#7F6E5E] hover:text-[#3E3024] font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{showCodeEditor ? 'Sembunyikan' : 'Lihat / Edit'} Kode dari File</span>
                    {showCodeEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showCodeEditor && (
                    <div className="mt-2 space-y-1.5">
                      <textarea
                        rows={6}
                        value={jsInput}
                        onChange={(e) => {
                          setJsInput(e.target.value);
                          parseJsContent(e.target.value, uploadedJsFileName || 'editor');
                        }}
                        className="w-full p-2.5 font-mono text-xs rounded-xl bg-[#FBF7F0] border border-[#E8D5C4] text-[#2C241E] focus:outline-none focus:ring-2 focus:ring-[#5F8F6B] leading-relaxed resize-y"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Excel Form */}
        {activeTab === 'excel' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border-2 border-dashed border-[#D9B99B] bg-[#FAF5EE] text-center flex flex-col items-center justify-center">
              <Upload className="w-9 h-9 text-[#5F8F6B] mb-2" />
              <p className="text-sm font-bold text-[#45382D]">
                Pilih atau seret file Excel (.xlsx / .csv)
              </p>
              <p className="text-xs text-[#8A7969] mt-1 mb-4">
                Kolom: <code>Nama Santri</code>, <code>Kelas</code>, <code>Alamat</code>, <code>Nama Wali</code>, <code>No. HP Wali</code>
              </p>
              <label className="clay-btn clay-btn-primary py-2.5 px-5 text-xs font-bold cursor-pointer">
                <span>Pilih File Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={downloadTemplateSantriExcel}
                className="text-xs text-[#5F8F6B] hover:text-[#457050] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Contoh Template Excel</span>
              </button>
            </div>
          </div>
        )}

        {/* Pesan Error jika Ada */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-red-800">Perhatian format file:</p>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Preview Section Hasil Parse */}
        {parsedData.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-[#E8D5C4]/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4B3D30] flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#5F8F6B]" />
                Pratinjau Data ({parsedData.length} Santri Terbaca):
              </span>
              <span className="text-[11px] text-[#7E6C5C]">
                Kode akses & kartu wali otomatis dibuat
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto rounded-xl border border-[#E8D5C4] text-xs shadow-inner">
              <table className="w-full text-left">
                <thead className="bg-[#EFE7DC] sticky top-0 text-[#473B2F] z-10">
                  <tr>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Nama Santri</th>
                    <th className="py-2 px-3">Kelas</th>
                    <th className="py-2 px-3">Alamat</th>
                    <th className="py-2 px-3">Nama Wali</th>
                    <th className="py-2 px-3">No HP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DC] bg-white">
                  {parsedData.map((row, i) => (
                    <tr key={i} className="hover:bg-[#FAF3EA]/50">
                      <td className="py-2 px-3 font-mono text-[11px] text-gray-500">{i + 1}</td>
                      <td className="py-2 px-3 font-bold text-[#2C241D]">{row.nama}</td>
                      <td className="py-2 px-3 font-bold text-[#5F8F6B]">
                        {row.kelas === 'Salaf' ? 'Salaf' : `Kelas ${row.kelas || '1'}`}
                      </td>
                      <td className="py-2 px-3 text-[#5A4C3F]">{row.alamat}</td>
                      <td className="py-2 px-3 text-[#5A4C3F]">{row.namaWali}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#5A4C3F]">{row.noHpWali || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={resetAll}
                className="px-4 py-2 text-xs font-bold text-[#7A6A5B] hover:bg-black/5 rounded-xl cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="submit"
                disabled={isSaving}
                onClick={handleSave}
                className="clay-btn clay-btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : `Simpan ${parsedData.length} Santri ke Database`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
