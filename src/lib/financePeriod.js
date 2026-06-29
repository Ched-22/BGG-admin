const ZONE = 'Europe/Lisbon';

function lisbonNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: ZONE }));
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toIsoDate(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function resolveFinancePeriodBounds(preset = 'month', now = lisbonNow()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (preset === 'month') {
    const lastDay = lastDayOfMonth(year, month);
    return {
      periodStart: toIsoDate(year, month, 1),
      periodEnd: toIsoDate(year, month, lastDay),
    };
  }

  if (preset === 'quarter') {
    const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
    const quarterEndMonth = quarterStartMonth + 2;
    const lastDay = lastDayOfMonth(year, quarterEndMonth);
    return {
      periodStart: toIsoDate(year, quarterStartMonth, 1),
      periodEnd: toIsoDate(year, quarterEndMonth, lastDay),
    };
  }

  if (preset === 'semester') {
    if (month <= 6) {
      return {
        periodStart: toIsoDate(year, 1, 1),
        periodEnd: toIsoDate(year, 6, 30),
      };
    }
    return {
      periodStart: toIsoDate(year, 7, 1),
      periodEnd: toIsoDate(year, 12, 31),
    };
  }

  if (preset === 'year') {
    return {
      periodStart: toIsoDate(year, 1, 1),
      periodEnd: toIsoDate(year, 12, 31),
    };
  }

  return null;
}

export function summaryMatchesPreset(summary, preset, customRange) {
  if (!summary?.periodStart || !summary?.periodEnd) return false;
  if (preset === 'custom' && customRange) {
    return summary.periodStart === customRange.periodStart
      && summary.periodEnd === customRange.periodEnd;
  }
  if (summary.preset && summary.preset === preset) return true;
  const expected = resolveFinancePeriodBounds(preset);
  if (!expected) return false;
  return summary.periodStart === expected.periodStart
    && summary.periodEnd === expected.periodEnd;
}
