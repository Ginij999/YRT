import React, { useState } from 'react';
import { Globe } from 'lucide-react';

interface CountryLogoProps {
  code?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-5 h-3.5',
  md: 'w-6 h-4',
  lg: 'w-7 h-5',
};

/**
 * Renders the authentic national flag emblem for a given ISO alpha-2 country code
 * (replacing raw 2-letter country short codes on maps and tooltips).
 */
export const CountryLogo: React.FC<CountryLogoProps> = ({
  code = 'NP',
  name = 'Country',
  size = 'sm',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const cleanCode = (code || '').trim().toLowerCase();

  if (!cleanCode || !/^[a-z]{2}$/.test(cleanCode) || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-[2px] bg-red-600/25 border border-red-500/40 shrink-0 ${SIZE_CLASSES[size]} ${className}`}
        title={name}
      >
        <Globe className="w-3 h-3 text-red-400" />
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${cleanCode}.png`}
      srcSet={`https://flagcdn.com/w80/${cleanCode}.png 2x`}
      alt={`${name} flag`}
      title={name}
      onError={() => setFailed(true)}
      className={`${SIZE_CLASSES[size]} object-cover rounded-[2px] border border-white/25 shadow-sm shrink-0 bg-[#141520] ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
};
