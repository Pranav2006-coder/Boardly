import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Avatar, Badge, Tabs, Dropdown, DropdownItem, DropdownDivider } from '../common';
import BoardCard from './BoardCard';
import BoardCardSkeleton from './BoardCardSkeleton';

/**
 * DashboardView Component for Boardly
 * Premium modern collaborative SaaS product dashboard
 * Fully componentized with shared Button, Input, Avatar, Badge, Tabs, Dropdown, and BoardCard
 */
export default function DashboardView({
  boards,
  loadingBoards = false,
  onOpenBoard,
  onOpenNewModal,
  onJoinRoomCode,
  onToggleStar,
  onDeleteBoard,
  onShareBoard,
}) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'shared' | 'starred'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCodeInput.trim()) {
      onJoinRoomCode(roomCodeInput.trim().toUpperCase());
      setRoomCodeInput('');
    }
  };

  const currentUserId = user?.id || user?._id;
  const isOwner = (b) => {
    const creator = b.createdBy || b.owner?._id || b.owner?.id || b.owner;
    return creator && currentUserId && creator.toString() === currentUserId.toString();
  };

  const filteredBoards = boards
    .filter((b) => {
      if (activeTab === 'starred' && !b.isStarred) return false;
      if (activeTab === 'shared' && isOwner(b)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.title?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.roomCode?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

  const tabList = [
    {
      id: 'my',
      label: 'My Whiteboards',
      count: boards.filter((b) => isOwner(b) || b.isPublic).length,
    },
    {
      id: 'shared',
      label: 'Shared with Me',
      count: boards.filter((b) => !isOwner(b)).length,
    },
    {
      id: 'starred',
      label: 'Starred',
      count: boards.filter((b) => b.isStarred).length,
    },
  ];

  const sidebarLinks = [
    { id: 'my', icon: 'grid_view', label: 'All Boards' },
    { id: 'recent', icon: 'schedule', label: 'Recent' },
    { id: 'shared', icon: 'group', label: 'Shared with Me' },
    { id: 'starred', icon: 'star', label: 'Starred' },
  ];

  return (
    <div className="bg-[#FAF6F2] font-sans text-[#292323] antialiased min-h-screen">
      {/* Top Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E8DDD8] shadow-xs">
        <div className="h-16 max-w-[1440px] mx-auto px-6 flex items-center justify-between gap-4">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => setActiveTab('my')}
            >
              <div className="w-9 h-9 rounded-xl bg-[#7F1D3F] group-hover:bg-[#651630] flex items-center justify-center shadow-burgundy-btn transition-colors">
                <span className="material-symbols-outlined text-white text-[20px]">draw</span>
              </div>
              <span className="font-headline text-[22px] font-bold tracking-tight text-[#292323]">
                Boardly
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('my')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-xl transition-colors ${
                  activeTab === 'my'
                    ? 'bg-[#FFF8F0] text-[#7F1D3F] border border-[#E8B7C2]/60'
                    : 'text-[#786C6C] hover:text-[#292323] hover:bg-[#FAF6F2]'
                }`}
              >
                Dashboards
              </button>
              <button
                onClick={onOpenNewModal}
                className="px-3 py-1.5 text-sm text-[#786C6C] hover:text-[#292323] hover:bg-[#FAF6F2] rounded-xl transition-colors"
              >
                Templates
              </button>
            </nav>
          </div>

          {/* Search, Notifications, Profile Dropdown */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block w-64">
              <Input
                size="sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search whiteboards..."
                icon={<span className="material-symbols-outlined text-[18px]">search</span>}
              />
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-[#786C6C] hover:text-[#292323] hover:bg-[#FFF8F0] transition-colors relative"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#7F1D3F] ring-2 ring-white" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E8DDD8] rounded-2xl shadow-[0_12px_40px_rgba(41,35,35,0.14)] p-4 z-50 animate-fade-in-up">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8DDD8] mb-3">
                    <span className="font-headline font-bold text-sm text-[#292323]">Notifications</span>
                    <Badge variant="burgundy" size="sm">2 new</Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FFF8F0] flex items-start gap-2.5 border border-[#E8DDD8]">
                      <span className="w-2 h-2 rounded-full bg-[#7F1D3F] mt-1 shrink-0" />
                      <div>
                        <span className="font-semibold text-[#292323] block">Sarah Chen invited you</span>
                        <span className="text-[11px] text-[#786C6C]">to "UX Design System Kit"</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF6F2] flex items-start gap-2.5 border border-[#E8DDD8]">
                      <span className="w-2 h-2 rounded-full bg-[#A63D57] mt-1 shrink-0" />
                      <div>
                        <span className="font-semibold text-[#292323] block">Live room ready</span>
                        <span className="text-[11px] text-[#786C6C]">Room X9K-72M is active</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <Dropdown
              width="w-60"
              trigger={(isOpen) => (
                <div className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-[#FFF8F0] transition-colors">
                  <Avatar
                    name={user?.name || 'Alex Morgan'}
                    email={user?.email}
                    color={user?.avatarColor}
                    size="sm"
                    isOnline
                    showStatus
                  />
                  <span className="material-symbols-outlined text-[#786C6C] text-[18px]">
                    {isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              )}
            >
              <div className="p-3 border-b border-[#E8DDD8]">
                <span className="font-headline font-bold text-sm text-[#292323] block truncate">
                  {user?.name || 'Alex Morgan'}
                </span>
                <span className="text-[11px] text-[#786C6C] block truncate">
                  {user?.email || 'alex@boardly.app'}
                </span>
                <div className="mt-1.5">
                  <Badge variant="burgundy" size="sm">
                    {user?.role || 'Product Lead'}
                  </Badge>
                </div>
              </div>

              <DropdownItem
                icon={<span className="material-symbols-outlined text-[16px]">manage_accounts</span>}
                onClick={() => alert('Account Settings')}
              >
                Profile Settings
              </DropdownItem>

              <DropdownItem
                icon={<span className="material-symbols-outlined text-[16px]">help_outline</span>}
                onClick={() => alert('Documentation and keyboard shortcuts')}
              >
                Help & Shortcuts
              </DropdownItem>

              <DropdownDivider />

              <DropdownItem
                danger
                icon={<span className="material-symbols-outlined text-[16px]">logout</span>}
                onClick={logout}
              >
                Sign Out
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Left Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white z-40 hidden lg:flex flex-col py-5 px-4 gap-5 border-r border-[#E8DDD8]">
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#786C6C]">
            Workspaces
          </div>
          <nav className="flex flex-col gap-0.5">
            {sidebarLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id === 'recent' ? 'my' : item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors text-left ${
                  activeTab === item.id
                    ? 'bg-[#FFF8F0] text-[#7F1D3F] font-semibold border-l-2 border-[#7F1D3F]'
                    : 'text-[#786C6C] hover:bg-[#FAF6F2] hover:text-[#292323]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeTab === item.id ? 'text-[#7F1D3F]' : ''
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto pt-4 border-t border-[#E8DDD8] flex flex-col gap-0.5">
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#7F1D3F] hover:bg-[#FFF8F0] font-semibold text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            New Board
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 pt-16 min-h-screen">
        <main className="max-w-[1440px] mx-auto p-6 lg:p-8">
          {/* Hero Banner — Deep Burgundy Gradient & Pale Cream Accent */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7F1D3F] via-[#651630] to-[#4A0E23] text-white p-7 lg:p-9 shadow-burgundy-btn mb-8">
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-[#E8B7C2]/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] uppercase tracking-wider font-semibold border border-white/30">
                    Live Collaboration Space
                  </span>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                </div>
                <h1 className="font-headline text-3xl lg:text-4xl tracking-tight font-extrabold mt-1">
                  Welcome back, {user?.name?.split(' ')[0] || 'Alex'}{' '}
                  <span className="inline-block hover:rotate-12 transition-transform cursor-pointer">👋</span>
                </h1>
                <p className="text-[#E8B7C2] text-base">
                  Jump into a live collaborative session or launch a new whiteboard blueprint.
                </p>
              </div>

              {/* Join & Create Bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <form onSubmit={handleJoin} className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60 text-[20px]">
                      tag
                    </span>
                    <input
                      type="text"
                      maxLength={7}
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value)}
                      placeholder="e.g. X9K-72M"
                      className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/15 text-white placeholder:text-white/60 font-mono text-base tracking-widest uppercase border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#E8B7C2] focus:bg-white/20 transition-all"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-11 bg-white/20 hover:bg-white/30 text-white border-white/20"
                    icon={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                    iconPosition="right"
                  >
                    Join Room
                  </Button>
                </form>

                <div className="hidden lg:flex items-center text-white/40 text-xs uppercase px-2 font-semibold">
                  or
                </div>

                <Button
                  variant="white"
                  className="h-11"
                  onClick={onOpenNewModal}
                  icon={<span className="material-symbols-outlined text-[20px] text-[#7F1D3F]">auto_awesome</span>}
                >
                  + New Whiteboard
                </Button>
              </div>

              {/* Real-time stats indicators */}
              <div className="flex flex-wrap items-center gap-5 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-white">view_quilt</span>
                  </div>
                  <span className="text-xs font-semibold text-white">{boards.length} Active Boards</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white ring-4 ring-white/30 animate-pulse" />
                  <span className="text-xs font-semibold text-white">Live Real-Time Sync</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-white">bolt</span>
                  </div>
                  <span className="text-xs text-[#E8B7C2]">60 FPS Canvas</span>
                </div>
              </div>
            </div>
          </section>

          {/* Tab Navigation and Controls */}
          <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-[#E8DDD8] mb-6">
            <Tabs
              tabs={tabList}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 px-3 bg-[#FFF8F0] border border-[#E8DDD8] rounded-xl text-xs text-[#292323] font-medium outline-none focus:border-[#7F1D3F] cursor-pointer"
              >
                <option value="updated">Recently Updated</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>

              <div className="flex items-center bg-[#FFF8F0] border border-[#E8DDD8] rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#7F1D3F] shadow-xs'
                      : 'text-[#786C6C] hover:text-[#292323]'
                  }`}
                  title="Grid View"
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-[#7F1D3F] shadow-xs'
                      : 'text-[#786C6C] hover:text-[#292323]'
                  }`}
                  title="List View"
                >
                  <span className="material-symbols-outlined text-[18px]">view_list</span>
                </button>
              </div>
            </div>
          </section>

          {/* Boards Grid / List / Skeleton / Empty State */}
          <section>
            {loadingBoards ? (
              /* Skeleton loading — 4 shimmer cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <BoardCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredBoards.length === 0 ? (
              /* Empty state */
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#E8DDD8] max-w-xl mx-auto shadow-xs animate-fade-in-up">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFF8F0] flex items-center justify-center mb-4 border border-[#E8B7C2]/60 shadow-xs">
                  <span className="material-symbols-outlined text-3xl text-[#7F1D3F]">dashboard_customize</span>
                </div>
                <h3 className="font-headline font-bold text-lg text-[#292323]">No whiteboards found</h3>
                <p className="text-sm text-[#786C6C] mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No boards match "${searchQuery}". Try a different search.`
                    : 'Get started by creating your first collaborative whiteboard or join via room code.'}
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    onClick={onOpenNewModal}
                    icon={<span className="material-symbols-outlined text-base">add</span>}
                  >
                    Create Whiteboard
                  </Button>
                </div>
              </div>
            ) : viewMode === 'list' ? (
              /* List view */
              <div className="flex flex-col gap-2">
                {filteredBoards.map((board, idx) => {
                  const bId = board.id || board._id;
                  return (
                    <div
                      key={bId}
                      onClick={() => onOpenBoard(bId)}
                      className="group bg-white border border-[#E8DDD8] hover:border-[#7F1D3F] rounded-2xl px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:shadow-[0_4px_16px_rgba(127,29,63,0.08)] transition-all duration-200 animate-fade-in-up"
                      style={{ animationDelay: `${idx * 40}ms`, opacity: 0, animationFillMode: 'forwards' }}
                    >
                      {/* Coloured accent strip */}
                      <div
                        className="w-1.5 h-12 rounded-full shrink-0"
                        style={{ backgroundColor: board.isStarred ? '#7F1D3F' : '#E8DDD8' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-headline font-bold text-sm text-[#292323] group-hover:text-[#7F1D3F] transition-colors truncate">
                            {board.title}
                          </h4>
                          {board.isStarred && (
                            <span className="material-symbols-outlined text-[14px] text-[#7F1D3F] shrink-0">star</span>
                          )}
                        </div>
                        <p className="text-xs text-[#786C6C] truncate mt-0.5">{board.description || 'Collaborative whiteboard canvas'}</p>
                      </div>
                      <div className="hidden sm:flex items-center -space-x-1.5 shrink-0">
                        {board.collaborators?.slice(0, 3).map((c, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white shadow-xs"
                            style={{ backgroundColor: c.avatarColor || '#7F1D3F' }}
                            title={c.name}
                          >
                            {c.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px] text-[#786C6C] font-mono shrink-0 hidden md:block">
                        {board.roomCode}
                      </span>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onShareBoard(board)}
                          className="w-8 h-8 rounded-lg text-[#786C6C] hover:text-[#7F1D3F] hover:bg-[#FFF8F0] flex items-center justify-center transition-colors"
                          title="Share"
                        >
                          <span className="material-symbols-outlined text-[16px]">share</span>
                        </button>
                        <button
                          onClick={() => onToggleStar(bId)}
                          className="w-8 h-8 rounded-lg text-[#786C6C] hover:text-[#7F1D3F] hover:bg-[#FFF8F0] flex items-center justify-center transition-colors"
                          title={board.isStarred ? 'Unstar' : 'Star'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {board.isStarred ? 'star' : 'star_border'}
                          </span>
                        </button>
                        <button
                          onClick={() => onDeleteBoard(bId)}
                          className="w-8 h-8 rounded-lg text-[#786C6C] hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Grid view */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredBoards.map((board, idx) => {
                  const bId = board.id || board._id;
                  return (
                    <div
                      key={bId}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${idx * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}
                    >
                      <BoardCard
                        board={board}
                        onOpen={() => onOpenBoard(bId)}
                        onToggleStar={() => onToggleStar(bId)}
                        onShare={() => onShareBoard(board)}
                        onDelete={() => onDeleteBoard(bId)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
