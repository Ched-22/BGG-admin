export const SERVICE_CATEGORY_COLORS = {
  EXTERIOR: '#5B9BD5',
  INTERIOR: '#E0A458',
  COMPLETE: '#B5EB0C',
  MOTO: '#c46aef',
};

export const SERVICE_CATEGORY_LABELS = {
  EXTERIOR: 'Externo',
  INTERIOR: 'Interno',
  COMPLETE: 'Completo',
  MOTO: 'Moto',
};

const COVERAGE_PROFILE_CLASS = {
  EXTERIOR_ONLY: 'tech-coverage-exterior',
  INTERIOR_ONLY: 'tech-coverage-interior',
  COMPLETE_ONLY: 'tech-coverage-complete',
  MOTO_ONLY: 'tech-coverage-moto',
  MOTO_EXTERIOR: 'tech-coverage-moto-exterior',
  MOTO_INTERIOR: 'tech-coverage-moto-interior',
  FULL: 'tech-coverage-full',
  MIXED: 'tech-coverage-mixed',
  NONE: 'tech-coverage-neutral',
};

const CATEGORY_ORDER = ['EXTERIOR', 'INTERIOR', 'COMPLETE', 'MOTO'];

export const COVERAGE_LEGEND = [
  { profile: 'EXTERIOR_ONLY', label: 'Externo' },
  { profile: 'INTERIOR_ONLY', label: 'Interior' },
  { profile: 'COMPLETE_ONLY', label: 'Completo' },
  { profile: 'MOTO_ONLY', label: 'Moto' },
  { profile: 'MOTO_EXTERIOR', label: 'Moto + exterior' },
  { profile: 'MOTO_INTERIOR', label: 'Moto + interior' },
  { profile: 'FULL', label: 'Totalmente completo' },
  { profile: 'MIXED', label: 'Misto' },
  { profile: 'NONE', label: 'Sem serviços' },
];

export function coverageClassName(profile) {
  return COVERAGE_PROFILE_CLASS[profile] || 'tech-coverage-neutral';
}

export function buildMixedCoverageGradient(categories = []) {
  const sorted = CATEGORY_ORDER.filter((c) => categories.includes(c));
  if (!sorted.length) return 'var(--border)';
  if (sorted.length === 1) return SERVICE_CATEGORY_COLORS[sorted[0]];
  const step = 100 / sorted.length;
  const stops = sorted.flatMap((cat, index) => {
    const color = SERVICE_CATEGORY_COLORS[cat];
    const start = index * step;
    const end = (index + 1) * step;
    return [`${color} ${start}%`, `${color} ${end}%`];
  });
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

export function technicianCoverageStyle(tech) {
  if (tech?.coverageProfile === 'MIXED' && tech?.serviceCategories?.length) {
    return { '--coverage-gradient': buildMixedCoverageGradient(tech.serviceCategories) };
  }
  return undefined;
}

export function serviceCategoryLabel(category) {
  return SERVICE_CATEGORY_LABELS[category] || category;
}

export function serviceCategoryBadgeClass(category) {
  const map = {
    EXTERIOR: 'service-cat-exterior',
    INTERIOR: 'service-cat-interior',
    COMPLETE: 'service-cat-complete',
    MOTO: 'service-cat-moto',
  };
  return map[category] || '';
}
