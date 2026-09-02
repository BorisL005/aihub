// AI Hub — KAN-5 capture flow artboards.
// Single source of truth for the tokens in design/DESIGN-SYSTEM.md.
// Every value here is derived from the owner-set §Aesthetic direction in that file.
// Run: node design/KAN-5/build-artboards.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

/* ---------------------------------------------------------------- tokens
   Neutral base (true neutral, zero chroma) + ONE accent + semantic status.
   Nothing else, per §Aesthetic direction.                                   */
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

/* One typeface. Hierarchy is weight, size and contrast — never a second font. */
const FONT = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
const NUM = 'font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;';

/* Exactly two corner radii in the whole system. */
const R_CTRL = 6;   // buttons, badges, thumbnails, inputs, chips, progress
const R_CARD = 12;  // sheets, cards, banners, toasts

const W = 390, H = 844, TOP = 59, BOTTOM = 34, GUT = 16;
const ROW_H = 64, THUMB = 40, DIVIDER_INSET = GUT + THUMB + 12;

/* ------------------------------------------------------------ primitives */
const icon = {
  camera: (c, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7a1 1 0 0 0 .84-.46l.92-1.42A1 1 0 0 1 9.8 3.7h4.4a1 1 0 0 1 .84.42l.92 1.42A1 1 0 0 0 16.8 6h1.7A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5Z"/><circle cx="12" cy="12.5" r="3.6"/></svg>`,
  chevronLeft: (c, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg>`,
  settings: (c, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.1M12 19.1v2.1M21.2 12h-2.1M4.9 12H2.8M18.5 5.5 17 7M7 17l-1.5 1.5M18.5 18.5 17 17M7 7 5.5 5.5"/></svg>`,
  lockedCamera: (c, s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7a1 1 0 0 0 .84-.46l.92-1.42A1 1 0 0 1 9.8 3.7h4.4a1 1 0 0 1 .84.42l.92 1.42A1 1 0 0 0 16.8 6h1.7A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5Z"/><path d="M4 4l16 16"/></svg>`,
  alert: (c, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5 21 19.5H3Z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.7" fill="${c}" stroke="none"/></svg>`,
  check: (c, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>`,
  flash: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2.5 5.5 13.5H11l-1 8 8.5-11.5H13Z"/></svg>`,
  retake: (c, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-1.2 5.4"/><path d="M20 4.5V11h-6.4"/></svg>`,
  receipt: (c, s = 24, sw = 1.5) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.2h12v17.6l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4Z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/></svg>`,
};

// Drawn stand-in for a receipt photo. Flat: no shadow, no gradient.
const photoPlate = (w, h, r, tone = 'light') => {
  const bg = tone === 'light' ? T.sunk : 'oklch(0.30 0 0)';
  const paper = tone === 'light' ? '#ffffff' : 'oklch(0.86 0 0)';
  const rule = tone === 'light' ? T.line : 'oklch(0.70 0 0)';
  const edge = tone === 'light' ? T.line : 'oklch(0.34 0 0)';
  const pw = Math.round(w * 0.44), ph = Math.round(h * 0.64);
  return `<div style="width: ${w}px; height: ${h}px; border-radius: ${r}px; background: ${bg}; border: 1px solid ${edge}; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
      <div style="width: ${pw}px; height: ${ph}px; background: ${paper}; transform: rotate(-3deg); display: flex; flex-direction: column; gap: ${Math.max(3, Math.round(ph / 16))}px; padding: ${Math.max(4, Math.round(pw / 8))}px;">
        ${Array.from({ length: 6 }, (_, i) => `<div style="height: 2px; background: ${rule}; width: ${[70, 100, 100, 88, 100, 52][i]}%;"></div>`).join('')}
      </div>
    </div>`;
};

// Jira-style: small, consistent, text-labeled. Control radius, never a pill.
const badge = (kind) => {
  const map = {
    pending:  ['Not read yet', T.warn, T.warnTint],
    review:   ['Needs a check', T.danger, T.dangerTint],
    extracted:['Read', T.positive, T.positiveTint],
  };
  const [label, fg, bg] = map[kind];
  return `<span style="display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: ${R_CTRL}px; background: ${bg}; color: ${fg}; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap;">${label}</span>`;
};

// Primary is INK, not accent: hierarchy is contrast, colour is reserved for meaning.
const btnPrimary = (label, glyph = '') => `<button style="width: 100%; height: 48px; border: none; border-radius: ${R_CTRL}px; background: ${T.ink}; color: #ffffff; font-family: ${FONT}; font-size: 16px; font-weight: 600; letter-spacing: -0.008em; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">${glyph}${label}</button>`;

const btnSecondary = (label, glyph = '') => `<button style="width: 100%; height: 48px; border: 1px solid ${T.lineStrong}; border-radius: ${R_CTRL}px; background: ${T.surface}; color: ${T.ink}; font-family: ${FONT}; font-size: 16px; font-weight: 600; letter-spacing: -0.008em; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">${glyph}${label}</button>`;

const btnQuiet = (label, color = T.accent) => `<button style="width: 100%; height: 44px; border: none; border-radius: ${R_CTRL}px; background: transparent; color: ${color}; font-family: ${FONT}; font-size: 15px; font-weight: 600; letter-spacing: -0.006em; cursor: pointer;">${label}</button>`;

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

/* ------------------------------------------------------------- file shell */
const wrap = (inner, pw = W, ph = H) => `<!doctype html>
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

// Safe-area spacers. The real status bar and home indicator paint on top of these.
const topInset = `<div style="height: ${TOP}px; flex-shrink: 0;"></div>`;
const bottomInset = `<div style="height: ${BOTTOM}px; flex-shrink: 0;"></div>`;

/* ------------------------------------------------------------- artboards */
const files = {};

/* 1. Main — receipts list, populated (AC-2 baseline, capture entry point) */
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
${spec('AC-2 · list, populated · rows tappable full width · primary action in thumb reach')}
`));

/* 2. ListEmpty — first run */
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
${spec('list, empty · same capture button position as the populated list')}
`));

/* 3. PermissionAsk — our rationale, shown before the OS prompt */
files['PermissionAsk.dc.html'] = wrap(phone(`
${topInset}
${backRow('Receipts')}
<div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 14px; padding: 0 ${GUT + 8}px 50px;">
  ${icon.camera(T.inkMuted, 26)}
  <div style="font-size: 22px; font-weight: 700; letter-spacing: -0.018em; color: ${T.ink}; line-height: 28px; text-wrap: pretty;">AI Hub needs your camera</div>
  <div style="font-size: 15px; line-height: 21px; color: ${T.inkMuted}; text-wrap: pretty;">You point it at a receipt, we keep the photo in your receipts. Nothing else uses the camera.</div>
</div>
<div style="flex-shrink: 0; display: flex; flex-direction: column; gap: 6px; padding: 0 ${GUT}px;">
  ${btnPrimary('Allow camera')}
  ${btnQuiet('Not now', T.inkMuted)}
</div>
${bottomInset}
${spec('permission not yet asked · Allow opens the system prompt — never a look-alike of it')}
`));

/* 4. PermissionDenied — blocked, route to Settings */
files['PermissionDenied.dc.html'] = wrap(phone(`
${topInset}
${backRow('Receipts')}
<div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 14px; padding: 0 ${GUT + 8}px 50px;">
  ${icon.lockedCamera(T.warn, 26)}
  <div style="font-size: 22px; font-weight: 700; letter-spacing: -0.018em; color: ${T.ink}; line-height: 28px; text-wrap: pretty;">Camera access is off</div>
  <div style="font-size: 15px; line-height: 21px; color: ${T.inkMuted}; text-wrap: pretty;">Turn it on for AI Hub in Settings and come back &mdash; then you can photograph a receipt.</div>
  <div style="display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; padding: 8px 10px; border-radius: ${R_CTRL}px; background: ${T.sunk}; border: 1px solid ${T.line}; margin-top: 2px;">
    ${icon.settings(T.inkMuted, 16)}
    <span style="font-size: 13px; font-weight: 500; color: ${T.inkMuted};">Settings &rsaquo; AI Hub &rsaquo; Camera</span>
  </div>
</div>
<div style="flex-shrink: 0; display: flex; flex-direction: column; gap: 6px; padding: 0 ${GUT}px;">
  ${btnPrimary('Open Settings')}
  ${btnQuiet('Back to receipts', T.inkMuted)}
</div>
${bottomInset}
${spec('permission denied · two ways out: Settings, or back to the list')}
`));

/* 5. CameraLive */
files['CameraLive.dc.html'] = wrap(phone(`
<div style="position: absolute; inset: 0; background: ${T.chrome};"></div>
<div style="position: relative; flex-grow: 1; display: flex; align-items: center; justify-content: center; overflow: hidden;">
  ${photoPlate(390, 560, 0, 'dark')}
  <div style="position: absolute; inset: 84px 28px 56px; pointer-events: none;">
    ${['top:0;left:0;border-top:2px solid;border-left:2px solid;border-top-left-radius:6px', 'top:0;right:0;border-top:2px solid;border-right:2px solid;border-top-right-radius:6px', 'bottom:0;left:0;border-bottom:2px solid;border-left:2px solid;border-bottom-left-radius:6px', 'bottom:0;right:0;border-bottom:2px solid;border-right:2px solid;border-bottom-right-radius:6px']
      .map((s) => `<div style="position: absolute; width: 28px; height: 28px; border-color: ${T.onDark}; opacity: 0.9; ${s};"></div>`).join('')}
  </div>
  <div style="position: absolute; left: 0; right: 0; top: ${TOP + 8}px; display: flex; justify-content: center;">
    <span style="padding: 7px 12px; border-radius: ${R_CTRL}px; background: oklch(0.16 0 0 / 0.7); color: ${T.onDark}; font-size: 14px; font-weight: 500;">Fit the whole receipt in the frame</span>
  </div>
</div>
<div style="position: relative; flex-shrink: 0; background: ${T.chrome}; padding: 16px ${GUT}px 0;">
  <div style="display: flex; align-items: center; justify-content: space-between; height: 84px;">
    <button style="min-width: 68px; height: 44px; border: none; background: transparent; color: ${T.onDark}; font-size: 15px; font-weight: 600; text-align: left; cursor: pointer;">Cancel</button>
    <button style="width: 68px; height: 68px; border-radius: 999px; border: 3px solid ${T.onDark}; background: transparent; padding: 4px; cursor: pointer;">
      <div style="width: 100%; height: 100%; border-radius: 999px; background: ${T.onDark};"></div>
    </button>
    <button style="min-width: 68px; height: 44px; border: none; background: transparent; display: flex; align-items: center; justify-content: flex-end; cursor: pointer;">${icon.flash(T.onDark, 22)}</button>
  </div>
</div>
${bottomInset}
${spec('AC-6 · camera live · Cancel returns to the list with nothing uploaded · shutter is a circle: camera convention, not a corner radius')}
`, T.chrome));

/* 6-10 share the photo-in-place frame so preview → saving → error never jumps. */
const previewFrame = (bottom, scrim = '', extra = '') => phone(`
<div style="position: absolute; inset: 0; background: ${T.chrome};"></div>
<div style="position: relative; flex-grow: 1; display: flex; align-items: center; justify-content: center; overflow: hidden;">
  ${photoPlate(390, 560, 0, 'dark')}
  <div style="position: absolute; left: 0; right: 0; top: ${TOP + 8}px; display: flex; justify-content: center;">
    <span style="padding: 7px 12px; border-radius: ${R_CTRL}px; background: oklch(0.16 0 0 / 0.7); color: ${T.onDark}; font-size: 14px; font-weight: 500;">Check the total is readable</span>
  </div>
  ${scrim}
</div>
<div style="position: relative; flex-shrink: 0; background: ${T.surface}; border-top: 1px solid ${T.line}; border-radius: ${R_CARD}px ${R_CARD}px 0 0; padding: 14px ${GUT}px 0; margin-top: -${R_CARD}px;">
${bottom}
</div>
${bottomInset}
${extra}
`, T.chrome);

files['Preview.dc.html'] = wrap(previewFrame(`
  <div style="display: flex; gap: 10px;">
    <div style="width: 132px; flex-shrink: 0;">${btnSecondary('Retake', icon.retake(T.ink, 18))}</div>
    <div style="flex-grow: 1;">${btnPrimary('Use photo')}</div>
  </div>
  <div style="height: 10px;"></div>
`, '', spec('AC-1 · preview · Use photo starts the save; Retake reopens the camera')));

files['Discard.dc.html'] = wrap(previewFrame(`
  <div style="display: flex; gap: 10px; opacity: 0.3;">
    <div style="width: 132px; flex-shrink: 0;">${btnSecondary('Retake', icon.retake(T.ink, 18))}</div>
    <div style="flex-grow: 1;">${btnPrimary('Use photo')}</div>
  </div>
  <div style="height: 10px;"></div>
`,
  `<div style="position: absolute; inset: 0; background: oklch(0.16 0 0 / 0.6);"></div>`,
  `<div style="position: absolute; left: 0; right: 0; bottom: 0; background: ${T.surface}; border-top: 1px solid ${T.line}; border-radius: ${R_CARD}px ${R_CARD}px 0 0; padding: 20px ${GUT}px ${BOTTOM + 10}px; display: flex; flex-direction: column; gap: 4px;">
    <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: ${T.ink};">Discard this photo?</div>
    <div style="font-size: 15px; line-height: 21px; color: ${T.inkMuted}; margin-bottom: 8px;">It hasn&#39;t been saved to your receipts yet.</div>
    ${btnSecondary('Keep it')}
    ${btnQuiet('Discard', T.danger)}
  </div>
  ${spec('AC-6 · discard confirm · nothing uploaded, no entry created')}`));

files['Uploading.dc.html'] = wrap(previewFrame(`
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <div style="display: flex; align-items: baseline; justify-content: space-between;">
      <span style="font-size: 16px; font-weight: 600; color: ${T.ink}; letter-spacing: -0.008em;">Saving your receipt</span>
      <span style="font-size: 15px; font-weight: 600; color: ${T.ink}; ${NUM}">64%</span>
    </div>
    <div style="height: 6px; border-radius: ${R_CTRL}px; background: ${T.sunk}; overflow: hidden;">
      <div style="width: 64%; height: 100%; border-radius: ${R_CTRL}px; background: ${T.accent};"></div>
    </div>
    <div style="font-size: 14px; color: ${T.inkMuted};">Keep the app open until it finishes.</div>
  </div>
  ${btnQuiet('Cancel', T.inkMuted)}
  <div style="height: 4px;"></div>
`, '', spec('AC-1 · saving · ONE bar, monotonic, never resets between the two network steps')));

files['UploadError.dc.html'] = wrap(previewFrame(`
  ${banner('danger', 'Couldn&#39;t save that receipt', 'Your photo is still here. Check your connection and try again.')}
  <div style="height: 12px;"></div>
  ${btnPrimary('Try again')}
  <div style="height: 4px;"></div>
  ${btnQuiet('Back to receipts', T.inkMuted)}
  <div style="height: 4px;"></div>
`, '', spec('AC-5 / AC-7 / AC-9 · save failed · photo kept on device until the receipt exists')));

files['PhotoRejected.dc.html'] = wrap(previewFrame(`
  ${banner('warn', 'This photo won&#39;t work', 'It&#39;s too big or in a format we can&#39;t read. Take another one and it&#39;ll be smaller.')}
  <div style="height: 12px;"></div>
  ${btnPrimary('Take another photo', icon.camera('#ffffff', 20))}
  <div style="height: 4px;"></div>
  ${btnQuiet('Back to receipts', T.inkMuted)}
  <div style="height: 4px;"></div>
`, '', spec('AC-4 · photo rejected · nothing stored, no entry created')));

/* 11. SuccessList (AC-1 + AC-2) */
files['SuccessList.dc.html'] = wrap(phone(`
${topInset}
${backRow()}
${screenTitle('Receipts', '7 receipts')}
<div style="flex-grow: 1; overflow: hidden; background: ${T.surface}; border-top: 1px solid ${T.line};">
  ${listRow({ title: 'Receipt', meta: 'Today, 16:07', right: badge('pending'), tint: T.accentTint })}
  ${listRow({ title: 'Receipt', meta: 'Today, 14:32', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: 'Today, 09:05', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: 'Yesterday, 18:44', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: 'Yesterday, 12:10', right: badge('pending') })}
  ${listRow({ title: 'Receipt', meta: '31 Aug, 19:22', right: badge('pending'), last: true })}
</div>
<div style="position: relative; flex-shrink: 0; padding: 10px ${GUT}px 0; background: ${T.bg}; border-top: 1px solid ${T.line};">
  <div style="position: absolute; left: ${GUT}px; right: ${GUT}px; top: -50px; display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; border-radius: ${R_CARD}px; background: ${T.chrome};">
    ${icon.check(T.onDark, 16)}
    <span style="font-size: 15px; font-weight: 600; color: ${T.onDark}; letter-spacing: -0.006em;">Receipt saved</span>
  </div>
  ${btnPrimary('Capture receipt', icon.camera('#ffffff', 20))}
</div>
${bottomInset}
${spec('AC-1 + AC-2 · new receipt at the top, marked not read yet · toast auto-dismisses after 3s')}
`));

/* ---------------------------------------------------- foundations sheet */
const swatch = (name, val, token) => `<div style="display: flex; flex-direction: column; gap: 6px;">
  <div style="height: 52px; border-radius: ${R_CTRL}px; background: ${val}; border: 1px solid ${T.line};"></div>
  <div style="font-size: 13px; font-weight: 600; color: ${T.ink};">${name}</div>
  <div style="font-size: 10px; color: ${T.inkFaint}; word-break: break-all; ${NUM}">${token}</div>
</div>`;

const sectionHead = (n, t, note) => `<div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px;">
  <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.inkFaint}; ${NUM}">${n}</div>
  <div style="font-size: 22px; font-weight: 700; letter-spacing: -0.018em; color: ${T.ink};">${t}</div>
  ${note ? `<div style="font-size: 14px; line-height: 20px; color: ${T.inkMuted}; max-width: 640px;">${note}</div>` : ''}
</div>`;

files['Foundations.dc.html'] = wrap(`<div style="width: 900px; min-height: 1040px; background: ${T.bg}; padding: 40px 40px 48px; display: flex; flex-direction: column; gap: 36px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${T.inkFaint};">AI Hub · design system baseline · established on KAN-5</div>
    <div style="font-size: 32px; font-weight: 700; letter-spacing: -0.024em; color: ${T.ink};">Foundations</div>
    <div style="font-size: 14px; line-height: 20px; color: ${T.inkMuted}; max-width: 660px; margin-top: 4px;">Every value below is derived from the owner-set aesthetic direction: dense, calm, utilitarian, confident, quiet. Typography does hierarchy; colour does meaning; decoration does nothing.</div>
  </div>

  <div>
    ${sectionHead('01', 'Colour', 'Neutral base at zero chroma, one accent, three semantic status hues. Nothing else. The accent is not a brand flourish &mdash; it marks interactive text and progress only.')}
    <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px;">
      ${swatch('Background', T.bg, '--bg')}
      ${swatch('Surface', T.surface, '--surface')}
      ${swatch('Sunk', T.sunk, '--sunk')}
      ${swatch('Line', T.line, '--line')}
      ${swatch('Line strong', T.lineStrong, '--line-strong')}
      ${swatch('Chrome', T.chrome, '--chrome')}
      ${swatch('Ink', T.ink, '--ink')}
      ${swatch('Ink muted', T.inkMuted, '--ink-muted')}
      ${swatch('Ink faint', T.inkFaint, '--ink-faint')}
      ${swatch('Chrome raised', T.chromeRaised, '--chrome-raised')}
      ${swatch('On dark', T.onDark, '--on-dark')}
      ${swatch('On dark muted', T.onDarkMuted, '--on-dark-muted')}
      ${swatch('Accent', T.accent, '--accent')}
      ${swatch('Accent tint', T.accentTint, '--accent-tint')}
      ${swatch('Positive', T.positive, '--positive')}
      ${swatch('Positive tint', T.positiveTint, '--positive-tint')}
      ${swatch('Warn', T.warn, '--warn')}
      ${swatch('Warn tint', T.warnTint, '--warn-tint')}
      ${swatch('Danger', T.danger, '--danger')}
      ${swatch('Danger tint', T.dangerTint, '--danger-tint')}
    </div>
  </div>

  <div>
    ${sectionHead('02', 'Type', 'One typeface: IBM Plex Sans, drawn for dense technical software and carrying true tabular figures. A second family would be decoration. Times, counts and amounts always set tabular so columns line up down a list.')}
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${[['Display', '28 / 34 / 700 / -0.021em', 28, 700, '-0.021em'],
         ['Title', '22 / 28 / 700 / -0.018em', 22, 700, '-0.018em'],
         ['Heading', '17 / 24 / 600 / -0.01em', 17, 600, '-0.01em'],
         ['Row', '16 / 22 / 600 / -0.008em', 16, 600, '-0.008em'],
         ['Body', '15 / 21 / 400', 15, 400, '0'],
         ['Label', '13 / 18 / 400', 13, 400, '0'],
         ['Micro', '11 / 14 / 600 / 0.04em / uppercase', 11, 600, '0.04em']]
        .map(([n, s, size, w2, ls]) => `<div style="display: flex; align-items: baseline; gap: 24px; padding-bottom: 11px; border-bottom: 1px solid ${T.line};">
          <div style="width: 110px; flex-shrink: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${T.inkFaint};">${n}</div>
          <div style="flex-grow: 1; font-size: ${size}px; font-weight: ${w2}; letter-spacing: ${ls}; color: ${T.ink}; ${n === 'Micro' ? 'text-transform: uppercase;' : ''}">Capture a receipt</div>
          <div style="font-size: 11px; color: ${T.inkMuted}; white-space: nowrap; ${NUM}">${s}</div>
        </div>`).join('')}
      <div style="display: flex; align-items: baseline; gap: 24px; padding-top: 2px;">
        <div style="width: 110px; flex-shrink: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${T.inkFaint};">Amount</div>
        <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 2px; align-items: flex-start;">
          ${['89.40', '128.05', '7.99'].map((v) => `<span style="font-size: 19px; font-weight: 600; color: ${T.ink}; ${NUM}">${v}</span>`).join('')}
        </div>
        <div style="font-size: 11px; color: ${T.inkMuted}; white-space: nowrap; ${NUM}">19 / 600 / tabular</div>
      </div>
    </div>
  </div>

  <div>
    ${sectionHead('03', 'Space, radius, reach', 'Spacing steps of 4. Screen gutter 16 &mdash; content gets the width. Two corner radii in the entire system, and no third one is permitted.')}
    <div style="display: flex; gap: 40px; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.inkFaint};">Spacing</div>
        <div style="display: flex; align-items: flex-end; gap: 10px;">
          ${[4, 8, 12, 16, 20, 24, 32, 40, 56].map((s) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 5px;"><div style="width: ${s}px; height: ${s}px; background: ${T.ink};"></div><div style="font-size: 10px; color: ${T.inkMuted}; ${NUM}">${s}</div></div>`).join('')}
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.inkFaint};">Radius &mdash; only these two</div>
        <div style="display: flex; align-items: flex-end; gap: 14px;">
          ${[['control', R_CTRL, 'buttons · badges · thumbnails · chips'], ['card', R_CARD, 'sheets · cards · banners · toasts']].map(([n, r, use]) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 5px;"><div style="width: 120px; height: 44px; background: ${T.surface}; border: 1px solid ${T.lineStrong}; border-radius: ${r}px;"></div><div style="font-size: 11px; font-weight: 600; color: ${T.ink}; ${NUM}">${n} ${r}</div><div style="font-size: 10px; color: ${T.inkFaint};">${use}</div></div>`).join('')}
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.inkFaint};">Frame</div>
        <div style="font-size: 14px; line-height: 21px; color: ${T.ink}; ${NUM}">390 &times; 844 baseline<br>Safe area 59 top / 34 bottom<br>Gutter 16 &middot; row height 64<br>Button 48 &middot; hit floor 44</div>
      </div>
    </div>
  </div>
</div>`, 900, 1040);

/* ------------------------------------------------------ components sheet */
const compBlock = (title, note, body) => `<div style="display: flex; flex-direction: column; gap: 10px; padding-bottom: 24px; border-bottom: 1px solid ${T.line};">
  <div style="font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: ${T.ink};">${title}</div>
  <div style="font-size: 14px; line-height: 20px; color: ${T.inkMuted}; max-width: 660px;">${note}</div>
  <div style="margin-top: 2px;">${body}</div>
</div>`;

files['Components.dc.html'] = wrap(`<div style="width: 900px; min-height: 1140px; background: ${T.bg}; padding: 40px 40px 48px; display: flex; flex-direction: column; gap: 28px;">
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${T.inkFaint};">AI Hub · design system baseline · established on KAN-5</div>
    <div style="font-size: 32px; font-weight: 700; letter-spacing: -0.024em; color: ${T.ink};">Primitives</div>
  </div>

  ${compBlock('Entry row', 'Fixed 64&nbsp;px, tappable across the full width, no chevron. Divider inset to the text column so the eye runs down one edge. The three slots do not move when extraction lands in KAN-6 &mdash; only their contents change: title becomes the merchant, the right slot becomes the amount, set larger and tabular because the number is what the user came for.',
    `<div style="display: flex; gap: 20px; flex-wrap: wrap;">
      <div style="width: 390px; background: ${T.surface}; border: 1px solid ${T.line}; border-radius: ${R_CARD}px; overflow: hidden;">
        <div style="padding: 6px 12px; background: ${T.warnTint}; font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${T.warn};">KAN-5 &mdash; not read yet</div>
        ${listRow({ title: 'Receipt', meta: 'Today, 14:32', right: badge('pending'), last: true })}
      </div>
      <div style="width: 390px; background: ${T.surface}; border: 1px solid ${T.line}; border-radius: ${R_CARD}px; overflow: hidden;">
        <div style="padding: 6px 12px; background: ${T.positiveTint}; font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${T.positive};">KAN-6 &mdash; same geometry, read</div>
        ${listRow({ title: 'Biedronka', meta: 'Today, 14:32', right: `<span style="font-size: 19px; font-weight: 600; color: ${T.ink}; ${NUM}">89.40</span>`, last: true })}
      </div>
    </div>`)}

  ${compBlock('Status badge', 'Small, text-labeled, consistent. Control radius &mdash; not a pill, because a pill would be a third corner radius. Maps from the receipt&#39;s stored status; the internal name is never shown. Read normally hides the badge in favour of the amount.',
    `<div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
      ${badge('pending')}${badge('review')}${badge('extracted')}
      <span style="font-size: 11px; color: ${T.inkFaint};">pending &middot; needs_review &middot; extracted</span>
    </div>`)}

  ${compBlock('Buttons', 'The primary button is ink, not accent. Hierarchy is contrast and weight; the accent is spent on meaning &mdash; interactive text and progress &mdash; not on shouting. Never two primaries on one screen.',
    `<div style="display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap;">
      <div style="width: 220px;">${btnPrimary('Capture receipt', icon.camera('#ffffff', 20))}</div>
      <div style="width: 180px;">${btnSecondary('Retake', icon.retake(T.ink, 18))}</div>
      <div style="width: 170px;">${btnQuiet('Back to receipts', T.inkMuted)}</div>
      <div style="width: 130px;">${btnQuiet('Discard', T.danger)}</div>
      <div style="width: 220px; opacity: 0.35;">${btnPrimary('Capture receipt', icon.camera('#ffffff', 20))}</div>
    </div>
    <div style="font-size: 10px; color: ${T.inkFaint}; margin-top: 8px;">primary 48 &middot; secondary 48 &middot; quiet 44 &middot; quiet-danger 44 &middot; disabled (35% opacity)</div>`)}

  ${compBlock('Progress', 'One determinate bar, 6&nbsp;px, the one place the accent fills a shape &mdash; it reports state, so it earns the colour. It only ever moves forward: getting ready 0&ndash;10%, sending the photo 10&ndash;95%, finishing 95&ndash;100%. It must not reset or restart between those.',
    `<div style="display: flex; flex-direction: column; gap: 12px; width: 420px;">
      ${[8, 64, 97].map((p) => `<div style="display: flex; align-items: center; gap: 12px;"><div style="flex-grow: 1; height: 6px; border-radius: ${R_CTRL}px; background: ${T.sunk}; overflow: hidden;"><div style="width: ${p}%; height: 100%; border-radius: ${R_CTRL}px; background: ${T.accent};"></div></div><span style="font-size: 13px; font-weight: 600; color: ${T.ink}; width: 40px; text-align: right; ${NUM}">${p}%</span></div>`).join('')}
    </div>`)}

  ${compBlock('Message banner', 'Sits inside the bottom sheet above the action buttons, so cause and fix read together. Flat tint, no border, no shadow. Danger for something that failed, warn for something the user must change.',
    `<div style="display: flex; gap: 18px; flex-wrap: wrap;">
      <div style="width: 350px;">${banner('danger', 'Couldn&#39;t save that receipt', 'Your photo is still here. Check your connection and try again.')}</div>
      <div style="width: 350px;">${banner('warn', 'This photo won&#39;t work', 'It&#39;s too big or in a format we can&#39;t read.')}</div>
    </div>`)}

  ${compBlock('Voice', 'Short, plain, second person. Say what happened and what to do. Never name the machinery.',
    `<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 18px; max-width: 780px;">
      ${[['Not read yet', 'no fields read yet'],
         ['Saving your receipt', 'save in flight'],
         ['Receipt saved', 'receipt stored'],
         ['Couldn&#39;t save that receipt', 'save or claim failed'],
         ['This photo won&#39;t work', 'rejected before sending'],
         ['Needs a check', 'needs_review']]
        .map(([good, when]) => `<div style="display: flex; flex-direction: column; gap: 2px; padding: 9px 12px; background: ${T.surface}; border: 1px solid ${T.line}; border-radius: ${R_CTRL}px;">
          <div style="font-size: 15px; font-weight: 600; color: ${T.ink};">${good}</div>
          <div style="font-size: 10px; letter-spacing: 0.03em; color: ${T.inkFaint};">${when}</div>
        </div>`).join('')}
    </div>`)}
</div>`, 900, 1140);

/* --------------------------------------------------------------- canvas */
const canvas = {
  pages: [
    { id: 'flow', name: 'Capture flow' },
    { id: 'system', name: 'Design system' },
  ],
  artboards: [
    { file: 'ListEmpty.dc.html',        title: '01 · List, empty',        page: 'flow', x: 0,    y: 0,    w: W, h: H },
    { file: 'Main.dc.html',             title: '02 · List, populated',    page: 'flow', x: 450,  y: 0,    w: W, h: H },
    { file: 'PermissionAsk.dc.html',    title: '03 · Camera permission',  page: 'flow', x: 900,  y: 0,    w: W, h: H },
    { file: 'PermissionDenied.dc.html', title: '04 · Permission off',     page: 'flow', x: 1350, y: 0,    w: W, h: H },
    { file: 'CameraLive.dc.html',       title: '05 · Camera live',        page: 'flow', x: 0,    y: 960,  w: W, h: H },
    { file: 'Preview.dc.html',          title: '06 · Preview',            page: 'flow', x: 450,  y: 960,  w: W, h: H },
    { file: 'Discard.dc.html',          title: '07 · Discard photo',      page: 'flow', x: 900,  y: 960,  w: W, h: H },
    { file: 'Uploading.dc.html',        title: '08 · Saving',             page: 'flow', x: 1350, y: 960,  w: W, h: H },
    { file: 'UploadError.dc.html',      title: '09 · Save failed',        page: 'flow', x: 0,    y: 1920, w: W, h: H },
    { file: 'PhotoRejected.dc.html',    title: '10 · Photo rejected',     page: 'flow', x: 450,  y: 1920, w: W, h: H },
    { file: 'SuccessList.dc.html',      title: '11 · Saved',              page: 'flow', x: 900,  y: 1920, w: W, h: H },
    { file: 'Foundations.dc.html',      title: 'Foundations',             page: 'system', x: 0,   y: 0, w: 900, h: 1040 },
    { file: 'Components.dc.html',       title: 'Primitives',              page: 'system', x: 960, y: 0, w: 900, h: 1140 },
  ],
  annotations: [
    { id: 'read-me', page: 'flow', x: 0, y: -230, w: 500,
      text: 'KAN-5 — photograph a receipt (slice 2/4).\nEvery state the ticket names has an artboard. Numbers run in flow order; the ticket comment maps each acceptance criterion to an artboard.\n\nVisual language follows the owner-set aesthetic direction: one typeface doing the hierarchy, neutral base, one accent spent only on progress and interactive text, two corner radii, flat surfaces.' },
    { id: 'permission', page: 'flow', x: 900, y: -230, w: 420,
      text: '03 is our own screen, shown before the system prompt. The system camera prompt itself is never drawn or imitated — tapping Allow camera hands off to the OS.\n\n04 is the only route back once access is off: Settings, or back to the list.' },
    { id: 'one-upload', page: 'flow', x: 1350, y: 780, w: 400,
      text: 'Getting the upload address and sending the photo are two network calls, but one bar. It never resets, never restarts, never goes backwards — the user sees a single save.\n\nThis is the one place the accent fills a shape: it reports state, so it earns the colour.' },
    { id: 'errors-out', page: 'flow', x: 0, y: 1780, w: 470,
      text: 'No error is a dead end. 09 keeps the photo on the device and offers Try again plus a way back. 10 cannot be retried with the same photo, so it offers a fresh one instead.\n\nAn expired upload address and a photo the server cannot find both surface as 09 — the user cannot act on the difference.' },
    { id: 'row-stable', page: 'system', x: 0, y: -180, w: 460,
      text: 'The entry row is the piece KAN-6 edits. Its geometry is fixed here so extraction changes the words, not the layout — no reflow when a receipt is read.' },
  ],
  launch: { view: 'canvas', page: 'flow' },
};

/* ---------------------------------------------------------------- write */
for (const [name, src] of Object.entries(files)) writeFileSync(join(OUT, name), src);
writeFileSync(join(OUT, 'canvas.json'), JSON.stringify(canvas, null, 2) + '\n');
console.log(`wrote ${Object.keys(files).length} artboards + canvas.json to ${OUT}`);
