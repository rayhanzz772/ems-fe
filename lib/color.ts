import type { CSSProperties } from "react";

type Rgb = { r: number; g: number; b: number };

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };
/** Dark theme `--card` (oklch(0.205 0 0)), used to score the dark tint. */
const DARK_CARD: Rgb = { r: 23, g: 23, b: 23 };
/** Used when the API sends a color we cannot parse. */
const FALLBACK: Rgb = { r: 37, g: 99, b: 235 };
const MIN_CONTRAST = 4.5;
const TINT_ALPHA = 0.12;
const DARK_TINT_ALPHA = 0.2;
const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

function parseColor(value: string): Rgb | null {
  const match = HEX_PATTERN.exec(value.trim());
  if (!match) return null;
  const hex =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((character) => character + character)
          .join("")
      : match[1];
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function channelLuminance(channel: number) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }: Rgb) {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

function contrastRatio(left: Rgb, right: Rgb) {
  const [lighter, darker] = [luminance(left), luminance(right)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

function mix(base: Rgb, target: Rgb, weight: number): Rgb {
  return {
    r: Math.round(base.r + (target.r - base.r) * weight),
    g: Math.round(base.g + (target.g - base.g) * weight),
    b: Math.round(base.b + (target.b - base.b) * weight),
  };
}

/** Flattens a translucent color onto an opaque surface. */
function composite(base: Rgb, alpha: number, surface: Rgb): Rgb {
  return mix(surface, base, alpha);
}

/**
 * Steps `base` toward `target` until it reaches `MIN_CONTRAST` against
 * `background`, so a brand color stays recognizable but stays readable.
 */
function readable(base: Rgb, background: Rgb, target: Rgb): Rgb {
  let current = base;
  for (let step = 0; step < 20; step += 1) {
    if (contrastRatio(current, background) >= MIN_CONTRAST) return current;
    current = mix(current, target, 0.16);
  }
  return target;
}

function toHex({ r, g, b }: Rgb) {
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function toRgba({ r, g, b }: Rgb, alpha: number) {
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

/**
 * Inline style for a tinted chip or avatar that shows a data-driven color.
 * Pair it with the `.tint` class, which applies the custom properties below so
 * the foreground keeps a 4.5:1 contrast in both themes.
 */
export function tintStyle(color: string): CSSProperties {
  const base = parseColor(color) ?? FALLBACK;
  const lightSurface = composite(base, TINT_ALPHA, WHITE);
  const darkSurface = composite(base, DARK_TINT_ALPHA, DARK_CARD);

  return {
    "--tint-fg": toHex(readable(base, lightSurface, BLACK)),
    "--tint-bg": toRgba(base, TINT_ALPHA),
    "--tint-fg-dark": toHex(readable(base, darkSurface, WHITE)),
    "--tint-bg-dark": toRgba(base, DARK_TINT_ALPHA),
  } as CSSProperties;
}
