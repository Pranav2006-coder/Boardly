import { useCallback } from 'react';
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
}) {
  const handleMouseMove = useCallback((e) => {
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
        y: canvasY,
      });
    }

    // Panning canvas with space or middle click or select drag
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
      return;
    }

    // Drawing with Pen
    if (currentPath && activeTool === 'pen') {
      const prevPoints = currentPath.points || [];
      const lastPoint = prevPoints[prevPoints.length - 1];
      const newPoint = { x: canvasX, y: canvasY };

      // Ignore points closer than 2 canvas px to previous point
      if (!lastPoint || distance(lastPoint, newPoint) >= 2) {
        setCurrentPath((prev) => ({
          ...prev,
          points: [...prev.points, newPoint],
        }));
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
        fill: resolveFill(fillColor, activeColor),
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
        fill: resolveFill(fillColor, activeColor),
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
          statusColor: '#7F1D3F',
        },
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
          fontSize: 16,
        };
        setElements((prev) => [...prev, newText]);
        getSocket().emit('element_created', { boardId: currentBoardId, element: newText });
      }
      setActiveTool('select');
    } else if (activeTool === 'line') {
      pushHistory();
      const newLine = {
        id: `line-${Date.now()}`,
        type: 'line',
        x: canvasX,
        y: canvasY,
        x2: canvasX + 200,
        y2: canvasY,
        stroke: activeColor,
        strokeWidth,
        dashed: isDashed,
      };
      setElements((prev) => [...prev, newLine]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newLine });
      setActiveTool('select');
      setSelectedId(newLine.id);
    } else if (activeTool === 'arrow') {
      pushHistory();
      const newArrow = {
        id: `arrow-${Date.now()}`,
        type: 'arrow',
        x: canvasX,
        y: canvasY,
        x2: canvasX + 200,
        y2: canvasY,
        stroke: activeColor,
        strokeWidth,
        dashed: isDashed,
      };
      setElements((prev) => [...prev, newArrow]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newArrow });
      setActiveTool('select');
      setSelectedId(newArrow.id);
    } else if (activeTool === 'triangle') {
      pushHistory();
      const newTriangle = {
        id: `triangle-${Date.now()}`,
        type: 'triangle',
        x: canvasX,
        y: canvasY,
        size: 100,
        stroke: activeColor,
        strokeWidth,
        dashed: isDashed,
        fill: resolveFill(fillColor, activeColor),
      };
      setElements((prev) => [...prev, newTriangle]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newTriangle });
      setActiveTool('select');
      setSelectedId(newTriangle.id);
    } else if (activeTool === 'diamond') {
      pushHistory();
      const newDiamond = {
        id: `diamond-${Date.now()}`,
        type: 'diamond',
        x: canvasX,
        y: canvasY,
        width: 160,
        height: 100,
        stroke: activeColor,
        strokeWidth,
        dashed: isDashed,
        fill: resolveFill(fillColor, activeColor),
      };
      setElements((prev) => [...prev, newDiamond]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newDiamond });
      setActiveTool('select');
      setSelectedId(newDiamond.id);
    } else if (activeTool === 'star') {
      pushHistory();
      const newStar = {
        id: `star-${Date.now()}`,
        type: 'star',
        x: canvasX,
        y: canvasY,
        size: 60,
        stroke: activeColor,
        strokeWidth,
        dashed: isDashed,
        fill: resolveFill(fillColor, activeColor),
      };
      setElements((prev) => [...prev, newStar]);
      getSocket().emit('element_created', { boardId: currentBoardId, element: newStar });
      setActiveTool('select');
      setSelectedId(newStar.id);
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
  ]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);

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
    currentPath,
    setElements,
    getSocket,
    currentBoardId,
    setCurrentPath,
    draggingId,
    elements,
    setDraggingId,
  ]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}