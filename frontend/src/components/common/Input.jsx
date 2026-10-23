import { forwardRef } from 'react';

/**
 * Reusable Input Component for Boardly
 * Burgundy focus rings, warm cream background, consistent typography
 */
const Input = forwardRef(function Input({
  label,
  error,
  helperText,
  icon,
  rightIcon,
  onRightIconClick,
  size = 'md', // 'sm' | 'md' | 'lg'
  fullWidth = true,
  className = '',
  id,
  type = 'text',
  disabled = false,
  ...props
}, ref) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const sizeClasses = {
    sm: 'h-8 text-xs px-3',
    md: 'h-10 text-sm px-3.5',
    lg: 'h-12 text-base px-4',
  };

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[#292323] tracking-wide flex items-center justify-between"
        >
          <span>{label}</span>
        </label>
      )}

      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-[#786C6C] pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={`
            w-full rounded-xl bg-[#FFF8F0] text-[#292323]
            placeholder:text-[#786C6C]/60
            border transition-all duration-150 outline-none
            ${icon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${sizeClasses[size] || sizeClasses.md}
            ${
              error
                ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/15'
                : 'border-[#E8DDD8] focus:border-[#7F1D3F] focus:ring-2 focus:ring-[#7F1D3F]/15 focus:bg-white'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed bg-stone-100' : ''}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            disabled={disabled || !onRightIconClick}
            className={`absolute right-3 text-[#786C6C] hover:text-[#292323] transition-colors flex items-center justify-center ${
              !onRightIconClick ? 'pointer-events-none' : 'cursor-pointer'
            }`}
          >
            {rightIcon}
          </button>
        )}
      </div>

      {error ? (
        <span className="text-[11px] font-medium text-red-600 flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">error</span>
          {error}
        </span>
      ) : helperText ? (
        <span className="text-[11px] text-[#786C6C]">{helperText}</span>
      ) : null}
    </div>
  );
});

export default Input;
