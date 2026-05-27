/**
 * Client-side share-card renderer for /my-challenges/[id]/progress.
 *
 * Draws a branded PNG summarising the user's challenge progress in one
 * of three aspect ratios sized for the major social-media surfaces:
 *
 *   square   1080×1080  — Instagram feed post, X / Twitter, Facebook
 *   portrait 1080×1350  — Instagram portrait post (taller in feed)
 *   story    1080×1920  — Instagram / Facebook Story, IG Reel cover,
 *                          WhatsApp Status, TikTok cover (all 9:16)
 *
 * Card layout per format is hand-tuned (not just rescaled) so the title,
 * stats, and calendar all use their format's space well. Numbers are
 * baked into each calendar cell so it's legible at thumbnail size — the
 * previous card showed only colour, which read as decoration rather
 * than data.
 *
 * Deliberately canvas-based (no html2canvas / dom-to-image dep, no
 * next/og server route + cookie-gated API roundtrip). Mirrors the
 * mobile app's share_plus + RepaintBoundary card so the brand surface
 * stays consistent across platforms.
 */

export type DayStatus = "COMPLETED" | "MISSED" | "SKIPPED" | undefined;

export type ShareFormat = "square" | "portrait" | "story";

export interface ShareCardOptions {
  challengeTitle: string;
  dailyTask: string;
  totalDays: number;
  currentDay: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  /** 0..1 */
  completionRate: number;
  /** length === totalDays; undefined cells are "upcoming" */
  daysStatus: DayStatus[];
}

interface FormatSpec {
  w: number;
  h: number;
  /** Human label shown on the picker. */
  label: string;
  /** One-liner explaining what surface it fits. */
  hint: string;
}

export const SHARE_FORMATS: Record<ShareFormat, FormatSpec> = {
  square: {
    w: 1080,
    h: 1080,
    label: "Square",
    hint: "Instagram post · X · Facebook",
  },
  portrait: {
    w: 1080,
    h: 1350,
    label: "Portrait",
    hint: "Instagram feed (4:5)",
  },
  story: {
    w: 1080,
    h: 1920,
    label: "Story",
    hint: "IG Story · Reel · WhatsApp Status",
  },
};

// Vital30 brand palette — kept in sync with src/app/globals.css @theme.
// Hard-coded here because canvas can't read CSS custom properties off
// document.documentElement reliably across browsers (Safari iOS in
// particular returns empty strings from a detached canvas context).
const BRAND_400 = "#34d399";
const BRAND_500 = "#10b981";
const BRAND_600 = "#059669";
const BRAND_700 = "#047857";
const BRAND_900 = "#064e3b";
const BRAND_50 = "#ecfdf5";
const BRAND_100 = "#d1fae5";
const STREAK = "#f59e0b";
const STREAK_DARK = "#78350f";
const INK = "#0f172a";
const INK_MUTED = "#475569";
const ROSE_300 = "#fda4af";
const ROSE_900 = "#7f1d1d";
const SLATE_300 = "#cbd5e1";
const SLATE_700 = "#334155";

// System font stack — avoids any async font loading. Bold/extrabold
// weights map to whatever the host has; on macOS / iOS that's SF Pro,
// on Android Roboto, on Windows Segoe UI. All have proper 700/800
// weights so the title reads as bold even without a webfont.
const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export async function generateShareCardBlob(
  opts: ShareCardOptions,
  format: ShareFormat = "square",
): Promise<Blob> {
  const { w, h } = SHARE_FORMATS[format];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available.");

  drawBackground(ctx, w, h);
  drawDecor(ctx, w, h);

  if (format === "square") renderSquare(ctx, w, h, opts);
  else if (format === "portrait") renderPortrait(ctx, w, h, opts);
  else renderStory(ctx, w, h, opts);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error("Canvas toBlob returned null."));
        else resolve(b);
      },
      "image/png",
      // Quality flag is ignored for PNG but kept for clarity if we ever
      // switch to JPEG for smaller story uploads.
      1,
    );
  });
}

// =========================================================================
// Per-format renderers
// =========================================================================

function renderSquare(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: ShareCardOptions,
) {
  const pad = 72;
  drawHeader(ctx, pad, pad, W - pad * 2, opts);
  const titleBottom = drawTitle(ctx, pad, 220, W - pad * 2, opts, {
    titleSize: 76,
    titleLeading: 88,
    dailySize: 26,
  });
  const statsTop = Math.max(titleBottom + 36, 470);
  drawStatsCard(ctx, pad, statsTop, W - pad * 2, 200, opts);
  const calTop = statsTop + 200 + 52;
  drawCalendar(ctx, pad, calTop, W - pad * 2, H - calTop - 96, opts);
  drawFooter(ctx, pad, H - pad, W - pad * 2);
}

function renderPortrait(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: ShareCardOptions,
) {
  const pad = 84;
  drawHeader(ctx, pad, pad, W - pad * 2, opts);
  const titleBottom = drawTitle(ctx, pad, 240, W - pad * 2, opts, {
    titleSize: 84,
    titleLeading: 96,
    dailySize: 28,
  });
  const statsTop = Math.max(titleBottom + 48, 540);
  drawStatsCard(ctx, pad, statsTop, W - pad * 2, 220, opts);
  const calTop = statsTop + 220 + 64;
  drawCalendar(ctx, pad, calTop, W - pad * 2, H - calTop - 110, opts);
  drawFooter(ctx, pad, H - pad, W - pad * 2);
}

function renderStory(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: ShareCardOptions,
) {
  const pad = 96;
  drawHeader(ctx, pad, pad + 40, W - pad * 2, opts);
  // Stories get prime real estate above the fold — much bigger title.
  const titleBottom = drawTitle(ctx, pad, 360, W - pad * 2, opts, {
    titleSize: 104,
    titleLeading: 120,
    dailySize: 32,
    maxTitleLines: 3,
  });
  const statsTop = Math.max(titleBottom + 64, 880);
  drawStatsCard(ctx, pad, statsTop, W - pad * 2, 240, opts);
  const calTop = statsTop + 240 + 80;
  // Reserve space at the bottom for the CTA banner + footer.
  const calBottom = H - 320;
  drawCalendar(ctx, pad, calTop, W - pad * 2, calBottom - calTop, opts);
  drawCtaBanner(ctx, pad, H - 240, W - pad * 2);
  drawFooter(ctx, pad, H - pad, W - pad * 2);
}

// =========================================================================
// Shared building blocks
// =========================================================================

function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
) {
  // Diagonal brand gradient — top-left lighter, bottom-right deeper —
  // gives the card visible depth instead of looking like a flat fill.
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, BRAND_400);
  g.addColorStop(0.55, BRAND_600);
  g.addColorStop(1, BRAND_900);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawDecor(ctx: CanvasRenderingContext2D, W: number, H: number) {
  // Soft radial highlight in the top-right + a faint streak-coloured
  // glow bottom-left for warmth. Subtle — improves perceived quality
  // without making the card look "designed".
  const r1 = ctx.createRadialGradient(
    W * 0.85,
    H * 0.12,
    20,
    W * 0.85,
    H * 0.12,
    W * 0.6,
  );
  r1.addColorStop(0, "rgba(255,255,255,0.22)");
  r1.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = r1;
  ctx.fillRect(0, 0, W, H);

  const r2 = ctx.createRadialGradient(
    W * 0.1,
    H * 0.92,
    20,
    W * 0.1,
    H * 0.92,
    W * 0.7,
  );
  r2.addColorStop(0, "rgba(245,158,11,0.18)");
  r2.addColorStop(1, "rgba(245,158,11,0)");
  ctx.fillStyle = r2;
  ctx.fillRect(0, 0, W, H);
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  opts: ShareCardOptions,
) {
  drawLogo(ctx, x, y);
  drawChip(
    ctx,
    `Day ${opts.currentDay} of ${opts.totalDays}`,
    x + w,
    y,
    "right",
  );
}

interface TitleLayout {
  titleSize: number;
  titleLeading: number;
  dailySize: number;
  maxTitleLines?: number;
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  opts: ShareCardOptions,
  layout: TitleLayout,
): number {
  const maxLines = layout.maxTitleLines ?? 2;
  const lines = wrapText(
    ctx,
    opts.challengeTitle,
    w,
    `800 ${layout.titleSize}px ${FONT_STACK}`,
    maxLines,
  );

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `800 ${layout.titleSize}px ${FONT_STACK}`;
  let cursor = y;
  for (const line of lines) {
    ctx.fillText(line, x, cursor);
    cursor += layout.titleLeading;
  }

  // Daily task line — italicised by weight contrast, brand-100 tint so
  // it sits behind the title in the visual hierarchy.
  ctx.fillStyle = BRAND_50;
  ctx.font = `500 ${layout.dailySize}px ${FONT_STACK}`;
  const dailyLines = wrapText(
    ctx,
    `“${opts.dailyTask}”`,
    w,
    `500 ${layout.dailySize}px ${FONT_STACK}`,
    2,
  );
  cursor += 16;
  for (const line of dailyLines) {
    ctx.fillText(line, x, cursor);
    cursor += layout.dailySize * 1.35;
  }
  return cursor;
}

function drawStatsCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: ShareCardOptions,
) {
  // Card with a soft shadow + subtle inner gradient so it lifts off the
  // brand bg instead of looking pasted on.
  ctx.save();
  ctx.shadowColor = "rgba(6,78,59,0.35)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, x, y, w, h, 32);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#f8fafc");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  const cells: Array<{ label: string; value: string; accent?: string }> = [
    { label: "ACTIVE", value: `${opts.activeDays}` },
    {
      label: "STREAK",
      value: `${opts.currentStreak}`,
      accent: STREAK,
    },
    { label: "LONGEST", value: `${opts.longestStreak}` },
    {
      label: "DONE",
      value: `${Math.round(opts.completionRate * 100)}%`,
      accent: BRAND_500,
    },
  ];
  const cellW = w / cells.length;
  cells.forEach((cell, i) => {
    drawStat(ctx, x + i * cellW, y, cellW, h, cell.label, cell.value, cell.accent);
    // Vertical separators between stats.
    if (i > 0) {
      ctx.fillStyle = "rgba(15,23,42,0.08)";
      ctx.fillRect(x + i * cellW, y + h * 0.22, 2, h * 0.56);
    }
  });
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accent: string | undefined,
) {
  ctx.fillStyle = INK_MUTED;
  ctx.font = `700 20px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + w / 2, y + 40);

  // Value — accent colour if specified, else ink.
  ctx.fillStyle = accent ?? INK;
  // Auto-shrink the value font if the string is long (e.g., 100%) so
  // it doesn't crash into the separator.
  const valuePx = value.length >= 4 ? 60 : 72;
  ctx.font = `800 ${valuePx}px ${FONT_STACK}`;
  ctx.textBaseline = "middle";
  ctx.fillText(value, x + w / 2, y + h / 2 + 18);
}

function drawCalendar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  hCap: number,
  opts: ShareCardOptions,
) {
  // Pick a column count that yields the largest square cells inside the
  // available box. Squarer cells = more legible day numbers.
  const cols = pickCols(opts.totalDays);
  const rows = Math.ceil(opts.totalDays / cols);
  const gap = 12;
  const cellW = (w - gap * (cols - 1)) / cols;
  const cellH = (hCap - gap * (rows - 1)) / rows;
  const cellSize = Math.max(28, Math.min(cellW, cellH));
  const gridW = cols * cellSize + (cols - 1) * gap;
  const startX = x + (w - gridW) / 2;
  // Label above the grid.
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `700 22px ${FONT_STACK}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${opts.totalDays}-day progress`, x, y - 16);

  for (let i = 0; i < opts.totalDays; i += 1) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cx = startX + c * (cellSize + gap);
    const cy = y + r * (cellSize + gap);
    drawDayCell(
      ctx,
      cx,
      cy,
      cellSize,
      i + 1,
      opts.daysStatus[i],
      i + 1 === opts.currentDay,
    );
  }
}

function pickCols(totalDays: number): number {
  if (totalDays <= 7) return totalDays;
  if (totalDays <= 14) return 7;
  if (totalDays <= 21) return 7;
  if (totalDays <= 30) return 6;
  if (totalDays <= 45) return 9;
  if (totalDays <= 60) return 10;
  return 10;
}

function drawDayCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  dayNumber: number,
  status: DayStatus,
  isToday: boolean,
) {
  let bg = "rgba(255,255,255,0.16)";
  let fg = "rgba(255,255,255,0.7)";
  if (status === "COMPLETED") {
    bg = STREAK;
    fg = STREAK_DARK;
  } else if (status === "MISSED") {
    bg = ROSE_300;
    fg = ROSE_900;
  } else if (status === "SKIPPED") {
    bg = SLATE_300;
    fg = SLATE_700;
  }

  const radius = Math.max(8, size * 0.18);
  roundRect(ctx, x, y, size, size, radius);
  ctx.fillStyle = bg;
  ctx.fill();

  if (isToday) {
    // Strong white outline ring so the user can spot "you are here" at
    // a glance, even against the brand bg.
    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(3, size * 0.06);
    roundRect(ctx, x, y, size, size, radius);
    ctx.stroke();
    ctx.restore();
  }

  // Day number — only render if there's room for it to be legible.
  // Below ~32px the digit becomes mush and just adds visual noise.
  if (size >= 32) {
    const fontSize = Math.floor(size * 0.42);
    ctx.fillStyle = fg;
    ctx.font = `700 ${fontSize}px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(dayNumber), x + size / 2, y + size / 2 + size * 0.04);
  }
}

function drawCtaBanner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
) {
  // Pill banner that draws the eye to vital30.com. Story format only —
  // square + portrait rely on the footer for the URL since space is
  // tighter.
  const h = 96;
  roundRect(ctx, x, y, w, h, 48);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.fillStyle = BRAND_700;
  ctx.font = `800 36px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Join me at vital30.com", x + w / 2, y + h / 2 + 2);
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
) {
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `600 20px ${FONT_STACK}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("vital30.com", x, y);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `500 18px ${FONT_STACK}`;
  ctx.textAlign = "right";
  ctx.fillText("30-day wellness challenges", x + w, y);
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
) {
  // White rounded pill: green "V" mark + Vital30 wordmark.
  const padX = 20;
  const padY = 12;
  const iconSize = 40;
  ctx.font = `800 32px ${FONT_STACK}`;
  const text = "Vital30";
  const textW = ctx.measureText(text).width;
  const pillW = padX * 2 + iconSize + 14 + textW;
  const pillH = padY * 2 + iconSize;

  // Shadow lift.
  ctx.save();
  ctx.shadowColor = "rgba(6,78,59,0.35)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  // Green "V" tile.
  roundRect(ctx, x + padX, y + padY, iconSize, iconSize, 10);
  ctx.fillStyle = BRAND_500;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 26px ${FONT_STACK}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("V", x + padX + iconSize / 2, y + padY + iconSize / 2 + 1);

  // Wordmark.
  ctx.fillStyle = INK;
  ctx.font = `800 32px ${FONT_STACK}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(text, x + padX + iconSize + 14, y + pillH / 2);
}

function drawChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  anchor: "left" | "right",
) {
  ctx.font = `800 24px ${FONT_STACK}`;
  const textW = ctx.measureText(text).width;
  const padX = 24;
  const padY = 18;
  const w = textW + padX * 2;
  const h = 24 + padY * 2;
  const startX = anchor === "right" ? x - w : x;

  ctx.save();
  ctx.shadowColor = "rgba(6,78,59,0.25)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, startX, y, w, h, h / 2);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fill();
  ctx.restore();

  // Subtle white border so the chip reads as a "tag" not a smudge.
  roundRect(ctx, startX, y, w, h, h / 2);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, startX + w / 2, y + h / 2 + 1);
}

// =========================================================================
// Geometry helpers
// =========================================================================

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
  maxLines: number,
): string[] {
  ctx.font = font;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  // Truncate any overflow into the last allowed line with an ellipsis,
  // so a paragraph-length title never pushes the rest of the card off
  // the canvas.
  if (lines.length > maxLines) {
    let last = lines.slice(maxLines - 1).join(" ");
    while (
      ctx.measureText(`${last}…`).width > maxWidth &&
      last.length > 1
    ) {
      last = last.slice(0, -1);
    }
    lines.length = maxLines;
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
