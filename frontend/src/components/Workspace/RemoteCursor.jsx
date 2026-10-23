/**
 * Reusable RemoteCursor Component for Whiteboard
 * Real-time collaborator cursor indicator with smooth transition and name pill
 */
export default function RemoteCursor({
  x,
  y,
  userName = 'Collaborator',
  avatarColor = '#7F1D3F',
}) {
  return (
    <div
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: 'transform 0.08s ease-out',
      }}
      className="absolute z-40 pointer-events-none flex flex-col items-start gap-1"
    >
      <svg className="w-5 h-5 -rotate-12 drop-shadow-md" fill="none" viewBox="0 0 24 24">
        <path
          d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
          fill={avatarColor}
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="px-2.5 py-0.5 rounded-full text-white text-[10px] font-bold shadow-md whitespace-nowrap ml-3 -mt-2"
        style={{ backgroundColor: avatarColor }}
      >
        {userName}
      </div>
    </div>
  );
}
