/**
 * Reusable BoardCard Component for Boardly Dashboard
 * Shows thumbnail preview, status, room code, collaborators, and action buttons.
 * Adheres strictly to Burgundy & Cream design palette.
 */
export default function BoardCard({ board, onOpen, onToggleStar, onShare, onDelete }) {
  // Deterministic Burgundy & Cream thumbnail palettes (No prohibited colours)
  const thumbnailColors = [
    { bg: '#FFF8F0', accent: '#7F1D3F' }, // Pale cream & primary burgundy
    { bg: '#FAF6F2', accent: '#A63D57' }, // Soft off-white & secondary burgundy
    { bg: '#FFFFFF', accent: '#651630' }, // White & deep burgundy
    { bg: '#F5EDE7', accent: '#786C6C' }, // Warm grey & stone
    { bg: '#FFF8F0', accent: '#C97086' }, // Pale cream & muted rose
  ];

  const boardId = board.id || board._id || '';
  const colorSet = thumbnailColors[Math.abs(boardId.charCodeAt(2) || 0) % thumbnailColors.length];

  return (
    <div
      onClick={onOpen}
      className="group bg-white rounded-2xl overflow-hidden border border-[#E8DDD8] hover:border-[#7F1D3F] shadow-xs hover:shadow-[0_12px_32px_rgba(127,29,63,0.12)] transition-all duration-200 cursor-pointer flex flex-col hover:-translate-y-0.5"
    >
      {/* Canvas Thumbnail */}
      <div
        className="h-44 relative overflow-hidden flex items-center justify-center border-b border-[#E8DDD8]"
        style={{ backgroundColor: colorSet.bg }}
      >
        {/* Subtle dot matrix */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${colorSet.accent} 1.25px, transparent 1.25px)`,
            backgroundSize: '18px 18px',
          }}
        />

        {/* Mock canvas preview container */}
        <div className="relative z-10 w-4/5 h-24 bg-white/90 backdrop-blur-sm rounded-xl border border-white/80 p-3 shadow-xs flex flex-col justify-between group-hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorSet.accent }} />
              <span className="font-mono text-[9px] uppercase tracking-wider font-bold" style={{ color: colorSet.accent }}>
                {board.template || 'Architecture'}
              </span>
            </div>
            <span className="font-mono text-[9px] text-[#786C6C] font-semibold bg-[#FAF6F2] px-1.5 py-0.5 rounded">
              {board.roomCode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-1/3 rounded" style={{ backgroundColor: colorSet.accent + '60' }} />
            <div className="h-2 w-1/4 rounded bg-[#E8B7C2]/60" />
            <div className="h-2 w-1/2 rounded bg-[#E8DDD8]" />
          </div>

          <div className="flex items-center justify-between text-[8px] font-mono text-[#786C6C]">
            <span>{board.elements?.length || 0} objects</span>
            <span>60 FPS Sync</span>
          </div>
        </div>

        {/* Star Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            board.isStarred
              ? 'text-[#7F1D3F] bg-white shadow-xs scale-105'
              : 'text-[#D6CECA] hover:text-[#7F1D3F] bg-white/70 hover:bg-white'
          }`}
          title={board.isStarred ? 'Unstar' : 'Star'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {board.isStarred ? 'star' : 'star_border'}
          </span>
        </button>

        {/* Public/Private Badge */}
        <div className="absolute inset-x-4 bottom-2.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorSet.accent }} />
          <span className="text-[10px] font-semibold text-[#786C6C] font-mono">
            {board.isPublic ? 'Public Canvas' : 'Private Workspace'}
          </span>
        </div>
      </div>

      {/* Board Meta */}
      <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-headline font-bold text-base text-[#292323] group-hover:text-[#7F1D3F] transition-colors leading-snug line-clamp-1">
              {board.title}
            </h4>
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={onShare}
                className="w-7 h-7 rounded-lg text-[#786C6C] hover:text-[#7F1D3F] hover:bg-[#FFF8F0] flex items-center justify-center transition-colors"
                title="Share Board"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="w-7 h-7 rounded-lg text-[#786C6C] hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                title="Delete Board"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-[#786C6C] line-clamp-1 mt-0.5">
            {board.description || 'Interactive collaborative whiteboard canvas.'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#E8DDD8] mt-1">
          <div className="flex items-center -space-x-1.5">
            {board.collaborators?.slice(0, 3).map((c, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white shadow-xs"
                style={{ backgroundColor: c.avatarColor || '#7F1D3F' }}
                title={c.name}
              >
                {c.name ? c.name[0].toUpperCase() : 'U'}
              </div>
            ))}
            {(board.collaborators?.length || 0) > 3 && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[#7F1D3F] bg-[#FFF8F0] border border-[#E8B7C2]/60 text-[9px] font-bold ring-2 ring-white shadow-xs">
                +{board.collaborators.length - 3}
              </div>
            )}
          </div>

          <span className="text-[11px] text-[#786C6C] font-medium">
            Updated {board.updatedAt ? new Date(board.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
          </span>
        </div>
      </div>
    </div>
  );
}
