import api from './api';

export const EXPENSE_CATEGORIES = [
  { id: 'fixed', label: 'Fixa' },
  { id: 'variable', label: 'Variável' },
  { id: 'tax', label: 'Impostos' },
  { id: 'other', label: 'Outra' },
];

export async function fetchFinanceSummary(params = { preset: 'month' }) {
  const { data } = await api.get('/finance/summary', { params });
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
