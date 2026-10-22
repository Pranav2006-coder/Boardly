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
    <div
      className={`
        bg-[#292524]/95 backdrop-blur-xl px-3.5 py-1.5 rounded-full
        shadow-[0_16px_40px_rgba(0,0,0,0.35)] flex items-center gap-1.5
        border border-stone-700/60 select-none
        ${className}
      `}
    >
      {tools.map((t) => (
        <ToolButton
          key={t.id}
          icon={t.icon}
          label={t.label}
          shortcut={t.shortcut}
          isActive={activeTool === t.id}
          onClick={() => onSelectTool(t.id)}
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
        disabled={!selectedId}
        danger={!!selectedId}
      />

      {/* Undo */}
      <ToolButton
        icon="undo"
        label="Undo"
        shortcut="Ctrl+Z"
        onClick={onUndo}
        disabled={!canUndo}
      />
    </div>
  );
}
