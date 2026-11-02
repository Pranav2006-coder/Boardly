import { smoothPath, getBounds, arrowHeadPoints } from './math';

/**
 * Draws a rounded rectangle path on a 2D canvas context.
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Wraps text and fills it on the canvas context within maxWidth.
 */
function wrapAndFillText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 5) {
  if (!text) return;
  const words = String(text).split(/\s+/);
  let line = '';
  let lineCount = 0;
  let currY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? ' ' : '') + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currY);
      line = words[n];
      currY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        line += '...';
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currY);
  }
}

/**
 * Exports the whiteboard elements to a PNG file and triggers browser download.
 *
 * @param {Object} options
 * @param {Array} options.elements - Elements on the board
 * @param {string} options.gridStyle - 'dots' | 'major' | 'blank'
 * @param {string} options.canvasTheme - 'light' | 'dark'
 * @param {string} options.title - Board title
 */
export function exportBoardAsPng({ elements = [], gridStyle = 'dots', canvasTheme = 'light', title = 'whiteboard' }) {
  const dpr = 2;
  const PAD = 48;

  // 1. Calculate bounding box of all elements
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasBounds = false;

  for (const elem of elements) {
    const b = getBounds(elem);
    if (b && isFinite(b.x) && isFinite(b.y) && isFinite(b.width) && isFinite(b.height)) {
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
      hasBounds = true;
    }
  }

  let bX, bY, bWidth, bHeight;
  if (!hasBounds || minX >= maxX || minY >= maxY) {
    bX = 0;
    bY = 0;
    bWidth = 1200;
    bHeight = 800;
  } else {
    bX = minX - PAD;
    bY = minY - PAD;
    bWidth = (maxX - minX) + PAD * 2;
    bHeight = (maxY - minY) + PAD * 2;
  }

  // 2. Setup offscreen canvas at 2x resolution
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bWidth * dpr);
  canvas.height = Math.round(bHeight * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);
  ctx.translate(-bX, -bY);

  // 3. Fill background according to canvasTheme
  const isDark = canvasTheme === 'dark';
  ctx.fillStyle = isDark ? '#1C1917' : '#FAF6F2';
  ctx.fillRect(bX, bY, bWidth, bHeight);

  // 4. Draw grid background according to gridStyle
  if (gridStyle === 'dots') {
    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(120, 108, 108, 0.35)' : 'rgba(214, 206, 202, 0.65)';
    const startGX = Math.floor(bX / 24) * 24;
    const startGY = Math.floor(bY / 24) * 24;
    for (let gx = startGX; gx <= bX + bWidth; gx += 24) {
      for (let gy = startGY; gy <= bY + bHeight; gy += 24) {
        ctx.beginPath();
        ctx.arc(gx + 12, gy + 12, 1.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  } else if (gridStyle === 'major') {
    ctx.save();
    ctx.strokeStyle = isDark ? '#44383A' : '#E8DDD8';
    ctx.lineWidth = 0.75;
    ctx.setLineDash([2, 4]);
    const startX = Math.floor(bX / 120) * 120;
    const startY = Math.floor(bY / 120) * 120;
    ctx.beginPath();
    for (let x = startX; x <= bX + bWidth; x += 120) {
      ctx.moveTo(x, bY);
      ctx.lineTo(x, bY + bHeight);
    }
    for (let y = startY; y <= bY + bHeight; y += 120) {
      ctx.moveTo(bX, y);
      ctx.lineTo(bX + bWidth, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 5. Draw elements in array order
  for (const elem of elements) {
    if (!elem || !elem.type) continue;

    // --- STROKE ---
    if (elem.type === 'stroke') {
      if (!elem.points || elem.points.length < 2) continue;
      const d = smoothPath(elem.points);
      if (!d) continue;
      ctx.save();
      ctx.strokeStyle = elem.color || '#111111';
      ctx.lineWidth = elem.width || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (elem.dashed) ctx.setLineDash([6, 6]);
      ctx.stroke(new Path2D(d));
      ctx.restore();
    }

    // --- CURVE ---
    else if (elem.type === 'curve') {
      const pathD = elem.data?.path || elem.path;
      if (!pathD) continue;
      ctx.save();
      const strokeColor = elem.data?.stroke || elem.stroke || '#111111';
      const sw = elem.data?.strokeWidth || elem.strokeWidth || 3;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = sw;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (elem.dashed || elem.data?.dashed) ctx.setLineDash([6, 6]);
      ctx.stroke(new Path2D(pathD));

      if (elem.data?.hasArrow && elem.points && elem.points.length >= 2) {
        const pLast = elem.points[elem.points.length - 1];
        const pPenult = elem.points[elem.points.length - 2];
        const pts = arrowHeadPoints(pPenult.x, pPenult.y, pLast.x, pLast.y, 14);
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // --- RECTANGLE ---
    else if (elem.type === 'rect') {
      const x = elem.x ?? 0;
      const y = elem.y ?? 0;
      const w = elem.width ?? 0;
      const h = elem.height ?? 0;
      ctx.save();
      if (elem.fill && elem.fill !== 'none') {
        ctx.fillStyle = elem.fill;
        drawRoundedRect(ctx, x, y, w, h, 6);
        ctx.fill();
      }
      ctx.strokeStyle = elem.stroke || '#7F1D3F';
      ctx.lineWidth = elem.strokeWidth || 2;
      if (elem.dashed) ctx.setLineDash([6, 6]);
      drawRoundedRect(ctx, x, y, w, h, 6);
      ctx.stroke();
      ctx.restore();
    }

    // --- CIRCLE ---
    else if (elem.type === 'circle') {
      const cx = elem.x ?? 0;
      const cy = elem.y ?? 0;
      const r = elem.radius ?? 60;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2);
      if (elem.fill && elem.fill !== 'none') {
        ctx.fillStyle = elem.fill;
        ctx.fill();
      }
      ctx.strokeStyle = elem.stroke || '#7F1D3F';
      ctx.lineWidth = elem.strokeWidth || 2;
      ctx.stroke();
      ctx.restore();
    }

    // --- TRIANGLE ---
    else if (elem.type === 'triangle') {
      const x = elem.x ?? 0;
      const y = elem.y ?? 0;
      const s = elem.size || 100;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + s / 2, y);
      ctx.lineTo(x + s, y + s);
      ctx.lineTo(x, y + s);
      ctx.closePath();
      if (elem.fill && elem.fill !== 'none') {
        ctx.fillStyle = elem.fill;
        ctx.fill();
      }
      ctx.strokeStyle = elem.stroke || '#111111';
      ctx.lineWidth = elem.strokeWidth || 3;
      ctx.lineJoin = 'round';
      if (elem.dashed) ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();
    }

    // --- DIAMOND ---
    else if (elem.type === 'diamond') {
      const x = elem.x ?? 0;
      const y = elem.y ?? 0;
      const w = elem.width || 120;
      const h = elem.height || 80;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
      if (elem.fill && elem.fill !== 'none') {
        ctx.fillStyle = elem.fill;
        ctx.fill();
      }
      ctx.strokeStyle = elem.stroke || '#111111';
      ctx.lineWidth = elem.strokeWidth || 3;
      ctx.lineJoin = 'round';
      if (elem.dashed) ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();
    }

    // --- STAR ---
    else if (elem.type === 'star') {
      const x = elem.x ?? 0;
      const y = elem.y ?? 0;
      const s = elem.size || 60;
      const cx = x + s / 2;
      const cy = y + s / 2;
      const outerR = s / 2;
      const innerR = outerR * 0.4;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (elem.fill && elem.fill !== 'none') {
        ctx.fillStyle = elem.fill;
        ctx.fill();
      }
      ctx.strokeStyle = elem.stroke || '#111111';
      ctx.lineWidth = elem.strokeWidth || 3;
      ctx.lineJoin = 'round';
      if (elem.dashed) ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();
    }

    // --- LINE ---
    else if (elem.type === 'line') {
      const { x, y, x2, y2 } = elem;
      if (!isFinite(x) || !isFinite(y) || !isFinite(x2) || !isFinite(y2)) continue;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = elem.stroke || '#111111';
      ctx.lineWidth = elem.strokeWidth || 3;
      ctx.lineCap = 'round';
      if (elem.dashed) ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();
    }

    // --- ARROW ---
    else if (elem.type === 'arrow') {
      const { x, y, x2, y2 } = elem;
      if (!isFinite(x) || !isFinite(y) || !isFinite(x2) || !isFinite(y2)) continue;
      const strokeColor = elem.stroke || '#111111';
      const sw = elem.strokeWidth || 3;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = sw;
      ctx.lineCap = 'round';
      if (elem.dashed) ctx.setLineDash([6, 6]);
      ctx.stroke();

      const pts = arrowHeadPoints(x, y, x2, y2, 12 + sw * 2);
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // --- TEXT ---
    else if (elem.type === 'text') {
      const x = elem.x ?? 0;
      const y = elem.y ?? 0;
      const fontSize = elem.fontSize || 16;
      ctx.save();
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = elem.color || '#292323';
      ctx.textBaseline = 'top';
      ctx.fillText(elem.text || '', x, y);
      ctx.restore();
    }

    // --- STICKY NOTE ---
    else if (elem.type === 'sticky') {
      const x = elem.x ?? 0;
      const y = elem.y ?? 0;
      const w = 220;
      const h = 160;
      ctx.save();
      ctx.shadowColor = 'rgba(41, 35, 35, 0.08)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = elem.color || '#FFF8F0';
      drawRoundedRect(ctx, x, y, w, h, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#E8DDD8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#786C6C';
      ctx.textBaseline = 'top';
      const tag = elem.data?.tag || 'Sticky Note';
      ctx.fillText(tag.toUpperCase(), x + 14, y + 14);

      ctx.font = '13px sans-serif';
      ctx.fillStyle = elem.textColor || '#292323';
      const bodyText = elem.data?.text || '';
      wrapAndFillText(ctx, bodyText, x + 14, y + 36, w - 28, 18, 5);

      if (elem.data?.author) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#786C6C';
        ctx.fillText(elem.data.author, x + 14, y + h - 22);
      }
      ctx.restore();
    }

    // --- SYSTEM NODE ---
    else if (elem.type === 'system-node') {
      const x = elem.x ?? 0;
      const y = elem.y ?? 0;
      const w = 330;
      const h = 220;
      ctx.save();
      ctx.shadowColor = 'rgba(41, 35, 35, 0.08)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#FFFFFF';
      drawRoundedRect(ctx, x, y, w, h, 16);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#E8DDD8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Header top bar
      ctx.save();
      ctx.beginPath();
      drawRoundedRect(ctx, x, y, w, 38, 16);
      ctx.clip();
      ctx.fillStyle = '#FFF8F0';
      ctx.fillRect(x, y, w, 38);
      ctx.strokeStyle = '#E8DDD8';
      ctx.beginPath();
      ctx.moveTo(x, y + 38);
      ctx.lineTo(x + w, y + 38);
      ctx.stroke();
      ctx.restore();

      // Status indicator dot
      ctx.fillStyle = elem.data?.statusColor || '#7F1D3F';
      ctx.beginPath();
      ctx.arc(x + 18, y + 19, 4, 0, Math.PI * 2);
      ctx.fill();

      // Category
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#7F1D3F';
      ctx.textBaseline = 'middle';
      ctx.fillText((elem.data?.category || 'System Node').toUpperCase(), x + 28, y + 19);

      // Version
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#786C6C';
      ctx.textAlign = 'right';
      ctx.fillText(elem.data?.version || 'v1.0.0', x + w - 16, y + 19);
      ctx.textAlign = 'left';

      // Title & Subtitle
      ctx.textBaseline = 'top';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#292323';
      ctx.fillText(elem.data?.title || 'ARCHITECTURE NODE', x + 16, y + 48);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#786C6C';
      ctx.fillText(elem.data?.subtitle || 'API Gateway, SSL & Distributed Routing', x + 16, y + 68);

      // Metrics container
      const mbX = x + 16;
      const mbY = y + 92;
      const mbW = w - 32;
      const mbH = 64;
      ctx.fillStyle = '#FAF6F2';
      drawRoundedRect(ctx, mbX, mbY, mbW, mbH, 10);
      ctx.fill();
      ctx.strokeStyle = '#E8DDD8';
      ctx.stroke();

      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#786C6C';
      ctx.fillText('Latency (p99)', mbX + 12, mbY + 10);
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#292323';
      ctx.fillText(elem.data?.latency || '14ms', mbX + 12, mbY + 26);

      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#786C6C';
      ctx.fillText('Uptime SLA', mbX + mbW / 2 + 6, mbY + 10);
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#7F1D3F';
      ctx.fillText(elem.data?.uptime || '99.99%', mbX + mbW / 2 + 6, mbY + 26);

      // Status Bar Footer
      ctx.fillStyle = '#7F1D3F';
      ctx.beginPath();
      ctx.arc(x + 20, y + h - 24, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#786C6C';
      ctx.textBaseline = 'middle';
      ctx.fillText(elem.data?.pods || '4 Pods healthy', x + 28, y + h - 24);

      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(elem.data?.throughput || '12.4k req/s', x + w - 16, y + h - 24);
      ctx.textAlign = 'left';

      ctx.restore();
    }
  }

  // 6. Trigger download via toBlob
  const sanitizedTitle = (title || 'whiteboard')
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_') || 'whiteboard';

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedTitle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
