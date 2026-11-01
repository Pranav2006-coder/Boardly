import { useCallback, useRef } from 'react';
import { distance, smoothPath, isPointNearStroke, getBounds, resolveFill } from '../utils/math';

/**
 * Custom hook managing whiteboard canvas mouse interactions:
 * - Panning, zooming, and cursor broadcasting
 * - Drawing with Pen (smoothPath, min distance filter of 2px, dot on single click)
 * - Erasing any element type (isPointNearStroke for strokes/curves, padded getBounds for other shapes)
 * - Dragging shapes / notes / cards (with line/arrow endpoints shifting)
 * - Creation of shapes (rect, circle, line, arrow, triangle, diamond, star, sticky, system, text)
 *
 * @param {Object} deps
 * @returns {{ handleMouseDown: Function, handleMouseMove: Function, handleMouseUp: Function }}
 */
const SHAPE_TOOLS = ['rect', 'circle', 'line', 'arrow', 'triangle', 'diamond', 'star'];

function computeShapeGeometry(type, startX, startY, curX, curY, shiftKey) {
  const dx = curX - startX;
  const dy = curY - startY;

  if (type === 'rect' || type === 'diamond') {
    if (shiftKey) {
      const side = Math.max(Math.abs(dx), Math.abs(dy));
      const x = dx >= 0 ? startX : startX - side;
      const y = dy >= 0 ? startY : startY - side;
      return { x, y, width: side, height: side };
    }
    return {
      x: Math.min(startX, curX),
      y: Math.min(startY, curY),
      width: Math.abs(dx),
      height: Math.abs(dy),
    };
  }

  if (type === 'circle') {
    return {
      x: startX,
      y: startY,
      radius: Math.round(Math.hypot(dx, dy)),
    };
  }

  if (type === 'triangle' || type === 'star') {
    const size = Math.max(Math.abs(dx), Math.abs(dy));
    const x = dx >= 0 ? startX : startX - size;
    const y = dy >= 0 ? startY : startY - size;
    return { x, y, size };
  }

  if (type === 'line' || type === 'arrow') {
    if (shiftKey) {
      const angle = Math.atan2(dy, dx);
      const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const len = Math.hypot(dx, dy);
      return {
        x: startX,
        y: startY,
        x2: startX + len * Math.cos(snappedAngle),
        y2: startY + len * Math.sin(snappedAngle),
      };
    }
    return {
      x: startX,
      y: startY,
      x2: curX,
      y2: curY,
    };
  }

  return {};
}

function getDefaultShapeGeometry(type, startX, startY) {
  switch (type) {
    case 'rect':
      return { x: startX, y: startY, width: 200, height: 120 };
    case 'circle':
      return { x: startX, y: startY, radius: 60 };
    case 'line':
    case 'arrow':
      return { x: startX, y: startY, x2: startX + 200, y2: startY };
    case 'triangle':
      return { x: startX, y: startY, size: 100 };
    case 'diamond':
      return { x: startX, y: startY, width: 160, height: 100 };
    case 'star':
      return { x: startX, y: startY, size: 60 };
    default:
      return {};
  }
}

export function useCanvas({
  containerRef,
  pan,
  setPan,
  zoom,
  isPanning,
  setIsPanning,
  startPan,
  setStartPan,
  activeTool,
  setActiveTool,
  activeColor,
  fillColor,
  strokeWidth,
  isDashed,
  elements,
  setElements,
  selectedId,
  setSelectedId,
  draggingId,
  setDraggingId,
  dragOffset,
  setDragOffset,
  currentPath,
  setCurrentPath,
  isViewOnly,
  canvasLocked,
  snapToGrid,
  user,
  currentBoardId,
  pushHistory,
  getSocket,
  eraserRadiusPx = 10,
  draftShape,
  setDraftShape,
  textInput,
  setTextInput,
}) {
  const lastCursorMoveRef = useRef({ time: 0, x: null, y: null });
  const strokeChunkRef = useRef({ lastSentIndex: 0, lastSentTime: 0 });

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const canvasX = (clientX - pan.x) / zoom;
    const canvasY = (clientY - pan.y) / zoom;

    const now = Date.now();
    if (
      now - lastCursorMoveRef.current.time >= 25 &&
      (lastCursorMoveRef.current.x !== canvasX || lastCursorMoveRef.current.y !== canvasY)
    ) {
      lastCursorMoveRef.current = { time: now, x: canvasX, y: canvasY };
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('cursor_move', {
          boardId: currentBoardId,
          x: canvasX,
          y: canvasY,
        });
      }
    }

    // Panning canvas with space or middle click or select drag
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
      return;
    }

    // Updating drag-to-draw shape draft
    if (draftShape && !isViewOnly && !canvasLocked) {
      const curX = snapToGrid ? Math.round(canvasX / 16) * 16 : canvasX;
      const curY = snapToGrid ? Math.round(canvasY / 16) * 16 : canvasY;
      const geo = computeShapeGeometry(
        draftShape.type,
        draftShape.startX,
        draftShape.startY,
        curX,
        curY,
        e.shiftKey
      );
      setDraftShape((prev) => (prev ? { ...prev, ...geo, curX, curY } : null));
      return;
    }

    // Drawing with Pen
    if (currentPath && activeTool === 'pen') {
      const prevPoints = currentPath.points || [];
      const lastPoint = prevPoints[prevPoints.length - 1];
      const newPoint = { x: canvasX, y: canvasY };

      // Ignore points closer than 2 canvas px to previous point
      if (!lastPoint || distance(lastPoint, newPoint) >= 2) {
        const nextPoints = [...prevPoints, newPoint];
        setCurrentPath((prev) => ({
          ...prev,
          points: nextPoints,
        }));

        if (!isViewOnly && !canvasLocked) {
          const chunkNow = Date.now();
          if (chunkNow - strokeChunkRef.current.lastSentTime >= 50) {
            const unsent = nextPoints.slice(strokeChunkRef.current.lastSentIndex);
            if (unsent.length > 0) {
              const socket = getSocket();
              if (socket && socket.connected) {
                socket.emit('draw_stroke_chunk', {
                  boardId: currentBoardId,
                  strokeId: currentPath.id,
                  color: currentPath.color,
                  width: currentPath.width,
                  dashed: currentPath.dashed,
                  points: unsent,
                });
                strokeChunkRef.current.lastSentIndex = nextPoints.length;
                strokeChunkRef.current.lastSentTime = chunkNow;
              }
            }
          }
        }
      }
      return;
    }

    // Erasing while dragging across elements with eraser
    if (activeTool === 'eraser' && !isViewOnly && !canvasLocked && (e.buttons === 1 || e.pressure > 0)) {
      const erasePoint = { x: canvasX, y: canvasY };
      const toRemove = [];

      for (const elem of elements) {
        let hit = false;
        if (elem.type === 'stroke') {
          hit = isPointNearStroke(erasePoint, elem.points || [], eraserRadiusPx);
        } else if (elem.type === 'curve') {
          if (elem.points && elem.points.length > 0) {
            hit = isPointNearStroke(erasePoint, elem.points, eraserRadiusPx);
          } else {
            const b = getBounds(elem);
            if (b) {
              hit =
                erasePoint.x >= b.x - eraserRadiusPx &&
                erasePoint.x <= b.x + b.width + eraserRadiusPx &&
                erasePoint.y >= b.y - eraserRadiusPx &&
                erasePoint.y <= b.y + b.height + eraserRadiusPx;
            }
          }
        } else {
          const b = getBounds(elem);
          if (b) {
            hit =
              erasePoint.x >= b.x - eraserRadiusPx &&
              erasePoint.x <= b.x + b.width + eraserRadiusPx &&
              erasePoint.y >= b.y - eraserRadiusPx &&
              erasePoint.y <= b.y + b.height + eraserRadiusPx;
          }
        }

        if (hit) {
          toRemove.push(elem.id);
        }
      }

      if (toRemove.length > 0) {
        pushHistory();
        setElements((prev) => prev.filter((el) => !toRemove.includes(el.id)));
        const sock = getSocket();
        for (const id of toRemove) {
          sock.emit('element_deleted', { boardId: currentBoardId, elementId: id });
        }
        if (selectedId && toRemove.includes(selectedId)) {
          setSelectedId(null);
        }
      }
      return;
    }

    // Dragging an element
    if (draggingId && !isViewOnly && !canvasLocked) {
      const snappedX = snapToGrid ? Math.round((canvasX - dragOffset.x) / 16) * 16 : canvasX - dragOffset.x;
      const snappedY = snapToGrid ? Math.round((canvasY - dragOffset.y) / 16) * 16 : canvasY - dragOffset.y;

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== draggingId) return el;
          // For line/arrow, shift both endpoints by the same delta
          if (el.x2 !== undefined && el.y2 !== undefined) {
            const dx = snappedX - el.x;
            const dy = snappedY - el.y;
            return { ...el, x: snappedX, y: snappedY, x2: el.x2 + dx, y2: el.y2 + dy };
          }
          return { ...el, x: snappedX, y: snappedY };
        })
      );
    }
  }, [
    containerRef,
    pan,
    setPan,
    zoom,
    isPanning,
    startPan,
    currentPath,
    activeTool,
    setCurrentPath,
    isViewOnly,
    canvasLocked,
    elements,
    eraserRadiusPx,
    pushHistory,
    setElements,
    getSocket,
    currentBoardId,
    selectedId,
    setSelectedId,
    draggingId,
    snapToGrid,
    dragOffset,
    draftShape,
    setDraftShape,
  ]);

  const handleMouseDown = useCallback((e) => {
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
      strokeChunkRef.current = { lastSentIndex: 0, lastSentTime: Date.now() };
      setCurrentPath({
        id: `stroke-${Date.now()}`,
        type: 'stroke',
        color: activeColor,
        width: strokeWidth,
        dashed: isDashed,
        points: [{ x: canvasX, y: canvasY }],
      });
    } else if (activeTool === 'eraser') {
      const erasePoint = { x: canvasX, y: canvasY };
      const toRemove = [];

      for (const elem of elements) {
        let hit = false;
        if (elem.type === 'stroke') {
          hit = isPointNearStroke(erasePoint, elem.points || [], eraserRadiusPx);
        } else if (elem.type === 'curve') {
          if (elem.points && elem.points.length > 0) {
            hit = isPointNearStroke(erasePoint, elem.points, eraserRadiusPx);
          } else {
            const b = getBounds(elem);
            if (b) {
              hit =
                erasePoint.x >= b.x - eraserRadiusPx &&
                erasePoint.x <= b.x + b.width + eraserRadiusPx &&
                erasePoint.y >= b.y - eraserRadiusPx &&
                erasePoint.y <= b.y + b.height + eraserRadiusPx;
            }
          }
        } else {
          const b = getBounds(elem);
          if (b) {
            hit =
              erasePoint.x >= b.x - eraserRadiusPx &&
              erasePoint.x <= b.x + b.width + eraserRadiusPx &&
              erasePoint.y >= b.y - eraserRadiusPx &&
              erasePoint.y <= b.y + b.height + eraserRadiusPx;
          }
        }

        if (hit) {
          toRemove.push(elem.id);
        }
      }

      if (toRemove.length > 0) {
        pushHistory();
        setElements((prev) => prev.filter((el) => !toRemove.includes(el.id)));
        const sock = getSocket();
        for (const id of toRemove) {
          sock.emit('element_deleted', { boardId: currentBoardId, elementId: id });
        }
        if (selectedId && toRemove.includes(selectedId)) {
          setSelectedId(null);
        }
      }
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
          author: `${user?.name || 'Collaborator'}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        },
      };
      setElements((prev) => [...prev, newSticky]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newSticky });
      setActiveTool('select');
      setSelectedId(newSticky.id);
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
          statusColor: '#7F1D3F',
        },
      };
      setElements((prev) => [...prev, newSystem]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newSystem });
      setActiveTool('select');
      setSelectedId(newSystem.id);
    } else if (activeTool === 'text') {
      if (textInput) return;
      setTextInput({
        x: snapToGrid ? Math.round(canvasX / 16) * 16 : canvasX,
        y: snapToGrid ? Math.round(canvasY / 16) * 16 : canvasY,
      });
    } else if (SHAPE_TOOLS.includes(activeTool)) {
      const startX = snapToGrid ? Math.round(canvasX / 16) * 16 : canvasX;
      const startY = snapToGrid ? Math.round(canvasY / 16) * 16 : canvasY;
      const initialDraft = {
        type: activeTool,
        startX,
        startY,
        x: startX,
        y: startY,
        x2: startX,
        y2: startY,
        width: 0,
        height: 0,
        radius: 0,
        size: 0,
        curX: startX,
        curY: startY,
        stroke: activeColor,
        strokeWidth,
        dashed: isDashed,
        fill: resolveFill(fillColor, activeColor),
      };
      setDraftShape(initialDraft);
    }
  }, [
    canvasLocked,
    activeTool,
    containerRef,
    pan,
    setStartPan,
    setIsPanning,
    isViewOnly,
    zoom,
    pushHistory,
    setCurrentPath,
    activeColor,
    strokeWidth,
    isDashed,
    elements,
    eraserRadiusPx,
    setElements,
    getSocket,
    currentBoardId,
    selectedId,
    setSelectedId,
    snapToGrid,
    user,
    setActiveTool,
    fillColor,
    textInput,
    setTextInput,
    setDraftShape,
  ]);

  const handleMouseUp = useCallback((e) => {
    setIsPanning(false);

    if (draftShape) {
      let curX = draftShape.startX;
      let curY = draftShape.startY;
      if (containerRef.current && e) {
        const rect = containerRef.current.getBoundingClientRect();
        const cX = (e.clientX - rect.left - pan.x) / zoom;
        const cY = (e.clientY - rect.top - pan.y) / zoom;
        curX = snapToGrid ? Math.round(cX / 16) * 16 : cX;
        curY = snapToGrid ? Math.round(cY / 16) * 16 : cY;
      } else if (draftShape.curX !== undefined && draftShape.curY !== undefined) {
        curX = draftShape.curX;
        curY = draftShape.curY;
      }

      const dragDist = Math.hypot(curX - draftShape.startX, curY - draftShape.startY);
      const isDrag = dragDist >= 4;
      const geo = isDrag
        ? computeShapeGeometry(draftShape.type, draftShape.startX, draftShape.startY, curX, curY, e?.shiftKey)
        : getDefaultShapeGeometry(draftShape.type, draftShape.startX, draftShape.startY);

      const type = draftShape.type;
      const newElem = {
        id: `${type}-${Date.now()}`,
        type,
        ...geo,
        stroke: draftShape.stroke,
        strokeWidth: draftShape.strokeWidth,
      };

      if (type === 'rect' || type === 'line' || type === 'arrow' || type === 'triangle' || type === 'diamond' || type === 'star') {
        newElem.dashed = draftShape.dashed;
      }
      if (type === 'rect' || type === 'circle' || type === 'triangle' || type === 'diamond' || type === 'star') {
        newElem.fill = draftShape.fill;
      }

      pushHistory();
      setElements((prev) => [...prev, newElem]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newElem });
      setSelectedId(newElem.id);
      setActiveTool('select');
      setDraftShape(null);
      return;
    }

    if (currentPath) {
      let finalPath = currentPath;
      // Single click with no movement creates a small dot (a 2-point stroke)
      if (currentPath.points && currentPath.points.length === 1) {
        const pt = currentPath.points[0];
        finalPath = {
          ...currentPath,
          points: [pt, { x: pt.x + 0.5, y: pt.y + 0.5 }],
        };
      }

      if (!isViewOnly && !canvasLocked) {
        const unsent = (finalPath.points || []).slice(strokeChunkRef.current.lastSentIndex);
        if (unsent.length > 0) {
          const socket = getSocket();
          if (socket && socket.connected) {
            socket.emit('draw_stroke_chunk', {
              boardId: currentBoardId,
              strokeId: finalPath.id,
              color: finalPath.color,
              width: finalPath.width,
              dashed: finalPath.dashed,
              points: unsent,
            });
          }
        }
        strokeChunkRef.current = { lastSentIndex: 0, lastSentTime: 0 };
      }

      setElements((prev) => [...prev, finalPath]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: finalPath });
      setCurrentPath(null);
    }

    if (draggingId) {
      const dragged = elements.find((e) => e.id === draggingId);
      if (dragged) {
        getSocket().emit('element_updated', { boardId: currentBoardId, element: dragged });
      }
      setDraggingId(null);
    }
  }, [
    setIsPanning,
    draftShape,
    containerRef,
    pan,
    zoom,
    snapToGrid,
    pushHistory,
    setElements,
    getSocket,
    currentBoardId,
    setSelectedId,
    setActiveTool,
    setDraftShape,
    currentPath,
    setCurrentPath,
    draggingId,
    elements,
    setDraggingId,
    isViewOnly,
    canvasLocked,
  ]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}