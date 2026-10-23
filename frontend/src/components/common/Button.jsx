/**
 * Reusable Button Component for Boardly
 * Adheres strictly to Burgundy & Cream theme (no prohibited colors)
 */
export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'danger' | 'white'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg'
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 h-7',
    sm: 'text-xs px-3.5 py-1.5 rounded-xl gap-1.5 h-8 font-semibold',
    md: 'text-sm px-4 py-2 rounded-xl gap-2 h-10 font-semibold',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5 h-12 font-bold',
  };

  const variantStyles = {
    primary: 'bg-[#7F1D3F] hover:bg-[#651630] text-white shadow-burgundy-btn border border-transparent focus-visible:ring-2 focus-visible:ring-[#7F1D3F] focus-visible:ring-offset-2',
    secondary: 'bg-[#FFF8F0] hover:bg-[#FAF6F2] text-[#7F1D3F] border border-[#E8B7C2]/60 hover:border-[#7F1D3F]/40 focus-visible:ring-2 focus-visible:ring-[#7F1D3F]',
    outline: 'bg-white hover:bg-[#FFF8F0] text-[#292323] hover:text-[#7F1D3F] border border-[#E8DDD8] hover:border-[#7F1D3F]/50 shadow-xs focus-visible:ring-2 focus-visible:ring-[#7F1D3F]',
    ghost: 'bg-transparent hover:bg-[#FFF8F0] text-[#786C6C] hover:text-[#292323] focus-visible:ring-2 focus-visible:ring-[#7F1D3F]',
    dark: 'bg-[#292524] hover:bg-[#1C1917] text-white border border-white/10 shadow-sm focus-visible:ring-2 focus-visible:ring-white/30',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus-visible:ring-2 focus-visible:ring-red-600',
    white: 'bg-white hover:bg-[#FFF8F0] text-[#7F1D3F] shadow-sm hover:shadow border border-white/40 focus-visible:ring-2 focus-visible:ring-white',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined text-[18px] animate-spin">
          progress_activity
        </span>
      ) : (
        icon && iconPosition === 'left' && (
          <span className="shrink-0 flex items-center justify-center">{icon}</span>
        )
      )}

      {children && <span>{children}</span>}

      {!loading && icon && iconPosition === 'right' && (
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
      )}
    </button>
  );
}
