import { memo } from 'react';
import { getBounds, arrowHeadPoints } from '../../utils/math';

const PAD = 6; // selection outline padding in canvas px

/**
 * Renders a single SVG element (stroke, curve, line, arrow,
 * triangle, diamond or star).
 *
 * The parent SVG must have pointer-events:none on itself; this
 * component sets pointer-events:auto on the individual shapes so
 * that clicks can propagate to onSelect / onDragStart only when
 * the select tool is active.
 *
 * @param {{
 *   elem: object,
 *   isSelected: boolean,
 *   activeTool: string,
 *   isViewOnly: boolean,
 *   canvasLocked: boolean,
 *   onSelect: (id: string) => void,
 *   onDragStart: (e: MouseEvent, elem: object) => void,
 * }} props
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

  // ── Shared interaction handlers ──────────────────────────────────────────
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(elem.id);
  };
  const handleMouseDown = (e) => {
    if (!canInteract) return;
    e.stopPropagation();
    onSelect(elem.id);
    onDragStart(e, elem);
  };

  const interactionProps = {
    onClick: handleClick,
    onMouseDown: handleMouseDown,
    style: { pointerEvents: canInteract ? 'auto' : 'none', cursor: canInteract ? 'grab' : 'default' },
  };

  // ── Selection outline box ─────────────────────────────────────────────
  function SelectionBox() {
    if (!isSelected) return null;
    const b = getBounds(elem);
    if (!b) return null;
    return (
      <rect
        x={b.x - PAD}
        y={b.y - PAD}
        width={b.width + PAD * 2}
        height={b.height + PAD * 2}
        fill="none"
        stroke="#111111"
        strokeWidth={1.5}
        strokeDasharray="5 4"
        strokeLinecap="round"
        pointerEvents="none"
        rx={3}
      />
    );
  }

  // ── Stroke (freehand pen) ────────────────────────────────────────────
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
          stroke={elem.color || '#7F1D3F'}
          strokeWidth={elem.width || 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          {...interactionProps}
        />
        <SelectionBox />
      </g>
    );
  }

  // ── Curve ────────────────────────────────────────────────────────────
  if (elem.type === 'curve') {
    if (!elem.data?.path) return null;
    return (
      <g>
        <path
          d={elem.data.path}
          fill="none"
          stroke={elem.data.stroke || '#7F1D3F'}
          strokeWidth={elem.data.strokeWidth || 3}
          strokeLinecap="round"
          markerEnd={elem.data.hasArrow ? 'url(#arrow-burgundy)' : undefined}
          {...interactionProps}
        />
        <SelectionBox />
      </g>
    );
  }

  // ── Line ─────────────────────────────────────────────────────────────
  // Fields: x, y, x2, y2, stroke, strokeWidth, dashed
  if (elem.type === 'line') {
    return (
      <g>
        <line
          x1={elem.x}
          y1={elem.y}
          x2={elem.x2}
          y2={elem.y2}
          stroke={elem.stroke || '#7F1D3F'}
          strokeWidth={elem.strokeWidth || 3}
          strokeLinecap="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          {...interactionProps}
        />
        <SelectionBox />
      </g>
    );
  }

  // ── Arrow ─────────────────────────────────────────────────────────────
  // Fields: x, y, x2, y2, stroke, strokeWidth, dashed
  if (elem.type === 'arrow') {
    const pts = arrowHeadPoints(elem.x, elem.y, elem.x2, elem.y2, 14);
    const headPoly = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const strokeColor = elem.stroke || '#7F1D3F';
    return (
      <g {...interactionProps}>
        <line
          x1={elem.x}
          y1={elem.y}
          x2={elem.x2}
          y2={elem.y2}
          stroke={strokeColor}
          strokeWidth={elem.strokeWidth || 3}
          strokeLinecap="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          pointerEvents="inherit"
        />
        <polygon
          points={headPoly}
          fill={strokeColor}
          pointerEvents="inherit"
        />
        <SelectionBox />
      </g>
    );
  }

  // ── Triangle ─────────────────────────────────────────────────────────
  // Fields: x, y, size, stroke, strokeWidth, dashed, fill
  if (elem.type === 'triangle') {
    const s = elem.size || 100;
    // equilateral triangle, apex at top-centre
    const cx = elem.x + s / 2;
    const points = [
      `${cx},${elem.y}`,
      `${elem.x},${elem.y + s}`,
      `${elem.x + s},${elem.y + s}`,
    ].join(' ');
    return (
      <g>
        <polygon
          points={points}
          fill={elem.fill || 'none'}
          stroke={elem.stroke || '#7F1D3F'}
          strokeWidth={elem.strokeWidth || 3}
          strokeLinejoin="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          {...interactionProps}
        />
        <SelectionBox />
      </g>
    );
  }

  // ── Diamond ──────────────────────────────────────────────────────────
  // Fields: x, y, width, height, stroke, strokeWidth, dashed, fill
  if (elem.type === 'diamond') {
    const w = elem.width || 120;
    const h = elem.height || 80;
    const cx = elem.x + w / 2;
    const cy = elem.y + h / 2;
    const points = [
      `${cx},${elem.y}`,
      `${elem.x + w},${cy}`,
      `${cx},${elem.y + h}`,
      `${elem.x},${cy}`,
    ].join(' ');
    return (
      <g>
        <polygon
          points={points}
          fill={elem.fill || 'none'}
          stroke={elem.stroke || '#7F1D3F'}
          strokeWidth={elem.strokeWidth || 3}
          strokeLinejoin="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          {...interactionProps}
        />
        <SelectionBox />
      </g>
    );
  }

  // ── Star (5-pointed) ─────────────────────────────────────────────────
  // Fields: x, y, size, stroke, strokeWidth, dashed, fill
  if (elem.type === 'star') {
    const s = elem.size || 100;
    const cx = elem.x + s / 2;
    const cy = elem.y + s / 2;
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
          stroke={elem.stroke || '#7F1D3F'}
          strokeWidth={elem.strokeWidth || 3}
          strokeLinejoin="round"
          strokeDasharray={elem.dashed ? '6 6' : undefined}
          {...interactionProps}
        />
        <SelectionBox />
      </g>
    );
  }

  return null;
});

export default ElementRenderer;
