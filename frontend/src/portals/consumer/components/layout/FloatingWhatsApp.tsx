import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { useWhatsAppSupport } from '@/hooks/useWhatsAppSupport';

export const FloatingWhatsApp: React.FC = () => {
  const { number, isEnabled, link } = useWhatsAppSupport();
  const [isOpen, setIsOpen] = useState(false);

  if (!isEnabled) return null;

  return (
    <aside aria-label="Customer Support" className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-3 w-72 sm:w-80 rounded-2xl bg-bg-surface/95 backdrop-blur-xl border border-bg-border shadow-2xl p-4 text-left overflow-hidden relative"
          >
            {/* Header with WhatsApp branding */}
            <div className="flex items-start justify-between pb-3 border-b border-bg-border">
              <div className="flex items-center space-x-2.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-bg-surface" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-content-primary flex items-center gap-1.5">
                    OneMed Support
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </h4>
                  <p className="text-[11px] text-content-muted flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    Typically replies in ~5 mins
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
                aria-label="Close WhatsApp card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Body */}
            <div className="py-3 text-xs text-content-secondary space-y-2">
              <p>
                Have a query about your medicine, prescription verification, or delivery timeline?
              </p>
              <div className="px-2.5 py-1.5 rounded-lg bg-bg-card border border-bg-border flex items-center justify-between text-[11px] font-mono">
                <span className="text-content-muted">Helpline:</span>
                <span className="text-emerald-400 font-bold">{number}</span>
              </div>
            </div>

            {/* Action Button */}
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer font-head tracking-wide"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Start WhatsApp Chat</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Trigger Button */}
      <div className="relative group">
        {/* Pulsing glow ring */}
        <span className="absolute -inset-1 rounded-full bg-emerald-500/30 blur-sm animate-pulse group-hover:bg-emerald-500/50 transition-all" />

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Chat on WhatsApp"
          className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/30 border border-emerald-400/40 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <MessageCircle className="w-6 h-6 fill-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-emerald-700 animate-ping" />
          </div>
          <span className="hidden sm:inline-block font-head font-bold text-xs tracking-wide">
            Live Support
          </span>
        </button>
      </div>
    </aside>
  );
};

export default FloatingWhatsApp;
