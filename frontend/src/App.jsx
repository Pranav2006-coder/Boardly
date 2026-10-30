import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/Landing/LandingPage';
import AuthPage from './components/Auth/AuthPage';
import DashboardView from './components/Dashboard/DashboardView';
import WhiteboardWorkspace from './components/Workspace/WhiteboardWorkspace';
import NewBoardModal from './components/Modals/NewBoardModal';
import ShareModal from './components/Modals/ShareModal';
import { boardApi } from './services/api';

function MainApp() {
  const { user, loading } = useAuth();
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [shareModalBoard, setShareModalBoard] = useState(null);
  const [loadingBoards, setLoadingBoards] = useState(false);
  // Landing page visibility — shown only when no user is logged in
  const [showLanding, setShowLanding] = useState(true);

  const loadBoards = useCallback(async () => {
    setLoadingBoards(true);
    try {
      const data = await boardApi.getBoards();
      setBoards(data);
    } catch {
      // Fallback sample boards if backend is booting or offline
      setBoards([
        {
          id: 'b-arch-2025',
          roomCode: 'X9K-72M',
          title: 'Q4 Product Architecture & Core Flows',
          description: 'Distributed microservices, event streaming architecture, and client edge security routing.',
          createdBy: user?.id || 'usr_alex',
          isPublic: true,
          gridStyle: 'dots',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isStarred: true,
          collaborators: [
            { id: 'usr_alex', name: 'Alex Morgan', role: 'owner', email: 'alex@boardly.app', avatarColor: '#7F1D3F' },
            { id: 'usr_sarah', name: 'Sarah Chen', role: 'editor', email: 'sarah@boardly.app', avatarColor: '#A63D57' },
          ],
          elements: [
            {
              id: 'comp-ingress-1',
              type: 'system-node',
              x: 140,
              y: 240,
              data: {
                category: 'Edge Gateway',
                version: 'v2.14.0',
                title: 'INGRESS CONTROLLER',
                subtitle: 'API Gateway, SSL & Edge Route Guard',
                latency: '14ms',
                uptime: '99.995%',
                pods: '4 Pods healthy',
                throughput: '12.4k req/s',
                statusColor: '#7F1D3F'
              }
            },
            {
              id: 'comp-mesh-1',
              type: 'system-node',
              x: 580,
              y: 220,
              data: {
                category: 'Core Runtime',
                version: 'Active Focus',
                title: 'SERVICE MESH',
                subtitle: 'Core Session & Distributed Event Orchestrator',
                loadBalancer: 'Envoy 1.28 (78%)',
                stream: 'Kafka 48,200 msg/sec',
                inspectedBy: 'Inspected by Alice',
                nodeId: 'srv-orchestrator-01',
                statusColor: '#A63D57'
              }
            },
            {
              id: 'sticky-mint-1',
              type: 'sticky',
              x: 440,
              y: 380,
              color: '#FFF8F0',
              textColor: '#292323',
              data: {
                tag: 'Architecture Note',
                text: 'Ensure Webhook broker maintains idempotent retry queue for intermittent client drops.',
                author: 'Alice, 10:42 AM'
              }
            }
          ]
        },
        {
          id: 'b-ux-design-kit',
          roomCode: 'B7X-92Q',
          title: 'UX Design System Kit & Component Canvas',
          description: 'Design tokens, accessibility guidelines, and interactive micro-interactions.',
          createdBy: 'usr_sarah',
          isPublic: true,
          gridStyle: 'major',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isStarred: true,
          collaborators: [
            { id: 'usr_sarah', name: 'Sarah Chen', role: 'owner', email: 'sarah@boardly.app', avatarColor: '#A63D57' },
          ],
          elements: []
        }
      ]);
    } finally {
      setLoadingBoards(false);
    }
  }, [user?.id]);

  const handleJoinRoomCode = useCallback(async (code) => {
    const norm = code.replace(/[\s-]/g, '').toUpperCase();
    try {
      // First attempt to join by code to gain membership (FR-02, AC-01)
      let joinRes = null;
      try {
        joinRes = await boardApi.joinBoard(norm);
      } catch {
        // Fall back to direct lookup if already a member or public
      }

      const board = joinRes?.board || (await boardApi.getBoardByRoomCode(norm));
      if (board) {
        const boardId = board.id || board._id;
        setBoards((prev) => {
          if (!prev.find((b) => (b.id || b._id) === boardId)) {
            return [board, ...prev];
          }
          return prev;
        });
        setActiveBoardId(boardId);
      }
    } catch {
      // Look up locally
      setBoards((prev) => {
        const match = prev.find((b) => (b.roomCode || '').replace(/[\s-]/g, '') === norm);
        if (match) {
          setActiveBoardId(match.id || match._id);
        } else {
          alert(`Room "${code}" not found. Please verify the 6-digit room code.`);
        }
        return prev;
      });
    }
  }, []);

  // Initial boards fetch
  useEffect(() => {
    if (user) {
      let cancelled = false;
      Promise.resolve().then(() => {
        if (!cancelled) loadBoards();
      });
      return () => { cancelled = true; };
    }
  }, [user, loadBoards]);

  // Check URL room code or board param on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      let cancelled = false;
      Promise.resolve().then(() => {
        if (!cancelled) handleJoinRoomCode(code);
      });
      return () => { cancelled = true; };
    }
  }, [handleJoinRoomCode]);

  const handleCreateBoard = async (boardData) => {
    try {
      const newBoard = await boardApi.createBoard(boardData);
      setBoards((prev) => [newBoard, ...prev]);
      setActiveBoardId(newBoard.id || newBoard._id);
    } catch {
      // Local fallback
      const fallbackBoard = {
        id: `b-${Date.now()}`,
        roomCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        title: boardData.title || 'Untitled Whiteboard',
        description: boardData.description || 'Collaborative whiteboard canvas',
        template: boardData.template || 'blank',
        createdBy: user?.id,
        isPublic: boardData.isPublic !== false,
        gridStyle: boardData.gridStyle || 'dots',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isStarred: false,
        collaborators: [
          { id: user?.id, name: user?.name, role: 'owner', email: user?.email, avatarColor: user?.avatarColor || '#7F1D3F' }
        ],
        elements: []
      };
      setBoards((prev) => [fallbackBoard, ...prev]);
      setActiveBoardId(fallbackBoard.id);
    }
  };

  const handleUpdateBoard = async (id, data) => {
    try {
      const updated = await boardApi.updateBoard(id, data);
      setBoards((prev) => prev.map((b) => (b.id || b._id) === id ? { ...b, ...updated } : b));
    } catch {
      setBoards((prev) => prev.map((b) => (b.id || b._id) === id ? { ...b, ...data } : b));
    }
  };

  const handleDeleteBoard = async (id) => {
    if (window.confirm('Are you sure you want to delete this board?')) {
      try {
        await boardApi.deleteBoard(id);
      } catch {
        // Ignored
      }
      setBoards((prev) => prev.filter((b) => (b.id || b._id) !== id));
      if (activeBoardId === id) setActiveBoardId(null);
    }
  };

  const handleToggleStar = async (id) => {
    const target = boards.find((b) => (b.id || b._id) === id);
    if (target) {
      handleUpdateBoard(id, { isStarred: !target.isStarred });
    }
  };

  const handleAddCollaborator = async (boardId, email, role) => {
    try {
      const updatedBoard = await boardApi.addCollaborator(boardId, email, role);
      setBoards((prev) => prev.map((b) => (b.id || b._id) === boardId ? updatedBoard : b));
      if (shareModalBoard && (shareModalBoard.id || shareModalBoard._id) === boardId) {
        setShareModalBoard(updatedBoard);
      }
    } catch {
      // Local fallback
      setBoards((prev) =>
        prev.map((b) => {
          if ((b.id || b._id) !== boardId) return b;
          const updated = {
            ...b,
            collaborators: [
              ...(b.collaborators || []),
              {
                id: `usr_${Date.now()}`,
                name: email.split('@')[0],
                email,
                avatarColor: '#7F1D3F',
                role
              }
            ]
          };
          if (shareModalBoard && (shareModalBoard.id || shareModalBoard._id) === boardId) {
            setShareModalBoard(updated);
          }
          return updated;
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  // Not logged in — show Landing or Auth
  if (!user) {
    if (showLanding) {
      return (
        <LandingPage
          onGetStarted={() => setShowLanding(false)}
          onSignIn={() => setShowLanding(false)}
        />
      );
    }
    return <AuthPage onLoginSuccess={loadBoards} />;
  }

  const activeBoard = boards.find((b) => (b.id || b._id) === activeBoardId);

  // In active whiteboard workspace
  if (activeBoard) {
    return (
      <WhiteboardWorkspace
        board={activeBoard}
        onBackToDashboard={() => setActiveBoardId(null)}
        onUpdateBoard={handleUpdateBoard}
        onAddCollaborator={handleAddCollaborator}
      />
    );
  }

  // Otherwise, in Dashboard View from Stitch
  return (
    <>
      <DashboardView
        boards={boards}
        loadingBoards={loadingBoards}
        onOpenBoard={(id) => setActiveBoardId(id)}
        onOpenNewModal={() => setNewModalOpen(true)}
        onJoinRoomCode={handleJoinRoomCode}
        onToggleStar={handleToggleStar}
        onDeleteBoard={handleDeleteBoard}
        onShareBoard={(b) => setShareModalBoard(b)}
      />

      {/* Modals */}
      <NewBoardModal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onCreateBoard={handleCreateBoard}
      />

      <ShareModal
        isOpen={!!shareModalBoard}
        onClose={() => setShareModalBoard(null)}
        board={shareModalBoard}
        onAddCollaborator={handleAddCollaborator}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
