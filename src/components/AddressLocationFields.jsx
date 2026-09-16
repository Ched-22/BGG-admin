import React from "react";
import { BGG_DATA } from "../data/bggData";
import { Field, Input, Select } from "./ui";

export function isBrazilPhoneCountry(countryCode) {
  return String(countryCode || "").replace(/\D/g, "") === "55";
}

export function AddressLocationFields({
  cidade,
  estado,
  cep,
  onCidadeChange,
  onEstadoChange,
  onCepChange,
  phoneCountryCode,
  optional = false,
  cidadeError,
  estadoError,
  cepError,
}) {
  const isBrazil = isBrazilPhoneCountry(phoneCountryCode);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
      <Field label="Cidade" optional={optional} error={cidadeError}>
        <Input
          placeholder={isBrazil ? "São Paulo" : "Ex: Madrid"}
          value={cidade}
          onChange={(e) => onCidadeChange(e.target.value)}
          err={!!cidadeError}
        />
      </Field>
      {isBrazil ? (
        <Field label="UF" optional={optional} error={estadoError}>
          <Select
            value={estado}
            onChange={(e) => onEstadoChange(e.target.value)}
            err={!!estadoError}
          >
            <option value="">Selecione</option>
            {BGG_DATA.estados.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
      ) : (
        <Field label="Estado / província" optional={optional} error={estadoError}>
          <Input
            placeholder="Ex: Madrid, Lisboa…"
            value={estado}
            onChange={(e) => onEstadoChange(e.target.value)}
            err={!!estadoError}
          />
        </Field>
      )}
      <Field label={isBrazil ? "CEP" : "Código postal"} optional={optional} error={cepError}>
        <Input
          placeholder={isBrazil ? "00000-000" : "Ex: 28001"}
          value={cep}
          onChange={(e) => onCepChange(e.target.value)}
          err={!!cepError}
        />
      </Field>
    </div>
  );
}
