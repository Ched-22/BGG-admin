import { parseLegacyPhone, toWhatsAppDigits, validatePhone } from './phoneUtils';
import { formatEUR } from './currency.js';
import { DEFAULT_CLIENT_LANGUAGE, normalizeClientLanguage } from './clientLanguage';
import { localizeServiceNamesString, resolveLocalizedServices } from './customerServiceLabels';
import { getWhatsAppTemplate } from './whatsappTemplates';

const SERVICES_LINE_PREFIX = {
  es: 'Servicios',
  ca: 'Serveis',
  en: 'Services',
  ptBr: 'Serviços',
  ptPt: 'Serviços',
};

function servicesLineFor(language, services) {
  if (!services) return '';
  const lang = normalizeClientLanguage(language);
  const prefix = SERVICES_LINE_PREFIX[lang] || SERVICES_LINE_PREFIX.es;
  return `${prefix}: ${services}`;
}

function isEmptyValue(value) {
  return value == null || value === '' || value === '—';
}

function fillTemplate(template, vars) {
  return template
    .replace(/\{(\w+)\}/g, (_, key) => {
      const v = vars[key];
      return isEmptyValue(v) ? '' : String(v);
    })
    .replace(/\(\s*\)/g, '')
    .replace(/Validez:\s*\./g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ +([.,!?])/g, '$1')
    .trim();
}

export function normalizeWhatsAppPhone(phone) {
  if (phone && typeof phone === 'object') {
    const countryCode = phone.countryCode ?? phone.phoneCountryCode ?? phone.clientPhoneCountryCode ?? phone.clienteTelCountryCode;
    const nationalNumber = phone.nationalNumber ?? phone.phoneNationalNumber ?? phone.clientPhoneNationalNumber ?? phone.clienteTelNationalNumber;
    const digits = toWhatsAppDigits(countryCode, nationalNumber);
    if (!digits || validatePhone(countryCode, nationalNumber)) return null;
    return digits;
  }
  if (isEmptyValue(phone)) return null;
  const parsed = parseLegacyPhone(phone);
  const digits = toWhatsAppDigits(parsed.countryCode, parsed.nationalNumber);
  if (!digits || validatePhone(parsed.countryCode, parsed.nationalNumber)) return null;
  return digits;
}

export function buildWhatsAppUrl(phone, message) {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

export function openWhatsAppClient({ phone, message }) {
  const url = buildWhatsAppUrl(phone, message);
  if (!url) {
    return { ok: false, error: 'Teléfono del cliente no válido — no se abrió WhatsApp' };
  }
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    return {
      ok: false,
      error: 'No se pudo abrir WhatsApp. Compruebe que las ventanas emergentes están permitidas.',
    };
  }
  return { ok: true };
}

export function buildWhatsAppMessage(templateId, vars = {}, preferredLanguage = DEFAULT_CLIENT_LANGUAGE) {
  const template = getWhatsAppTemplate(templateId, preferredLanguage);
  if (!template) return '';
  const enriched = { ...vars };
  if (enriched.total != null && typeof enriched.total === 'number') {
    enriched.total = formatEUR(enriched.total);
  }
  return fillTemplate(template, enriched);
}

export function formatAddressForWhatsApp(endereco) {
  if (!endereco) return '';
  const line1 = [endereco.unidade, endereco.logradouro]
    .filter((p) => !isEmptyValue(p))
    .join(' · ');
  const line2 = [endereco.cidade, endereco.estado]
    .filter((p) => !isEmptyValue(p))
    .join(' — ');
  return [line1, line2].filter(Boolean).join(', ');
}

export function formatDateES(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!d) return iso;
  return `${d}/${m}/${y}`;
}

export const formatDateBR = formatDateES;

export function quoteSendVarsFromTask(task, preferredLanguage = DEFAULT_CLIENT_LANGUAGE) {
  const lang = preferredLanguage || task.clientePreferredLanguage;
  const services = localizeServiceNamesString(task.servico, lang);
  return {
    clientName: task.cliente,
    vehicle: task.projeto,
    services,
    servicesLine: servicesLineFor(lang, services),
    total: task.orcamento?.valor,
  };
}

export function quoteResendVarsFromTask(task, preferredLanguage = DEFAULT_CLIENT_LANGUAGE) {
  const lang = preferredLanguage || task.clientePreferredLanguage;
  const services = localizeServiceNamesString(task.servico, lang);
  return {
    clientName: task.cliente,
    vehicle: task.projeto,
    services,
    servicesLine: servicesLineFor(lang, services),
    total: task.orcamento?.valor,
  };
}

export function serviceReadyPickupVarsFromTask(task) {
  return {
    clientName: task.cliente,
    vehicle: task.projeto,
  };
}

export function quoteSendVarsFromQuote(quote, preferredLanguage = DEFAULT_CLIENT_LANGUAGE) {
  const lang = preferredLanguage || quote.clientPreferredLanguage;
  const services = resolveLocalizedServices(quote, lang);
  return {
    clientName: quote.cliente,
    vehicle: quote.projeto,
    services,
    servicesLine: servicesLineFor(lang, services),
    total: quote.valor,
  };
}

export function quoteResendVarsFromQuote(quote, preferredLanguage = DEFAULT_CLIENT_LANGUAGE) {
  return quoteSendVarsFromQuote(quote, preferredLanguage);
}

export function notifyWhatsAppResult(result, toast) {
  if (!result.ok && toast) {
    toast({ kind: 'warn', title: 'WhatsApp', desc: result.error });
  }
}

export function openWhatsAppAfterApi({
  phone,
  templateId,
  vars,
  toast,
  preferredLanguage = DEFAULT_CLIENT_LANGUAGE,
}) {
  const message = buildWhatsAppMessage(templateId, vars, preferredLanguage);
  const result = openWhatsAppClient({ phone, message });
  notifyWhatsAppResult(result, toast);
  return result;
}

export function openWhatsAppQuoteSend({
  phone,
  clientName,
  quote,
  task,
  toast,
  preferredLanguage = DEFAULT_CLIENT_LANGUAGE,
}) {
  const vars = quote
    ? quoteSendVarsFromQuote(quote, preferredLanguage)
    : task
      ? quoteSendVarsFromTask(task, preferredLanguage)
      : { clientName, servicesLine: '' };
  return openWhatsAppAfterApi({
    phone,
    templateId: 'quote_send',
    vars,
    toast,
    preferredLanguage,
  });
}

export function openWhatsAppQuoteResend({
  phone,
  clientName,
  quote,
  task,
  toast,
  preferredLanguage = DEFAULT_CLIENT_LANGUAGE,
}) {
  const vars = quote
    ? quoteResendVarsFromQuote(quote, preferredLanguage)
    : task
      ? quoteResendVarsFromTask(task, preferredLanguage)
      : { clientName, servicesLine: '' };
  return openWhatsAppAfterApi({
    phone,
    templateId: 'quote_resend',
    vars,
    toast,
    preferredLanguage,
  });
}
