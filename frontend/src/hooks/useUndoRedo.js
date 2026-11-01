import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook providing robust undo/redo capabilities for the canvas.
 * Manages action-based history:
 *  - 'create': element created ({ after })
 *  - 'delete': element deleted ({ before })
 *  - 'update': element modified ({ before, after })
 *  - 'batch': multiple actions ({ actions })
 *
 * @param {Object} params
 * @param {string} params.boardId
 * @param {Function} params.setElements
 * @param {Function} params.getSocket
 * @param {boolean} params.isViewOnly
 * @returns {{ pushAction: Function, undo: Function, redo: Function, canUndo: boolean, canRedo: boolean, clearHistory: Function }}
 */
function applyInverseToElements(elements, act) {
  if (act.type === 'create') {
    return elements.filter((e) => e.id !== act.after.id);
  }
  if (act.type === 'delete') {
    return [...elements.filter((e) => e.id !== act.before.id), act.before];
  }
  if (act.type === 'update') {
    return elements.map((e) => (e.id === act.before.id ? act.before : e));
  }
  if (act.type === 'batch') {
    let curr = elements;
    const rev = [...(act.actions || [])].reverse();
    for (const sub of rev) {
      curr = applyInverseToElements(curr, sub);
    }
    return curr;
  }
  return elements;
}

function applyForwardToElements(elements, act) {
  if (act.type === 'create') {
    return [...elements.filter((e) => e.id !== act.after.id), act.after];
  }
  if (act.type === 'delete') {
    return elements.filter((e) => e.id !== act.before.id);
  }
  if (act.type === 'update') {
    return elements.map((e) => (e.id === act.after.id ? act.after : e));
  }
  if (act.type === 'batch') {
    let curr = elements;
    for (const sub of (act.actions || [])) {
      curr = applyForwardToElements(curr, sub);
    }
    return curr;
  }
  return elements;
}

function emitInverseSocketEvents(act, socket, boardId) {
  if (!socket || !socket.connected) return;
  if (act.type === 'create') {
    socket.emit('element_deleted', { boardId, elementId: act.after.id });
  } else if (act.type === 'delete') {
    socket.emit('element_created', { boardId, element: act.before });
  } else if (act.type === 'update') {
    socket.emit('element_updated', { boardId, element: act.before });
  } else if (act.type === 'batch') {
    const rev = [...(act.actions || [])].reverse();
    for (const sub of rev) {
      emitInverseSocketEvents(sub, socket, boardId);
    }
  }
}

function emitForwardSocketEvents(act, socket, boardId) {
  if (!socket || !socket.connected) return;
  if (act.type === 'create') {
    socket.emit('element_created', { boardId, element: act.after });
  } else if (act.type === 'delete') {
    socket.emit('element_deleted', { boardId, elementId: act.before.id });
  } else if (act.type === 'update') {
    socket.emit('element_updated', { boardId, element: act.after });
  } else if (act.type === 'batch') {
    for (const sub of (act.actions || [])) {
      emitForwardSocketEvents(sub, socket, boardId);
    }
  }
}

export function useUndoRedo({ boardId, setElements, getSocket, isViewOnly }) {
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushAction = useCallback((action) => {
    if (isViewOnly || !action) return;
    undoStackRef.current.push(action);
    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [isViewOnly]);

  const undo = useCallback(() => {
    if (isViewOnly) return;
    if (undoStackRef.current.length === 0) return;
    const action = undoStackRef.current.pop();
    setCanUndo(undoStackRef.current.length > 0);

    setElements((prev) => applyInverseToElements(prev, action));
    const socket = getSocket();
    emitInverseSocketEvents(action, socket, boardId);

    redoStackRef.current.push(action);
    if (redoStackRef.current.length > 50) {
      redoStackRef.current.shift();
    }
    setCanRedo(true);
  }, [boardId, isViewOnly, setElements, getSocket]);

  const redo = useCallback(() => {
    if (isViewOnly) return;
    if (redoStackRef.current.length === 0) return;
    const action = redoStackRef.current.pop();
    setCanRedo(redoStackRef.current.length > 0);

    setElements((prev) => applyForwardToElements(prev, action));
    const socket = getSocket();
    emitForwardSocketEvents(action, socket, boardId);

    undoStackRef.current.push(action);
    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift();
    }
    setCanUndo(true);
  }, [boardId, isViewOnly, setElements, getSocket]);

  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return {
    pushAction,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
}
