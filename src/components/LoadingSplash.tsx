import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSite } from '../context/SiteContext';

export const LoadingSplash: React.FC = () => {
  const { settings, loading } = useSite();

  // Only show dark splash on true uncached cold first load; never flash white.
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#08080A]"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-4">
            <img
              src={settings?.logoDarkUrl || '/logo.png'}
              alt={settings?.organizationName || 'YRT Esports'}
              className="h-20 w-20 object-contain"
            />
            <div className="w-28 h-[2px] bg-white/10 overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 0.85, ease: 'easeInOut' }}
                className="h-full w-1/2 bg-red-600"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
