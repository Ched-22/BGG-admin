import api from './api';

export const PAYMENT_METHODS = [
  { id: 'multibanco', label: 'Multibanco' },
  { id: 'cash', label: 'Dinheiro' },
  { id: 'card', label: 'Cartão (débito/crédito)' },
  { id: 'mbWay', label: 'MB Way' },
  { id: 'bankTransfer', label: 'Transferência bancária (SEPA)' },
  { id: 'sepaDirectDebit', label: 'Débito direto SEPA' },
  { id: 'cheque', label: 'Cheque' },
  { id: 'other', label: 'Outro' },
];

export const SETTLEMENT_STATUSES = [
  { id: 'pending', label: 'Pendente' },
  { id: 'paid', label: 'Pago' },
  { id: 'prepaid', label: 'Pagamento antecipado' },
];

export const REVENUE_TABS = [
  { id: 'pending', label: 'Pagamento pendente' },
  { id: 'installmentsOpen', label: 'Parcelas em aberto' },
  { id: 'completed', label: 'Pagamento concluído' },
];

export function defaultPaymentIban() {
  return import.meta.env.VITE_BGG_PAYMENT_IBAN?.trim() || '';
}

export async function fetchTaskPayment(taskDisplayId) {
  const { data } = await api.get(`/tasks/${taskDisplayId}/payment`);
  return data;
}

export async function saveTaskPayment(taskDisplayId, body) {
  const { data } = await api.put(`/tasks/${taskDisplayId}/payment`, body);
  return data;
}
