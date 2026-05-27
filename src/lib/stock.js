/** Nível considerado crítico: abaixo de 20% da capacidade máxima do depósito */
export const STOCK_LOW_THRESHOLD = 0.2;

export function stockLevelRatio(product) {
  const max = product.capacidadeMaxima;
  if (max == null || max <= 0) return 1;
  return product.quantidadeAtual / max;
}

export function needsRestock(product) {
  return stockLevelRatio(product) < STOCK_LOW_THRESHOLD;
}

/** Entre o mínimo (20%) e 40% — faixa de atenção */
export const STOCK_WARN_THRESHOLD = 0.4;

/** "comprar" | "atencao" | "ok" — alinhado às badges da tabela */
export function stockStatusKey(product) {
  const r = stockLevelRatio(product);
  if (needsRestock(product)) return "comprar";
  if (r < STOCK_WARN_THRESHOLD) return "atencao";
  return "ok";
}

/** Quantidade sugerida para voltar a ~60% da capacidade (protótipo) */
export function suggestedOrderQty(product) {
  const max = product.capacidadeMaxima;
  const cur = product.quantidadeAtual;
  if (!max || max <= 0) return 0;
  const target = Math.ceil(max * 0.6);
  return Math.max(0, target - cur);
}
