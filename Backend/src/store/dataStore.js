import { v4 as uuidv4 } from 'uuid';

// In-memory backing store for instant, zero-setup reliability
export const memoryStore = {
  users: [
    {
      id: 'usr_alex',
      name: 'Alex Morgan',
      email: 'alex@boardly.app',
      passwordHash: 'demo', // Demo password
      avatarColor: '#0f766e',
      role: 'Product Lead'
    },
    {
      id: 'usr_sarah',
      name: 'Sarah Chen',
      email: 'sarah@boardly.app',
      passwordHash: 'demo',
      avatarColor: '#ec4899',
      role: 'Staff Designer'
    },
    {
      id: 'usr_marcus',
      name: 'Marcus Brody',
      email: 'marcus@boardly.app',
      passwordHash: 'demo',
      avatarColor: '#f59e0b',
      role: 'Engineering'
    },
    {
      id: 'usr_elena',
      name: 'Elena Rostova',
      email: 'elena@boardly.app',
      passwordHash: 'demo',
      avatarColor: '#8b5cf6',
      role: 'UX Architect'
    }
  ],
  boards: [
    {
      id: 'b-arch-2025',
      roomCode: 'X9K-72M',
      title: 'Q4 Product Architecture & Core Flows',
      description: 'Distributed microservices, event streaming architecture, and client edge security routing.',
      createdBy: 'usr_alex',
      isPublic: true,
      gridStyle: 'dots',
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
      isStarred: true,
      collaborators: [
        { id: 'usr_alex', name: 'Alex Morgan', role: 'owner', email: 'alex@boardly.app', avatarColor: '#0f766e' },
        { id: 'usr_sarah', name: 'Sarah Chen', role: 'editor', email: 'sarah@boardly.app', avatarColor: '#ec4899' },
        { id: 'usr_marcus', name: 'Marcus Brody', role: 'editor', email: 'marcus@boardly.app', avatarColor: '#f59e0b' },
        { id: 'usr_elena', name: 'Elena Rostova', role: 'viewer', email: 'elena@boardly.app', avatarColor: '#8b5cf6' }
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
            statusColor: '#10b981'
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
            statusColor: '#ec4899'
          }
        },
        {
          id: 'sticky-mint-1',
          type: 'sticky',
          x: 440,
          y: 380,
          color: '#dcfce7',
          textColor: '#064e3b',
          data: {
            tag: 'Architecture Note',
            text: 'Ensure Webhook broker maintains idempotent retry queue for intermittent client drops.',
            author: 'Alice, 10:42 AM'
          }
        },
        {
          id: 'sticky-yellow-1',
          type: 'sticky',
          x: 960,
          y: 200,
          color: '#fef08a',
          textColor: '#713f12',
          data: {
            tag: 'Security Review',
            text: 'Zero-trust token propagation across Kafka streams verified. Ready for penetration sign-off!',
            author: 'Bob, 11:15 AM'
          }
        },
        {
          id: 'stroke-curve-1',
          type: 'curve',
          x: 0,
          y: 0,
          data: {
            path: 'M 440 280 C 510 280, 530 320, 580 320',
            stroke: '#0f766e',
            strokeWidth: 3,
            hasArrow: true
          }
        }
      ]
    },
    {
      id: 'b-ux-design-kit',
      roomCode: 'B7X-92Q',
      title: 'UX Design System Kit & Component Canvas',
      description: 'Material Design 3 tokens, accessibility guidelines, and interactive micro-interactions.',
      createdBy: 'usr_sarah',
      isPublic: true,
      gridStyle: 'major',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      isStarred: true,
      collaborators: [
        { id: 'usr_sarah', name: 'Sarah Chen', role: 'owner', email: 'sarah@boardly.app', avatarColor: '#ec4899' },
        { id: 'usr_alex', name: 'Alex Morgan', role: 'editor', email: 'alex@boardly.app', avatarColor: '#0f766e' }
      ],
      elements: [
        {
          id: 'sticky-pink-1',
          type: 'sticky',
          x: 320,
          y: 200,
          color: '#fce7f3',
          textColor: '#831843',
          data: {
            tag: 'Design System',
            text: 'Ensure high contrast ratios (4.5:1) for all typography tokens across dark/light mode.',
            author: 'Sarah, 9:15 AM'
          }
        }
      ]
    },
    {
      id: 'b-roadmap-q3',
      roomCode: 'R9D-44K',
      title: 'Product Roadmap Q3-Q4 Execution Board',
      description: 'Milestones, sprint allocations, and launch checklist.',
      createdBy: 'usr_alex',
      isPublic: false,
      gridStyle: 'dots',
      createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      isStarred: false,
      collaborators: [
        { id: 'usr_alex', name: 'Alex Morgan', role: 'owner', email: 'alex@boardly.app', avatarColor: '#0f766e' },
        { id: 'usr_marcus', name: 'Marcus Brody', role: 'viewer', email: 'marcus@boardly.app', avatarColor: '#f59e0b' }
      ],
      elements: []
    }
  ]
};

// Helper methods
export function findUserById(id) {
  return memoryStore.users.find(u => u.id === id);
}

export function findUserByEmail(email) {
  return memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser({ name, email, passwordHash, avatarColor = '#0f766e' }) {
  const newUser = {
    id: `usr_${uuidv4().slice(0, 8)}`,
    name,
    email,
    passwordHash,
    avatarColor,
    role: 'Member'
  };
  memoryStore.users.push(newUser);
  return newUser;
}

export function getBoardsForUser(userId) {
  return memoryStore.boards.filter(b => 
    b.createdBy === userId || b.collaborators.some(c => c.id === userId) || b.isPublic
  );
}

export function getBoardById(boardId) {
  return memoryStore.boards.find(b => b.id === boardId);
}

export function getBoardByRoomCode(code) {
  const norm = code.toUpperCase().replace(/\s+/g, '');
  return memoryStore.boards.find(b => b.roomCode.replace(/-/g, '') === norm.replace(/-/g, ''));
}

export function createBoard({ title, description, isPublic = true, gridStyle = 'dots', template = 'blank', user }) {
  const roomCodePart1 = Math.random().toString(36).substring(2, 5).toUpperCase();
  const roomCodePart2 = Math.random().toString(36).substring(2, 5).toUpperCase();
  const roomCode = `${roomCodePart1}-${roomCodePart2}`;

  const newBoard = {
    id: `b-${uuidv4().slice(0, 8)}`,
    roomCode,
    title: title || 'Untitled Whiteboard',
    description: description || 'Collaborative whiteboard canvas',
    createdBy: user.id,
    isPublic,
    gridStyle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isStarred: false,
    collaborators: [
      { id: user.id, name: user.name, role: 'owner', email: user.email, avatarColor: user.avatarColor || '#0f766e' }
    ],
    elements: []
  };

  if (template === 'architecture') {
    newBoard.elements = [
      {
        id: `node-${Date.now()}-1`,
        type: 'system-node',
        x: 180,
        y: 220,
        data: {
          category: 'Edge Gateway',
          version: 'v2.14.0',
          title: 'INGRESS CONTROLLER',
          subtitle: 'API Gateway, SSL & Route Guard',
          latency: '14ms',
          uptime: '99.995%',
          pods: '4 Pods healthy',
          throughput: '12.4k req/s',
          statusColor: '#10b981'
        }
      },
      {
        id: `node-${Date.now()}-2`,
        type: 'system-node',
        x: 620,
        y: 200,
        data: {
          category: 'Core Runtime',
          version: 'Active Focus',
          title: 'SERVICE MESH',
          subtitle: 'Distributed Event Orchestrator',
          loadBalancer: 'Envoy 1.28 (78%)',
          stream: 'Kafka 48,200 msg/sec',
          inspectedBy: 'Inspected by Team',
          nodeId: 'srv-orchestrator-01',
          statusColor: '#ec4899'
        }
      },
      {
        id: `sticky-${Date.now()}-3`,
        type: 'sticky',
        x: 460,
        y: 380,
        color: '#dcfce7',
        textColor: '#064e3b',
        data: {
          tag: 'Sprint Note',
          text: 'Idempotency keys implemented across edge and message queues.',
          author: user.name
        }
      }
    ];
  }

  memoryStore.boards.unshift(newBoard);
  return newBoard;
}
