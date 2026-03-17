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

  const variant = useMemo(() => getAlertVariant(current), [current]);

  const variantUI = {
    success: {
      icon: CheckCircle2,
      iconWrap: 'bg-emerald-100 text-emerald-600',
      title: 'Success',
      titleClass: 'text-emerald-700',
      actionClass: 'bg-emerald-600 hover:bg-emerald-700'
    },
    error: {
      icon: AlertTriangle,
      iconWrap: 'bg-rose-100 text-rose-600',
      title: 'Attention',
      titleClass: 'text-rose-700',
      actionClass: 'bg-rose-600 hover:bg-rose-700'
    },
    info: {
      icon: Info,
      iconWrap: 'bg-indigo-100 text-indigo-600',
      title: 'Notice',
      titleClass: 'text-indigo-700',
      actionClass: 'bg-indigo-600 hover:bg-indigo-700'
    }
  }[variant || 'info'];

  if (!isOpen || !current) return null;

  const Icon = variantUI.icon;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => setQueue((prev) => prev.slice(1))}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/30 bg-white shadow-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-fuchsia-500" />

        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${variantUI.iconWrap}`}>
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className={`text-sm font-semibold tracking-wide uppercase ${variantUI.titleClass}`}>
                {variantUI.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-700 break-words">{current}</p>
            </div>

            <button
              type="button"
              onClick={() => setQueue((prev) => prev.slice(1))}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            {queue.length > 1 && (
              <span className="text-xs text-slate-500">{queue.length - 1} more</span>
            )}
            <button
              type="button"
              onClick={() => setQueue((prev) => prev.slice(1))}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${variantUI.actionClass}`}
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PremiumAlertHost;
