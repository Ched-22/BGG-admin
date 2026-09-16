import React, { useCallback, useEffect, useState } from "react";
import { Button, Checkbox, Field, Icon, Input } from "../ui";
import { mapClientFromApi, searchClients } from "../../lib/clientApi";
import { DEFAULT_PHONE_COUNTRY_CODE } from "../../lib/phoneCountries";
import { formatPhoneDisplay } from "../../lib/phoneUtils";
import { PhoneInput } from "../PhoneInput";
import { ClientLanguageSelect } from "../ClientLanguageSelect";
import { DEFAULT_CLIENT_LANGUAGE } from "../../lib/clientLanguage";

function clearClientFields(form) {
  return {
    ...form,
    clientId: undefined,
    clientName: "",
    clientEmail: "",
    clientPhoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
    clientPhoneNationalNumber: "",
    clientPreferredLanguage: DEFAULT_CLIENT_LANGUAGE,
  };
}

function applyClientToForm(form, client) {
  const row = client.name ? client : mapClientFromApi(client);
  return {
    ...form,
    clientExistente: true,
    clientId: row.id,
    clientName: row.name || "",
    clientEmail: row.email || "",
    clientPhoneCountryCode: row.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    clientPhoneNationalNumber: row.phoneNationalNumber || "",
    clientPreferredLanguage: row.preferredLanguage || DEFAULT_CLIENT_LANGUAGE,
  };
}

export function QuoteClientSection({
  form,
  setForm,
  touched,
  setTouched,
  creating = false,
  errors = {},
}) {
  const [clientSearchMode, setClientSearchMode] = useState("name");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientResults, setClientResults] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);

  const resetClientSearch = useCallback(() => {
    setClientSearchMode("name");
    setClientSearchQuery("");
    setClientResults([]);
    setSearchingClients(false);
  }, []);

  useEffect(() => {
    if (!creating || !form.clientExistente || form.clientId) {
      setClientResults([]);
      return undefined;
    }
    const query = clientSearchQuery.trim();
    if (query.length < 2) {
      setClientResults([]);
      setSearchingClients(false);
      return undefined;
    }
    setSearchingClients(true);
    const timer = window.setTimeout(() => {
      searchClients(query, clientSearchMode)
        .then((rows) => setClientResults(rows))
        .catch(() => setClientResults([]))
        .finally(() => setSearchingClients(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [creating, form.clientExistente, form.clientId, clientSearchQuery, clientSearchMode]);

  const selectClient = (client) => {
    setForm((f) => applyClientToForm(f, client));
    setClientSearchQuery(client.name);
    setClientResults([]);
  };

  const clearSelectedClient = () => {
    setForm((f) => clearClientFields(f));
    setClientSearchQuery("");
    setClientResults([]);
  };

  const clientFields = (
    <>
      <Field label="Nome completo" error={touched.clientName && errors.clientName}>
        <Input
          value={form.clientName}
          onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
          onBlur={() => setTouched((t) => ({ ...t, clientName: true }))}
          placeholder="ex. Marina Costa"
        />
      </Field>
      <Field label="Telefone" error={touched.clientPhone && errors.clientPhone}>
        <PhoneInput
          countryCode={form.clientPhoneCountryCode}
          nationalNumber={form.clientPhoneNationalNumber}
          onChange={({ countryCode, nationalNumber }) =>
            setForm((f) => ({
              ...f,
              clientPhoneCountryCode: countryCode,
              clientPhoneNationalNumber: nationalNumber,
            }))
          }
        />
      </Field>
      <Field label="E-mail" optional error={touched.clientEmail && errors.clientEmail}>
        <Input
          type="email"
          value={form.clientEmail}
          onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
          onBlur={() => setTouched((t) => ({ ...t, clientEmail: true }))}
          placeholder="cliente@email.com"
        />
      </Field>
      <ClientLanguageSelect
        value={form.clientPreferredLanguage}
        onChange={(lang) => setForm((f) => ({ ...f, clientPreferredLanguage: lang }))}
        disabled={!!form.clientId}
        hint={form.clientId ? "Idioma definido no cadastro do cliente" : undefined}
      />
    </>
  );

  if (!creating) {
    return clientFields;
  }

  return (
    <>
      <Checkbox
        checked={!!form.clientExistente}
        onChange={(v) => {
          setForm((f) => ({
            ...clearClientFields(f),
            clientExistente: v,
            clientPreferredLanguage: DEFAULT_CLIENT_LANGUAGE,
          }));
          resetClientSearch();
        }}
        label="Cliente existente (buscar no cadastro)"
      />

      {form.clientExistente ? (
        <>
          <div className="view-switcher" style={{ width: "fit-content" }}>
            {[
              { id: "name", label: "Por nome" },
              { id: "phone", label: "Por telefone" },
              { id: "email", label: "Por e-mail" },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={clientSearchMode === mode.id ? "active" : ""}
                onClick={() => {
                  setClientSearchMode(mode.id);
                  if (!form.clientId) setClientResults([]);
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {form.clientId ? (
            <div style={{
              border: "1px solid var(--gold-30)",
              borderRadius: 4,
              padding: 14,
              background: "rgba(181, 235, 12,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--fg)", fontWeight: 500 }}>{form.clientName}</div>
                <div className="muted small" style={{ marginTop: 4 }}>
                  {formatPhoneDisplay(form.clientPhoneCountryCode, form.clientPhoneNationalNumber)}
                  {form.clientEmail ? ` · ${form.clientEmail}` : ""}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={clearSelectedClient}>Trocar</Button>
            </div>
          ) : (
            <>
              <Field
                label={
                  clientSearchMode === "phone"
                    ? "Buscar por telefone"
                    : clientSearchMode === "email"
                      ? "Buscar por e-mail"
                      : "Buscar por nome"
                }
                error={touched.clientSelect && errors.clientSelect}
                hint={
                  clientSearchMode === "phone"
                    ? "Digite ao menos 2 dígitos"
                    : clientSearchMode === "email"
                      ? "Digite ao menos 2 caracteres"
                      : "Digite ao menos 2 letras"
                }
              >
                <Input
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  leading={
                    clientSearchMode === "phone"
                      ? <Icon.Phone size={14}/>
                      : clientSearchMode === "email"
                        ? <Icon.Mail size={14}/>
                        : <Icon.Search size={14}/>
                  }
                  placeholder={
                    clientSearchMode === "phone"
                      ? "Ex: 612345678"
                      : clientSearchMode === "email"
                        ? "cliente@email.com"
                        : "Ex: João Silva"
                  }
                  onBlur={() => setTouched((t) => ({ ...t, clientSelect: true }))}
                />
              </Field>

              {searchingClients ? (
                <div className="muted small">A buscar clientes…</div>
              ) : null}

              {clientResults.length > 0 ? (
                <div className="col" style={{ gap: 6 }}>
                  {clientResults.map((client) => (
                    <button
                      key={client.id || client.name}
                      type="button"
                      className="entity-card"
                      style={{ textAlign: "left", padding: 12, cursor: "pointer" }}
                      onClick={() => selectClient(client)}
                    >
                      <div style={{ fontWeight: 500 }}>{client.name}</div>
                      <div className="muted small" style={{ marginTop: 4 }}>
                        {client.tel}{client.email ? ` · ${client.email}` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </>
      ) : (
        clientFields
      )}
    </>
  );
}
