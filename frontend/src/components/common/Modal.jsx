import { useEffect } from 'react';

/**
 * Reusable Modal Dialog for Boardly
 * Premium backdrop blur, smooth scale-in animation, accessible ESC handler
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  showClose = true,
  closeOnClickOutside = true,
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#292323]/40 backdrop-blur-sm"
        onClick={closeOnClickOutside ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div
        className={`
          relative w-full ${maxWidthClasses[maxWidth] || maxWidthClasses.md}
          bg-white rounded-3xl border border-[#E8DDD8]
          shadow-[0_24px_64px_-12px_rgba(41,35,35,0.28)]
          p-6 sm:p-7 z-10 animate-scale-in overflow-hidden my-auto
          ${className}
        `}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E8DDD8] mb-5">
            <div className="flex items-start gap-3">
              {/* Burgundy accent left stripe */}
              <div className="w-1 min-h-[36px] rounded-full bg-[#7F1D3F] shrink-0 mt-0.5" />
              <div>
                {title && (
                  <h3 className="font-headline font-bold text-xl text-[#292323] tracking-tight leading-tight">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-[#786C6C] mt-0.5 leading-relaxed">{subtitle}</p>
                )}
              </div>
            </div>

            {showClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#786C6C] hover:text-[#292323] hover:bg-[#FAF6F2] transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="space-y-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="pt-5 mt-5 border-t border-[#E8DDD8] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
