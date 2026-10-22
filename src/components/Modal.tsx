import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[#FFFFFF] dark:bg-[#25211D] rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(70,50,30,0.25)] border border-[#E8D5C4]/60 dark:border-[#3E362F] z-10 my-8 max-h-[90vh] flex flex-col animate-scale-up`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E8D5C4]/40 dark:border-[#38312B] shrink-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-heading text-[#352D26] dark:text-[#F3EBE1]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-[#7D6E60] dark:text-[#AFA193] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#F5EDE4] dark:bg-[#342D27] text-[#6A5B4F] dark:text-[#D9B99B] hover:bg-[#E8D5C4] transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="pt-4 overflow-y-auto pr-1 grow">
          {children}
        </div>
      </div>
    </div>
  );
};
