/**
 * Reusable Card Component for Boardly
 * Burgundy & cream themed container with hover elevation and border options
 */
export default function Card({
  children,
  className = '',
  interactive = false,
  onClick,
  padding = 'md', // 'none' | 'sm' | 'md' | 'lg'
  variant = 'surface', // 'surface' | 'container' | 'outline'
  ...props
}) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantStyles = {
    surface: 'bg-white border border-[#E8DDD8]',
    container: 'bg-[#FFF8F0] border border-[#E8DDD8]',
    outline: 'bg-transparent border border-[#E8DDD8]',
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-[#7F1D3F] hover:shadow-[0_8px_24px_rgba(127,29,63,0.10)] transition-all duration-200'
    : 'shadow-xs';

  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl overflow-hidden
        ${variantStyles[variant] || variantStyles.surface}
        ${paddingStyles[padding] || paddingStyles.md}
        ${interactiveStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
