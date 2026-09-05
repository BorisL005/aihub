/**
 * DESIGN-SYSTEM.md authors colour as oklch() (design/KAN-5/build-artboards.mjs is the source of
 * truth). React Native's StyleSheet has no oklch() support, so this file reproduces the same
 * (L, C, H) triples from the design doc and converts them to sRGB hex at load time via the
 * published OKLab conversion (Björn Ottosson), instead of hand-approximating each hex value.
 */
function oklchToHex(l: number, c: number, h: number): string {
  const hueRadians = (h * Math.PI) / 180;
  const a = c * Math.cos(hueRadians);
  const b = c * Math.sin(hueRadians);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  const linear = {
    r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3,
  };

  const toChannel = (value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    const srgb = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055;
    return Math.round(srgb * 255);
  };

  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(toChannel(linear.r))}${toHex(toChannel(linear.g))}${toHex(toChannel(linear.b))}`;
}

export const colors = {
  bg: oklchToHex(0.975, 0, 0),
  surface: "#ffffff",
  sunk: oklchToHex(0.945, 0, 0),
  line: oklchToHex(0.9, 0, 0),
  lineStrong: oklchToHex(0.8, 0, 0),
  ink: oklchToHex(0.2, 0, 0),
  inkMuted: oklchToHex(0.5, 0, 0),
  inkFaint: oklchToHex(0.65, 0, 0),
  chrome: oklchToHex(0.16, 0, 0),
  chromeRaised: oklchToHex(0.24, 0, 0),
  onDark: oklchToHex(0.97, 0, 0),
  onDarkMuted: oklchToHex(0.72, 0, 0),
  accent: oklchToHex(0.52, 0.16, 252),
  accentTint: oklchToHex(0.96, 0.025, 252),
  positive: oklchToHex(0.5, 0.13, 150),
  positiveTint: oklchToHex(0.955, 0.03, 150),
  warn: oklchToHex(0.52, 0.11, 70),
  warnTint: oklchToHex(0.955, 0.035, 75),
  danger: oklchToHex(0.52, 0.16, 27),
  dangerTint: oklchToHex(0.955, 0.028, 27),
} as const;
