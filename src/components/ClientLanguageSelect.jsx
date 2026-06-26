import React from 'react';
import { Field, Select } from './ui';
import { CLIENT_LANGUAGE_OPTIONS } from '../lib/clientLanguage';

export function ClientLanguageSelect({
  value,
  onChange,
  disabled = false,
  hint,
}) {
  return (
    <Field label="Idioma do cliente" hint={hint}>
      <Select
        value={value || 'es'}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {CLIENT_LANGUAGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </Select>
    </Field>
  );
}
