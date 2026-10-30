import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSocket, connectSocket } from '../../services/socket';
import SettingsDropdown from '../Modals/SettingsDropdown';
import ShareModal from '../Modals/ShareModal';
import { Button, AvatarGroup } from '../common';
import CanvasToolbar from './CanvasToolbar';
import ColorPicker from './ColorPicker';
import RemoteCursor from './RemoteCursor';
import StickyNote from './StickyNote';

export default function WhiteboardWorkspace({
  board,
  onBackToDashboard,
  onUpdateBoard,
  onAddCollaborator
}) {
  const { user } = useAuth();
  const currentBoardId = board.id || board._id;
  const [boardTitle, setBoardTitle] = useState(board.title || 'Untitled Whiteboard');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(board.role === 'viewer' || board.userRole === 'viewer');
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Canvas Viewport State (Panning & Zooming)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Canvas Settings State
  const [gridStyle, setGridStyle] = useState(board.gridStyle || 'dots'); // 'dots' | 'major' | 'blank'
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [canvasTheme, setCanvasTheme] = useState('light'); // 'light' | 'dark'
  const [showCursors, setShowCursors] = useState(true);
  const [canvasLocked, setCanvasLocked] = useState(false);

  // Active Tool & Styling
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'pen' | 'eraser' | 'sticky' | 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'system'
  const [activeColor, setActiveColor] = useState('#7F1D3F');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDashed, setIsDashed] = useState(false);

  // Elements State
  const [elements, setElements] = useState(board.elements || []);
  const [selectedId, setSelectedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Current drawing path for Pen tool
  const [currentPath, setCurrentPath] = useState(null);

  // Real-Time Collaborators & Cursors
  const [collaborators, setCollaborators] = useState(board.collaborators || []);
  const [remoteCursors, setRemoteCursors] = useState({});

  const containerRef = useRef(null);
  const historyRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);


  // Socket.IO Connection & Events
  useEffect(() => {
    const socket = connectSocket();

    socket.emit('join_board', {
      boardId: currentBoardId,
      role: isViewOnly ? 'viewer' : 'editor',
      userName: user?.name,
      avatarColor: user?.avatarColor || '#7F1D3F'
    }, (res) => {
      if (res?.board?.elements) {
        setElements(res.board.elements);
      }
      if (res?.activeUsers) {
        setCollaborators(res.activeUsers);
      }
    });

    socket.on('element_created', (newElem) => {
      setElements((prev) => [...prev.filter(e => e.id !== newElem.id), newElem]);
    });

    socket.on('element_updated', (updatedElem) => {
      setElements((prev) => prev.map(e => e.id === updatedElem.id ? { ...e, ...updatedElem } : e));
    });

    socket.on('element_deleted', (elemId) => {
      setElements((prev) => prev.filter(e => e.id !== elemId));
    });

    socket.on('board_cleared', () => {
      setElements([]);
    });

    socket.on('cursor_moved', ({ socketId, userName, avatarColor, x, y }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [socketId]: { userName, avatarColor: avatarColor || '#7F1D3F', x, y, lastSeen: Date.now() }
      }));
    });

    socket.on('active_users_changed', (users) => {
      setCollaborators(users);
    });

    return () => {
      socket.emit('leave_board');
      socket.off('element_created');
      socket.off('element_updated');
      socket.off('element_deleted');
      socket.off('board_cleared');
      socket.off('cursor_moved');
      socket.off('active_users_changed');
    };
  }, [currentBoardId, isViewOnly, user]);

  // Push to history before mutating
  const pushHistory = useCallback(() => {
    historyRef.current.push(JSON.parse(JSON.stringify(elements)));
    if (historyRef.current.length > 20) historyRef.current.shift();
    setCanUndo(true);
  }, [elements]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length > 0) {
      const prev = historyRef.current.pop();
      setCanUndo(historyRef.current.length > 0);
      setElements(prev);
      const socket = getSocket();
      socket.emit('clear_board', { boardId: currentBoardId });
      prev.forEach(elem => socket.emit('element_created', { boardId: currentBoardId, element: elem }));
    }
  }, [currentBoardId]);

  // Broadcast cursor movements to socket
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const canvasX = (clientX - pan.x) / zoom;
    const canvasY = (clientY - pan.y) / zoom;

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('cursor_move', {
        boardId: currentBoardId,
        x: canvasX,
        y: canvasY
      });
    }

    // Panning canvas with space or middle click or select drag
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
      return;
    }

    // Drawing with Pen
    if (currentPath && activeTool === 'pen') {
      setCurrentPath((prev) => ({
        ...prev,
        points: [...prev.points, { x: canvasX, y: canvasY }]
      }));
      return;
    }

    // Dragging an element
    if (draggingId && !isViewOnly && !canvasLocked) {
      const snappedX = snapToGrid ? Math.round((canvasX - dragOffset.x) / 16) * 16 : canvasX - dragOffset.x;
      const snappedY = snapToGrid ? Math.round((canvasY - dragOffset.y) / 16) * 16 : canvasY - dragOffset.y;

      setElements((prev) =>
        prev.map((el) => el.id === draggingId ? { ...el, x: snappedX, y: snappedY } : el)
      );
    }
  };

  const handleMouseDown = (e) => {
    if (canvasLocked) return;
    if (e.button === 1 || e.spaceKey || (activeTool === 'select' && e.target === containerRef.current)) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (isViewOnly) return;

    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasY = (e.clientY - rect.top - pan.y) / zoom;

    if (activeTool === 'pen') {
      pushHistory();
      setCurrentPath({
        id: `stroke-${Date.now()}`,
        type: 'stroke',
        color: activeColor,
        width: strokeWidth,
        dashed: isDashed,
        points: [{ x: canvasX, y: canvasY }]
      });
    } else if (activeTool === 'sticky') {
      pushHistory();
      const newSticky = {
        id: `sticky-${Date.now()}`,
        type: 'sticky',
        x: snapToGrid ? Math.round(canvasX / 16) * 16 : canvasX,
        y: snapToGrid ? Math.round(canvasY / 16) * 16 : canvasY,
        color: activeColor === '#7F1D3F' ? '#FFF8F0' : activeColor,
        textColor: '#292323',
        data: {
          tag: 'Quick Note',
          text: 'Double click to edit note content...',
          author: `${user?.name || 'Collaborator'}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        }
      };
      setElements((prev) => [...prev, newSticky]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newSticky });
      setActiveTool('select');
      setSelectedId(newSticky.id);
    } else if (activeTool === 'rect') {
      pushHistory();
      const newRect = {
        id: `rect-${Date.now()}`,
        type: 'rect',
        x: canvasX,
        y: canvasY,
        width: 200,
        height: 120,
        stroke: activeColor,
        strokeWidth,
        dashed: isDashed,
        fill: `${activeColor}15`
      };
      setElements((prev) => [...prev, newRect]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newRect });
      setActiveTool('select');
      setSelectedId(newRect.id);
    } else if (activeTool === 'circle') {
      pushHistory();
      const newCircle = {
        id: `circle-${Date.now()}`,
        type: 'circle',
        x: canvasX,
        y: canvasY,
        radius: 60,
        stroke: activeColor,
        strokeWidth,
        fill: `${activeColor}15`
      };
      setElements((prev) => [...prev, newCircle]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newCircle });
      setActiveTool('select');
      setSelectedId(newCircle.id);
    } else if (activeTool === 'system') {
      pushHistory();
      const newSystem = {
        id: `sys-${Date.now()}`,
        type: 'system-node',
        x: snapToGrid ? Math.round(canvasX / 16) * 16 : canvasX,
        y: snapToGrid ? Math.round(canvasY / 16) * 16 : canvasY,
        data: {
          category: 'Distributed Component',
          version: 'v1.0.0',
          title: 'REDIS CACHE CLUSTER',
          subtitle: 'Distributed In-Memory Key-Value Store',
          latency: '2.4ms',
          uptime: '99.99%',
          pods: '3 Replicas active',
          throughput: '85k ops/sec',
          statusColor: '#7F1D3F'
        }
      };
      setElements((prev) => [...prev, newSystem]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newSystem });
      setActiveTool('select');
      setSelectedId(newSystem.id);
    } else if (activeTool === 'text') {
      pushHistory();
      const textVal = window.prompt('Enter canvas text label:', 'New Architecture Component');
      if (textVal) {
        const newText = {
          id: `text-${Date.now()}`,
          type: 'text',
          x: canvasX,
          y: canvasY,
          color: activeColor,
          text: textVal,
          fontSize: 16
        };
        setElements((prev) => [...prev, newText]);
        getSocket().emit('element_created', { boardId: currentBoardId, element: newText });
      }
      setActiveTool('select');
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    if (currentPath) {
      setElements((prev) => [...prev, currentPath]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: currentPath });
      setCurrentPath(null);
    }

    if (draggingId) {
      const dragged = elements.find((e) => e.id === draggingId);
      if (dragged) {
        getSocket().emit('element_updated', { boardId: currentBoardId, element: dragged });
      }
      setDraggingId(null);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.25), 3));
  };

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId || isViewOnly) return;
    pushHistory();
    setElements((prev) => prev.filter(e => e.id !== selectedId));
    getSocket().emit('element_deleted', { boardId: currentBoardId, elementId: selectedId });
    setSelectedId(null);
  }, [selectedId, isViewOnly, pushHistory, currentBoardId]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'p' || e.key === 'P') {
        setActiveTool('pen');
      } else if (e.key === 's' || e.key === 'S') {
        setActiveTool('sticky');
      } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool('rect');
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, handleUndo]);

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (boardTitle.trim() && onUpdateBoard) {
      onUpdateBoard(currentBoardId, { title: boardTitle.trim() });
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FAF6F2] select-none font-sans text-[#292323]">
      {/* Top Shell Navbar with Burgundy & Cream Theme */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E8DDD8] shadow-xs flex items-center justify-between px-4">
        {/* Left: Brand, Back, Board Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#786C6C] hover:text-[#292323] hover:bg-[#FAF6F2] transition-colors text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="h-5 w-px bg-[#E8DDD8]"></div>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#FFF8F0] text-[#7F1D3F] flex items-center justify-center shrink-0 border border-[#E8DDD8]">
              <span className="material-symbols-outlined text-[18px]">draw</span>
            </div>

            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="bg-[#FAF6F2] px-2 py-1 rounded text-sm text-[#292323] font-semibold outline-none border border-[#7F1D3F]"
              />
            ) : (
              <h3
                onClick={() => !isViewOnly && setIsEditingTitle(true)}
                className="font-headline font-bold text-sm text-[#292323] truncate max-w-[200px] md:max-w-md cursor-pointer hover:text-[#7F1D3F] transition-colors"
                title="Click to rename"
              >
                {boardTitle}
              </h3>
            )}
          </div>

          {/* View Only Mode Indicator / Switcher */}
          <button
            type="button"
            onClick={() => setIsViewOnly(!isViewOnly)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide flex items-center gap-1 border transition-colors ${
              isViewOnly
                ? 'bg-[#FFF8F0] text-[#7F1D3F] border-[#E8B7C2]'
                : 'bg-[#FAF6F2] text-[#292323] border-[#E8DDD8]'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">
              {isViewOnly ? 'visibility' : 'edit'}
            </span>
            <span>{isViewOnly ? 'View-Only' : 'Editor'}</span>
          </button>
        </div>

        {/* Center: Quick Links */}
        <nav className="hidden xl:flex items-center gap-4 text-xs font-medium text-[#786C6C]">
          <span className="text-[#7F1D3F] font-bold cursor-pointer">Canvas</span>
          <span className="hover:text-[#292323] cursor-pointer" onClick={() => alert('Templates library')}>Templates</span>
          <span className="hover:text-[#292323] cursor-pointer" onClick={() => alert('Version history')}>History</span>
          <span className="hover:text-[#292323] cursor-pointer" onClick={() => alert('Exporting canvas...')}>Export</span>
        </nav>

        {/* Right Controls: Zoom, Settings, Collaborators, Share */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-[#FAF6F2] px-2 py-1 rounded-lg gap-1 border border-[#E8DDD8]">
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.3))}
              className="w-6 h-6 flex items-center justify-center text-[#786C6C] hover:text-[#292323] hover:bg-white rounded transition-colors"
              title="Zoom out"
            >
              <span className="material-symbols-outlined text-[15px]">remove</span>
            </button>
            <span className="text-xs font-mono font-semibold px-1 min-w-[40px] text-center text-[#292323]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
              className="w-6 h-6 flex items-center justify-center text-[#786C6C] hover:text-[#292323] hover:bg-white rounded transition-colors"
              title="Zoom in"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
            </button>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#786C6C] hover:bg-[#FAF6F2] hover:text-[#292323] transition-colors"
            title="Canvas Settings"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>

          {/* Active Collaborators Avatars */}
          <AvatarGroup users={collaborators} max={3} size="sm" />

          {/* Share Button with Burgundy Theme */}
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShareOpen(true)}
            icon={<span className="material-symbols-outlined text-[16px]">person_add</span>}
          >
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </header>

      {/* Settings Dropdown Popover */}
      <SettingsDropdown
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        gridStyle={gridStyle}
        onGridStyleChange={setGridStyle}
        snapToGrid={snapToGrid}
        onSnapToggle={() => setSnapToGrid(!snapToGrid)}
        canvasTheme={canvasTheme}
        onThemeToggle={() => setCanvasTheme(t => t === 'dark' ? 'light' : 'dark')}
        showCursors={showCursors}
        onCursorsToggle={() => setShowCursors(!showCursors)}
        onClearBoard={() => {
          setElements([]);
          getSocket().emit('clear_board', { boardId: currentBoardId });
        }}
      />

      {/* Share Modal Popover */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        board={board}
        onAddCollaborator={onAddCollaborator}
      />

      {/* View-Only Mode Banner */}
      {isViewOnly && (
        <div className="fixed top-16 left-0 right-0 z-30 bg-[#FFF8F0] backdrop-blur-md border-b border-[#E8B7C2] px-4 py-1.5 flex items-center justify-between text-xs text-[#7F1D3F]">
          <div className="flex items-center gap-2 mx-auto">
            <span className="material-symbols-outlined text-base text-[#7F1D3F]">visibility</span>
            <span className="font-semibold">View-Only Mode</span>
            <span className="text-[#7F1D3F]/80 hidden sm:inline">— You have read permissions for this canvas.</span>
          </div>
          <button
            onClick={() => setIsViewOnly(false)}
            className="text-[11px] px-2.5 py-0.5 rounded bg-[#7F1D3F] text-white font-bold hover:bg-[#651630] transition-colors"
          >
            Enable Edit
          </button>
        </div>
      )}

      {/* Main Canvas Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full pt-16 relative overflow-hidden cursor-${
          isPanning ? 'grabbing' : activeTool === 'pen' ? 'crosshair' : 'default'
        } ${canvasTheme === 'dark' ? 'bg-[#1C1917]' : 'bg-[#FAF6F2]'}`}
      >
        {/* SVG Canvas Background Grids (Bright & uncluttered with subtle neutral dots) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="canvas-dots-pat" width={24 * zoom} height={24 * zoom} patternUnits="userSpaceOnUse">
              <circle
                cx={12 * zoom}
                cy={12 * zoom}
                r={1.25 * zoom}
                fill={canvasTheme === 'dark' ? '#786C6C' : '#D6CECA'}
                opacity={canvasTheme === 'dark' ? 0.35 : 0.65}
              />
            </pattern>
            <pattern id="canvas-major-pat" width={120 * zoom} height={120 * zoom} patternUnits="userSpaceOnUse">
              <path
                d={`M ${120 * zoom} 0 L 0 0 0 ${120 * zoom}`}
                fill="none"
                stroke={canvasTheme === 'dark' ? '#44383A' : '#E8DDD8'}
                strokeDasharray="2 4"
                strokeWidth={0.75 * zoom}
              />
            </pattern>
            <marker id="arrow-burgundy" markerWidth="6" markerHeight="6" refX="6" refY="5" viewBox="0 0 10 10" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#7F1D3F" />
            </marker>
          </defs>

          {/* Grid Background Render */}
          {gridStyle === 'major' && <rect width="100%" height="100%" fill="url(#canvas-major-pat)" />}
          {gridStyle === 'dots' && <rect width="100%" height="100%" fill="url(#canvas-dots-pat)" />}
        </svg>

        {/* Spatial HUD Coordinate Pill */}
        <div className="absolute top-20 left-6 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-[0_4px_16px_rgba(41,35,35,0.06)] text-[#292323] border border-[#E8DDD8]">
          <span className="w-2 h-2 rounded-full bg-[#7F1D3F] animate-pulse"></span>
          <span className="text-[10px] font-bold tracking-wider text-[#786C6C] uppercase">
            {snapToGrid ? 'GRID SNAP: ACTIVE' : 'GRID SNAP: OFF'}
          </span>
          <span className="text-[#D6CECA]">|</span>
          <span className="text-[10px] text-[#292323] font-mono font-bold">
            X: {Math.round(-pan.x)} • Y: {Math.round(-pan.y)}
          </span>
          <span className="text-[#D6CECA]">|</span>
          <div className="flex items-center gap-1 text-[#786C6C] text-[10px] font-semibold">
            <span className="material-symbols-outlined text-[14px] text-[#7F1D3F]">visibility</span>
            <span>{collaborators.length} online</span>
          </div>
        </div>

        {/* Quick Canvas Action Pill (Top Right) */}
        <div className="absolute top-20 right-6 z-20 hidden md:flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-[0_4px_16px_rgba(41,35,35,0.06)] border border-[#E8DDD8]">
          <button
            onClick={handleUndo}
            className="px-2 py-0.5 text-[#786C6C] hover:text-[#292323] text-xs rounded-full hover:bg-[#FAF6F2] transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">undo</span> Undo
          </button>
          <span className="w-px h-3.5 bg-[#E8DDD8]"></span>
          <button
            onClick={() => setCanvasLocked(!canvasLocked)}
            className={`px-2 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
              canvasLocked ? 'text-rose-700 bg-rose-50 font-bold' : 'text-[#786C6C] hover:text-[#292323] hover:bg-[#FAF6F2]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {canvasLocked ? 'lock' : 'lock_open'}
            </span>
            {canvasLocked ? 'Locked' : 'Unlocked'}
          </button>
          <span className="w-px h-3.5 bg-[#E8DDD8]"></span>
          <button
            onClick={() => alert('Following live presenter viewport')}
            className="px-2.5 py-0.5 bg-[#FFF8F0] text-[#7F1D3F] text-xs rounded-full font-bold flex items-center gap-1 hover:bg-[#E8B7C2]/40 transition-colors border border-[#E8DDD8]"
          >
            <span className="material-symbols-outlined text-[14px]">near_me</span> Follow Presenter
          </button>
        </div>

        {/* Canvas World Layer (Transformed by pan & zoom) */}
        <div
          className="absolute inset-0 origin-top-left pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* SVG Strokes & Connectors Layer */}
          <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible">
            {elements
              .filter((e) => e.type === 'stroke' || e.type === 'curve' || e.type === 'line' || e.type === 'arrow')
              .map((elem) => {
                if (elem.type === 'stroke' && elem.points?.length > 1) {
                  const d = elem.points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
                  return (
                    <path
                      key={elem.id}
                      d={d}
                      fill="none"
                      stroke={elem.color || '#7F1D3F'}
                      strokeWidth={elem.width || 3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={elem.dashed ? '6 6' : undefined}
                    />
                  );
                }
                if (elem.type === 'curve' && elem.data?.path) {
                  return (
                    <path
                      key={elem.id}
                      d={elem.data.path}
                      fill="none"
                      stroke={elem.data.stroke || '#7F1D3F'}
                      strokeWidth={elem.data.strokeWidth || 3}
                      strokeLinecap="round"
                      markerEnd={elem.data.hasArrow ? 'url(#arrow-burgundy)' : undefined}
                    />
                  );
                }
                return null;
              })}

            {/* Currently drawing stroke */}
            {currentPath && currentPath.points?.length > 1 && (
              <path
                d={currentPath.points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')}
                fill="none"
                stroke={currentPath.color}
                strokeWidth={currentPath.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={currentPath.dashed ? '6 6' : undefined}
              />
            )}
          </svg>

          {/* Interactive Objects on Canvas */}
          {elements.map((elem) => {
            const isSelected = selectedId === elem.id;

            // 1. System Architecture Node Card
            if (elem.type === 'system-node') {
              return (
                <div
                  key={elem.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(elem.id);
                  }}
                  onMouseDown={(e) => {
                    if (activeTool === 'select' && !isViewOnly && !canvasLocked) {
                      e.stopPropagation();
                      setSelectedId(elem.id);
                      setDraggingId(elem.id);
                      const rect = containerRef.current.getBoundingClientRect();
                      const cX = (e.clientX - rect.left - pan.x) / zoom;
                      const cY = (e.clientY - rect.top - pan.y) / zoom;
                      setDragOffset({ x: cX - elem.x, y: cY - elem.y });
                    }
                  }}
                  style={{
                    transform: `translate(${elem.x}px, ${elem.y}px)`,
                    outline: isSelected ? '2px dashed #7F1D3F' : undefined,
                    outlineOffset: isSelected ? '6px' : undefined,
                  }}
                  className={`absolute w-[330px] bg-white rounded-2xl shadow-[0_8px_30px_rgba(41,35,35,0.08)] p-5 cursor-grab active:cursor-grabbing hover:shadow-[0_12px_40px_rgba(41,35,35,0.12)] transition-shadow pointer-events-auto select-none border border-[#E8DDD8] ${
                    isSelected ? 'ring-2 ring-[#7F1D3F]/30' : ''
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute -top-7 left-0 bg-[#7F1D3F] text-white text-[11px] font-bold px-2.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">crop_free</span>
                      <span>Selected Node</span>
                    </div>
                  )}

                  {/* Node Header */}
                  <div className="flex items-center justify-between pb-2 mb-3 bg-[#FFF8F0] -mx-5 -mt-5 px-5 pt-3.5 rounded-t-2xl border-b border-[#E8DDD8]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: elem.data?.statusColor || '#7F1D3F' }}
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#7F1D3F]">
                        {elem.data?.category || 'System Node'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#786C6C] font-mono font-bold">
                      {elem.data?.version || 'v1.0.0'}
                    </span>
                  </div>

                  <h4 className="font-headline font-extrabold text-sm text-[#292323] tracking-tight leading-snug">
                    {elem.data?.title || 'ARCHITECTURE NODE'}
                  </h4>
                  <p className="text-xs text-[#786C6C] mt-0.5">
                    {elem.data?.subtitle || 'API Gateway, SSL & Distributed Routing'}
                  </p>

                  {/* Metrics Box */}
                  <div className="mt-3.5 pt-2.5 grid grid-cols-2 gap-2 bg-[#FAF6F2] p-2.5 rounded-xl border border-[#E8DDD8] font-mono">
                    <div>
                      <div className="text-[10px] text-[#786C6C]">Latency (p99)</div>
                      <div className="text-xs font-bold text-[#292323]">{elem.data?.latency || '14ms'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#786C6C]">Uptime SLA</div>
                      <div className="text-xs font-bold text-[#7F1D3F]">{elem.data?.uptime || '99.99%'}</div>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#786C6C] pt-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7F1D3F]"></span>
                      {elem.data?.pods || '4 Pods healthy'}
                    </span>
                    <span className="font-mono text-[#786C6C] font-bold">{elem.data?.throughput || '12.4k req/s'}</span>
                  </div>

                  {/* Ports / Pins */}
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md flex items-center justify-center border border-[#D6CECA]">
                    <div className="w-2 h-2 rounded-full bg-[#7F1D3F]"></div>
                  </div>
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md flex items-center justify-center border border-[#D6CECA]">
                    <div className="w-2 h-2 rounded-full bg-[#786C6C]"></div>
                  </div>
                </div>
              );
            }

            // 2. Sticky Notes
            if (elem.type === 'sticky') {
              return (
                <StickyNote
                  key={elem.id}
                  element={elem}
                  isSelected={isSelected}
                  isViewOnly={isViewOnly}
                  canvasLocked={canvasLocked}
                  onSelect={setSelectedId}
                  onMouseDown={(e) => {
                    if (activeTool === 'select' && !isViewOnly && !canvasLocked) {
                      e.stopPropagation();
                      setSelectedId(elem.id);
                      setDraggingId(elem.id);
                      const rect = containerRef.current.getBoundingClientRect();
                      const cX = (e.clientX - rect.left - pan.x) / zoom;
                      const cY = (e.clientY - rect.top - pan.y) / zoom;
                      setDragOffset({ x: cX - elem.x, y: cY - elem.y });
                    }
                  }}
                  onUpdateText={(id, text) => {
                    const updated = {
                      ...elem,
                      data: { ...elem.data, text }
                    };
                    setElements((prev) => prev.map(el => el.id === id ? updated : el));
                    getSocket().emit('element_updated', { boardId: currentBoardId, element: updated });
                  }}
                  onUpdateColor={(id, color) => {
                    const updated = { ...elem, color };
                    setElements((prev) => prev.map(el => el.id === id ? updated : el));
                    getSocket().emit('element_updated', { boardId: currentBoardId, element: updated });
                  }}
                  onDelete={handleDeleteSelected}
                />
              );
            }

            // 3. Rectangles
            if (elem.type === 'rect') {
              return (
                <div
                  key={elem.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(elem.id);
                  }}
                  onMouseDown={(e) => {
                    if (activeTool === 'select' && !isViewOnly && !canvasLocked) {
                      e.stopPropagation();
                      setSelectedId(elem.id);
                      setDraggingId(elem.id);
                      const rect = containerRef.current.getBoundingClientRect();
                      const cX = (e.clientX - rect.left - pan.x) / zoom;
                      const cY = (e.clientY - rect.top - pan.y) / zoom;
                      setDragOffset({ x: cX - elem.x, y: cY - elem.y });
                    }
                  }}
                  style={{
                    transform: `translate(${elem.x}px, ${elem.y}px)`,
                    width: `${elem.width}px`,
                    height: `${elem.height}px`,
                    borderColor: elem.stroke || '#7F1D3F',
                    borderWidth: `${elem.strokeWidth || 2}px`,
                    borderStyle: elem.dashed ? 'dashed' : 'solid',
                    backgroundColor: elem.fill || '#7F1D3F15',
                    outline: isSelected ? '2px dashed #7F1D3F' : undefined,
                  }}
                  className="absolute rounded-xl pointer-events-auto cursor-grab shadow-2xs"
                />
              );
            }

            // 4. Circle
            if (elem.type === 'circle') {
              return (
                <div
                  key={elem.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(elem.id);
                  }}
                  onMouseDown={(e) => {
                    if (activeTool === 'select' && !isViewOnly && !canvasLocked) {
                      e.stopPropagation();
                      setSelectedId(elem.id);
                      setDraggingId(elem.id);
                      const rect = containerRef.current.getBoundingClientRect();
                      const cX = (e.clientX - rect.left - pan.x) / zoom;
                      const cY = (e.clientY - rect.top - pan.y) / zoom;
                      setDragOffset({ x: cX - elem.x, y: cY - elem.y });
                    }
                  }}
                  style={{
                    transform: `translate(${elem.x - (elem.radius || 60)}px, ${elem.y - (elem.radius || 60)}px)`,
                    width: `${(elem.radius || 60) * 2}px`,
                    height: `${(elem.radius || 60) * 2}px`,
                    borderColor: elem.stroke || '#7F1D3F',
                    borderWidth: `${elem.strokeWidth || 2}px`,
                    backgroundColor: elem.fill || '#7F1D3F15',
                    outline: isSelected ? '2px dashed #7F1D3F' : undefined,
                  }}
                  className="absolute rounded-full pointer-events-auto cursor-grab shadow-2xs"
                />
              );
            }

            // 5. Text Label
            if (elem.type === 'text') {
              return (
                <div
                  key={elem.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(elem.id);
                  }}
                  onMouseDown={(e) => {
                    if (activeTool === 'select' && !isViewOnly && !canvasLocked) {
                      e.stopPropagation();
                      setSelectedId(elem.id);
                      setDraggingId(elem.id);
                      const rect = containerRef.current.getBoundingClientRect();
                      const cX = (e.clientX - rect.left - pan.x) / zoom;
                      const cY = (e.clientY - rect.top - pan.y) / zoom;
                      setDragOffset({ x: cX - elem.x, y: cY - elem.y });
                    }
                  }}
                  style={{
                    transform: `translate(${elem.x}px, ${elem.y}px)`,
                    color: elem.color || '#292323',
                    outline: isSelected ? '2px dashed #7F1D3F' : undefined,
                  }}
                  className="absolute font-headline font-bold text-base pointer-events-auto cursor-grab px-2 py-1 rounded"
                >
                  {elem.text}
                </div>
              );
            }

            return null;
          })}

          {/* Live Collaborators Remote Cursors */}
          {showCursors &&
            Object.entries(remoteCursors).map(([sId, c]) => (
              <RemoteCursor
                key={sId}
                x={c.x}
                y={c.y}
                userName={c.userName}
                avatarColor={c.avatarColor}
              />
            ))}
        </div>
      </div>

      {/* FLOATING COLOR & STROKE PALETTE with Dark Charcoal Surface */}
      {!isViewOnly && (
        <ColorPicker
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
          activeColor={activeColor}
          onChangeColor={setActiveColor}
          strokeWidth={strokeWidth}
          onChangeStrokeWidth={setStrokeWidth}
          isDashed={isDashed}
          onToggleDashed={setIsDashed}
        />
      )}

      {/* PRIMARY FLOATING WHITEBOARD TOOLBAR */}
      {!isViewOnly && (
        <CanvasToolbar
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          selectedId={selectedId}
          onDeleteSelected={handleDeleteSelected}
          onUndo={handleUndo}
          canUndo={canUndo}
        />
      )}
    </div>
  );
}
