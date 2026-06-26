import React, { useEffect, useState } from "react";
import { Button, Icon, Modal, formatEUR, useToast } from "../ui";
import api from "../../lib/api";
import {
  emptyQuoteForm,
  isQuoteDraft,
  isQuotePending,
  mapQuoteFromApi,
  mapQuoteToApi,
  quoteToForm,
  QUOTE_TONE,
  quoteSubtotalFromDetail,
} from "../../lib/quoteApi";
import { VEHICLE_SIZE_OPTIONS } from "../../data/orcamentoCatalog";
import { validateQuoteForm } from "../../lib/quoteFormUtils";
import { formatPlateDisplay, getPlateCountryOptions } from "../../lib/plateUtils";
import { fetchOrcamentoCatalog } from "../../lib/catalogApi";
import { QuoteEditForm } from "./QuoteEditForm";

const PLATE_COUNTRY_LABELS = Object.fromEntries(
  getPlateCountryOptions().map((o) => [o.code, o.label]),
);

const VEHICLE_SIZE_LABELS = Object.fromEntries(
  VEHICLE_SIZE_OPTIONS.map((o) => [o.id, o.label]),
);

function QuoteDetailView({ detail }) {
  const discount = Number(detail.discount) || 0;
  const hasDiscount = discount > 0;
  const subtotal = quoteSubtotalFromDetail(detail);

  return (
    <div className="col" style={{ gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 18, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 4 }}>{detail.servico}</div>
          <div className="serif" style={{ color: "var(--fg)", fontSize: 22, lineHeight: 1.2, fontWeight: 500, marginBottom: 6 }}>{detail.projeto}</div>
          <div className="row" style={{ gap: 8 }}>
            <span className={`badge ${QUOTE_TONE[detail.status] || "muted"}`}><span className="dot"></span>{detail.status}</span>
            <span className="tag mono">{detail.id}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-5)" }}>Valor total</div>
          <div className="serif" style={{ color: "var(--gold)", fontSize: 32, fontWeight: 500, lineHeight: 1 }}>{formatEUR(detail.valor)}</div>
          <div className="tiny" style={{ marginTop: 6, color: hasDiscount ? "#8fbf6a" : "var(--fg-5)" }}>
            {hasDiscount ? `Desconto aplicado: −${formatEUR(discount)}` : "Sem desconto aplicado"}
          </div>
          <div className="tiny muted" style={{ marginTop: 4 }}>Validade: {detail.validade}</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Valores</div>
        <div className="kv-row">
          <span className="k">Subtotal (serviços)</span>
          <span className="v mono">{formatEUR(subtotal)}</span>
        </div>
        <div className="kv-row">
          <span className="k">Desconto</span>
          <span className="v mono" style={{ color: hasDiscount ? "#8fbf6a" : undefined }}>
            {hasDiscount ? `−${formatEUR(discount)}` : "Nenhum desconto aplicado"}
          </span>
        </div>
        <div className="kv-row">
          <span className="k">Valor total</span>
          <span className="v mono" style={{ color: "var(--gold)", fontWeight: 500 }}>{formatEUR(detail.valor)}</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Cliente</div>
        <div className="kv-row"><span className="k">Nome</span><span className="v">{detail.cliente}</span></div>
        <div className="kv-row"><span className="k">Telefone</span><span className="v">{detail.clientPhone || "—"}</span></div>
        <div className="kv-row"><span className="k">E-mail</span><span className="v">{detail.clientEmail || "—"}</span></div>
        <div className="kv-row"><span className="k">Criado em</span><span className="v mono">{detail.dataCriacao}</span></div>
      </div>

      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Veículo</div>
        <div className="kv-row"><span className="k">País de origem</span><span className="v">{PLATE_COUNTRY_LABELS[detail.plateCountry] || detail.plateCountry || "—"}</span></div>
        <div className="kv-row"><span className="k">Placa</span><span className="v mono">{formatPlateDisplay(detail.plateRaw || detail.plate, detail.plateCountry) || "—"}</span></div>
        <div className="kv-row"><span className="k">Marca / Modelo</span><span className="v">{detail.brand} {detail.model}</span></div>
        <div className="kv-row"><span className="k">Ano / Cor</span><span className="v">{detail.year || "—"} · {detail.color || "—"}</span></div>
        <div className="kv-row"><span className="k">Quilometragem</span><span className="v mono">{detail.km ? `${detail.km} km` : "—"}</span></div>
        <div className="kv-row"><span className="k">Tamanho</span><span className="v">{VEHICLE_SIZE_LABELS[detail.vehicleSize] || detail.vehicleSize || "—"}</span></div>
      </div>

      {detail.notes ? (
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Descrição adicional</div>
          <p className="muted small" style={{ lineHeight: 1.6 }}>{detail.notes}</p>
        </div>
      ) : null}

      {detail.internalNote ? (
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Observações internas</div>
          <p className="muted small" style={{ lineHeight: 1.6 }}>{detail.internalNote}</p>
        </div>
      ) : null}

      <div className="row" style={{ gap: 8, padding: "12px 14px", background: "rgba(194,164,109,0.06)", border: "1px solid var(--gold-30)", borderRadius: 4 }}>
        <Icon.Info size={14} style={{ color: "var(--gold)" }}/>
        <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
          {isQuoteDraft(detail)
            ? "Rascunho — edite e envie para aprovação interna quando estiver pronto."
            : isQuotePending(detail)
              ? "Aguarda revisão ou aprovação interna (inclui orçamentos enviados pelo mobile)."
              : detail.status === "Aprovado"
                ? "Orçamento aprovado."
                : "Revise os dados antes de prosseguir no funil."}
        </span>
      </div>
    </div>
  );
}

function QuoteDetailModal({
  open,
  quote,
  creating = false,
  initialEdit = false,
  linkedTaskDisplayId,
  onClose,
  onSaved,
  onApprove,
  onSend,
  onScheduleFromQuote,
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [touched, setTouched] = useState({});
  const [servicesCatalog, setServicesCatalog] = useState([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchOrcamentoCatalog()
      .then((catalog) => {
        if (!cancelled) setServicesCatalog(catalog);
      })
      .catch(() => {
        if (!cancelled) setServicesCatalog([]);
      });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setForm(null);
      setDetail(null);
      setTouched({});
      return;
    }
    if (creating) {
      setDetail(null);
      setForm(emptyQuoteForm());
      setEditing(true);
      setTouched({});
      return;
    }
    if (!quote) return;
    setDetail(quote);
    setForm(quoteToForm(quote));
    setEditing(initialEdit);
    setTouched({});
  }, [open, quote, initialEdit, creating]);

  const runValidation = () => {
    const allTouched = {
      clientName: true,
      clientPhone: true,
      clientEmail: true,
      plate: true,
      services: true,
      total: true,
    };
    setTouched(allTouched);
    const errors = validateQuoteForm(form);
    if (Object.keys(errors).length > 0) {
      toast({ kind: "error", title: "Verifique os campos", desc: "Corrija os erros antes de continuar." });
      return false;
    }
    return true;
  };

  const persistForm = async () => {
    const body = mapQuoteToApi(form, { linkedTaskDisplayId });
    if (creating || !detail?.id) {
      const { data } = await api.post('/quotes', body);
      return mapQuoteFromApi(data);
    }
    const { data } = await api.patch(`/quotes/${detail.id}`, body);
    return mapQuoteFromApi(data);
  };

  const handleSave = async () => {
    if (!form) return;
    if (!runValidation()) return;
    setSaving(true);
    try {
      const mapped = await persistForm();
      setDetail(mapped);
      setForm(quoteToForm(mapped));
      setEditing(false);
      onSaved?.(mapped);
      toast({
        kind: "success",
        title: creating ? "Orçamento criado" : "Orçamento atualizado",
        desc: mapped.id,
      });
    } catch {
      toast({ kind: "error", title: "Erro ao salvar", desc: "Não foi possível guardar o orçamento." });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!form) return;
    if (!runValidation()) return;
    setSaving(true);
    try {
      let mapped = detail;
      if (creating || !detail?.id || editing) {
        mapped = await persistForm();
      }
      const { data } = await api.patch(`/quotes/${mapped.id}/submit`);
      const submitted = mapQuoteFromApi(data);
      onSaved?.(submitted);
      toast({ kind: "success", title: "Enviado para aprovação", desc: submitted.id });
      onClose();
    } catch {
      toast({ kind: "error", title: "Erro ao enviar", desc: "Não foi possível enviar para aprovação." });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!detail?.id || !onApprove) return;
    const updated = await onApprove(detail.id);
    if (updated) {
      setDetail(updated);
      setForm(quoteToForm(updated));
      setEditing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!detail) return;
    setDownloadingPdf(true);
    try {
      const { exportQuotePdf } = await import("../../lib/quotePdf");
      const filename = await exportQuotePdf(detail);
      toast({ kind: "success", title: "PDF gerado", desc: filename });
    } catch {
      toast({ kind: "error", title: "Erro ao gerar PDF", desc: "Não foi possível gerar o PDF." });
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!open) return null;
  if (!creating && !detail) return null;

  const showSubmit = creating || (detail && isQuoteDraft(detail));
  const showApproveBtn = onApprove && detail && isQuotePending(detail);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={creating ? "Novo orçamento" : editing ? `Editar orçamento ${detail.id}` : `Orçamento ${detail.id}`}
      sub={creating ? "Preencha os dados do veículo e serviços" : detail.projeto}
      size="xl"
      footer={
        <>
          {editing || creating ? (
            <>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="secondary" icon={Icon.Check} disabled={saving} onClick={handleSave}>
                {saving ? "A guardar…" : creating ? "Guardar rascunho" : "Guardar alterações"}
              </Button>
              {showSubmit ? (
                <Button icon={Icon.Send} disabled={saving} onClick={handleSubmitForApproval}>
                  Enviar para aprovação
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                icon={Icon.Download}
                disabled={!detail || downloadingPdf}
                onClick={handleDownloadPdf}
              >
                {downloadingPdf ? "Gerando…" : "Baixar PDF"}
              </Button>
              {isQuotePending(detail) ? (
                <Button variant="secondary" icon={Icon.Edit} onClick={() => setEditing(true)}>Editar</Button>
              ) : null}
              {showSubmit ? (
                <Button icon={Icon.Send} onClick={handleSubmitForApproval}>Enviar para aprovação</Button>
              ) : null}
              {showApproveBtn ? (
                <Button icon={Icon.Check} onClick={handleApprove}>Aprovar</Button>
              ) : null}
              {detail.status === "Aprovado" && onScheduleFromQuote ? (
                <Button icon={Icon.Calendar} onClick={() => { onScheduleFromQuote(detail); onClose(); }}>Agendar tarefa</Button>
              ) : null}
              {detail.status === "Aprovado" && onSend ? (
                <Button icon={Icon.Send} onClick={() => { onSend(detail.id); onClose(); }}>Enviar ao cliente</Button>
              ) : null}
            </>
          )}
        </>
      }
    >
      {editing || creating ? (
        form ? (
          <QuoteEditForm
            form={form}
            setForm={setForm}
            touched={touched}
            setTouched={setTouched}
            creating={creating}
            servicesCatalog={servicesCatalog.length ? servicesCatalog : undefined}
          />
        ) : null
      ) : (
        detail ? <QuoteDetailView detail={detail}/> : null
      )}
    </Modal>
  );
}

export { QuoteDetailModal };
