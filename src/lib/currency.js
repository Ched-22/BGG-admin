export const VIP_LTV_THRESHOLD_EUR = 3600;

const eurFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

export function formatEUR(amount) {
  const value = Number(amount);
  if (Number.isNaN(value)) return eurFormatter.format(0);
  return eurFormatter.format(value);
}

export function roundEur(amount) {
  return Math.round(Number(amount) * 100) / 100;
}
