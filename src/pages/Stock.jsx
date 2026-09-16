import React, { useMemo, useState } from "react";
import { Button, Icon, PageRefreshButton, Field, Input, Modal, Select, StatusBadge, Textarea, useConfirm } from "../components/ui";
import { ExportMenu } from "../components/ExportMenu";
import { STOCK_EXPORT_COLUMNS } from "../lib/exportColumns";
import { getInventoryHistory } from "../lib/inventoryApi";
import { needsRestock, stockLevelRatio, suggestedOrderQty, stockStatusKey, STOCK_LOW_THRESHOLD, STOCK_WARN_THRESHOLD } from "../lib/stock";

const UNIDADES = ["L", "un", "pct", "rolo", "cx", "kit"];
const CATEGORIAS_PADRAO = ["Químicos", "Acessórios", "Películas", "Ferramentas"];
const HISTORY_PAGE_SIZE = 50;

function formatHistoryWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function movementTone(type) {
  if (type === "ADJUSTMENT_IN" || type === "CREATED") return "success";
  if (type === "ADJUSTMENT_OUT") return "warn";
  if (type === "DEACTIVATED") return "muted";
  return "neutral";
}

function formatDelta(delta) {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return String(delta);
  return "0";
}

function StockLevelBar({ ratio }) {
  const pct = Math.min(100, Math.round(ratio * 100));
  const low = ratio < STOCK_LOW_THRESHOLD;
  const warn = ratio >= STOCK_LOW_THRESHOLD && ratio < STOCK_WARN_THRESHOLD;
  return (
    <div className="stock-level-wrap">
      <div className="stock-level-track">
        <div
          className={`stock-level-fill ${low ? "low" : warn ? "warn" : "ok"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="stock-level-pct mono">{pct}%</span>
    </div>
  );
}

function StockPage({ readOnly = false, inventory = [], onUpdateQty, onUpdateProduct, onAddProduct, onDeleteProduct, onRefresh }) {
  const [confirm, ConfirmEl] = useConfirm();
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [showCreate, setShowCreate] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    sku: "",
    categoria: "Químicos",
    unidade: "un",
    quantidadeAtual: "",
    capacidadeMaxima: "",
    fornecedor: "",
    custoUnitario: "",
  });
  const [adjustForm, setAdjustForm] = useState({ quantidadeAtual: "", custoUnitario: "", adjustmentNote: "" });
  const [formErr, setFormErr] = useState({});

  const categoriasModal = useMemo(() => {
    const s = new Set([...CATEGORIAS_PADRAO, ...inventory.map((p) => p.categoria)]);
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [inventory]);

  const openCreate = () => {
    setForm({
      nome: "",
      sku: "",
      categoria: "Químicos",
      unidade: "un",
      quantidadeAtual: "",
      capacidadeMaxima: "",
      fornecedor: "",
      custoUnitario: "",
    });
    setFormErr({});
    setShowCreate(true);
  };

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const submitCreate = async () => {
    const err = {};
    if (!form.nome.trim()) err.nome = "Informe o nome do produto";
    if (!form.sku.trim()) err.sku = "Informe o SKU";
    else if (inventory.some((p) => p.sku.toLowerCase() === form.sku.trim().toLowerCase())) {
      err.sku = "Já existe um produto com este SKU";
    }
    const qa = parseInt(String(form.quantidadeAtual).replace(",", "."), 10);
    const cap = parseInt(String(form.capacidadeMaxima).replace(",", "."), 10);
    if (Number.isNaN(qa) || qa < 0) err.quantidadeAtual = "Quantidade inválida";
    if (Number.isNaN(cap) || cap <= 0) err.capacidadeMaxima = "Capacidade deve ser maior que zero";
    const unitCost = parseFloat(String(form.custoUnitario).replace(",", "."));
    if (form.custoUnitario !== "" && (Number.isNaN(unitCost) || unitCost < 0)) {
      err.custoUnitario = "Custo unitário inválido";
    }
    if (Object.keys(err).length) {
      setFormErr(err);
      return;
    }
    setSaving(true);
    try {
      await onAddProduct({
        nome: form.nome.trim(),
        sku: form.sku.trim().toUpperCase(),
        categoria: form.categoria,
        unidade: form.unidade,
        quantidadeAtual: qa,
        capacidadeMaxima: cap,
        fornecedor: form.fornecedor.trim() || "—",
        ...(form.custoUnitario !== "" ? { custoUnitario: unitCost } : {}),
      });
      setShowCreate(false);
    } catch {
      // toast handled in App
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (product) => {
    const ok = await confirm({
      title: "Remover produto?",
      body: `Desativar "${product.nome}" (${product.sku}) do estoque?`,
      ok: "Remover",
      danger: true,
      cancel: "Cancelar",
    });
    if (!ok) return;
    await onDeleteProduct(product.id);
  };

  const openAdjust = (product) => {
    setAdjustProduct(product);
    setAdjustForm({
      quantidadeAtual: String(product.quantidadeAtual),
      custoUnitario: String(product.custoUnitario ?? 0),
      adjustmentNote: "",
    });
    setShowAdjust(true);
  };

  const loadHistoryPage = async (product, offset = 0, append = false) => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const result = await getInventoryHistory(product.id, {
        limit: HISTORY_PAGE_SIZE,
        offset,
      });
      setHistoryRows((cur) => (append ? [...cur, ...result.data] : result.data));
      setHistoryTotal(result.total);
      setHistoryOffset(offset + result.data.length);
    } catch {
      setHistoryError("Não foi possível carregar o histórico.");
      if (!append) setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = async (product) => {
    setHistoryProduct(product);
    setHistoryRows([]);
    setHistoryTotal(0);
    setHistoryOffset(0);
    setShowHistory(true);
    await loadHistoryPage(product, 0, false);
  };

  const loadMoreHistory = async () => {
    if (!historyProduct || historyLoading) return;
    await loadHistoryPage(historyProduct, historyOffset, true);
  };

  const submitAdjust = async () => {
    if (!adjustProduct || !onUpdateProduct) return;
    const qa = parseInt(String(adjustForm.quantidadeAtual).replace(",", "."), 10);
    const unitCost = parseFloat(String(adjustForm.custoUnitario).replace(",", "."));
    if (Number.isNaN(qa) || qa < 0) return;
    if (Number.isNaN(unitCost) || unitCost < 0) return;
    setSaving(true);
    try {
      await onUpdateProduct(adjustProduct.id, {
        quantidadeAtual: qa,
        custoUnitario: unitCost,
        ...(adjustForm.adjustmentNote.trim()
          ? { adjustmentNote: adjustForm.adjustmentNote.trim() }
          : {}),
      });
      setShowAdjust(false);
      setAdjustProduct(null);
    } catch {
      /* toast in App */
    } finally {
      setSaving(false);
    }
  };

  const categorias = useMemo(() => {
    const s = new Set(inventory.map((p) => p.categoria));
    return ["Todos", ...Array.from(s).sort()];
  }, [inventory]);

  const statusCounts = useMemo(() => {
    const c = { comprar: 0, atencao: 0, ok: 0 };
    for (const p of inventory) {
      c[stockStatusKey(p)] += 1;
    }
    return c;
  }, [inventory]);

  const filtered = useMemo(() => {
    return inventory.filter((p) => {
      if (categoria !== "Todos" && p.categoria !== categoria) return false;
      if (status !== "Todos") {
        const key = stockStatusKey(p);
        if (status === "Comprar" && key !== "comprar") return false;
        if (status === "Atenção" && key !== "atencao") return false;
        if (status === "OK" && key !== "ok") return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const nome = (p.nome || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        if (!nome.includes(q) && !sku.includes(q)) return false;
      }
      return true;
    });
  }, [inventory, categoria, status, search]);

  const urgentes = useMemo(() => inventory.filter(needsRestock), [inventory]);
  const totalSku = inventory.length;
  const valorMedio = urgentes.length;

  return (
    <div className="page">
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow-sm">Gestão · Almoxarifado</span>
          <h2 className="page-title">Estoque</h2>
          <div className="page-sub">
            {totalSku} itens cadastrados · {valorMedio} abaixo de 20% da capacidade (compra urgente)
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <PageRefreshButton onClick={handleRefresh} loading={refreshing}/>
          <ExportMenu
            filenameBase="estoque"
            sheetName="Estoque"
            columns={STOCK_EXPORT_COLUMNS}
            rows={filtered}
          />
          {!readOnly ? (
            <Button icon={Icon.Plus} onClick={openCreate}>Cadastrar produto</Button>
          ) : null}
        </div>
      </div>

      <div className="dash-grid" style={{ marginBottom: 22 }}>
        <div className="col-4">
          <div className="kpi tall">
            <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Compra urgente</span>
            <div className="stat">
              <div className="num" style={{ color: urgentes.length ? "var(--destructive)" : "var(--gold)" }}>{urgentes.length}</div>
              <div className="delta">{urgentes.length ? "Abaixo de 20% do teto" : "Nenhum item crítico"}</div>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="kpi tall">
            <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Itens monitorados</span>
            <div className="stat">
              <div className="num">{totalSku}</div>
              <div className="delta">SKUs ativos</div>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="kpi tall">
            <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Referência</span>
            <div className="stat">
              <div className="num" style={{ fontSize: 22 }}>20%</div>
              <div className="delta">Nível mínimo antes de sugerir compra</div>
            </div>
          </div>
        </div>
      </div>

      <div className="entity-toolbar">
        <div className="searchbar" style={{ width: 280, background: "var(--bg)", border: "1px solid var(--border)" }}>
          <Icon.Search size={14}/>
          <input
            placeholder="Buscar por nome ou SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="select-wrap" style={{ minWidth: 200 }}>
          <select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {categorias.map((c) => (
              <option key={c} value={c}>{c === "Todos" ? "Categoria: Todos" : c}</option>
            ))}
          </select>
        </div>
        <div className="select-wrap" style={{ minWidth: 200 }}>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Todos">Status: Todos ({inventory.length})</option>
            <option value="Comprar">Comprar ({statusCounts.comprar})</option>
            <option value="Atenção">Atenção ({statusCounts.atencao})</option>
            <option value="OK">OK ({statusCounts.ok})</option>
          </select>
        </div>
        <div style={{ flex: 1 }}/>
      </div>

      <div className="tbl-wrap" style={{ marginTop: 14 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Produto</th>
              <th>Categoria</th>
              <th style={{ width: 200 }}>Nível</th>
              <th style={{ textAlign: "right" }}>Atual</th>
              <th style={{ textAlign: "right" }}>Capacidade</th>
              <th style={{ textAlign: "right" }}>Custo un.</th>
              <th>Fornecedor</th>
              <th style={{ width: 120 }}>Status</th>
              <th style={{ width: 96 }}/>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const ratio = stockLevelRatio(p);
              const low = needsRestock(p);
              const key = stockStatusKey(p);
              return (
                <tr key={p.id}>
                  <td className="id mono">{p.sku}</td>
                  <td>
                    <div style={{ color: "var(--fg)", fontWeight: 500 }}>{p.nome}</div>
                    <div className="muted small mono">{p.id}</div>
                  </td>
                  <td className="muted small">{p.categoria}</td>
                  <td><StockLevelBar ratio={ratio}/></td>
                  <td style={{ textAlign: "right" }} className="mono">{p.quantidadeAtual} {p.unidade}</td>
                  <td style={{ textAlign: "right" }} className="muted small">{p.capacidadeMaxima} {p.unidade}</td>
                  <td style={{ textAlign: "right" }} className="mono muted small">€ {Number(p.custoUnitario || 0).toFixed(2)}</td>
                  <td className="muted small">{p.fornecedor}</td>
                  <td>
                    {low ? (
                      <StatusBadge tone="danger">Comprar</StatusBadge>
                    ) : key === "atencao" ? (
                      <StatusBadge tone="warn">Atenção</StatusBadge>
                    ) : (
                      <StatusBadge tone="success">OK</StatusBadge>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {!readOnly ? (
                      <div className="row" style={{ gap: 4, justifyContent: "flex-end" }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openHistory(p)}
                          title="Ver histórico"
                        >
                          Histórico
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openAdjust(p)}
                          title="Ajustar stock"
                        >
                          Ajustar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Icon.Trash}
                          onClick={() => handleDelete(p)}
                          title="Remover produto"
                        />
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--fg-5)" }}>Nenhum item encontrado.</div>
        ) : null}
      </div>

      {urgentes.length ? (
        <div className="card" style={{ marginTop: 22 }}>
          <div className="card-head">
            <h3><Icon.AlertTriangle size={18}/> Sugestão de pedido (críticos)</h3>
          </div>
          <div className="card-body">
            <div className="muted small" style={{ marginBottom: 12 }}>
              Itens com estoque abaixo de 20% da capacidade máxima. Quantidades sugeridas para aproximar 60% do teto (simulação).
            </div>
            <div className="tbl-wrap" style={{ border: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Produto</th>
                    <th style={{ textAlign: "right" }}>Sugerido</th>
                    <th style={{ width: 140 }}/>
                  </tr>
                </thead>
                <tbody>
                  {urgentes.map((p) => (
                    <tr key={p.id}>
                      <td className="id mono">{p.sku}</td>
                      <td>{p.nome}</td>
                      <td style={{ textAlign: "right" }} className="mono">
                        +{suggestedOrderQty(p)} {p.unidade}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {!readOnly ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              const add = suggestedOrderQty(p);
                              if (add <= 0) return;
                              onUpdateQty(p.id, Math.min(p.capacidadeMaxima, p.quantidadeAtual + add));
                            }}
                          >
                            Simular entrada
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Cadastrar produto"
        sub="Novo item no almoxarifado — capacidade máxima define o teto para alertas de 20%"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button icon={Icon.Package} onClick={submitCreate} disabled={saving}>
              {saving ? "Salvando…" : "Salvar produto"}
            </Button>
          </>
        }
      >
        <div className="col" style={{ gap: 14 }}>
          <Field label="Nome do produto" error={formErr.nome}>
            <Input value={form.nome} onChange={(e) => setField("nome", e.target.value)} placeholder="Ex: Shampoo neutro 5L" err={!!formErr.nome}/>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="SKU" error={formErr.sku}>
              <Input value={form.sku} onChange={(e) => setField("sku", e.target.value)} placeholder="Ex: QUI-100" err={!!formErr.sku}/>
            </Field>
            <Field label="Fornecedor" optional>
              <Input value={form.fornecedor} onChange={(e) => setField("fornecedor", e.target.value)} placeholder="Nome do fornecedor"/>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Categoria">
              <Select value={form.categoria} onChange={(e) => setField("categoria", e.target.value)}>
                {categoriasModal.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Unidade">
              <Select value={form.unidade} onChange={(e) => setField("unidade", e.target.value)}>
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Quantidade atual" error={formErr.quantidadeAtual}>
              <Input type="number" min={0} step="any" value={form.quantidadeAtual} onChange={(e) => setField("quantidadeAtual", e.target.value)} placeholder="0" err={!!formErr.quantidadeAtual}/>
            </Field>
            <Field label="Capacidade máxima (depósito)" error={formErr.capacidadeMaxima} hint="Usada para calcular % e alerta de 20%">
              <Input type="number" min={1} step="any" value={form.capacidadeMaxima} onChange={(e) => setField("capacidadeMaxima", e.target.value)} placeholder="Ex: 40" err={!!formErr.capacidadeMaxima}/>
            </Field>
          </div>
          <Field label="Custo unitário (€)" optional error={formErr.custoUnitario} hint="Usado no financeiro quando reduzir quantidade">
            <Input type="number" min={0} step="0.01" value={form.custoUnitario} onChange={(e) => setField("custoUnitario", e.target.value)} placeholder="0.00" err={!!formErr.custoUnitario}/>
          </Field>
        </div>
      </Modal>

      <Modal
        open={showAdjust}
        onClose={() => setShowAdjust(false)}
        title="Ajustar stock"
        sub={adjustProduct ? `${adjustProduct.nome} (${adjustProduct.sku})` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAdjust(false)}>Cancelar</Button>
            <Button onClick={submitAdjust} disabled={saving}>
              {saving ? "Salvando…" : "Aplicar"}
            </Button>
          </>
        }
      >
        <div className="col" style={{ gap: 14 }}>
          <Field label="Quantidade atual" hint="Reduzir gera custo de produto no Financeiro">
            <Input
              type="number"
              min={0}
              value={adjustForm.quantidadeAtual}
              onChange={(e) => setAdjustForm((f) => ({ ...f, quantidadeAtual: e.target.value }))}
            />
          </Field>
          <Field label="Custo unitário (€)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={adjustForm.custoUnitario}
              onChange={(e) => setAdjustForm((f) => ({ ...f, custoUnitario: e.target.value }))}
            />
          </Field>
          <Field label="Motivo / nota" optional hint="Opcional — aparece no histórico do produto">
            <Textarea
              rows={2}
              value={adjustForm.adjustmentNote}
              onChange={(e) => setAdjustForm((f) => ({ ...f, adjustmentNote: e.target.value }))}
              placeholder="Ex.: Compra fornecedor, uso em serviço…"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        title="Histórico de stock"
        sub={historyProduct ? `${historyProduct.nome} (${historyProduct.sku})` : ""}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowHistory(false)}>Fechar</Button>
            {historyOffset < historyTotal ? (
              <Button variant="secondary" onClick={loadMoreHistory} disabled={historyLoading}>
                {historyLoading ? "Carregando…" : "Carregar mais"}
              </Button>
            ) : null}
          </>
        }
      >
        <div className="stock-history-wrap">
          {historyError ? (
            <div className="muted small" style={{ padding: "12px 0" }}>{historyError}</div>
          ) : null}
          {historyLoading && historyRows.length === 0 ? (
            <div className="muted small" style={{ padding: "24px 0", textAlign: "center" }}>Carregando histórico…</div>
          ) : null}
          {!historyLoading && !historyError && historyRows.length === 0 ? (
            <div className="muted small" style={{ padding: "24px 0", textAlign: "center" }}>Nenhuma movimentação registrada.</div>
          ) : null}
          {historyRows.length > 0 ? (
            <div className="tbl-wrap stock-history-table">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th style={{ textAlign: "right" }}>Delta</th>
                    <th style={{ textAlign: "right" }}>Antes → Depois</th>
                    <th style={{ textAlign: "right" }}>Custo unit.</th>
                    <th>Autor</th>
                    <th>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row) => (
                    <tr key={row.id}>
                      <td className="mono small">{formatHistoryWhen(row.occurredAt)}</td>
                      <td>
                        <StatusBadge tone={movementTone(row.type)}>{row.label}</StatusBadge>
                      </td>
                      <td style={{ textAlign: "right" }} className="mono">
                        {formatDelta(row.quantityDelta)}
                      </td>
                      <td style={{ textAlign: "right" }} className="mono muted small">
                        {row.quantityBefore} → {row.quantityAfter}
                      </td>
                      <td style={{ textAlign: "right" }} className="mono muted small">
                        € {Number(row.unitCostSnapshot || 0).toFixed(2)}
                      </td>
                      <td className="small">{row.actorName}</td>
                      <td className="muted small">{row.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {historyRows.length > 0 ? (
            <div className="muted small" style={{ marginTop: 10 }}>
              {historyRows.length} de {historyTotal} registro{historyTotal === 1 ? "" : "s"}
            </div>
          ) : null}
        </div>
      </Modal>
      {ConfirmEl}
    </div>
  );
}

export { StockPage, StockLevelBar };
