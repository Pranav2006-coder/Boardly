/**
 * Reusable Tabs Component for Boardly
 * Burgundy underline or pill style tabs with badges and smooth transitions
 */
export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline', // 'underline' | 'pill'
  className = '',
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === 'pill') {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`
                px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center gap-2
                ${
                  isActive
                    ? 'bg-[#FFF8F0] text-[#7F1D3F] border border-[#E8B7C2]/60 shadow-xs'
                    : 'text-[#786C6C] hover:text-[#292323] hover:bg-[#FAF6F2]'
                }
              `}
            >
              {tab.icon && <span className="text-[16px]">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-[#7F1D3F] text-white' : 'bg-[#E8DDD8] text-[#786C6C]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`
              relative pb-3 text-sm font-semibold transition-colors flex items-center gap-2
              ${isActive ? 'text-[#7F1D3F]' : 'text-[#786C6C] hover:text-[#292323]'}
            `}
          >
            {tab.icon && <span className="text-[18px]">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-[#FFF8F0] text-[#7F1D3F] border border-[#E8B7C2]/60' : 'bg-[#FAF6F2] text-[#786C6C]'
                }`}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7F1D3F] rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
