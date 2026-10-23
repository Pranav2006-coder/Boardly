/**
 * Reusable ToolButton for Canvas Floating Toolbar
 * Dark charcoal style (#292524) with Burgundy (#7F1D3F) active indicator
 */
export default function ToolButton({
  icon,
  label,
  shortcut,
  isActive = false,
  onClick,
  disabled = false,
  danger = false,
  badge = false,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label ? `${label}${shortcut ? ` (${shortcut})` : ''}` : undefined}
      className={`
        relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 select-none
        ${
          disabled
            ? 'text-stone-600 cursor-not-allowed opacity-50'
            : danger
            ? 'text-rose-400 hover:text-rose-300 hover:bg-stone-800/80 active:scale-95'
            : isActive
            ? 'bg-[#7F1D3F] text-white shadow-md shadow-[#7F1D3F]/40 active:scale-95'
            : 'text-[#D6CECA] hover:text-white hover:bg-stone-800/80 active:scale-95'
        }
        ${className}
      `}
    >
      {typeof icon === 'string' ? (
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      ) : (
        icon
      )}

      {badge && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#E8B7C2] ring-1 ring-[#292524]" />
      )}
    </button>
  );
}
