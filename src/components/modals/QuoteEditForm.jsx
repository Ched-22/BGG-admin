import React, { useMemo } from "react";
import { Field, Input, Textarea, Select, Icon, formatEUR } from "../ui";
import {
  CAR_BRANDS,
  SERVICES_CATALOG,
  VEHICLE_SIZE_OPTIONS,
  computeBudgetTotal,
  servicePrice,
} from "../../data/orcamentoCatalog";
import { formatPlate, validateQuoteForm } from "../../lib/quoteFormUtils";
import { getPlateCountryOptions, getPlatePlaceholder } from "../../lib/plateUtils";
import { QuoteClientSection } from "./QuoteClientSection";

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="quote-form-head">
      <div>
        {eyebrow ? <div className="quote-form-eyebrow">{eyebrow}</div> : null}
        <div className="quote-form-title">{title}</div>
      </div>
      {action || null}
    </div>
  );
}

function QuoteEditForm({ form, setForm, touched, setTouched, creating = false, servicesCatalog = SERVICES_CATALOG }) {
  const errors = useMemo(() => validateQuoteForm(form), [form]);

  const computedTotal = useMemo(
    () => computeBudgetTotal({
      selected: form.selected,
      vehicleSize: form.vehicleSize,
      discount: form.discount,
      override: form.override ?? "",
    }, servicesCatalog),
    [form.selected, form.vehicleSize, form.discount, form.override, servicesCatalog],
  );

  const servicesSubtotal = useMemo(() => {
    return Object.entries(form.selected || {}).reduce((sum, [id, on]) => {
      if (!on) return sum;
      const s = servicesCatalog.find((x) => x.id === id);
      return sum + (s ? servicePrice(s, form.vehicleSize) : 0);
    }, 0);
  }, [form.selected, form.vehicleSize, servicesCatalog]);

  const selectedCount = Object.values(form.selected || {}).filter(Boolean).length;
  const totalDisplay = form.override !== "" ? form.override : computedTotal;

  const onVehicleSizeChange = (size) => {
    setForm((f) => ({ ...f, vehicleSize: size, override: "" }));
  };

  const toggleService = (id) => {
    setForm((f) => ({
      ...f,
      selected: { ...f.selected, [id]: !f.selected[id] },
      override: "",
    }));
  };

  return (
    <div className="quote-form col" style={{ gap: 18 }}>
      <div className="quote-form-section">
        <SectionHeader eyebrow="Etapa 01" title="Cliente" />
        <QuoteClientSection
          form={form}
          setForm={setForm}
          touched={touched}
          setTouched={setTouched}
          creating={creating}
          errors={errors}
        />
      </div>

      <div className="quote-form-rule" />

      <div className="quote-form-section">
        <SectionHeader eyebrow="Etapa 02" title="Veículo" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="País de origem">
            <Select
              value={form.plateCountry || 'ES'}
              onChange={(e) => setForm((f) => ({
                ...f,
                plateCountry: e.target.value,
                plate: '',
              }))}
            >
              {getPlateCountryOptions().map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Placa" error={touched.plate && errors.plate}>
            <Input
              value={form.plate}
              onChange={(e) => setForm((f) => ({
                ...f,
                plate: formatPlate(e.target.value, f.plateCountry),
              }))}
              onBlur={() => setTouched((t) => ({ ...t, plate: true }))}
              placeholder={getPlatePlaceholder(form.plateCountry)}
              style={{ letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}
            />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <Field label="Ano">
            <Input
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
              placeholder="2024"
              inputMode="numeric"
            />
          </Field>
        </div>
        <Field label="Marca">
          <Select
            value={form.brand}
            onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
          >
            <option value="">Selecione a marca</option>
            {CAR_BRANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Modelo">
            <Input
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="911 Carrera S"
            />
          </Field>
          <Field label="Cor">
            <Input
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              placeholder="Preto Jet"
            />
          </Field>
        </div>
        <Field label="Quilometragem" hint="Apenas números, sem ponto">
          <Input
            value={form.km}
            onChange={(e) => setForm((f) => ({ ...f, km: e.target.value.replace(/\D/g, "") }))}
            placeholder="42500"
            inputMode="numeric"
            trailing="km"
          />
        </Field>
        <Field
          label="Tamanho do veículo"
          hint="Os valores dos serviços são ajustados conforme o porte"
        >
          <div className="quote-size-row" role="radiogroup" aria-label="Tamanho do veículo">
            {VEHICLE_SIZE_OPTIONS.map((opt) => {
              const active = form.vehicleSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`quote-size-btn ${active ? "active" : ""}`}
                  onClick={() => onVehicleSizeChange(opt.id)}
                  title={opt.hint}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="tiny muted" style={{ marginTop: 8 }}>
            {VEHICLE_SIZE_OPTIONS.find((o) => o.id === form.vehicleSize)?.hint}
          </div>
        </Field>
      </div>

      <div className="quote-form-rule" />

      <div className="quote-form-section">
        <SectionHeader
          eyebrow="Etapa 03"
          title="Serviços"
          action={
            <span className="tiny" style={{ color: selectedCount > 0 ? "var(--gold)" : "var(--fg-5)" }}>
              {selectedCount} selecionado{selectedCount !== 1 ? "s" : ""}
            </span>
          }
        />
        {touched.services && errors.services ? (
          <div className="err" style={{ marginBottom: 8 }}>
            <Icon.AlertTriangle size={12}/> {errors.services}
          </div>
        ) : null}
        <div className="col" style={{ gap: 8 }}>
          {servicesCatalog.map((s) => {
            const on = !!form.selected[s.id];
            return (
              <button
                key={s.id}
                type="button"
                className={`quote-svc-item ${on ? "selected" : ""}`}
                onClick={() => toggleService(s.id)}
              >
                <div className="quote-svc-check">
                  {on ? <Icon.Check size={13} strokeWidth={3} style={{ color: "#0B0B0B" }}/> : null}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div className="quote-svc-name">{s.name}</div>
                  <div className="quote-svc-desc">{s.desc}</div>
                </div>
                <div className="quote-svc-price">{formatEUR(servicePrice(s, form.vehicleSize))}</div>
              </button>
            );
          })}
        </div>
        <Field label="Descrição adicional" optional>
          <Textarea
            rows={3}
            maxLength={500}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Detalhes específicos do serviço..."
          />
        </Field>
      </div>

      <div className="quote-form-rule" />

      <div className="quote-form-section">
        <SectionHeader eyebrow="Etapa 04" title="Valor total" />
        <div className="quote-total-card">
          <div className="quote-total-row">
            <span className="muted small">Subtotal de serviços</span>
            <span className="mono">{formatEUR(servicesSubtotal)}</span>
          </div>
          <div className="quote-total-row">
            <span className="muted small">Desconto</span>
            <div className="row" style={{ gap: 6 }}>
              <span className="muted small">€</span>
              <Input
                style={{ width: 90, textAlign: "right", height: 32, padding: "0 8px", fontSize: 13 }}
                value={form.discount}
                onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value.replace(/\D/g, ""), override: "" }))}
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="quote-total-line">
            <div>
              <div className="quote-total-label">Total</div>
              <div className="tiny muted">
                {form.override !== "" ? "Editado manualmente" : "Calculado automaticamente"}
              </div>
            </div>
            <Input
              className="quote-total-input"
              value={totalDisplay}
              onChange={(e) => setForm((f) => ({ ...f, override: e.target.value.replace(/[^\d]/g, "") }))}
              inputMode="numeric"
            />
          </div>
          {touched.total && errors.total ? (
            <div className="err" style={{ marginTop: 6 }}>
              <Icon.AlertTriangle size={12}/> {errors.total}
            </div>
          ) : null}
          {form.override !== "" ? (
            <button
              type="button"
              className="btn ghost sm"
              style={{ marginTop: 8, fontSize: 10 }}
              onClick={() => setForm((f) => ({ ...f, override: "" }))}
            >
              Recalcular automaticamente
            </button>
          ) : null}
        </div>
      </div>

      <Field
        label="Observações internas"
        optional
        hint="Visível apenas ao técnico — máx. 500 caracteres"
      >
        <Textarea
          rows={2}
          maxLength={500}
          value={form.internalNote}
          onChange={(e) => setForm((f) => ({ ...f, internalNote: e.target.value }))}
          placeholder="ex. Cliente prefere atendimento aos sábados..."
        />
      </Field>
    </div>
  );
}

export { QuoteEditForm };
