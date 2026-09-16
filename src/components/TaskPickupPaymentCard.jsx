import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Field,
  Icon,
  Input,
  Select,
  formatEUR,
  useToast,
} from "./ui";
import {
  PAYMENT_METHODS,
  SETTLEMENT_STATUSES,
  defaultPaymentIban,
  fetchTaskPayment,
  saveTaskPayment,
} from "../lib/taskPaymentApi";

const IBAN_METHODS = new Set(["multibanco", "bankTransfer"]);

function emptyForm(amount = "") {
  return {
    settlementStatus: "pending",
    paymentMethod: "",
    iban: defaultPaymentIban(),
    amount: amount === "" ? "" : String(amount),
    isInstallment: false,
    installmentCount: "2",
    installmentsPaid: "0",
    notes: "",
  };
}

export function TaskPickupPaymentCard({
  task,
  readOnly = false,
  onSaved,
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [form, setForm] = useState(emptyForm());

  const showCard = task.status === "Pronto para QA" || task.status === "Concluído";
  const showIban = IBAN_METHODS.has(form.paymentMethod);
  const showInstallments = form.settlementStatus === "paid" && form.isInstallment;
  const canEdit = !readOnly;

  const statusBadgeTone = useMemo(() => {
    if (paymentStatus === "completed") return "#8fbf6a";
    if (paymentStatus === "installmentsOpen") return "#d4a017";
    return "#d4a017";
  }, [paymentStatus]);

  useEffect(() => {
    if (!showCard || !task?.id) return undefined;
    let cancelled = false;
    setLoading(true);
    fetchTaskPayment(task.id)
      .then((data) => {
        if (cancelled) return;
        setPaymentStatus(data.paymentStatus || "pending");
        setForm({
          settlementStatus: data.settlementStatus || "pending",
          paymentMethod: data.paymentMethod || "",
          iban: data.iban || defaultPaymentIban(),
          amount: data.amount != null ? String(data.amount) : "",
          isInstallment: Boolean(data.isInstallment),
          installmentCount: data.installmentCount != null ? String(data.installmentCount) : "2",
          installmentsPaid: data.installmentsPaid != null ? String(data.installmentsPaid) : "0",
          notes: data.notes || "",
        });
      })
      .catch(() => {
        if (!cancelled) {
          toast({ kind: "error", title: "Falha ao carregar pagamento" });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [task.id, showCard, toast]);

  if (!showCard) return null;

  const handleMethodChange = (paymentMethod) => {
    setForm((cur) => ({
      ...cur,
      paymentMethod,
      iban: IBAN_METHODS.has(paymentMethod) && !cur.iban
        ? defaultPaymentIban()
        : cur.iban,
    }));
  };

  const handleSave = async () => {
    const amount = Number(String(form.amount).replace(",", "."));
    if (form.settlementStatus !== "pending") {
      if (!form.paymentMethod) {
        toast({ kind: "error", title: "Selecione o método de pagamento" });
        return;
      }
      if (!Number.isFinite(amount) || amount < 0) {
        toast({ kind: "error", title: "Informe um valor válido" });
        return;
      }
      if (showIban && !form.iban.trim()) {
        toast({ kind: "error", title: "Informe o IBAN" });
        return;
      }
      if (form.isInstallment) {
        const installmentCount = Number(form.installmentCount);
        const installmentsPaid = Number(form.installmentsPaid);
        if (!Number.isFinite(installmentCount) || installmentCount < 2) {
          toast({ kind: "error", title: "Parcelas devem ser no mínimo 2" });
          return;
        }
        if (!Number.isFinite(installmentsPaid) || installmentsPaid < 0 || installmentsPaid > installmentCount) {
          toast({ kind: "error", title: "Parcelas pagas inválidas" });
          return;
        }
      }
    }

    setSaving(true);
    try {
      const body = {
        settlementStatus: form.settlementStatus,
        notes: form.notes.trim() || undefined,
      };
      if (form.settlementStatus !== "pending") {
        body.paymentMethod = form.paymentMethod;
        body.amount = amount;
        if (showIban) body.iban = form.iban.trim();
        if (form.settlementStatus === "paid") {
          body.isInstallment = form.isInstallment;
          if (form.isInstallment) {
            body.installmentCount = Number(form.installmentCount);
            body.installmentsPaid = Number(form.installmentsPaid);
          }
        }
      } else if (form.amount !== "") {
        body.amount = amount;
      }

      const saved = await saveTaskPayment(task.id, body);
      setPaymentStatus(saved.paymentStatus);
      toast({ kind: "success", title: "Pagamento guardado" });
      onSaved?.(saved);
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Falha ao guardar pagamento",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <h3><Icon.CreditCard size={18}/> Pagamento na retirada</h3>
        <span className="tag" style={{ color: statusBadgeTone, borderColor: `${statusBadgeTone}55` }}>
          {paymentStatus === "completed"
            ? "Concluído"
            : paymentStatus === "installmentsOpen"
              ? "Parcelas em aberto"
              : "Pendente"}
        </span>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="muted small">A carregar…</div>
        ) : (
          <div className="col" style={{ gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Estado">
                <Select
                  value={form.settlementStatus}
                  disabled={!canEdit}
                  onChange={(e) => setForm((cur) => ({
                    ...cur,
                    settlementStatus: e.target.value,
                    isInstallment: e.target.value === "paid" ? cur.isInstallment : false,
                  }))}
                >
                  {SETTLEMENT_STATUSES.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Valor (€)">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.amount}
                  disabled={!canEdit}
                  onChange={(e) => setForm((cur) => ({ ...cur, amount: e.target.value }))}
                />
              </Field>
            </div>

            {form.settlementStatus !== "pending" ? (
              <>
                <Field label="Método de pagamento">
                  <Select
                    value={form.paymentMethod}
                    disabled={!canEdit}
                    onChange={(e) => handleMethodChange(e.target.value)}
                  >
                    <option value="">—</option>
                    {PAYMENT_METHODS.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </Select>
                </Field>

                {showIban ? (
                  <Field label="IBAN">
                    <Input
                      value={form.iban}
                      disabled={!canEdit}
                      onChange={(e) => setForm((cur) => ({ ...cur, iban: e.target.value }))}
                      placeholder="PT50 0000 0000 0000 0000 0000 0"
                    />
                  </Field>
                ) : null}

                {form.settlementStatus === "paid" ? (
                  <label className="row" style={{ gap: 8, fontSize: 12.5 }}>
                    <input
                      type="checkbox"
                      checked={form.isInstallment}
                      disabled={!canEdit}
                      onChange={(e) => setForm((cur) => ({ ...cur, isInstallment: e.target.checked }))}
                    />
                    Pagamento parcelado
                  </label>
                ) : null}

                {showInstallments ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="N.º de parcelas">
                      <Input
                        type="number"
                        min={2}
                        value={form.installmentCount}
                        disabled={!canEdit}
                        onChange={(e) => setForm((cur) => ({ ...cur, installmentCount: e.target.value }))}
                      />
                    </Field>
                    <Field label="Parcelas pagas">
                      <Input
                        type="number"
                        min={0}
                        value={form.installmentsPaid}
                        disabled={!canEdit}
                        onChange={(e) => setForm((cur) => ({ ...cur, installmentsPaid: e.target.value }))}
                      />
                    </Field>
                  </div>
                ) : null}
              </>
            ) : null}

            <Field label="Notas">
              <Input
                value={form.notes}
                disabled={!canEdit}
                onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))}
                placeholder="Opcional"
              />
            </Field>

            {form.amount !== "" ? (
              <div className="muted small">
                Total registado: <span className="mono" style={{ color: "var(--gold)" }}>{formatEUR(Number(form.amount) || 0)}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
      {canEdit && !loading ? (
        <div className="card-foot">
          <Button size="sm" icon={Icon.Check} disabled={saving} onClick={handleSave}>
            {saving ? "A guardar…" : "Guardar pagamento"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
