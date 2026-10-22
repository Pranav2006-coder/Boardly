import { useState } from 'react';

/**
 * Reusable Tooltip Component for Boardly
 * Non-intrusive hover popup for toolbar buttons and icons
 */
export default function Tooltip({
  content,
  children,
  position = 'top', // 'top' | 'bottom' | 'left' | 'right'
  className = '',
}) {
  const [visible, setVisible] = useState(false);

  if (!content) return children;

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`
            absolute z-50 pointer-events-none whitespace-nowrap
            px-2.5 py-1 rounded-lg bg-[#292524] text-white text-[11px] font-medium
            shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-white/10
            animate-fade-in-up
            ${positionStyles[position] || positionStyles.top}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
}
