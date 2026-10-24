import { useState, useEffect } from 'react';

// Swatch colors adhering strictly to Burgundy & Cream system
const BURGUNDY_SWATCHES = [
  { color: '#7F1D3F', name: 'Primary Burgundy' },
  { color: '#651630', name: 'Deep Wine' },
  { color: '#A63D57', name: 'Secondary Burgundy' },
  { color: '#E8B7C2', name: 'Soft Rose' },
  { color: '#292323', name: 'Deep Charcoal' },
  { color: '#44383A', name: 'Dark Stone' },
  { color: '#786C6C', name: 'Medium Stone' },
  { color: '#A89F9E', name: 'Light Stone' },
  { color: '#FFF8F0', name: 'Pale Cream' },
  { color: '#991B1B', name: 'Muted Crimson' },
];

/**
 * Normalises a raw input string to an uppercase #RRGGBB hex colour.
 * Accepts 3- or 6-digit hex, with or without '#'.
 * Returns null when the input is invalid.
 * @param {string} raw
 * @returns {string | null}
 */
function normaliseHex(raw) {
  const stripped = raw.trim().replace(/^#/, '');
  if (/^[0-9A-Fa-f]{3}$/.test(stripped)) {
    const [r, g, b] = stripped;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (/^[0-9A-Fa-f]{6}$/.test(stripped)) {
    return `#${stripped.toUpperCase()}`;
  }
  return null;
}

/**
 * A controlled hex text input that validates on change/blur.
 * Commits only valid 3- or 6-digit hex values (normalised to #RRGGBB).
 * Invalid input is ignored and the last valid value is kept.
 */
function HexInput({ value, onChange }) {
  const [draft, setDraft] = useState(value ?? '');

  // Keep the draft in sync when the external value changes (e.g. swatch click).
  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const tryCommit = (raw) => {
    const normalised = normaliseHex(raw);
    if (normalised) {
      onChange(normalised);
      setDraft(normalised);
    } else {
      // Revert to last valid
      setDraft(value ?? '');
    }
  };

  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const normalised = normaliseHex(e.target.value);
        if (normalised) onChange(normalised);
      }}
      onBlur={(e) => tryCommit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') tryCommit(e.target.value);
      }}
      spellCheck={false}
      maxLength={7}
      placeholder="#RRGGBB"
      className="w-[78px] h-6 px-1.5 rounded bg-stone-800/90 border border-stone-700/80 text-[#D6CECA] text-[11px] font-mono outline-none focus:border-[#A63D57] transition-colors"
    />
  );
}

/**
 * Reusable Color & Stroke Palette for Whiteboard
 * Dark Charcoal surface (#292524)
 */
export default function ColorPicker({
  activeColor,
  onChangeColor,
  strokeWidth,
  onChangeStrokeWidth,
  isDashed,
  onToggleDashed,
  fillColor,
  onChangeFillColor,
  className = '',
}) {
  const strokeOptions = [
    { val: 1.5, title: 'Fine (1.5px)', h: '1.5px' },
    { val: 3, title: 'Medium (3px)', h: '3px' },
    { val: 6, title: 'Bold (6px)', h: '5px' },
  ];

  const swatchRing = (isActive) =>
    isActive
      ? 'ring-2 ring-offset-2 ring-offset-[#292524] ring-[#E8B7C2] scale-110 shadow-xs'
      : 'hover:scale-110';

  return (
    <div
      className={`
        bg-[#292524]/95 backdrop-blur-xl px-4 py-2 rounded-2xl
        shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex items-center gap-3
        border border-stone-700/60
        ${className}
      `}
    >
      {/* ── Stroke colour row ─────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider leading-none">Stroke</span>
        <div className="flex items-center gap-1.5">
          {BURGUNDY_SWATCHES.map((s) => (
            <button
              key={s.color}
              type="button"
              onClick={() => onChangeColor(s.color)}
              style={{ backgroundColor: s.color }}
              className={`w-6 h-6 rounded-full transition-transform ${swatchRing(activeColor === s.color)}`}
              title={s.name}
            />
          ))}

          <input
            type="color"
            value={activeColor}
            onChange={(e) => onChangeColor(e.target.value)}
            className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-0 p-0 ring-1 ring-stone-600 bg-transparent"
            title="Custom Stroke Color"
          />

          <HexInput value={activeColor} onChange={onChangeColor} />
        </div>
      </div>

      <span className="w-px h-10 bg-stone-700" />

      {/* ── Fill colour row ───────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider leading-none">Fill</span>
        <div className="flex items-center gap-1.5">
          {/* Auto (null) */}
          <button
            type="button"
            onClick={() => onChangeFillColor(null)}
            className={`w-6 h-6 rounded-full border border-stone-600 flex items-center justify-center transition-transform ${swatchRing(fillColor === null)}`}
            title="Auto fill (tint of stroke)"
            style={{ background: 'conic-gradient(#7F1D3F 0deg 180deg, #FFF8F0 180deg 360deg)' }}
          >
            <span className="material-symbols-outlined text-[10px] text-white drop-shadow" style={{ fontSize: '10px' }}>
              auto_fix_high
            </span>
          </button>

          {/* None (transparent) */}
          <button
            type="button"
            onClick={() => onChangeFillColor('none')}
            className={`w-6 h-6 rounded-full border border-stone-600 flex items-center justify-center overflow-hidden relative transition-transform ${swatchRing(fillColor === 'none')}`}
            title="No fill (transparent)"
          >
            {/* Diagonal slash on a light background */}
            <span
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, #FFF8F0 calc(50% - 1px), #991B1B calc(50% - 1px), #991B1B calc(50% + 1px), #FFF8F0 calc(50% + 1px))',
              }}
            />
          </button>

          {/* Palette */}
          {BURGUNDY_SWATCHES.map((s) => (
            <button
              key={s.color}
              type="button"
              onClick={() => onChangeFillColor(s.color)}
              style={{ backgroundColor: s.color }}
              className={`w-6 h-6 rounded-full transition-transform ${swatchRing(fillColor === s.color)}`}
              title={s.name}
            />
          ))}

          <input
            type="color"
            value={fillColor && fillColor !== 'none' ? fillColor : '#7F1D3F'}
            onChange={(e) => onChangeFillColor(e.target.value)}
            className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-0 p-0 ring-1 ring-stone-600 bg-transparent"
            title="Custom Fill Color"
          />

          <HexInput
            value={fillColor && fillColor !== 'none' ? fillColor : ''}
            onChange={onChangeFillColor}
          />
        </div>
      </div>

      <span className="w-px h-10 bg-stone-700" />

      {/* ── Stroke Width Pills ────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-stone-800/90 p-0.5 rounded-xl border border-stone-700/80">
        {strokeOptions.map((st) => (
          <button
            key={st.val}
            type="button"
            onClick={() => onChangeStrokeWidth(st.val)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              strokeWidth === st.val ? 'bg-[#7F1D3F] text-white shadow-2xs' : 'hover:bg-stone-700/70 text-[#D6CECA]'
            }`}
            title={st.title}
          >
            <div
              className="w-3.5 rounded-full"
              style={{
                height: st.h,
                backgroundColor: strokeWidth === st.val ? '#FFFFFF' : '#D6CECA',
              }}
            />
          </button>
        ))}
      </div>

      <span className="w-px h-5 bg-stone-700" />

      {/* ── Solid vs Dashed ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 text-[#D6CECA]">
        <button
          type="button"
          onClick={() => onToggleDashed(false)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            !isDashed ? 'bg-[#7F1D3F] text-white font-bold' : 'text-[#D6CECA] hover:text-white hover:bg-stone-800'
          }`}
          title="Solid line"
        >
          <span className="material-symbols-outlined text-[18px]">horizontal_rule</span>
        </button>
        <button
          type="button"
          onClick={() => onToggleDashed(true)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            isDashed ? 'bg-[#7F1D3F] text-white font-bold' : 'text-[#D6CECA] hover:text-white hover:bg-stone-800'
          }`}
          title="Dashed line"
        >
          <span className="material-symbols-outlined text-[18px]">line_style</span>
        </button>
      </div>
    </div>
  );
}
