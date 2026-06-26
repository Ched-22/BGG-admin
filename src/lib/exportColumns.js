import { formatEUR } from './currency.js';
import { formatPhoneDisplay } from './phoneUtils';
import { needsRestock, stockLevelRatio, stockStatusKey } from './stock';

function stockStatusLabel(product) {
  const key = stockStatusKey(product);
  if (needsRestock(product)) return 'Comprar';
  if (key === 'atencao') return 'Atenção';
  return 'OK';
}

export const STOCK_EXPORT_COLUMNS = [
  { key: 'sku', label: 'SKU' },
  { key: 'nome', label: 'Produto' },
  { key: 'categoria', label: 'Categoria' },
  { key: 'quantidadeAtual', label: 'Quantidade atual' },
  { key: 'unidade', label: 'Unidade' },
  { key: 'capacidadeMaxima', label: 'Capacidade máxima' },
  { key: 'fornecedor', label: 'Fornecedor' },
  { key: 'status', label: 'Status', getValue: stockStatusLabel },
  {
    key: 'nivel',
    label: 'Nível (%)',
    getValue: (p) => `${Math.round(stockLevelRatio(p) * 100)}%`,
  },
];

export const CUSTOMERS_EXPORT_COLUMNS = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'E-mail' },
  { key: 'tel', label: 'Telefone' },
  { key: 'cidade', label: 'Cidade', getValue: (c) => c.endereco?.cidade || '' },
  { key: 'estado', label: 'Estado', getValue: (c) => c.endereco?.estado || '' },
  { key: 'tarefas', label: 'Tarefas' },
  { key: 'ativas', label: 'Ativas' },
  { key: 'ltv', label: 'LTV', getValue: (c) => formatEUR(c.totalGasto) },
  { key: 'ultima', label: 'Última tarefa' },
  { key: 'status', label: 'Status' },
  { key: 'since', label: 'Cliente desde' },
];

export const CALENDAR_EXPORT_COLUMNS = [
  { key: 'data', label: 'Data' },
  { key: 'horario', label: 'Horário' },
  { key: 'id', label: 'ID tarefa' },
  { key: 'projeto', label: 'Projeto' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'servico', label: 'Serviço' },
  { key: 'tecnico', label: 'Técnico' },
  {
    key: 'endereco',
    label: 'Endereço',
    getValue: (e) => {
      const city = e.endereco?.cidade || e.cidade || '';
      const state = e.endereco?.estado || e.estado || '';
      return [city, state].filter(Boolean).join('/');
    },
  },
  { key: 'status', label: 'Status' },
];

export const TASKS_EXPORT_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'projeto', label: 'Projeto' },
  { key: 'servico', label: 'Serviço' },
  { key: 'status', label: 'Status' },
  { key: 'dataAgendada', label: 'Data agendada' },
  { key: 'horario', label: 'Horário' },
  { key: 'tecnico', label: 'Técnico' },
  { key: 'valor', label: 'Valor orçamento', getValue: (t) => formatEUR(t.orcamento?.valor) },
  { key: 'criadaEm', label: 'Criada em' },
];

export const QUOTES_EXPORT_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'projeto', label: 'Projeto' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'servico', label: 'Serviço' },
  { key: 'valor', label: 'Valor', getValue: (q) => formatEUR(q.valor) },
  { key: 'status', label: 'Status' },
  { key: 'validade', label: 'Validade' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'dataCriacao', label: 'Criado em' },
];

export const TECHNICIANS_EXPORT_COLUMNS = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefone', getValue: (t) => formatPhoneDisplay(t.phoneCountryCode, t.phoneNationalNumber) },
  { key: 'skills', label: 'Habilidades', getValue: (t) => (Array.isArray(t.skills) ? t.skills.join(', ') : '') },
  { key: 'ativas', label: 'Tarefas ativas' },
  { key: 'concluidas', label: 'Concluídas (mês)' },
  { key: 'util', label: 'Utilização (%)', getValue: (t) => `${t.util ?? 0}%` },
  { key: 'disponivel', label: 'Disponível', getValue: (t) => (t.disponivel === false ? 'Não' : 'Sim') },
  { key: 'active', label: 'Conta ativa', getValue: (t) => (t.active === false ? 'Inativo' : 'Ativo') },
];

function formatServiceDuration(minutes) {
  const m = Number(minutes) || 0;
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}min` : `${h}h`;
}

function formatServiceExportDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatServiceVigencia(from, to) {
  const start = from ? new Date(from).toLocaleDateString('pt-BR') : '—';
  const end = to ? new Date(to).toLocaleDateString('pt-BR') : 'Atual';
  return `${start} – ${end}`;
}

export function formatServicePriceHistoryExport(history = []) {
  const pastVersions = history.filter((row) => row.effectiveTo);
  if (!pastVersions.length) return '—';
  return pastVersions
    .map((row) => (
      `${formatServiceVigencia(row.effectiveFrom, row.effectiveTo)}: `
      + `P ${formatEUR(row.priceSmall)}, M ${formatEUR(row.priceMedium)}, G ${formatEUR(row.priceLarge)}`
    ))
    .join('\n');
}

export const SERVICES_EXPORT_COLUMNS = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nome' },
  { key: 'description', label: 'Descrição' },
  {
    key: 'durationMinutes',
    label: 'Duração',
    getValue: (s) => formatServiceDuration(s.durationMinutes),
  },
  { key: 'priceSmall', label: 'Preço pequeno (vigente)', getValue: (s) => formatEUR(s.priceSmall) },
  { key: 'priceMedium', label: 'Preço médio (vigente)', getValue: (s) => formatEUR(s.priceMedium) },
  { key: 'priceLarge', label: 'Preço grande (vigente)', getValue: (s) => formatEUR(s.priceLarge) },
  { key: 'active', label: 'Status', getValue: (s) => (s.active ? 'Ativo' : 'Inativo') },
  {
    key: 'createdAt',
    label: 'Criado em',
    getValue: (s) => formatServiceExportDateTime(s.createdAt),
  },
  {
    key: 'updatedAt',
    label: 'Alterado em',
    getValue: (s) => formatServiceExportDateTime(s.updatedAt),
  },
  {
    key: 'priceHistory',
    label: 'Histórico de preços',
    getValue: (s) => formatServicePriceHistoryExport(s.priceHistory),
  },
];
