import ToolButton from './ToolButton';

/**
 * Reusable CanvasToolbar Component for Whiteboard
 * Floating dark charcoal pill (#292524) with quick tool shortcuts
 */
export default function CanvasToolbar({
  activeTool,
  onSelectTool,
  selectedId,
  onDeleteSelected,
  onUndo,
  canUndo = true,
  className = '',
  isViewOnly = false,
  onRedo,
  canRedo = false,
  onClear,
  onExport,
}) {
  const tools = [
    { id: 'select', icon: 'near_me', label: 'Select', shortcut: 'V' },
    { id: 'pen', icon: 'edit', label: 'Pen', shortcut: 'P', badge: true },
    { id: 'sticky', icon: 'note_alt', label: 'Sticky Note', shortcut: 'S' },
    { id: 'system', icon: 'schema', label: 'Architecture Card', shortcut: 'A' },
    { id: 'rect', icon: 'crop_square', label: 'Rectangle', shortcut: 'R' },
    { id: 'circle', icon: 'radio_button_unchecked', label: 'Circle', shortcut: 'C' },
    { id: 'text', icon: <span className="font-bold text-sm">T</span>, label: 'Text', shortcut: 'T' },
  ];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* View-Only lock pill above the toolbar */}
      {isViewOnly && (
        <div className="bg-slate-900/90 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 pointer-events-none border border-stone-700/60">
          <span className="material-symbols-outlined text-[14px] text-amber-400">lock</span>
          <span>View-Only mode prevents drawing &amp; editing</span>
        </div>
      )}

      <div
        className="
          bg-[#292524]/95 backdrop-blur-xl px-3.5 py-1.5 rounded-full
          shadow-[0_16px_40px_rgba(0,0,0,0.35)] flex items-center gap-1.5
          border border-stone-700/60 select-none
        "
      >
        {tools.map((t) => (
          <ToolButton
            key={t.id}
            icon={t.icon}
            label={t.label}
            shortcut={t.shortcut}
            isActive={activeTool === t.id}
            onClick={() => onSelectTool(t.id)}
            disabled={isViewOnly && t.id !== 'select'}
            badge={t.badge && activeTool === t.id}
          />
        ))}

        <span className="w-px h-6 bg-stone-700 mx-1" />

        {/* Delete selected */}
        <ToolButton
          icon="delete"
          label="Delete Selected"
          shortcut="Del"
          onClick={onDeleteSelected}
          disabled={isViewOnly || !selectedId}
          danger={!isViewOnly && !!selectedId}
        />

        {/* Undo */}
        <ToolButton
          icon="undo"
          label="Undo"
          shortcut="Ctrl+Z"
          onClick={onUndo}
          disabled={isViewOnly || !canUndo}
        />

        {/* Redo */}
        <ToolButton
          icon="redo"
          label="Redo"
          shortcut="Ctrl+Y"
          onClick={onRedo}
          disabled={isViewOnly || !canRedo}
        />

        <span className="w-px h-6 bg-stone-700 mx-1" />

        {/* Clear canvas */}
        <ToolButton
          icon="delete_sweep"
          label="Clear Canvas"
          onClick={onClear}
          disabled={isViewOnly}
          danger={true}
        />

        {/* Export PNG button */}
        <button
          type="button"
          onClick={onExport}
          title="Export PNG"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-all shadow-sm active:scale-95 cursor-pointer border border-stone-700/60"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span className="font-semibold">Export PNG</span>
        </button>
      </div>
    </div>
  );
}
