import api from './api';

export async function getInspectionByTask(taskDisplayId) {
  const { data } = await api.get('/vehicle-inspections/by-assignment/admin-detail', {
    params: { taskDisplayId },
  });
  return data;
}

export const INSPECTION_ITEM_LABELS = {
  lataria: 'Lataria (amassados, riscos)',
  vidros: 'Vidros (trincas, funcionamento)',
  farois: 'Faróis e lanternas',
  pneus: 'Pneus (calibragem, banda)',
  estepe: 'Estepe e ferramentas',
  oleo: 'Nível do óleo',
  arref: 'Nível do líquido de arrefecimento',
  freio_fl: 'Nível do fluido de freio',
  freios: 'Funcionamento dos freios',
  setas: 'Luzes de seta / pisca-alerta',
  palhetas: 'Palhetas do limpador',
  cinto: 'Cinto de segurança',
  bancos: 'Bancos (rasgos, sujeira)',
  bateria: 'Bateria (terminais, data)',
  ac: 'Ar-condicionado',
  doc: 'Documentação a bordo',
};

export function statusLabel(status) {
  if (status === 'ok') return 'OK';
  if (status === 'warn') return 'Atenção';
  if (status === 'na') return 'N/A';
  return '—';
}
