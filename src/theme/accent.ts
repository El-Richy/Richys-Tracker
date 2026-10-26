export const DEFAULT_ACCENT = '#F0611A';
export const DEFAULT_ACCENT_CHANNELS = '240 97 26';

/** Space-separated RGB channels for `rgb(var(--accent-rgb) / <alpha>)`. */
export function hexToRgbChannels(hex: string | null | undefined): string {
  if (!hex) return DEFAULT_ACCENT_CHANNELS;
  const normalized = hex.trim().replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((channel) => channel + channel).join('')
    : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return DEFAULT_ACCENT_CHANNELS;
  const value = Number.parseInt(full, 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

export function applyAccentColor(hex: string | null | undefined): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--accent-rgb', hexToRgbChannels(hex));
}
