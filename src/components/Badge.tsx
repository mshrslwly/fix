import React from 'react';
import { StatusSanksi, StatusPerizinan, JenisPerizinan, KelasSantri } from '../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'selesai' | 'diajukan' | 'disetujui' | 'ditolak' | 'neutral' | 'info' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-xs px-3 py-1 font-bold';

  const variantStyles: Record<string, string> = {
    selesai: 'bg-[#5F8F6B]/20 text-[#245232] border border-[#5F8F6B]/40',
    disetujui: 'bg-[#5F8F6B]/20 text-[#245232] border border-[#5F8F6B]/40',
    diajukan: 'bg-[#E8D5C4] text-[#5C4534] border border-[#D9B99B]',
    ditolak: 'bg-[#D98E75]/25 text-[#991B1B] border border-[#D98E75]/50',
    warning: 'bg-[#F6B98A]/35 text-[#8A450D] border border-[#F6B98A]',
    danger: 'bg-[#D98E75]/25 text-[#8C2E17] border border-[#D98E75]',
    neutral: 'bg-[#EFE7DC] text-[#4A423A] border border-[#DDD0C1]',
    info: 'bg-[#6FA8DC]/20 text-[#184673] border border-[#6FA8DC]/50'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses} ${variantStyles[variant] || variantStyles.neutral} transition-colors ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
      {children}
    </span>
  );
};

export const KelasBadge: React.FC<{ kelas: KelasSantri; size?: 'sm' | 'md' }> = ({ kelas, size = 'sm' }) => {
  return (
    <span className={`inline-flex items-center font-extrabold rounded-xl px-2 py-0.5 bg-[#5F8F6B]/15 text-[#386144] border border-[#5F8F6B]/30 ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}>
      Kelas {kelas}
    </span>
  );
};

export const StatusSanksiBadge: React.FC<{ status: StatusSanksi; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const map: Record<StatusSanksi, { label: string; variant: 'danger' | 'warning' | 'selesai' }> = {
    belum: { label: 'Belum Dilaksanakan', variant: 'danger' },
    sedang: { label: 'Sedang Dijalani', variant: 'warning' },
    selesai: { label: 'Selesai', variant: 'selesai' }
  };
  const item = map[status];
  return <Badge variant={item.variant} size={size}>{item.label}</Badge>;
};

export const StatusPerizinanBadge: React.FC<{ status: StatusPerizinan; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const map: Record<StatusPerizinan, { label: string; variant: 'diajukan' | 'disetujui' | 'ditolak' | 'selesai' }> = {
    diajukan: { label: 'Diajukan', variant: 'diajukan' },
    disetujui: { label: 'Disetujui', variant: 'disetujui' },
    ditolak: { label: 'Ditolak', variant: 'ditolak' },
    selesai: { label: 'Selesai / Kembali', variant: 'selesai' }
  };
  const item = map[status];
  return <Badge variant={item.variant} size={size}>{item.label}</Badge>;
};

export const JenisPerizinanBadge: React.FC<{ jenis: JenisPerizinan; size?: 'sm' | 'md' }> = ({ jenis, size = 'md' }) => {
  const map: Record<JenisPerizinan, { label: string; variant: 'info' | 'neutral' | 'warning' | 'diajukan' }> = {
    pulang: { label: 'Izin Pulang', variant: 'info' },
    keluar: { label: 'Keluar Sebentar', variant: 'neutral' },
    sakit: { label: 'Izin Sakit', variant: 'warning' },
    lainnya: { label: 'Lainnya', variant: 'diajukan' }
  };
  const item = map[jenis] || { label: jenis, variant: 'neutral' };
  return <Badge variant={item.variant} size={size}>{item.label}</Badge>;
};
