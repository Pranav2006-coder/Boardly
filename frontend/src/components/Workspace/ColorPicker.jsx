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
  className = '',
}) {
  const strokeOptions = [
    { val: 1.5, title: 'Fine (1.5px)', h: '1.5px' },
    { val: 3, title: 'Medium (3px)', h: '3px' },
    { val: 6, title: 'Bold (6px)', h: '5px' },
  ];

  return (
    <div
      className={`
        bg-[#292524]/95 backdrop-blur-xl px-4 py-2 rounded-2xl
        shadow-[0_12px_40px_rgba(0,0,0,0.35)] flex items-center gap-3
        border border-stone-700/60
        ${className}
      `}
    >
      {/* Swatches */}
      <div className="flex items-center gap-1.5">
        {BURGUNDY_SWATCHES.map((s) => (
          <button
            key={s.color}
            type="button"
            onClick={() => onChangeColor(s.color)}
            style={{ backgroundColor: s.color }}
            className={`w-6 h-6 rounded-full transition-transform ${
              activeColor === s.color
                ? 'ring-2 ring-offset-2 ring-offset-[#292524] ring-[#E8B7C2] scale-110 shadow-xs'
                : 'hover:scale-110'
            }`}
            title={s.name}
          />
        ))}

        <input
          type="color"
          value={activeColor}
          onChange={(e) => onChangeColor(e.target.value)}
          className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-0 p-0 ring-1 ring-stone-600 bg-transparent"
          title="Custom Color"
        />
      </div>

      <span className="w-px h-5 bg-stone-700" />

      {/* Stroke Width Pills */}
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

      {/* Solid vs Dashed */}
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
