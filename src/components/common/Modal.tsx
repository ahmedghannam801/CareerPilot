import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SIZE_MAP: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
  full: 'max-w-full',
};

function useModalKeyboard(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);
}

function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const originalBody = document.body.style.overflow;
    const originalHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalBody;
      document.documentElement.style.overflow = originalHtml;
    };
  }, [active]);
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  preventBackdropClose?: boolean;
  children: React.ReactNode;
  panelClass?: string;
  dir?: 'rtl' | 'ltr';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  footer,
  size = 'lg',
  preventBackdropClose = false,
  children,
  panelClass = '',
  dir,
  showCloseButton = true,
}) => {
  useModalKeyboard(isOpen, onClose);
  useLockBodyScroll(isOpen);
  const panelRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={preventBackdropClose ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        dir={dir}
        onClick={(e) => e.stopPropagation()}
        className={[
          'relative bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#374151]',
          'w-full',
          SIZE_MAP[size] ?? SIZE_MAP.lg,
          'max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)]',
          'flex flex-col overflow-hidden',
          'animate-in zoom-in-95 duration-150',
          panelClass,
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 p-4 sm:p-5 border-b border-slate-100 dark:border-[#1F2937] shrink-0">
            {title && (
              <div className="min-w-0 flex-1">
                {typeof title === 'string' ? (
                  <h2 className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9] truncate">{title}</h2>
                ) : (
                  title
                )}
              </div>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-slate-100 dark:border-[#1F2937] p-4 sm:p-5 bg-slate-50/70 dark:bg-[#1E293B]/70">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  preventBackdropClose?: boolean;
  children: React.ReactNode;
  dir?: 'rtl' | 'ltr';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  side = 'right',
  title,
  footer,
  width = 'max-w-xl',
  preventBackdropClose = false,
  children,
  dir,
}) => {
  useModalKeyboard(isOpen, onClose);
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  const slideClass =
    side === 'right'
      ? 'animate-in slide-in-from-right duration-200'
      : 'animate-in slide-in-from-left duration-200';

  return (
    <div
      className={`fixed inset-0 z-50 flex ${side === 'right' ? 'justify-end' : 'justify-start'} bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200`}
      onClick={preventBackdropClose ? undefined : onClose}
    >
      <div
        dir={dir}
        onClick={(e) => e.stopPropagation()}
        className={[
          'bg-white dark:bg-[#111827] shadow-2xl flex flex-col h-full w-full max-w-[calc(100vw-1rem)] overflow-hidden',
          width,
          slideClass,
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        {title !== undefined && (
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-[#1F2937] shrink-0 sticky top-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xs z-10">
            <div className="min-w-0 flex-1">
              {typeof title === 'string' ? (
                <h2 className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">{title}</h2>
              ) : (
                title
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 ml-2 rounded-lg text-slate-400 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors shrink-0 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-slate-200 dark:border-[#1F2937] p-4 bg-slate-50 dark:bg-[#1E293B] sticky bottom-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
