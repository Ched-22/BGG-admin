import api from './api';

const MOVEMENT_LABELS = {
  CREATED: 'Produto criado',
  ADJUSTMENT_IN: 'Entrada de stock',
  ADJUSTMENT_OUT: 'Retirada de stock',
  DEACTIVATED: 'Produto desativado',
};

export function mapProductFromApi(row) {
  return {
    id: row.id,
    sku: row.sku,
    nome: row.name,
    categoria: row.category,
    unidade: row.unit,
    quantidadeAtual: row.currentQuantity,
    capacidadeMaxima: row.maxCapacity,
    custoUnitario: row.unitCost ?? 0,
    fornecedor: row.supplier?.trim() ? row.supplier : '—',
  };
}

export function mapProductsFromApi(rows) {
  return (rows ?? []).map(mapProductFromApi);
}

export function mapMovementFromApi(row) {
  return {
    id: row.id,
    productId: row.productId,
    type: row.type,
    label: MOVEMENT_LABELS[row.type] || row.type,
    quantityBefore: row.quantityBefore,
    quantityAfter: row.quantityAfter,
    quantityDelta: row.quantityDelta,
    unitCostSnapshot: row.unitCostSnapshot ?? 0,
    note: row.note || '',
    actorId: row.actorId,
    actorName: row.actorName,
    occurredAt: row.occurredAt,
  };
}

export function mapProductToApi(product) {
  const body = {};
  if (product.sku != null) body.sku = product.sku;
  if (product.nome != null) body.name = product.nome;
  if (product.categoria != null) body.category = product.categoria;
  if (product.unidade != null) body.unit = product.unidade;
  if (product.quantidadeAtual != null) body.currentQuantity = product.quantidadeAtual;
  if (product.capacidadeMaxima != null) body.maxCapacity = product.capacidadeMaxima;
  if (product.custoUnitario != null) body.unitCost = Number(product.custoUnitario);
  if (product.fornecedor != null) {
    body.supplier = product.fornecedor === '—' ? '' : product.fornecedor;
  }
  if (product.adjustmentNote != null) body.adjustmentNote = product.adjustmentNote;
  return body;
}

export async function listInventoryProducts(params = {}) {
  const { data } = await api.get('/inventory/products', { params });
  return mapProductsFromApi(data.data);
}

export async function getInventoryHistory(productId, { limit = 50, offset = 0 } = {}) {
  const { data } = await api.get(`/inventory/products/${productId}/history`, {
    params: { limit, offset },
  });
  return {
    data: (data.data ?? []).map(mapMovementFromApi),
    total: data.total ?? 0,
    limit: data.limit ?? limit,
    offset: data.offset ?? offset,
  };
}

export async function createInventoryProduct(product) {
  const { data } = await api.post('/inventory/products', mapProductToApi(product));
  return mapProductFromApi(data);
}

export async function updateInventoryProduct(id, patch) {
  const { data } = await api.patch(`/inventory/products/${id}`, mapProductToApi(patch));
  return mapProductFromApi(data);
}

export async function deleteInventoryProduct(id) {
  const { data } = await api.delete(`/inventory/products/${id}`);
  return data;
}
