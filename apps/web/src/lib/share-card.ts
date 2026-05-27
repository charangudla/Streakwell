/**
 * Client-side share-card renderer for /my-challenges/[id]/progress.
 *
 * Draws a 1080×1080 PNG (Instagram-square; works on Twitter, FB, Stories,
 * etc.) summarising the user's challenge progress: title, day X of Y,
 * key stats, and a mini 30-day grid colour-coded the same way the
 * on-screen calendar is. Returned as a Blob ready to hand to the Web
 * Share API or to download.
 *
 * Deliberately canvas-based instead of html2canvas / dom-to-image so we
 * don't add a 100+kb dependency for one feature, and instead of a
 * next/og server route so we don't have to plumb cookie-gated API
 * lookups through an image handler. The trade-off is that we manage
 * layout by hand — keep the dimensions in this file and only this file.
 *
 * Mirrors the mobile app's share card (Flutter RepaintBoundary export
 * via share_plus) so the brand surface is consistent across platforms.
 */

export type DayStatus = "COMPLETED" | "MISSED" | "SKIPPED" | undefined;

export interface ShareCardOptions {
  challengeTitle: string;
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

// Vital30 brand palette — kept in sync with src/app/globals.css @theme.
// Hard-coded here because canvas can't read CSS custom properties off
// the document root reliably across browsers (Safari iOS in particular).
const BRAND_500 = "#10b981";
const BRAND_700 = "#047857";
const BRAND_100 = "#d1fae5";
const STREAK = "#f59e0b";
const INK = "#0f172a";
const INK_MUTED = "#64748b";
const ROSE_200 = "#fecaca";
const SLATE_200 = "#e2e8f0";
const SLATE_100 = "#f1f5f9";

// System font stack — avoids any async font loading.
const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export async function generateShareCardBlob(
  opts: ShareCardOptions,
): Promise<Blob> {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available.");

  // ---- Background: brand gradient ----
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, BRAND_500);
  bg.addColorStop(1, BRAND_700);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ---- Top chip row: logo + "Day X of Y" ----
  drawLogo(ctx, 64, 64);
  drawChip(
    ctx,
    `Day ${opts.currentDay} of ${opts.totalDays}`,
    W - 64,
    64,
    "right",
  );

  // ---- Title (white, wrapped) ----
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const titleLines = wrapText(
    ctx,
    opts.challengeTitle,
    W - 128,
    72,
    `700 72px ${FONT_STACK}`,
  );
  let y = 220;
  ctx.font = `700 72px ${FONT_STACK}`;
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, 64, y);
    y += 84;
  }

  // ---- Tagline ----
  ctx.font = `500 28px ${FONT_STACK}`;
  ctx.fillStyle = BRAND_100;
  ctx.fillText("30-day wellness challenge · vital30.com", 64, y + 12);

  // ---- Stats card (white, four big numbers) ----
  const cardX = 64;
  const cardY = 460;
  const cardW = W - 128;
  const cardH = 200;
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  drawStat(ctx, cardX, cardY, cardW / 4, cardH, "ACTIVE", `${opts.activeDays}`);
  drawStat(
    ctx,
    cardX + cardW / 4,
    cardY,
    cardW / 4,
    cardH,
    "STREAK",
    `${opts.currentStreak}`,
  );
  drawStat(
    ctx,
    cardX + (cardW / 4) * 2,
    cardY,
    cardW / 4,
    cardH,
    "LONGEST",
    `${opts.longestStreak}`,
  );
  drawStat(
    ctx,
    cardX + (cardW / 4) * 3,
    cardY,
    cardW / 4,
    cardH,
    "COMPLETE",
    `${Math.round(opts.completionRate * 100)}%`,
  );

  // ---- Mini calendar grid ----
  // Lay out the totalDays cells in a 6-column grid (matches mobile
  // app share card). Cell size scales with number of rows so any
  // duration (7..90) renders cleanly.
  const gridX = 64;
  const gridY = 720;
  const gridW = W - 128;
  const cols = 6;
  const rows = Math.ceil(opts.totalDays / cols);
  const gap = 12;
  const cellSize = Math.min(72, Math.floor((gridW - gap * (cols - 1)) / cols));
  const gridStartX =
    gridX + (gridW - (cols * cellSize + (cols - 1) * gap)) / 2;

  for (let i = 0; i < opts.totalDays; i += 1) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = gridStartX + c * (cellSize + gap);
    const yy = gridY + r * (cellSize + gap);
    const status = opts.daysStatus[i];
    let fill = "rgba(255,255,255,0.18)"; // upcoming on dark bg
    if (status === "COMPLETED") fill = STREAK;
    else if (status === "MISSED") fill = ROSE_200;
    else if (status === "SKIPPED") fill = SLATE_200;
    roundRect(ctx, x, yy, cellSize, cellSize, 10);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // ---- Footer: legend + URL ----
  ctx.font = `600 22px ${FONT_STACK}`;
  ctx.fillStyle = BRAND_100;
  ctx.textAlign = "left";
  ctx.fillText("Join me — vital30.com", 64, H - 88);

  ctx.font = `500 18px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("✓ Completed   ◌ Upcoming", 64, H - 52);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) reject(new Error("Canvas toBlob returned null."));
      else resolve(b);
    }, "image/png");
  });
}

// ---------- helpers ----------

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // White pill with the brand "V" mark + "Vital30" wordmark.
  const padX = 18;
  const padY = 10;
  ctx.font = `700 30px ${FONT_STACK}`;
  const text = "Vital30";
  const textW = ctx.measureText(text).width;
  const iconSize = 36;
  const pillW = padX * 2 + iconSize + 12 + textW;
  const pillH = padY * 2 + 36;
  roundRect(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Green "V" square inside the pill.
  roundRect(ctx, x + padX, y + padY, iconSize, iconSize, 8);
  ctx.fillStyle = BRAND_500;
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 24px ${FONT_STACK}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("V", x + padX + iconSize / 2, y + padY + iconSize / 2 + 1);

  ctx.fillStyle = INK;
  ctx.font = `700 30px ${FONT_STACK}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(text, x + padX + iconSize + 12, y + pillH / 2);
}

function drawChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  anchor: "left" | "right",
) {
  ctx.font = `700 22px ${FONT_STACK}`;
  const textW = ctx.measureText(text).width;
  const padX = 20;
  const padY = 12;
  const w = textW + padX * 2;
  const h = 22 + padY * 2;
  const startX = anchor === "right" ? x - w : x;
  roundRect(ctx, startX, y, w, h, h / 2);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, startX + w / 2, y + h / 2 + 1);
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
) {
  ctx.fillStyle = INK_MUTED;
  ctx.font = `700 18px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + w / 2, y + 36);

  ctx.fillStyle = INK;
  ctx.font = `800 64px ${FONT_STACK}`;
  ctx.textBaseline = "middle";
  ctx.fillText(value, x + w / 2, y + h / 2 + 18);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  font: string,
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
  // Truncate a final third line into the second with an ellipsis so
  // we never push the stats card off the canvas with a super-long title.
  if (lines.length > 2) {
    let second = lines[1];
    while (
      ctx.measureText(`${second}…`).width > maxWidth &&
      second.length > 0
    ) {
      second = second.slice(0, -1);
    }
    lines.length = 2;
    lines[1] = `${second}…`;
  }
  // Silence unused-param warning for fontSize — kept in the signature
  // because callers expect to pass it for readability.
  void fontSize;
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
