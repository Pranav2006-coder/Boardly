import { memo } from 'react';
import { getBounds, arrowHeadPoints } from '../../utils/math';

const PAD = 6; // selection box padding in canvas px

/**
 * Renders a single SVG element (stroke, curve, line, arrow,
 * triangle, diamond or star) inside the parent pointer-events-none SVG.
 *
 * Individual shapes opt-in to pointer events via SVG pointerEvents="auto".
 *
 * Props:
 *   elem           – the element object
 *   isSelected     – boolean, whether this element is selected
 *   activeTool     – current tool string
 *   isViewOnly     – boolean
 *   canvasLocked   – boolean
 *   onSelect(id)   – call when element is clicked/focused
 *   onDragStart(e, elem) – call to begin dragging
 */
const ElementRenderer = memo(function ElementRenderer({
  elem,
  isSelected,
  activeTool,
  isViewOnly,
  canvasLocked,
  onSelect,
  onDragStart,
}) {
  const canInteract = activeTool === 'select' && !isViewOnly && !canvasLocked;
  const cursor = canInteract ? 'grab' : 'default';

  const handleMouseDown = (e) => {
    if (!canInteract) return;
    e.stopPropagation();
    onSelect(elem.id);
    onDragStart(e, elem);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(elem.id);
  };

  // ── Selection outline rectangle ──────────────────────────────────────────
  let selectionBox = null;
  if (isSelected) {
    const b = getBounds(elem);
    if (b && isFinite(b.x) && isFinite(b.y) && isFinite(b.width) && isFinite(b.height)) {
      selectionBox = (
        <rect
          x={b.x - PAD}
          y={b.y - PAD}
          width={Math.max(0, b.width + PAD * 2)}
          height={Math.max(0, b.height + PAD * 2)}
          fill="none"
          stroke="#111111"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          strokeLinecap="round"
          pointerEvents="none"
          rx={3}
        />
      );
    }
  }

  // ── Stroke (freehand pen) ────────────────────────────────────────────────
  if (elem.type === 'stroke') {
    if (!elem.points || elem.points.length < 2) return null;
    const d = elem.points.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
      ''
    );
    return (
      <g>
        <path
          d={d}
          fill="none"
          stroke={elem.color || '#111111'}
          strokeWidth={elem.width || 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          pointerEvents={canInteract ? 'auto' : 'none'}
          style={{ cursor }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
        />
        {selectionBox}
      </g>
    );
  }

  // ── Curve ────────────────────────────────────────────────────────────────
  if (elem.type === 'curve') {
    if (!elem.data?.path) return null;
    return (
      <g>
        <path
          d={elem.data.path}
          fill="none"
          stroke={elem.data.stroke || '#111111'}
          strokeWidth={elem.data.strokeWidth || 3}
          strokeLinecap="round"
          markerEnd={elem.data.hasArrow ? 'url(#arrow-burgundy)' : undefined}
          pointerEvents={canInteract ? 'auto' : 'none'}
          style={{ cursor }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
        />
        {selectionBox}
      </g>
    );
  }

  // ── Line ─────────────────────────────────────────────────────────────────
  // Fields: x, y, x2, y2, stroke, strokeWidth, dashed
  if (elem.type === 'line') {
    const { x, y, x2, y2 } = elem;
    if (!isFinite(x) || !isFinite(y) || !isFinite(x2) || !isFinite(y2)) return null;
    const strokeColor = elem.stroke || '#111111';
    const sw = elem.strokeWidth || 3;
    return (
      <g onClick={handleClick} onMouseDown={handleMouseDown}>
        {/* Visible line */}
        <line
          x1={x} y1={y} x2={x2} y2={y2}
          stroke={strokeColor}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          pointerEvents="none"
        />
        {/* Wide invisible hit area */}
        <line
          x1={x} y1={y} x2={x2} y2={y2}
          stroke="transparent"
          strokeWidth={Math.max(14, sw + 8)}
          strokeLinecap="round"
          pointerEvents={canInteract ? 'auto' : 'none'}
          style={{ cursor }}
        />
        {selectionBox}
      </g>
    );
  }

  // ── Arrow ─────────────────────────────────────────────────────────────────
  // Fields: x, y, x2, y2, stroke, strokeWidth, dashed
  if (elem.type === 'arrow') {
    const { x, y, x2, y2 } = elem;
    if (!isFinite(x) || !isFinite(y) || !isFinite(x2) || !isFinite(y2)) return null;
    const strokeColor = elem.stroke || '#111111';
    const sw = elem.strokeWidth || 3;
    const pts = arrowHeadPoints(x, y, x2, y2, 12 + sw * 2);
    const headPoly = pts.map((p) => `${p.x},${p.y}`).join(' ');
    return (
      <g onClick={handleClick} onMouseDown={handleMouseDown}>
        {/* Visible shaft */}
        <line
          x1={x} y1={y} x2={x2} y2={y2}
          stroke={strokeColor}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          pointerEvents="none"
        />
        {/* Arrowhead */}
        <polygon
          points={headPoly}
          fill={strokeColor}
          pointerEvents="none"
        />
        {/* Wide invisible hit area */}
        <line
          x1={x} y1={y} x2={x2} y2={y2}
          stroke="transparent"
          strokeWidth={Math.max(14, sw + 8)}
          strokeLinecap="round"
          pointerEvents={canInteract ? 'auto' : 'none'}
          style={{ cursor }}
        />
        {selectionBox}
      </g>
    );
  }

  // ── Triangle ──────────────────────────────────────────────────────────────
  // Fields: x, y, size, stroke, strokeWidth, dashed, fill
  if (elem.type === 'triangle') {
    const { x, y } = elem;
    if (!isFinite(x) || !isFinite(y)) return null;
    const s = elem.size || 100;
    const points = [
      `${x + s / 2},${y}`,
      `${x + s},${y + s}`,
      `${x},${y + s}`,
    ].join(' ');
    return (
      <g>
        <polygon
          points={points}
          fill={elem.fill || 'none'}
          stroke={elem.stroke || '#111111'}
          strokeWidth={elem.strokeWidth || 3}
          strokeLinejoin="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          pointerEvents={canInteract ? 'auto' : 'none'}
          style={{ cursor }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
        />
        {selectionBox}
      </g>
    );
  }

  // ── Diamond ───────────────────────────────────────────────────────────────
  // Fields: x, y, width, height, stroke, strokeWidth, dashed, fill
  if (elem.type === 'diamond') {
    const { x, y } = elem;
    if (!isFinite(x) || !isFinite(y)) return null;
    const w = elem.width || 120;
    const h = elem.height || 80;
    const points = [
      `${x + w / 2},${y}`,
      `${x + w},${y + h / 2}`,
      `${x + w / 2},${y + h}`,
      `${x},${y + h / 2}`,
    ].join(' ');
    return (
      <g>
        <polygon
          points={points}
          fill={elem.fill || 'none'}
          stroke={elem.stroke || '#111111'}
          strokeWidth={elem.strokeWidth || 3}
          strokeLinejoin="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          pointerEvents={canInteract ? 'auto' : 'none'}
          style={{ cursor }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
        />
        {selectionBox}
      </g>
    );
  }

  // ── Star (5-pointed) ──────────────────────────────────────────────────────
  // Fields: x, y, size, stroke, strokeWidth, dashed, fill
  if (elem.type === 'star') {
    const { x, y } = elem;
    if (!isFinite(x) || !isFinite(y)) return null;
    const s = elem.size || 60;
    const cx = x + s / 2;
    const cy = y + s / 2;
    const outerR = s / 2;
    const innerR = outerR * 0.4;
    const numPoints = 5;
    const pts = [];
    for (let i = 0; i < numPoints * 2; i++) {
      const angle = (Math.PI / numPoints) * i - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return (
      <g>
        <polygon
          points={pts.join(' ')}
          fill={elem.fill || 'none'}
          stroke={elem.stroke || '#111111'}
          strokeWidth={elem.strokeWidth || 3}
          strokeLinejoin="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          pointerEvents={canInteract ? 'auto' : 'none'}
          style={{ cursor }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
        />
        {selectionBox}
      </g>
    );
  }

  return null;
});

export default ElementRenderer;
