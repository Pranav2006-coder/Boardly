/**
 * Calculates the midpoint between two points.
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {{ x: number, y: number }}
 */
export function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

/**
 * Calculates Euclidean distance between two points.
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {number}
 */
export function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Returns an SVG path d string using quadratic Bezier curves through midpoints.
 * @param {Array<{ x: number, y: number }>} points
 * @returns {string}
 */
export function smoothPath(points) {
  if (!points || points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 2; i++) {
    const mid = midpoint(points[i], points[i + 1]);
    d += ` Q ${points[i].x} ${points[i].y} ${mid.x} ${mid.y}`;
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  d += ` Q ${penultimate.x} ${penultimate.y} ${last.x} ${last.y}`;

  return d;
}

/**
 * Returns an array of 3 points {x, y} forming the arrowhead triangle at (x2, y2).
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} [size=12]
 * @returns {Array<{ x: number, y: number }>}
 */
export function arrowHeadPoints(x1, y1, x2, y2, size = 12) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const wingAngle = Math.PI / 6;

  return [
    { x: x2, y: y2 },
    {
      x: x2 - size * Math.cos(angle - wingAngle),
      y: y2 - size * Math.sin(angle - wingAngle),
    },
    {
      x: x2 - size * Math.cos(angle + wingAngle),
      y: y2 - size * Math.sin(angle + wingAngle),
    },
  ];
}

/**
 * Calculates the shortest distance from point p to line segment ab.
 * @param {{ x: number, y: number }} p
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {number}
 */
export function pointToSegmentDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return distance(p, a);
  }

  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  const projection = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };

  return distance(p, projection);
}

/**
 * Checks whether a point is within threshold distance of any segment of a polyline.
 * @param {{ x: number, y: number }} point
 * @param {Array<{ x: number, y: number }>} points
 * @param {number} threshold
 * @returns {boolean}
 */
export function isPointNearStroke(point, points, threshold) {
  if (!points || points.length === 0) return false;
  if (points.length === 1) {
    return distance(point, points[0]) <= threshold;
  }

  for (let i = 0; i < points.length - 1; i++) {
    if (pointToSegmentDistance(point, points[i], points[i + 1]) <= threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Returns the bounding box { x, y, width, height } for an element, or null for unknown types.
 * @param {object} element
 * @returns {{ x: number, y: number, width: number, height: number } | null}
 */
export function getBounds(element) {
  if (!element || !element.type) return null;

  switch (element.type) {
    case 'stroke': {
      if (!Array.isArray(element.points) || element.points.length === 0) {
        return null;
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const pt of element.points) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }

      if (!isFinite(minX)) return null;

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }

    case 'rect':
    case 'diamond': {
      return {
        x: element.x ?? 0,
        y: element.y ?? 0,
        width: element.width ?? 0,
        height: element.height ?? 0,
      };
    }

    case 'circle': {
      const radius = element.radius ?? 0;
      return {
        x: (element.x ?? 0) - radius,
        y: (element.y ?? 0) - radius,
        width: radius * 2,
        height: radius * 2,
      };
    }

    case 'triangle':
    case 'star': {
      const size = element.size ?? 0;
      return {
        x: element.x ?? 0,
        y: element.y ?? 0,
        width: size,
        height: size,
      };
    }

    case 'line':
    case 'arrow': {
      const x1 = element.x ?? 0;
      const y1 = element.y ?? 0;
      const x2 = element.x2 ?? x1;
      const y2 = element.y2 ?? y1;
      const minX = Math.min(x1, x2);
      const minY = Math.min(y1, y2);
      return {
        x: minX,
        y: minY,
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      };
    }

    case 'text': {
      const fontSize = element.fontSize ?? 16;
      const text = element.text || '';
      return {
        x: element.x ?? 0,
        y: element.y ?? 0,
        width: text.length * (fontSize * 0.6),
        height: fontSize * 1.2,
      };
    }

    case 'sticky': {
      return {
        x: element.x ?? 0,
        y: element.y ?? 0,
        width: 220,
        height: 160,
      };
    }

    case 'system-node': {
      return {
        x: element.x ?? 0,
        y: element.y ?? 0,
        width: 330,
        height: 220,
      };
    }

    default:
      return null;
  }
}

/**
 * Resolves the effective fill color for a shape.
 * - null  => "auto": returns a light tint of the stroke color (strokeColor + "15" alpha)
 * - 'none' => transparent: returns 'none'
 * - any other string => returned as-is
 * @param {string | null} fillColor  The user-selected fill value.
 * @param {string} strokeColor       The active stroke/outline color.
 * @returns {string}
 */
export function resolveFill(fillColor, strokeColor) {
  if (fillColor === null) return strokeColor + '15';
  if (fillColor === 'none') return 'none';
  return fillColor;
}