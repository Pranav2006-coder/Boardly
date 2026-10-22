export default function SettingsDropdown({
  isOpen,
  onClose,
  gridStyle,
  onGridStyleChange,
  snapToGrid,
  onSnapToggle,
  canvasTheme,
  onThemeToggle,
  showCursors,
  onCursorsToggle,
  onClearBoard
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Click-outside overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <aside
        className="fixed top-16 right-16 z-50 w-[300px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(41,35,35,0.12)] p-5 border border-[#E8DDD8] animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DDD8] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFF8F0] flex items-center justify-center border border-[#E8DDD8]">
              <span className="material-symbols-outlined text-[#7F1D3F] text-[16px]">tune</span>
            </div>
            <h2 className="font-headline text-base text-[#292323] font-bold tracking-tight">Canvas Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#786C6C] hover:text-[#292323] hover:bg-[#FAF6F2] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Grid Display */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#786C6C] block mb-2">
              Grid Display
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#FAF6F2] p-1 rounded-xl border border-[#E8DDD8]">
              {[
                { id: 'dots', label: 'Dots' },
                { id: 'major', label: 'Lines' },
                { id: 'blank', label: 'None' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onGridStyleChange(g.id)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    gridStyle === g.id
                      ? 'bg-white text-[#7F1D3F] shadow-xs font-bold'
                      : 'text-[#786C6C] hover:text-[#292323]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Snap to Grid */}
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-xs font-semibold text-[#292323] block">Snap to Grid</span>
              <span className="text-[10px] text-[#786C6C]">Align objects to 16px increments</span>
            </div>
            <button
              type="button"
              onClick={onSnapToggle}
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                snapToGrid ? 'bg-[#7F1D3F]' : 'bg-[#D6CECA]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                  snapToGrid ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Live Cursors */}
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-xs font-semibold text-[#292323] block">Live Cursors</span>
              <span className="text-[10px] text-[#786C6C]">Show teammates moving on canvas</span>
            </div>
            <button
              type="button"
              onClick={onCursorsToggle}
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                showCursors ? 'bg-[#7F1D3F]' : 'bg-[#D6CECA]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                  showCursors ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Canvas Theme */}
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-xs font-semibold text-[#292323] block">Canvas Surface</span>
              <span className="text-[10px] text-[#786C6C]">{canvasTheme === 'dark' ? 'Dark Mode' : 'Light Paper'}</span>
            </div>
            <button
              type="button"
              onClick={onThemeToggle}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FFF8F0] hover:bg-[#E8B7C2]/40 text-[#7F1D3F] transition-colors flex items-center gap-1 border border-[#E8DDD8]"
            >
              <span className="material-symbols-outlined text-sm">
                {canvasTheme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
              <span>{canvasTheme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>

          {/* Clear Board */}
          <div className="pt-3 border-t border-[#E8DDD8]">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all canvas elements?')) {
                  onClearBoard();
                  onClose();
                }
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#FFF8F0] hover:bg-rose-100/60 text-[#7F1D3F] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-[#E8B7C2]"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              <span>Clear Board Canvas</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
