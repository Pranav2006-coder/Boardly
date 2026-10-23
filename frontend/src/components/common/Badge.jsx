/**
 * Reusable Badge Component for Boardly
 * Strictly Burgundy & Cream Light Theme (Zero forbidden colors)
 */
export default function Badge({
  children,
  variant = 'burgundy', // 'burgundy' | 'rose' | 'neutral' | 'dark' | 'live'
  size = 'md', // 'sm' | 'md'
  icon,
  className = '',
  ...props
}) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold gap-1 rounded-md',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5 rounded-lg',
  };

  const variantStyles = {
    burgundy: 'bg-[#FFF8F0] text-[#7F1D3F] border border-[#E8B7C2]/60',
    rose: 'bg-[#FAF6F2] text-[#A63D57] border border-[#E8B7C2]/40',
    neutral: 'bg-white text-[#786C6C] border border-[#E8DDD8]',
    dark: 'bg-[#292524] text-white border border-white/10',
    live: 'bg-[#FFF8F0] text-[#7F1D3F] border border-[#E8B7C2]/60',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center font-mono uppercase tracking-wider
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.burgundy}
        ${className}
      `}
      {...props}
    >
      {variant === 'live' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#7F1D3F] animate-pulse shrink-0" />
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
