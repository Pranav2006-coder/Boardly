import { useState } from 'react';

/**
 * Reusable StickyNote Canvas Component
 * Pale cream / soft rose notes, rich text editing, tag, and author
 */
export default function StickyNote({
  element,
  isSelected,
  isViewOnly,
  canvasLocked,
  onSelect,
  onMouseDown,
  onUpdateText,
  onUpdateColor,
  onDelete,
}) {
  const [text, setText] = useState(element.data?.text || '');

  const stickyColors = [
    { bg: '#FFF8F0', tag: 'Cream' },
    { bg: '#FAF6F2', tag: 'Alabaster' },
    { bg: '#FDECEF', tag: 'Rose' },
    { bg: '#FCE7EB', tag: 'Blush' },
    { bg: '#F5EDE7', tag: 'Stone' },
  ];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.id);
      }}
      onMouseDown={onMouseDown}
      style={{
        transform: `translate(${element.x}px, ${element.y}px)`,
        backgroundColor: element.color || '#FFF8F0',
        outline: isSelected ? '2px dashed #7F1D3F' : undefined,
        outlineOffset: isSelected ? '4px' : undefined,
      }}
      className={`
        absolute w-64 p-4 rounded-2xl shadow-[0_8px_24px_rgba(41,35,35,0.08)]
        hover:shadow-[0_12px_32px_rgba(41,35,35,0.14)]
        cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-transform
        pointer-events-auto select-none border border-[#E8DDD8] group
      `}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#E8DDD8]/80 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-[#7F1D3F]">push_pin</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7F1D3F]">
            {element.data?.tag || 'Sticky Note'}
          </span>
        </div>

        {/* Color picker pills on hover if selected & editable */}
        {isSelected && !isViewOnly && !canvasLocked && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {stickyColors.map((sc) => (
              <button
                key={sc.bg}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateColor(element.id, sc.bg);
                }}
                style={{ backgroundColor: sc.bg }}
                className="w-3.5 h-3.5 rounded-full border border-[#D6CECA] hover:scale-125 transition-transform"
                title={sc.tag}
              />
            ))}
          </div>
        )}
      </div>

      {/* Note body */}
      <textarea
        rows={3}
        value={text}
        disabled={isViewOnly || canvasLocked}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== element.data?.text) {
            onUpdateText(element.id, text);
          }
        }}
        placeholder="Type note ideas here..."
        className="w-full bg-transparent text-xs text-[#292323] leading-relaxed outline-none resize-none font-medium placeholder:text-[#786C6C]/50"
      />

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-[#786C6C] pt-1">
        <span className="font-medium text-[#786C6C]">
          {element.data?.author ? `— ${element.data.author}` : '— Note'}
        </span>
        {isSelected && !isViewOnly && !canvasLocked && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete Sticky Note"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
