/**
 * Reusable Avatar Component for Boardly
 * Deterministic burgundy palettes, initials generation, online badge indicator
 */
export default function Avatar({
  name = 'User',
  email = '',
  color,
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isOnline = false,
  showStatus = false,
  className = '',
  ...props
}) {
  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const defaultBurgundyColors = ['#7F1D3F', '#651630', '#A63D57', '#8B264A', '#9B3356'];
  const avatarColor = color || defaultBurgundyColors[Math.abs(name.charCodeAt(0) || 0) % defaultBurgundyColors.length];

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-12 h-12 text-base font-extrabold',
  };

  const indicatorSizes = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0 right-0',
    lg: 'w-3 h-3 bottom-0.5 right-0.5',
    xl: 'w-3.5 h-3.5 bottom-0.5 right-0.5',
  };

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`} title={name + (email ? ` (${email})` : '')} {...props}>
      <div
        className={`
          ${sizeClasses[size] || sizeClasses.md}
          rounded-full flex items-center justify-center font-bold text-white
          ring-2 ring-white shadow-xs tracking-tight
        `}
        style={{ backgroundColor: avatarColor }}
      >
        {getInitials(name)}
      </div>

      {showStatus && (
        <span
          className={`
            absolute rounded-full ring-2 ring-white
            ${indicatorSizes[size] || indicatorSizes.md}
            ${isOnline ? 'bg-[#7F1D3F]' : 'bg-[#D6CECA]'}
          `}
        />
      )}
    </div>
  );
}

/**
 * AvatarGroup - Overlapping cluster of avatars with counter pill
 */
export function AvatarGroup({ users = [], max = 3, size = 'sm', className = '' }) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={`flex items-center -space-x-2 ${className}`}>
      {visible.map((u, i) => (
        <Avatar
          key={u.id || i}
          name={u.name}
          email={u.email}
          color={u.avatarColor}
          size={size}
        />
      ))}
      {remaining > 0 && (
        <div
          className={`
            rounded-full bg-[#FFF8F0] text-[#7F1D3F] border border-[#E8B7C2]/60
            font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-xs
            ${size === 'xs' ? 'w-6 h-6 text-[9px]' : 'w-7 h-7'}
          `}
          title={`${remaining} more team members`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
