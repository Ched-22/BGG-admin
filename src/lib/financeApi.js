import api from './api';

export const EXPENSE_CATEGORIES = [
  { id: 'fixed', label: 'Fixa' },
  { id: 'variable', label: 'Variável' },
  { id: 'tax', label: 'Impostos' },
  { id: 'other', label: 'Outra' },
];

export async function fetchFinanceSummary({ preset = 'month', periodStart, periodEnd } = {}) {
  const params = periodStart && periodEnd
    ? { periodStart, periodEnd }
    : { preset };
  const { data } = await api.get('/finance/summary', {
    params,
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data;
}

export async function listFinanceExpenses() {
  const { data } = await api.get('/finance/expenses');
  return data.data ?? [];
}

export async function createFinanceExpense(body) {
  const { data } = await api.post('/finance/expenses', body);
  return data;
}

export async function updateFinanceExpense(id, body) {
  const { data } = await api.patch(`/finance/expenses/${id}`, body);
  return data;
}

export async function deleteFinanceExpense(id) {
  const { data } = await api.delete(`/finance/expenses/${id}`);
  return data;
}

export async function listEmployeeCosts() {
  const { data } = await api.get('/finance/employee-costs');
  return data.data ?? [];
}

export async function upsertEmployeeCost(userId, body) {
  const { data } = await api.put(`/finance/employee-costs/${userId}`, body);
  return data;
}

export async function fetchFinanceRevenueSummary({ preset = 'month', periodStart, periodEnd } = {}) {
  const params = periodStart && periodEnd
    ? { periodStart, periodEnd }
    : { preset };
  const { data } = await api.get('/finance/revenue/summary', {
    params,
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data;
}

export async function fetchFinanceRevenue({
  preset = 'month',
  periodStart,
  periodEnd,
  paymentStatus,
  page = 1,
  limit = 20,
} = {}) {
  const params = {
    ...(periodStart && periodEnd ? { periodStart, periodEnd } : { preset }),
    page,
    limit,
    ...(paymentStatus ? { paymentStatus } : {}),
  };
  const { data } = await api.get('/finance/revenue', {
    params,
    headers: { 'Cache-Control': 'no-cache' },
  });
  return data;
}
