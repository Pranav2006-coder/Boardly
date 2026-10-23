/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const BoardContext = createContext(null);

export function BoardProvider({ board, children }) {
  const [elements, setElements] = useState(board?.elements || []);
  const [activeTool, setActiveTool] = useState('select');
  const [activeColor, setActiveColor] = useState('#111111');
  const [fillColor, setFillColor] = useState(null);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDashed, setIsDashed] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(board?.role === 'viewer');

  const upsertElement = useCallback((element) => {
    if (!element) return;
    setElements((prev) => {
      const index = prev.findIndex((el) => el.id === element.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = element;
        return next;
      }
      return [...prev, element];
    });
  }, []);

  const removeElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  const clearElements = useCallback(() => {
    setElements([]);
  }, []);

  const value = useMemo(
    () => ({
      elements,
      setElements,
      activeTool,
      setActiveTool,
      activeColor,
      setActiveColor,
      fillColor,
      setFillColor,
      strokeWidth,
      setStrokeWidth,
      isDashed,
      setIsDashed,
      selectedId,
      setSelectedId,
      isViewOnly,
      setIsViewOnly,
      upsertElement,
      removeElement,
      clearElements,
    }),
    [
      elements,
      activeTool,
      activeColor,
      fillColor,
      strokeWidth,
      isDashed,
      selectedId,
      isViewOnly,
      upsertElement,
      removeElement,
      clearElements,
    ]
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
}
