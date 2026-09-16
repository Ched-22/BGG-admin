export const MM_TO_PT = 72 / 25.4;

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const PAGE_MARGIN = 18 * MM_TO_PT;
export const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
export const FOOTER_HEIGHT = 14 * MM_TO_PT;
export const FOOTER_Y = PAGE_HEIGHT - FOOTER_HEIGHT;
export const HEADER_BAND_HEIGHT = 12 * MM_TO_PT;
export const MINI_HEADER_HEIGHT = 6 * MM_TO_PT;
export const LABEL_WIDTH = 52 * MM_TO_PT;

export const COLORS = {
  text: '#1A1A1A',
  muted: '#6B7280',
  gold: '#B5EB0C',
  goldDark: '#7A9C00',
  border: '#E5E7EB',
  surface: '#F9F7F4',
  white: '#FFFFFF',
  ok: '#166534',
  warn: '#B45309',
};

export const FONT = {
  docTitle: 17,
  section: 11,
  body: 9,
  bodySmall: 8,
  total: 12,
};

export const SPACING = {
  sectionGap: 8 * MM_TO_PT,
  rowGap: 2 * MM_TO_PT,
  cardPadding: 4 * MM_TO_PT,
  cardGap: 3 * MM_TO_PT,
};

export function mm(value) {
  return value * MM_TO_PT;
}
