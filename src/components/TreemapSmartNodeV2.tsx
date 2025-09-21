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

const PADDING = 6;
const MIN_FONT = 10;           // hard floor to avoid micro/blur
const BASE_FONT = 16;
const SMALL_AREA = 1200;       // switch to compact mode
const TINY_AREA = 420;         // switch to pill mode
const MIN_W = 34;
const MIN_H = 18;  // bounds to render multi-line

const money = (n: number, cc = 'SAR') => {
  if (n >= 1000000) {
    return `${cc} ${(n / 1000000).toFixed(1)}M`;
  } else if (n >= 1000) {
    return `${cc} ${(n / 1000).toFixed(1)}K`;
  } else {
    return `${cc} ${n.toFixed(0)}`;
  }
};

const pct = (p?: number) => (typeof p === 'number' ? `${p.toFixed(1)}%` : '');

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number, base = BASE_FONT) {
  let size = Math.min(base, BASE_FONT);
  ctx.font = `${size}px sans-serif`;
  while (size > MIN_FONT && ctx.measureText(text).width > maxW) {
    size -= 1;
    ctx.font = `${size}px sans-serif`;
  }
  return size;
}

function lines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines = 2) {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width <= maxW) line = probe;
    else {
      if (line) out.push(line);
      line = w;
      if (out.length === maxLines) break;
    }
  }
  if (line && out.length < maxLines) out.push(line);
  return out;
}

let ctx: CanvasRenderingContext2D | null = null;

export default function TreemapSmartNodeV2(p: SmartNodeProps) {
  const { x, y, width, height, name = 'Unknown', value = 0, fill, percent, currency = 'SAR' } = p;

  if (!ctx && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d')!;
  }

  if (!ctx) return null;

  const px = Math.round(x);
  const py = Math.round(y);
  const pw = Math.round(width);
  const ph = Math.round(height);
  const w = Math.max(0, pw - PADDING * 2);
  const h = Math.max(0, ph - PADDING * 2);
  const cx = px + Math.round(pw / 2);
  const cy = py + Math.round(ph / 2);
  const area = pw * ph;
  const clipId = `clip-${px}-${py}-${pw}-${ph}`;

  const pillMode = area < TINY_AREA || pw < MIN_W || ph < MIN_H;
  const compact = !pillMode && area < SMALL_AREA;

  // Rectangle background
  const rect = (
    <rect
      x={px}
      y={py}
      width={pw}
      height={ph}
      fill={fill || '#9e1f63'}
      stroke="#fff"
      strokeWidth={2}
      strokeOpacity={1}
    />
  );

  // Text color
  const color = compact || pillMode ? '#9e1f63' : '#fff';

  return (
    <g pointerEvents="none">
      {rect}
      <defs>
        <clipPath id={clipId}>
          <rect x={px + 1} y={py + 1} width={Math.max(0, pw - 2)} height={Math.max(0, ph - 2)} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {pillMode ? (() => {
          // Pill mode for tiny tiles
          const short = name.length <= 4
            ? name
            : name.split(/\s+/)
                .map(w => w[0])
                .join('')
                .slice(0, 3)
                .toUpperCase();

          const fs = MIN_FONT;
          const pillW = Math.min(w, Math.max(30, fs * (short.length + 1.5)));
          const pillH = Math.min(h, fs + 8);
          const rx = Math.round(cx - pillW / 2);
          const ry = Math.round(cy - pillH / 2);

          return (
            <g>
              <rect
                x={rx}
                y={ry}
                width={pillW}
                height={pillH}
                fill="rgba(255,255,255,0.9)"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth={1}
                rx={4}
                ry={4}
              />
              <text
                x={cx}
                y={ry + pillH / 2 + fs * 0.35}
                textAnchor="middle"
                fontSize={fs}
                fill="#9e1f63"
              >
                {short}
              </text>
            </g>
          );
        })() : (() => {
          // Regular/compact modes
          const valueLine = money(value, currency);
          const percentLine = pct(percent);

          // Name size & wrap
          const nameSize = fit(ctx, name, w, compact ? 14 : BASE_FONT);
          ctx.font = `${nameSize}px sans-serif`;
          const nameLines = lines(ctx, name, w, 2);

          const valSize = Math.max(MIN_FONT, nameSize - 2);
          const pctSize = Math.max(MIN_FONT, nameSize - 4);

          const showPercent = !compact && percent !== undefined;
          const totalH = nameLines.length * (nameSize + 2) + (valSize + 2) + (showPercent ? (pctSize + 2) : 0);
          const startY = cy - Math.round(totalH / 2) + nameSize;

          const y1 = Math.round(startY);
          const y2 = Math.round(y1 + nameLines.length * (nameSize + 2));
          const y3 = Math.round(y2 + (valSize + 2));

          return (
            <g>
              {nameLines.map((ln, i) => (
                <text
                  key={i}
                  x={cx}
                  y={Math.round(y1 + i * (nameSize + 2))}
                  textAnchor="middle"
                  fontSize={nameSize}
                  fill={color}
                >
                  {ln}
                </text>
              ))}
              <text
                x={cx}
                y={Math.round(y2 + valSize * 0.2)}
                textAnchor="middle"
                fontSize={valSize}
                fill={color}
              >
                {valueLine}
              </text>
              {showPercent && (
                <text
                  x={cx}
                  y={Math.round(y3 + pctSize * 0.2)}
                  textAnchor="middle"
                  fontSize={pctSize}
                  fill={color}
                >
                  ({percentLine})
                </text>
              )}
            </g>
          );
        })()}
      </g>
    </g>
  );
}