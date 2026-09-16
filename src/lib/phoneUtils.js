import { DEFAULT_PHONE_COUNTRY_CODE, PHONE_COUNTRIES } from './phoneCountries';

const KNOWN_DIAL_CODES = [...PHONE_COUNTRIES]
  .map((c) => c.dialCode)
  .sort((a, b) => b.length - a.length);

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function parseLegacyPhone(raw) {
  const digits = digitsOnly(raw);
  if (!digits) {
    return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, nationalNumber: '' };
  }

  for (const code of KNOWN_DIAL_CODES) {
    if (digits.startsWith(code) && digits.length > code.length + 7) {
      return { countryCode: code, nationalNumber: digits.slice(code.length) };
    }
  }

  if (digits.length >= 10 && digits.length <= 11) {
    return { countryCode: '55', nationalNumber: digits };
  }

  return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, nationalNumber: digits };
}

export function formatNationalNumberDisplay(nationalNumber) {
  const digits = digitsOnly(nationalNumber);
  if (!digits) return '';
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

export function formatPhoneDisplay(countryCode, nationalNumber) {
  const cc = digitsOnly(countryCode);
  const nn = formatNationalNumberDisplay(nationalNumber);
  if (!cc || !nn) return '—';
  return `+${cc} ${nn}`;
}

export function toWhatsAppDigits(countryCode, nationalNumber) {
  const cc = digitsOnly(countryCode);
  const nn = digitsOnly(nationalNumber);
  if (!cc || !nn) return '';
  return `${cc}${nn}`;
}

export function validatePhone(countryCode, nationalNumber) {
  const cc = digitsOnly(countryCode);
  const nn = digitsOnly(nationalNumber);
  if (!cc) return 'Selecione o código do país.';
  if (!nn) return 'Informe o número de telefone.';
  if (cc === '34' && nn.length !== 9) return 'Número espanhol deve ter 9 dígitos.';
  if (cc === '351' && nn.length !== 9) return 'Número português deve ter 9 dígitos.';
  if (cc === '55' && (nn.length < 10 || nn.length > 11)) return 'Número brasileiro inválido.';
  if (cc === '33' && nn.length !== 9) return 'Número francês deve ter 9 dígitos.';
  if (cc === '39' && (nn.length < 9 || nn.length > 10)) return 'Número italiano inválido.';
  if (cc === '44' && (nn.length < 10 || nn.length > 11)) return 'Número britânico inválido.';
  if (cc === '49' && (nn.length < 10 || nn.length > 11)) return 'Número alemão inválido.';
  if (nn.length < 8 || nn.length > 12) return 'Número inválido para o país selecionado.';
  return null;
}

export function phonePairFromFields(countryCode, nationalNumber) {
  return {
    countryCode: digitsOnly(countryCode) || DEFAULT_PHONE_COUNTRY_CODE,
    nationalNumber: digitsOnly(nationalNumber),
  };
}

export function isValidPhonePair(countryCode, nationalNumber) {
  return !validatePhone(countryCode, nationalNumber);
}
