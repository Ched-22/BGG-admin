import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Field,
  Icon,
  Input,
  Modal,
  PageRefreshButton,
  Select,
  formatEUR,
  useConfirm,
  useToast,
} from "../components/ui";
import {
  EXPENSE_CATEGORIES,
  createFinanceExpense,
  deleteFinanceExpense,
  fetchFinanceSummary,
  listEmployeeCosts,
  listFinanceExpenses,
  upsertEmployeeCost,
} from "../lib/financeApi";

const PRESETS = [
  { id: "month", label: "Mês atual" },
  { id: "quarter", label: "Trimestre" },
  { id: "year", label: "Ano" },
];

function KpiCard({ label, value, tone = "gold", hint }) {
  const color =
    tone === "positive"
      ? "var(--success)"
      : tone === "negative"
        ? "var(--destructive)"
        : "var(--gold)";
  return (
    <div className="kpi tall">
      <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>
        {label}
      </span>
      <div className="stat">
        <div className="num" style={{ color }}>{value}</div>
        {hint ? <div className="delta">{hint}</div> : null}
      </div>
    </div>
  );
}

function profitTone(value) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "gold";
}

const emptyExpenseForm = () => ({
  label: "",
  category: "fixed",
  amount: "",
  occurredAt: new Date().toISOString().slice(0, 10),
  notes: "",
});

export function FinancePage() {
  const toast = useToast();
  const [confirm, ConfirmEl] = useConfirm();
  const [preset, setPreset] = useState("month");
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [employeeCosts, setEmployeeCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [savingExpense, setSavingExpense] = useState(false);
  const [editingCostId, setEditingCostId] = useState(null);
  const [costDraft, setCostDraft] = useState("");

  const loadAll = useCallback(async () => {
    const [summaryData, expenseRows, costRows] = await Promise.all([
      fetchFinanceSummary({ preset }),
      listFinanceExpenses(),
      listEmployeeCosts(),
    ]);
    setSummary(summaryData);
    setExpenses(expenseRows);
    setEmployeeCosts(costRows);
  }, [preset]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadAll()
      .catch(() => {
        if (!cancelled) {
          toast({ kind: "error", title: "Falha ao carregar financeiro", desc: "Tente novamente." });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadAll, toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const breakdownRows = useMemo(() => {
    if (!summary?.breakdown) return [];
    return EXPENSE_CATEGORIES.map((cat) => ({
      ...cat,
      amount: summary.breakdown[cat.id] ?? 0,
    }));
  }, [summary]);

  const submitExpense = async () => {
    const amount = Number(String(expenseForm.amount).replace(",", "."));
    if (!expenseForm.label.trim()) {
      toast({ kind: "error", title: "Informe o nome da despesa" });
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      toast({ kind: "error", title: "Valor inválido" });
      return;
    }
    setSavingExpense(true);
    try {
      const created = await createFinanceExpense({
        label: expenseForm.label.trim(),
        category: expenseForm.category,
        amount,
        occurredAt: expenseForm.occurredAt,
        notes: expenseForm.notes.trim() || undefined,
      });
      setExpenses((cur) => [created, ...cur]);
      setShowExpenseModal(false);
      setExpenseForm(emptyExpenseForm());
      await loadAll();
      toast({ kind: "success", title: "Despesa registada" });
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Falha ao guardar despesa",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Tente novamente.",
      });
    } finally {
      setSavingExpense(false);
    }
  };

  const removeExpense = async (expense) => {
    const ok = await confirm({
      title: "Remover despesa?",
      body: `"${expense.label}" — ${formatEUR(expense.amount)}`,
      ok: "Remover",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteFinanceExpense(expense.id);
      setExpenses((cur) => cur.filter((row) => row.id !== expense.id));
      await loadAll();
      toast({ kind: "success", title: "Despesa removida" });
    } catch {
      toast({ kind: "error", title: "Falha ao remover despesa" });
    }
  };

  const saveEmployeeCost = async (row) => {
    const monthlyCost = Number(String(costDraft).replace(",", "."));
    if (!Number.isFinite(monthlyCost) || monthlyCost < 0) {
      toast({ kind: "error", title: "Custo mensal inválido" });
      return;
    }
    try {
      const updated = await upsertEmployeeCost(row.userId, { monthlyCost });
      setEmployeeCosts((cur) => cur.map((r) => (r.userId === updated.userId ? updated : r)));
      setEditingCostId(null);
      await loadAll();
      toast({ kind: "success", title: "Custo atualizado", desc: row.userName });
    } catch {
      toast({ kind: "error", title: "Falha ao guardar custo" });
    }
  };

  const periodLabel = summary
    ? `${summary.periodStart} — ${summary.periodEnd}`
    : "—";

  return (
    <div className="page">
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow-sm">Gestão · Financeiro</span>
          <h2 className="page-title">Financeiro</h2>
          <div className="page-sub">
            Período: {periodLabel} · Custo de produtos atualiza ao reduzir stock no Estoque
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <div className="select-wrap" style={{ minWidth: 160 }}>
            <select className="select" value={preset} onChange={(e) => setPreset(e.target.value)}>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <PageRefreshButton onClick={handleRefresh} loading={refreshing}/>
          <Button icon={Icon.Plus} onClick={() => setShowExpenseModal(true)}>Nova despesa</Button>
        </div>
      </div>

      {loading && !summary ? (
        <div className="muted" style={{ padding: 40, textAlign: "center" }}>A carregar…</div>
      ) : summary ? (
        <>
          <div className="dash-grid" style={{ marginBottom: 22 }}>
            <div className="col-3"><KpiCard label="Receita total" value={formatEUR(summary.totalRevenue)} hint={`${summary.completedServicesCount} serviços concluídos`} /></div>
            <div className="col-3"><KpiCard label="Receita média" value={formatEUR(summary.averageRevenue)} hint="Por serviço concluído" /></div>
            <div className="col-3"><KpiCard label="Custo produtos" value={formatEUR(summary.productCosts)} hint="Consumo de stock" tone="negative" /></div>
            <div className="col-3"><KpiCard label="Custo funcionários" value={formatEUR(summary.employeeCosts)} hint="Técnicos (rateado)" tone="negative" /></div>
            <div className="col-3"><KpiCard label="Despesas contas" value={formatEUR(summary.accountExpenses)} tone="negative" /></div>
            <div className="col-3"><KpiCard label="Lucro bruto" value={formatEUR(summary.grossProfit)} tone={profitTone(summary.grossProfit)} /></div>
            <div className="col-3"><KpiCard label="Lucro líquido" value={formatEUR(summary.netProfit)} tone={profitTone(summary.netProfit)} /></div>
          </div>

          <div className="card" style={{ marginBottom: 22 }}>
            <div className="card-head">
              <h3><Icon.CreditCard size={18}/> Despesas por categoria</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      <td style={{ textAlign: "right" }} className="mono">{formatEUR(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 22 }}>
            <div className="card-head">
              <h3><Icon.FileText size={18}/> Despesas registadas</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th style={{ textAlign: "right" }}>Valor</th>
                    <th style={{ width: 56 }}/>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="mono muted small">{exp.occurredAt}</td>
                      <td>{exp.label}</td>
                      <td className="muted small">{EXPENSE_CATEGORIES.find((c) => c.id === exp.category)?.label ?? exp.category}</td>
                      <td style={{ textAlign: "right" }} className="mono">{formatEUR(exp.amount)}</td>
                      <td style={{ textAlign: "right" }}>
                        <Button size="sm" variant="ghost" icon={Icon.Trash} onClick={() => removeExpense(exp)} title="Remover"/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expenses.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--fg-5)" }}>Nenhuma despesa registada.</div>
              ) : null}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3><Icon.Briefcase size={18}/> Custos de funcionários (técnicos)</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Técnico</th>
                    <th style={{ textAlign: "right" }}>Custo mensal (€)</th>
                    <th style={{ width: 120 }}/>
                  </tr>
                </thead>
                <tbody>
                  {employeeCosts.map((row) => (
                    <tr key={row.userId}>
                      <td>{row.userName}</td>
                      <td style={{ textAlign: "right" }}>
                        {editingCostId === row.userId ? (
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={costDraft}
                            onChange={(e) => setCostDraft(e.target.value)}
                            style={{ maxWidth: 140, marginLeft: "auto" }}
                          />
                        ) : (
                          <span className="mono">{formatEUR(row.monthlyCost)}</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {editingCostId === row.userId ? (
                          <Button size="sm" onClick={() => saveEmployeeCost(row)}>Guardar</Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingCostId(row.userId);
                              setCostDraft(String(row.monthlyCost));
                            }}
                          >
                            Editar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {employeeCosts.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--fg-5)" }}>Nenhum técnico ativo.</div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      <Modal
        open={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="Nova despesa"
        sub="Registo manual — aluguer, utilities, fornecedores, etc."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowExpenseModal(false)}>Cancelar</Button>
            <Button icon={Icon.Plus} onClick={submitExpense} disabled={savingExpense}>
              {savingExpense ? "A guardar…" : "Guardar"}
            </Button>
          </>
        }
      >
        <div className="col" style={{ gap: 14 }}>
          <Field label="Descrição">
            <Input value={expenseForm.label} onChange={(e) => setExpenseForm((f) => ({ ...f, label: e.target.value }))} placeholder="Ex: Aluguer"/>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Categoria">
              <Select value={expenseForm.category} onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Data">
              <Input type="date" value={expenseForm.occurredAt} onChange={(e) => setExpenseForm((f) => ({ ...f, occurredAt: e.target.value }))}/>
            </Field>
          </div>
          <Field label="Valor (€)">
            <Input type="number" min={0} step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}/>
          </Field>
          <Field label="Notas" optional>
            <Input value={expenseForm.notes} onChange={(e) => setExpenseForm((f) => ({ ...f, notes: e.target.value }))}/>
          </Field>
        </div>
      </Modal>
      {ConfirmEl}
    </div>
  );
}
