export const DEFAULT_PHONE_COUNTRY_CODE = '34';

export function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((char) => 127397 + char.charCodeAt(0)),
  );
}

const EUROPEAN_COUNTRIES = [
  { code: 'AL', dialCode: '355', label: 'Albânia' },
  { code: 'DE', dialCode: '49', label: 'Alemanha' },
  { code: 'AD', dialCode: '376', label: 'Andorra' },
  { code: 'AM', dialCode: '374', label: 'Arménia' },
  { code: 'AT', dialCode: '43', label: 'Áustria' },
  { code: 'AZ', dialCode: '994', label: 'Azerbaijão' },
  { code: 'BY', dialCode: '375', label: 'Bielorrússia' },
  { code: 'BE', dialCode: '32', label: 'Bélgica' },
  { code: 'BA', dialCode: '387', label: 'Bósnia e Herzegovina' },
  { code: 'BG', dialCode: '359', label: 'Bulgária' },
  { code: 'HR', dialCode: '385', label: 'Croácia' },
  { code: 'CY', dialCode: '357', label: 'Chipre' },
  { code: 'DK', dialCode: '45', label: 'Dinamarca' },
  { code: 'SK', dialCode: '421', label: 'Eslováquia' },
  { code: 'SI', dialCode: '386', label: 'Eslovénia' },
  { code: 'ES', dialCode: '34', label: 'Espanha' },
  { code: 'EE', dialCode: '372', label: 'Estónia' },
  { code: 'FO', dialCode: '298', label: 'Ilhas Faroé' },
  { code: 'FI', dialCode: '358', label: 'Finlândia' },
  { code: 'FR', dialCode: '33', label: 'França' },
  { code: 'GE', dialCode: '995', label: 'Geórgia' },
  { code: 'GI', dialCode: '350', label: 'Gibraltar' },
  { code: 'GR', dialCode: '30', label: 'Grécia' },
  { code: 'HU', dialCode: '36', label: 'Hungria' },
  { code: 'IE', dialCode: '353', label: 'Irlanda' },
  { code: 'IS', dialCode: '354', label: 'Islândia' },
  { code: 'IT', dialCode: '39', label: 'Itália' },
  { code: 'XK', dialCode: '383', label: 'Kosovo' },
  { code: 'LV', dialCode: '371', label: 'Letónia' },
  { code: 'LI', dialCode: '423', label: 'Liechtenstein' },
  { code: 'LT', dialCode: '370', label: 'Lituânia' },
  { code: 'LU', dialCode: '352', label: 'Luxemburgo' },
  { code: 'MK', dialCode: '389', label: 'Macedónia do Norte' },
  { code: 'MT', dialCode: '356', label: 'Malta' },
  { code: 'MD', dialCode: '373', label: 'Moldávia' },
  { code: 'MC', dialCode: '377', label: 'Mónaco' },
  { code: 'ME', dialCode: '382', label: 'Montenegro' },
  { code: 'NO', dialCode: '47', label: 'Noruega' },
  { code: 'NL', dialCode: '31', label: 'Países Baixos' },
  { code: 'PL', dialCode: '48', label: 'Polónia' },
  { code: 'PT', dialCode: '351', label: 'Portugal' },
  { code: 'GB', dialCode: '44', label: 'Reino Unido' },
  { code: 'CZ', dialCode: '420', label: 'República Checa' },
  { code: 'RO', dialCode: '40', label: 'Roménia' },
  { code: 'RU', dialCode: '7', label: 'Rússia' },
  { code: 'SM', dialCode: '378', label: 'San Marino' },
  { code: 'RS', dialCode: '381', label: 'Sérvia' },
  { code: 'SE', dialCode: '46', label: 'Suécia' },
  { code: 'CH', dialCode: '41', label: 'Suíça' },
  { code: 'TR', dialCode: '90', label: 'Turquia' },
  { code: 'UA', dialCode: '380', label: 'Ucrânia' },
  { code: 'VA', dialCode: '379', label: 'Vaticano' },
];

const OTHER_COUNTRIES = [
  { code: 'BR', dialCode: '55', label: 'Brasil' },
];

const ALL_COUNTRIES = [...EUROPEAN_COUNTRIES, ...OTHER_COUNTRIES];

const PRIORITY_DIAL_CODES = ['34', '351', '55'];

export const PHONE_COUNTRIES = [
  ...PRIORITY_DIAL_CODES
    .map((dialCode) => ALL_COUNTRIES.find((c) => c.dialCode === dialCode))
    .filter(Boolean),
  ...ALL_COUNTRIES
    .filter((c) => !PRIORITY_DIAL_CODES.includes(c.dialCode))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt')),
];

export function formatDialDisplay(country) {
  return `${countryFlag(country.code)} +${country.dialCode}`;
}

export function findCountryByDialCode(dialCode) {
  return PHONE_COUNTRIES.find((c) => c.dialCode === String(dialCode || '').replace(/\D/g, ''))
    || PHONE_COUNTRIES[0];
}
