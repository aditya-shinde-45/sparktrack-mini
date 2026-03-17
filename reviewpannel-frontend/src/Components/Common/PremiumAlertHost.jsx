import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const getAlertVariant = (message) => {
  const text = String(message || '').toLowerCase();
  if (text.includes('success') || text.includes('successfully')) return 'success';
  if (text.includes('failed') || text.includes('error') || text.includes('unable')) return 'error';
  return 'info';
};

const normalizeMessage = (value) => {
  if (value === null || value === undefined || value === '') return 'Something happened.';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (typeof value.message === 'string') return value.message;
    try {
      return JSON.stringify(value);
    } catch {
      return 'Something happened.';
    }
  }
  return String(value);
};

const PremiumAlertHost = () => {
  const [queue, setQueue] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const originalAlertRef = useRef(null);
  const okButtonRef = useRef(null);

  const current = queue.length > 0 ? queue[0] : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!originalAlertRef.current) {
      originalAlertRef.current = window.alert;
    }

    window.alert = (message) => {
      const normalized = normalizeMessage(message);
      setQueue((prev) => [...prev, normalized]);
      setIsOpen(true);
    };

    return () => {
      if (originalAlertRef.current) {
        window.alert = originalAlertRef.current;
      }
    };
  }, []);

  useEffect(() => {
    if (!current) {
      setIsOpen(false);
    }
  }, [current]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setQueue((prev) => prev.slice(1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!okButtonRef.current) return;
    okButtonRef.current.focus();
  }, [isOpen, current]);

  useEffect(() => {
    if (!current) return;
    const currentVariant = getAlertVariant(current);
    if (currentVariant === 'error') return;

    const timeout = setTimeout(() => {
      setQueue((prev) => prev.slice(1));
    }, 4200);

    return () => clearTimeout(timeout);
  }, [current]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const variant = useMemo(() => getAlertVariant(current), [current]);

  const variantUI = {
    success: {
      icon: CheckCircle2,
      iconWrap: 'bg-emerald-500/15 text-emerald-100 border border-emerald-200/25',
      title: 'Success',
      titleClass: 'text-emerald-100',
      actionClass: 'bg-emerald-500/90 hover:bg-emerald-500',
      glow: 'shadow-[0_16px_48px_rgba(16,185,129,0.22)]',
      ring: 'ring-emerald-200/30'
    },
    error: {
      icon: AlertTriangle,
      iconWrap: 'bg-rose-500/15 text-rose-100 border border-rose-200/25',
      title: 'Attention',
      titleClass: 'text-rose-100',
      actionClass: 'bg-rose-500/90 hover:bg-rose-500',
      glow: 'shadow-[0_16px_48px_rgba(244,63,94,0.22)]',
      ring: 'ring-rose-200/30'
    },
    info: {
      icon: Info,
      iconWrap: 'bg-indigo-500/15 text-indigo-100 border border-indigo-200/25',
      title: 'Notice',
      titleClass: 'text-indigo-100',
      actionClass: 'bg-indigo-500/90 hover:bg-indigo-500',
      glow: 'shadow-[0_16px_48px_rgba(99,102,241,0.24)]',
      ring: 'ring-indigo-200/30'
    }
  }[variant || 'info'];

  if (!isOpen || !current) return null;

  const Icon = variantUI.icon;
  const queueCount = queue.length;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4" role="presentation">
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-lg"
        onClick={() => setQueue((prev) => prev.slice(1))}
      />

      <div
        role="alertdialog"
        aria-live="assertive"
        aria-modal="true"
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border border-white/30 ring-1 ${variantUI.ring} bg-white/12 backdrop-blur-2xl shadow-2xl ${variantUI.glow} animate-[fadeIn_.2s_ease-out]`}
      >
        <div className="h-1 w-full bg-white/35" />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-inner ${variantUI.iconWrap}`}>
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className={`text-xs sm:text-sm font-semibold tracking-[0.14em] uppercase ${variantUI.titleClass}`}>
                {variantUI.title}
              </h3>
              <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-white/90 break-words">{current}</p>
            </div>

            <button
              type="button"
              onClick={() => setQueue((prev) => prev.slice(1))}
              className="rounded-xl p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white"
              aria-label="Close alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/20 pt-4">
            {queueCount > 1 && (
              <span className="inline-flex items-center rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90">
                {queueCount - 1} more in queue
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                ref={okButtonRef}
                type="button"
                onClick={() => setQueue((prev) => prev.slice(1))}
                className={`rounded-xl px-4 sm:px-5 py-2 text-sm font-semibold text-white transition ${variantUI.actionClass} shadow-lg shadow-black/20`}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PremiumAlertHost;
