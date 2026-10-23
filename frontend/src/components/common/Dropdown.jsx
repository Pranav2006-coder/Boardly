import { useState, useRef, useEffect } from 'react';

/**
 * Reusable Dropdown Component for Boardly
 * Handles toggle state, click-outside dismissal, and accessible menu items
 */
export default function Dropdown({
  trigger,
  children,
  align = 'right', // 'left' | 'right'
  width = 'w-56',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger(isOpen)}
      </div>

      {isOpen && (
        <div
          className={`
            absolute mt-2 z-50 ${width}
            ${align === 'right' ? 'right-0' : 'left-0'}
            bg-white border border-[#E8DDD8] rounded-2xl
            shadow-[0_10px_35px_-5px_rgba(41,35,35,0.15)]
            p-1.5 animate-fade-in-up
          `}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  icon,
  onClick,
  danger = false,
  active = false,
  className = '',
  disabled = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        w-full text-left px-3 py-2 text-xs font-medium rounded-xl flex items-center gap-2.5 transition-colors
        ${
          danger
            ? 'text-red-600 hover:bg-red-50'
            : active
            ? 'bg-[#FFF8F0] text-[#7F1D3F] font-semibold'
            : 'text-[#292323] hover:bg-[#FAF6F2]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {icon && (
        <span className={`shrink-0 flex items-center ${danger ? 'text-red-500' : 'text-[#786C6C]'}`}>
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="h-px bg-[#E8DDD8] my-1.5" />;
}
