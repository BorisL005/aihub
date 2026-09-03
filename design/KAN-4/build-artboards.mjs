// AI Hub — KAN-4 entry list artboards (empty, loading, error, populated, pull-to-refresh).
// Tokens are copied from design/KAN-5/build-artboards.mjs, the single source of truth for
// design/DESIGN-SYSTEM.md — kept in sync by hand since each ticket's script writes its own
// folder. If you change a token here, change it there too (and in DESIGN-SYSTEM.md).
// Run: node design/KAN-4/build-artboards.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

/* ---------------------------------------------------------------- tokens
   Identical to design/KAN-5/build-artboards.mjs — KAN-4 inherits the baseline unchanged. */
const T = {
  bg:         'oklch(0.975 0 0)',
  surface:    '#ffffff',
  sunk:       'oklch(0.945 0 0)',
  line:       'oklch(0.900 0 0)',
  lineStrong: 'oklch(0.800 0 0)',
  ink:        'oklch(0.200 0 0)',
  inkMuted:   'oklch(0.500 0 0)',
  inkFaint:   'oklch(0.650 0 0)',
  chrome:     'oklch(0.160 0 0)',
  chromeRaised:'oklch(0.240 0 0)',
  onDark:     'oklch(0.970 0 0)',
  onDarkMuted:'oklch(0.720 0 0)',
  accent:     'oklch(0.520 0.160 252)',
  accentTint: 'oklch(0.960 0.025 252)',
  positive:   'oklch(0.500 0.130 150)',
  positiveTint:'oklch(0.955 0.030 150)',
  warn:       'oklch(0.520 0.110 70)',
  warnTint:   'oklch(0.955 0.035 75)',
  danger:     'oklch(0.520 0.160 27)',
  dangerTint: 'oklch(0.955 0.028 27)',
};

const FONT = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
const NUM = 'font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;';

const R_CTRL = 6;
const R_CARD = 12;

const W = 390, H = 844, TOP = 59, BOTTOM = 34, GUT = 16;
const ROW_H = 64, THUMB = 40;

/* ------------------------------------------------------------ primitives */
const icon = {
  camera: (c, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7a1 1 0 0 0 .84-.46l.92-1.42A1 1 0 0 1 9.8 3.7h4.4a1 1 0 0 1 .84.42l.92 1.42A1 1 0 0 0 16.8 6h1.7A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5Z"/><circle cx="12" cy="12.5" r="3.6"/></svg>`,
  chevronLeft: (c, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg>`,
  receipt: (c, s = 24, sw = 1.5) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.2h12v17.6l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4Z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/></svg>`,
  alert: (c, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5 21 19.5H3Z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.7" fill="${c}" stroke="none"/></svg>`,
};

// Drawn stand-in for a receipt photo. Flat: no shadow, no gradient. Copied verbatim from KAN-5.
const photoPlate = (w, h, r, tone = 'light') => {
  const bg = T.sunk, paper = '#ffffff', rule = T.line, edge = T.line;
  const pw = Math.round(w * 0.44), ph = Math.round(h * 0.64);
  return `<div style="width: ${w}px; height: ${h}px; border-radius: ${r}px; background: ${bg}; border: 1px solid ${edge}; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
      <div style="width: ${pw}px; height: ${ph}px; background: ${paper}; transform: rotate(-3deg); display: flex; flex-direction: column; gap: ${Math.max(3, Math.round(ph / 16))}px; padding: ${Math.max(4, Math.round(pw / 8))}px;">
        ${Array.from({ length: 6 }, (_, i) => `<div style="height: 2px; background: ${rule}; width: ${[70, 100, 100, 88, 100, 52][i]}%;"></div>`).join('')}
      </div>
    </div>`;
};

const badge = (kind) => {
  const map = {
    pending:  ['Not read yet', T.warn, T.warnTint],
    review:   ['Needs a check', T.danger, T.dangerTint],
    extracted:['Read', T.positive, T.positiveTint],
  };
  const [label, fg, bg] = map[kind];
  return `<span style="display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: ${R_CTRL}px; background: ${bg}; color: ${fg}; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap;">${label}</span>`;
};

const listRow = (opts) => {
  const { title, meta, right, tint, last } = opts;
  return `<div style="display: flex; align-items: center; gap: 12px; height: ${ROW_H}px; padding: 0 ${GUT}px; background: ${tint || 'transparent'}; box-shadow: ${last ? 'none' : `inset 0 -1px 0 0 ${T.line}`}; cursor: pointer;">
      ${photoPlate(THUMB, THUMB, R_CTRL)}
      <div style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1; min-width: 0;">
        <div style="font-size: 16px; font-weight: 600; color: ${T.ink}; letter-spacing: -0.008em;">${title}</div>
        <div style="font-size: 13px; color: ${T.inkMuted}; ${NUM}">${meta}</div>
      </div>
      <div style="display: flex; align-items: center; justify-content: flex-end; min-width: 88px; flex-shrink: 0;">${right}</div>
    </div>`;
};

// New primitive for this ticket: a skeleton row, same geometry as listRow so the swap-in
// on data arrival cannot reflow. Fill is --sunk (the token already used for inset wells);
// no new colour token needed. The pulse explains a state change (loading), the one motion
// exception the system allows.
const skeletonRow = (last) => `<div style="display: flex; align-items: center; gap: 12px; height: ${ROW_H}px; padding: 0 ${GUT}px; box-shadow: ${last ? 'none' : `inset 0 -1px 0 0 ${T.line}`};">
    <div class="sk" style="width: ${THUMB}px; height: ${THUMB}px; border-radius: ${R_CTRL}px; background: ${T.sunk}; flex-shrink: 0;"></div>
    <div style="display: flex; flex-direction: column; gap: 6px; flex-grow: 1; min-width: 0;">
      <div class="sk" style="width: 96px; height: 14px; border-radius: ${R_CTRL}px; background: ${T.sunk};"></div>
      <div class="sk" style="width: 64px; height: 11px; border-radius: ${R_CTRL}px; background: ${T.sunk};"></div>
    </div>
    <div class="sk" style="width: 60px; height: 20px; border-radius: ${R_CTRL}px; background: ${T.sunk}; flex-shrink: 0;"></div>
  </div>`;

// New primitive: refresh spinner. Accent stroke — this is progress feedback, the same
// exemption the upload progress bar uses; it is the only other place the accent fills/draws a shape.
const spinner = (s = 20) => `<svg class="spin" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="${T.line}" stroke-width="2.5"/><path d="M21 12a9 9 0 0 0-9-9" stroke="${T.accent}" stroke-width="2.5" stroke-linecap="round"/></svg>`;

const btnPrimary = (label, glyph = '') => `<button style="width: 100%; height: 48px; border: none; border-radius: ${R_CTRL}px; background: ${T.ink}; color: #ffffff; font-family: ${FONT}; font-size: 16px; font-weight: 600; letter-spacing: -0.008em; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">${glyph}${label}</button>`;

const banner = (tone, title, body) => {
  const [fg, bg] = tone === 'danger' ? [T.danger, T.dangerTint] : [T.warn, T.warnTint];
  return `<div style="display: flex; gap: 10px; padding: 12px 14px; border-radius: ${R_CARD}px; background: ${bg};">
      <div style="flex-shrink: 0; padding-top: 2px;">${icon.alert(fg, 18)}</div>
      <div style="display: flex; flex-direction: column; gap: 3px;">
        <div style="font-size: 15px; font-weight: 600; color: ${fg}; letter-spacing: -0.006em;">${title}</div>
        <div style="font-size: 14px; line-height: 20px; color: ${T.ink};">${body}</div>
      </div>
    </div>`;
};

const screenTitle = (text, sub) => `<div style="padding: 4px ${GUT}px 12px; display: flex; align-items: baseline; justify-content: space-between; gap: 12px;">
    <div style="font-size: 28px; font-weight: 700; letter-spacing: -0.021em; color: ${T.ink};">${text}</div>
    ${sub ? `<div style="font-size: 13px; color: ${T.inkMuted}; ${NUM}">${sub}</div>` : ''}
  </div>`;

const backRow = (label = 'Projects') => `<div style="display: flex; align-items: center; gap: 2px; height: 44px; padding: 0 ${GUT - 5}px;">
    ${icon.chevronLeft(T.accent, 18)}<span style="font-size: 15px; font-weight: 500; color: ${T.accent}; letter-spacing: -0.006em;">${label}</span>
  </div>`;

const spec = (text) => `<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 5px ${GUT}px; background: ${T.sunk}; border-top: 1px solid ${T.line}; font-size: 10px; font-weight: 500; letter-spacing: 0.015em; color: ${T.inkFaint};">${text}</div>`;

const wrap = (inner, pw = W, ph = H, extraStyle = '') => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
  <style>
    body { margin: 0; font-family: ${FONT}; -webkit-font-smoothing: antialiased; }
    * { box-sizing: border-box; }
    button { font-family: ${FONT}; }
    a { color: ${T.accent}; text-decoration: none; }
    a:hover { color: oklch(0.42 0.16 252); }
    ${extraStyle}
  </style>
</helmet>
${inner}
</x-dc>
<script data-dc-script data-props='{"$preview":{"width":${pw},"height":${ph}}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`;

const phone = (body, bg = T.bg) => `<div style="width: ${W}px; height: ${H}px; background: ${bg}; position: relative; overflow: hidden; display: flex; flex-direction: column;">
${body}
</div>`;

const topInset = `<div style="height: ${TOP}px; flex-shrink: 0;"></div>`;
const bottomInset = `<div style="height: ${BOTTOM}px; flex-shrink: 0;"></div>`;

/* ------------------------------------------------------------- artboards */
const files = {};

/* 1. Main — receipts list, populated. Byte-identical content to design/KAN-5/Main.dc.html —
   this ticket's Notes for design says the populated list already exists on KAN-5's canvas
   and must match exactly. Only the spec footer changes (this ticket's AC). */
files['Main.dc.html'] = wrap(phone(`
${topInset}
${backRow()}
${screenTitle('Receipts', '6 receipts')}
<div style="flex-grow: 1; overflow: hidden; background: ${T.surface}; border-top: 1px solid ${T.line};">
  ${listRow({ title: 'Receipt', meta: 'Today, 14:32', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: 'Today, 09:05', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: 'Yesterday, 18:44', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: 'Yesterday, 12:10', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: '31 Aug, 19:22', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: '30 Aug, 08:15', right: badge('pending'), last: true })}
</div>
<div style="flex-shrink: 0; padding: 10px ${GUT}px 0; background: ${T.bg}; border-top: 1px solid ${T.line};">
  ${btnPrimary('Capture receipt', icon.camera('#ffffff', 20))}
</div>
${bottomInset}
${spec('AC-8 · list, populated · reused unchanged from the KAN-5 canvas (Main.dc.html there)')}
`));

/* 2. ListEmpty — first run. Byte-identical content to design/KAN-5/ListEmpty.dc.html. */
files['ListEmpty.dc.html'] = wrap(phone(`
${topInset}
${backRow()}
${screenTitle('Receipts')}
<div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 0 40px 70px; text-align: center;">
  ${icon.receipt(T.inkFaint, 30, 1.4)}
  <div style="font-size: 17px; font-weight: 600; color: ${T.ink}; letter-spacing: -0.01em; margin-top: 2px;">No receipts yet</div>
  <div style="font-size: 15px; line-height: 21px; color: ${T.inkMuted}; text-wrap: pretty;">Take a photo of a receipt and you can throw the paper away straight&nbsp;after.</div>
</div>
<div style="flex-shrink: 0; padding: 10px ${GUT}px 0;">
  ${btnPrimary('Capture receipt', icon.camera('#ffffff', 20))}
</div>
${bottomInset}
${spec('AC-8 · list, empty · reused unchanged from the KAN-5 canvas (ListEmpty.dc.html there) · the app’s front door')}
`));

/* 3. ListLoading — cold load, before the first response. New for this ticket. */
files['ListLoading.dc.html'] = wrap(phone(`
${topInset}
${backRow()}
${screenTitle('Receipts')}
<div style="flex-grow: 1; overflow: hidden; background: ${T.surface}; border-top: 1px solid ${T.line};">
  ${skeletonRow(false)}
  ${skeletonRow(false)}
  ${skeletonRow(false)}
  ${skeletonRow(false)}
  ${skeletonRow(false)}
  ${skeletonRow(true)}
</div>
<div style="flex-shrink: 0; padding: 10px ${GUT}px 0; background: ${T.bg}; border-top: 1px solid ${T.line};">
  ${btnPrimary('Capture receipt', icon.camera('#ffffff', 20))}
</div>
${bottomInset}
${spec('AC-8 · list, loading · row geometry pinned so the populated swap-in cannot reflow')}
`), W, H, `
    @keyframes sk-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .sk { animation: sk-pulse 1.1s ease-in-out infinite; }
  `);

/* 4. ListError — load failed, with retry. New for this ticket.
   Deliberate deviation from the system's "always one way forward, one way back" rule:
   this screen has no "back" to offer. It is the app's front door — there is nowhere
   behind it to return to. Retry is the only, and only necessary, way out. */
files['ListError.dc.html'] = wrap(phone(`
${topInset}
${backRow()}
${screenTitle('Receipts')}
<div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 0 40px 70px; text-align: center;">
  ${icon.alert(T.danger, 28)}
  <div style="font-size: 17px; font-weight: 600; color: ${T.ink}; letter-spacing: -0.01em; margin-top: 2px;">Couldn&#39;t load your receipts</div>
  <div style="font-size: 15px; line-height: 21px; color: ${T.inkMuted}; text-wrap: pretty;">Check your connection and try again.</div>
</div>
<div style="flex-shrink: 0; padding: 10px ${GUT}px 0;">
  ${btnPrimary('Try again')}
</div>
${bottomInset}
${spec('AC-8 · list, error · Try again refetches · no "back" offered — this screen is the front door')}
`));

/* 5. PullToRefresh — populated list, mid-gesture. New for this ticket.
   KAN-5 AC-2 depends on this list refreshing after a save. */
files['PullToRefresh.dc.html'] = wrap(phone(`
${topInset}
${backRow()}
<div style="display: flex; align-items: center; justify-content: center; height: 46px; flex-shrink: 0;">
  ${spinner(20)}
</div>
${screenTitle('Receipts', '6 receipts')}
<div style="flex-grow: 1; overflow: hidden; background: ${T.surface}; border-top: 1px solid ${T.line};">
  ${listRow({ title: 'Receipt', meta: 'Today, 14:32', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: 'Today, 09:05', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: 'Yesterday, 18:44', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: 'Yesterday, 12:10', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: '31 Aug, 19:22', right: badge('pending'), last: true })}
</div>
<div style="flex-shrink: 0; padding: 10px ${GUT}px 0; background: ${T.bg}; border-top: 1px solid ${T.line};">
  ${btnPrimary('Capture receipt', icon.camera('#ffffff', 20))}
</div>
${bottomInset}
${spec('AC-8 · pull-to-refresh in progress · spinner is the same accent used for upload progress')}
`), W, H, `
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; }
  `);

/* ---------------------------------------------------------------- write */
for (const [name, html] of Object.entries(files)) {
  writeFileSync(join(OUT, name), html, 'utf8');
}
console.log(`wrote ${Object.keys(files).length} artboards to ${OUT}`);
