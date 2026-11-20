import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export const WhatsAppButton: React.FC = () => {
  const { settings } = useSite();
  const enabled = settings?.whatsappEnabled !== false;
  const rawUrl = (settings?.whatsappUrl || '').trim();

  if (!enabled || !rawUrl) return null;

  const href = rawUrl.startsWith('http')
    ? rawUrl
    : `https://wa.me/${rawUrl.replace(/[^0-9]/g, '')}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-[0_14px_34px_rgba(22,163,74,0.42)] border border-white/20 transition-all duration-300 hover:-translate-y-1"
    >
      <MessageCircle className="w-5 h-5 fill-white/15 shrink-0" />
      <span className="text-xs font-semibold tracking-wide hidden sm:inline">WhatsApp Us</span>
    </a>
  );
};
