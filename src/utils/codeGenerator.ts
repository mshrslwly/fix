/**
 * Generator Kode Akses Wali Santri
 * Menghasilkan 10 karakter huruf besar + angka unik.
 * Menghindari karakter ambigu seperti O, 0, I, 1, L.
 */
const ALLOWED_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateKodeAkses(): string {
  let result = '';
  const length = 10;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    result += ALLOWED_CHARS[randomIndex];
  }
  return result;
}

export function isValidKodeAkses(code: string): boolean {
  if (!code || code.trim().length !== 10) return false;
  const clean = code.trim().toUpperCase();
  for (const ch of clean) {
    if (!ALLOWED_CHARS.includes(ch)) return false;
  }
  return true;
}
