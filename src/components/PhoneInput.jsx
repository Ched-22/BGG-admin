import React from 'react';
import { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY_CODE, formatDialDisplay } from '../lib/phoneCountries';
import { formatNationalNumberDisplay } from '../lib/phoneUtils';

export function PhoneInput({
  countryCode = DEFAULT_PHONE_COUNTRY_CODE,
  nationalNumber = '',
  onChange,
  disabled = false,
  id,
}) {
  const handleCountryChange = (e) => {
    onChange?.({
      countryCode: e.target.value,
      nationalNumber: String(nationalNumber || '').replace(/\D/g, ''),
    });
  };

  const handleNationalChange = (e) => {
    const next = e.target.value.replace(/\D/g, '').slice(0, 15);
    onChange?.({
      countryCode: String(countryCode || DEFAULT_PHONE_COUNTRY_CODE).replace(/\D/g, ''),
      nationalNumber: next,
    });
  };

  const displayNational = formatNationalNumberDisplay(nationalNumber);

  return (
    <div className="phone-input">
      <select
        id={id ? `${id}-country` : undefined}
        className="input phone-input__country"
        value={String(countryCode || DEFAULT_PHONE_COUNTRY_CODE).replace(/\D/g, '')}
        onChange={handleCountryChange}
        disabled={disabled}
        aria-label="Código do país"
      >
        {PHONE_COUNTRIES.map((country) => (
          <option key={country.code} value={country.dialCode}>
            {formatDialDisplay(country)}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        className="input phone-input__number"
        value={displayNational}
        onChange={handleNationalChange}
        disabled={disabled}
        placeholder="612 345 678"
        aria-label="Número de telefone"
      />
    </div>
  );
}
