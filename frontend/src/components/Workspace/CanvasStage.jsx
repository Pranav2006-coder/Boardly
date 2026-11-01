import { memo } from 'react';
import ElementRenderer from './ElementRenderer';
import { smoothPath } from '../../utils/math';

/**
 * CanvasStage renders the SVG layer of the whiteboard workspace.
 * Includes:
 *  - Marker definitions
 *  - ElementRenderer for all SVG element types (stroke, curve, line, arrow, triangle, diamond, star)
 *  - Live local pen preview (currentPath)
 *  - Live local shape preview (draftShape)
 *  - Live remote stroke previews (remoteStrokes)
 *  - Children slot for overlay components
 */
const CanvasStage = memo(function CanvasStage({
  elements = [],
  selectedId,
  activeTool,
  isViewOnly,
  canvasLocked,
  currentPath,
  draftShape,
  remoteStrokes = {},
  onSelect,
  onDragStart,
  children,
}) {
  return (
    <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible">
      <defs>
        <marker
          id="arrow-elem-head"
          markerWidth="6"
          markerHeight="6"
          refX="6"
          refY="5"
          viewBox="0 0 10 10"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="inherit" />
        </marker>
      </defs>

      {/* Rendered SVG shapes and strokes */}
      {elements
        .filter((e) =>
          e.type === 'stroke' ||
          e.type === 'curve' ||
          e.type === 'line' ||
          e.type === 'arrow' ||
          e.type === 'triangle' ||
          e.type === 'diamond' ||
          e.type === 'star'
        )
        .map((elem) => (
          <ElementRenderer
            key={elem.id}
            elem={elem}
            isSelected={selectedId === elem.id}
            activeTool={activeTool}
            isViewOnly={isViewOnly}
            canvasLocked={canvasLocked}
            onSelect={onSelect}
            onDragStart={onDragStart}
          />
        ))}

      {/* Currently drawing local stroke (live preview) */}
      {currentPath && currentPath.points?.length > 1 && (
        <path
          d={smoothPath(currentPath.points)}
          fill="none"
          stroke={currentPath.color}
          strokeWidth={currentPath.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={currentPath.dashed ? '6 6' : undefined}
        />
      )}

      {/* Live remote strokes in-progress from collaborators */}
      {remoteStrokes &&
        Object.values(remoteStrokes).map((stroke) => {
          if (!stroke || !stroke.points || stroke.points.length < 2) return null;
          return (
            <path
              key={stroke.id}
              d={smoothPath(stroke.points)}
              fill="none"
              stroke={stroke.color || '#111111'}
              strokeWidth={stroke.width || 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={stroke.dashed ? '6 6' : undefined}
              pointerEvents="none"
            />
          );
        })}

      {/* Drag-to-draw shape preview */}
      {draftShape && (
        <g style={{ opacity: 0.5, pointerEvents: 'none' }}>
          {['line', 'arrow', 'triangle', 'diamond', 'star'].includes(draftShape.type) ? (
            <ElementRenderer
              elem={draftShape}
              isSelected={false}
              activeTool="select"
              isViewOnly={true}
              canvasLocked={true}
              onSelect={() => {}}
              onDragStart={() => {}}
            />
          ) : draftShape.type === 'rect' ? (
            <rect
              x={draftShape.x}
              y={draftShape.y}
              width={Math.max(0, draftShape.width)}
              height={Math.max(0, draftShape.height)}
              fill={draftShape.fill || 'none'}
              stroke={draftShape.stroke || '#7F1D3F'}
              strokeWidth={draftShape.strokeWidth || 2}
              strokeDasharray={draftShape.dashed ? '6 6' : undefined}
              rx={6}
            />
          ) : draftShape.type === 'circle' ? (
            <circle
              cx={draftShape.x}
              cy={draftShape.y}
              r={Math.max(0, draftShape.radius)}
              fill={draftShape.fill || 'none'}
              stroke={draftShape.stroke || '#7F1D3F'}
              strokeWidth={draftShape.strokeWidth || 2}
            />
          ) : null}
        </g>
      )}

      {/* Children slot for later SVG overlays */}
      {children}
    </svg>
  );
});

export default CanvasStage;
