import { DEFAULT_CLIENT_LANGUAGE, normalizeClientLanguage } from './clientLanguage';

const SERVICE_IDS = ['polim', 'vitri', 'ppf', 'couro', 'motor', 'ozonio', 'rodas', 'farol'];
const SIZE_IDS = ['pequeno', 'medio', 'grande'];

export const SERVICE_LABELS_BY_LANGUAGE = {
  es: {
    polim: { name: 'Pulido técnico', desc: 'Corrección de pintura en 1 etapa' },
    vitri: { name: 'Vitrificación cerámica', desc: 'Protección cerámica de alto nivel' },
    ppf: { name: 'PPF — película de protección', desc: 'Frontal completo, capó + parachoques' },
    couro: { name: 'Higiene de cuero', desc: 'Asientos + salpicadero + acabados' },
    motor: { name: 'Detallado de motor', desc: 'Limpieza y acabado' },
    ozonio: { name: 'Tratamiento de ozono', desc: 'Desinfección completa del habitáculo' },
    rodas: { name: 'Restauración de llantas', desc: 'Pulido + sellador por llanta' },
    farol: { name: 'Pulido de faros', desc: 'Restauración óptica' },
  },
  ca: {
    polim: { name: 'Poliment tècnic', desc: 'Correcció de pintura en 1 etapa' },
    vitri: { name: 'Vitrificació ceràmica', desc: 'Protecció ceràmica d\'alt nivell' },
    ppf: { name: 'PPF — pel·lícula de protecció', desc: 'Frontal complet, capó + para-xocs' },
    couro: { name: 'Higiene de cuir', desc: 'Seients + quadre de comandaments + acabats' },
    motor: { name: 'Detallat de motor', desc: 'Neteja i acabament' },
    ozonio: { name: 'Tractament d\'ozó', desc: 'Desinfecció completa de l\'habitacle' },
    rodas: { name: 'Restauració de rodes', desc: 'Poliment + segellador per roda' },
    farol: { name: 'Poliment de fars', desc: 'Restauració òptica' },
  },
  en: {
    polim: { name: 'Technical polish', desc: 'Single-stage paint correction' },
    vitri: { name: 'Ceramic coating', desc: 'High-level ceramic protection' },
    ppf: { name: 'PPF — paint protection film', desc: 'Full front, bonnet + bumpers' },
    couro: { name: 'Leather cleaning', desc: 'Seats + dashboard + trim' },
    motor: { name: 'Engine detailing', desc: 'Cleaning and finishing' },
    ozonio: { name: 'Ozone treatment', desc: 'Full cabin disinfection' },
    rodas: { name: 'Wheel restoration', desc: 'Polish + sealant per wheel' },
    farol: { name: 'Headlight polish', desc: 'Optical restoration' },
  },
  ptBr: {
    polim: { name: 'Polimento técnico', desc: 'Correção de pintura em 1 etapa' },
    vitri: { name: 'Vitrificação cerâmica', desc: 'Proteção cerâmica de alto nível' },
    ppf: { name: 'PPF — película de proteção', desc: 'Frontal completo, capô + para-choques' },
    couro: { name: 'Higienização de couro', desc: 'Bancos + painel + acabamentos' },
    motor: { name: 'Detalhamento de motor', desc: 'Limpeza e acabamento' },
    ozonio: { name: 'Tratamento de ozônio', desc: 'Desinfecção completa do habitáculo' },
    rodas: { name: 'Restauração de rodas', desc: 'Polimento + selante por roda' },
    farol: { name: 'Polimento de faróis', desc: 'Restauração óptica' },
  },
  ptPt: {
    polim: { name: 'Polimento técnico', desc: 'Correção de pintura em 1 etapa' },
    vitri: { name: 'Vitrificação cerâmica', desc: 'Proteção cerâmica de alto nível' },
    ppf: { name: 'PPF — película de proteção', desc: 'Frontal completo, capô + para-choques' },
    couro: { name: 'Higienização de couro', desc: 'Bancos + tablier + acabamentos' },
    motor: { name: 'Detalhe de motor', desc: 'Limpeza e acabamento' },
    ozonio: { name: 'Tratamento de ozono', desc: 'Desinfeção completa do habitáculo' },
    rodas: { name: 'Restauro de jantes', desc: 'Polimento + selante por jante' },
    farol: { name: 'Polimento de faróis', desc: 'Restauração óptica' },
  },
};

export const VEHICLE_SIZE_LABELS_BY_LANGUAGE = {
  es: {
    pequeno: { label: 'Pequeño', hint: 'Hatch, compacto' },
    medio: { label: 'Mediano', hint: 'Berlina, SUV mediano' },
    grande: { label: 'Grande', hint: 'SUV grande, pickup' },
  },
  ca: {
    pequeno: { label: 'Petit', hint: 'Hatchback, compacte' },
    medio: { label: 'Mitjà', hint: 'Berlina, SUV mitjà' },
    grande: { label: 'Gran', hint: 'SUV gran, pickup' },
  },
  en: {
    pequeno: { label: 'Small', hint: 'Hatch, compact' },
    medio: { label: 'Medium', hint: 'Sedan, mid-size SUV' },
    grande: { label: 'Large', hint: 'Large SUV, pickup' },
  },
  ptBr: {
    pequeno: { label: 'Pequeno', hint: 'Hatch, compacto' },
    medio: { label: 'Médio', hint: 'Sedan, SUV médio' },
    grande: { label: 'Grande', hint: 'SUV grande, pickup' },
  },
  ptPt: {
    pequeno: { label: 'Pequeno', hint: 'Hatch, compacto' },
    medio: { label: 'Médio', hint: 'Berlina, SUV médio' },
    grande: { label: 'Grande', hint: 'SUV grande, pickup' },
  },
};

export function getServiceLabel(id, language = DEFAULT_CLIENT_LANGUAGE) {
  const lang = normalizeClientLanguage(language);
  const entry = SERVICE_LABELS_BY_LANGUAGE[lang]?.[id]
    || SERVICE_LABELS_BY_LANGUAGE.es[id];
  return entry?.name || id;
}

export function getServiceDesc(id, language = DEFAULT_CLIENT_LANGUAGE) {
  const lang = normalizeClientLanguage(language);
  const entry = SERVICE_LABELS_BY_LANGUAGE[lang]?.[id]
    || SERVICE_LABELS_BY_LANGUAGE.es[id];
  return entry?.desc || '';
}

export function getVehicleSizeLabel(id, language = DEFAULT_CLIENT_LANGUAGE) {
  const lang = normalizeClientLanguage(language);
  const entry = VEHICLE_SIZE_LABELS_BY_LANGUAGE[lang]?.[id]
    || VEHICLE_SIZE_LABELS_BY_LANGUAGE.es[id];
  return entry?.label || id;
}

export function getVehicleSizeHint(id, language = DEFAULT_CLIENT_LANGUAGE) {
  const lang = normalizeClientLanguage(language);
  const entry = VEHICLE_SIZE_LABELS_BY_LANGUAGE[lang]?.[id]
    || VEHICLE_SIZE_LABELS_BY_LANGUAGE.es[id];
  return entry?.hint || '';
}

/** Lista de nomes de serviço no idioma do cliente (para PDF e WhatsApp). */
export function formatServiceLabelsList(serviceIds, language = DEFAULT_CLIENT_LANGUAGE, separator = ', ') {
  const ids = Array.isArray(serviceIds) ? serviceIds : [];
  return ids.map((id) => getServiceLabel(id, language)).filter(Boolean).join(separator);
}

function findServiceIdByAnyLabel(label) {
  const normalized = String(label || '').trim().toLowerCase();
  if (!normalized) return null;
  for (const id of SERVICE_IDS) {
    for (const lang of Object.keys(SERVICE_LABELS_BY_LANGUAGE)) {
      const name = SERVICE_LABELS_BY_LANGUAGE[lang][id]?.name;
      if (name && name.toLowerCase() === normalized) return id;
    }
  }
  return null;
}

/** Traduz string de serviços (nomes separados por vírgula) quando houver match no catálogo. */
export function localizeServiceNamesString(servicoString, language = DEFAULT_CLIENT_LANGUAGE) {
  if (!servicoString || servicoString === '—') return '';
  return servicoString
    .split(',')
    .map((part) => {
      const trimmed = part.trim();
      const id = findServiceIdByAnyLabel(trimmed);
      return id ? getServiceLabel(id, language) : trimmed;
    })
    .filter(Boolean)
    .join(', ');
}

export function resolveLocalizedServices(detail, language = DEFAULT_CLIENT_LANGUAGE) {
  const ids = Array.isArray(detail?.services) ? detail.services : [];
  if (ids.length) return formatServiceLabelsList(ids, language);
  return localizeServiceNamesString(detail?.servico, language);
}

export { SERVICE_IDS, SIZE_IDS };
