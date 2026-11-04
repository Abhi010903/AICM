'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-2xl', 'max-w-xl', 'max-w-lg'
  ariaLabel?: string;
  className?: string;
}

/**
 * Accessible, Portal-backed Application Modal.
 * - Renders directly under document.body via React Portal to decouple from parent layout stacking contexts.
 * - Enforces z-[9999] stacking to guarantee rendering above Leaflet maps, sticky headers (z-40), and tab bars.
 * - Supports keyboard Escape key handling, backdrop click dismiss, and background scroll locking.
 * - Maintains a sticky, un-scrollable header so the close button and title are always visible.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  maxWidth = 'max-w-2xl',
  ariaLabel,
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard accessibility: Dismiss on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background document scrolling while dialog is displayed
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || (typeof title === 'string' ? title : 'Dialog')}
    >
      <div
        className={`relative bg-white rounded-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden isolate ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Dialog Header with Accessible Close Button */}
        {(title || badge || subtitle) && (
          <div className="flex items-start justify-between border-b border-slate-100 p-4 sm:p-5 pb-3 sm:pb-4 gap-3 bg-white sticky top-0 z-20 flex-shrink-0">
            <div className="min-w-0 flex-1">
              {badge && <div className="mb-1">{badge}</div>}
              {title && (
                <div className="text-lg sm:text-xl font-black text-slate-900 truncate">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Independently Scrollable Dialog Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
