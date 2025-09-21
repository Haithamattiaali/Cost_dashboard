import * as React from 'react';

type SmartNodeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number;
  fill?: string;
  percent?: number;
  currency?: string;
};

const MIN_FONT = 8;
const MAX_FONT = 16;
const PADDING = 6;
const SMALL_AREA = 1200;
const TINY_AREA = 420;

const fmtMoney = (n: number, cc = 'SAR') => {
  if (n >= 1000000) {
    return `${cc} ${(n / 1000000).toFixed(1)}M`;
  } else if (n >= 1000) {
    return `${cc} ${(n / 1000).toFixed(1)}K`;
  } else {
    return `${cc} ${n.toFixed(0)}`;
  }
};
const fmtPct = (p?: number) => (typeof p === 'number' ? `${p.toFixed(1)}%` : '');

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxW: number, base = MAX_FONT) {
  let size = Math.min(base, MAX_FONT);
  ctx.font = `600 ${size}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  while (size > MIN_FONT && ctx.measureText(text).width > maxW) {
    size -= 1;
    ctx.font = `600 ${size}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  }
  return size;
}

function breakLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines = 2) {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width <= maxW) line = probe;
    else {
      if (line) lines.push(line);
      line = w;
    }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

const getMeasureCtx = (): CanvasRenderingContext2D => {
  const c = document.createElement('canvas').getContext('2d')!;
  c.font = `600 ${MAX_FONT}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  return c;
};

let measureCtx: CanvasRenderingContext2D | null = null;

export default function TreemapSmartNode(props: SmartNodeProps) {
  const { x, y, width, height, name = 'Unknown', value = 0, fill, percent, currency = 'SAR' } = props;
  const w = Math.max(0, width - PADDING * 2);
  const h = Math.max(0, height - PADDING * 2);
  const cx = x + width / 2;
  const cy = y + height / 2;
  const area = width * height;

  if (!measureCtx && typeof document !== 'undefined') {
    measureCtx = getMeasureCtx();
  }

  if (!measureCtx) return null;

  const rect = (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill || '#9e1f63'}
      stroke="#fff"
      strokeWidth={2}
      strokeOpacity={1}
    />
  );

  const compact = area < SMALL_AREA;
  const micro = area < TINY_AREA;

  const color = micro || compact ? '#9e1f63' : '#fff';

  const valueLine = fmtMoney(value, currency);
  const percentLine = fmtPct(percent);
  const displayName = name || 'Unknown';

  if (micro) {
    const size = fitFont(measureCtx, displayName, w);
    const yText = cy + size * 0.35;
    return (
      <g pointerEvents="none">
        {rect}
        <text x={cx} y={yText} fill={color} fontSize={size} fontWeight={700} fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" textAnchor="middle">
          {displayName}
        </text>
      </g>
    );
  }

  if (compact) {
    const nameSize = fitFont(measureCtx, displayName, w, 14);
    measureCtx.font = `700 ${nameSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    const nameLines = breakLines(measureCtx, displayName, w, 2);

    const valSize = Math.max(MIN_FONT, nameSize - 1);

    const totalH = nameLines.length * (nameSize + 2) + (valSize + 2);
    const startY = cy - totalH / 2 + nameSize;

    return (
      <g pointerEvents="none">
        {rect}
        {nameLines.map((ln, i) => (
          <text key={i} x={cx} y={startY + i * (nameSize + 2)} fill={color}
                fontSize={nameSize} fontWeight={700} fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" textAnchor="middle">{ln}</text>
        ))}
        <text x={cx} y={startY + nameLines.length * (nameSize + 2) + valSize * 0.2}
              fill={color} fontSize={valSize} fontWeight={600} fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" textAnchor="middle">
          {valueLine}
        </text>
      </g>
    );
  }

  const nameSize = fitFont(measureCtx, displayName, w, 16);
  measureCtx.font = `700 ${nameSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  const nameLines = breakLines(measureCtx, displayName, w, 2);
  const valSize = Math.max(MIN_FONT, nameSize - 2);
  const pctSize = Math.max(MIN_FONT, nameSize - 4);

  const totalH =
    nameLines.length * (nameSize + 2) + (valSize + 2) + (pctSize + 2);
  const startY = cy - totalH / 2 + nameSize;

  return (
    <g pointerEvents="none">
      {rect}
      {nameLines.map((ln, i) => (
        <text key={i} x={cx} y={startY + i * (nameSize + 2)} fill="#fff"
              fontSize={nameSize} fontWeight={700} fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" textAnchor="middle">{ln}</text>
      ))}
      <text x={cx} y={startY + nameLines.length * (nameSize + 2) + valSize * 0.2}
            fill="#fff" fontSize={valSize} fontWeight={600} fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" textAnchor="middle">
        {valueLine}
      </text>
      {!!percentLine && (
        <text x={cx}
              y={startY + nameLines.length * (nameSize + 2) + (valSize + 2) + pctSize * 0.2}
              fill="#fff" fontSize={pctSize} fontWeight={600} fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" textAnchor="middle">
          {`(${percentLine})`}
        </text>
      )}
    </g>
  );
}