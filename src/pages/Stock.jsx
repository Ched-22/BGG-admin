import React, { useMemo, useState } from "react";
import { Button, Icon, Field, Input, Modal, Select, StatusBadge } from "../components/ui";
import { needsRestock, stockLevelRatio, suggestedOrderQty, stockStatusKey, STOCK_LOW_THRESHOLD, STOCK_WARN_THRESHOLD } from "../lib/stock";

const UNIDADES = ["L", "un", "pct", "rolo", "cx", "kit"];
const CATEGORIAS_PADRAO = ["Químicos", "Acessórios", "Películas", "Ferramentas"];

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

function StockPage({ inventory, onUpdateQty, onAddProduct }) {
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    sku: "",
    categoria: "Químicos",
    unidade: "un",
    quantidadeAtual: "",
    capacidadeMaxima: "",
    fornecedor: "",
  });
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
    });
    setFormErr({});
    setShowCreate(true);
  };

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const submitCreate = () => {
    const err = {};
    if (!form.nome.trim()) err.nome = "Informe o nome do produto";
    if (!form.sku.trim()) err.sku = "Informe o SKU";
    else if (inventory.some((p) => p.sku.toLowerCase() === form.sku.trim().toLowerCase())) {
      err.sku = "Já existe um produto com este SKU";
    }
    const qa = parseFloat(String(form.quantidadeAtual).replace(",", "."), 10);
    const cap = parseFloat(String(form.capacidadeMaxima).replace(",", "."), 10);
    if (Number.isNaN(qa) || qa < 0) err.quantidadeAtual = "Quantidade inválida";
    if (Number.isNaN(cap) || cap <= 0) err.capacidadeMaxima = "Capacidade deve ser maior que zero";
    if (Object.keys(err).length) {
      setFormErr(err);
      return;
    }
    onAddProduct({
      nome: form.nome.trim(),
      sku: form.sku.trim().toUpperCase(),
      categoria: form.categoria,
      unidade: form.unidade,
      quantidadeAtual: qa,
      capacidadeMaxima: cap,
      fornecedor: form.fornecedor.trim() || "—",
    });
    setShowCreate(false);
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
        if (!p.nome.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
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
          <Button variant="secondary" icon={Icon.Download}>Exportar</Button>
          <Button icon={Icon.Plus} onClick={openCreate}>Cadastrar produto</Button>
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
              <th>Fornecedor</th>
              <th style={{ width: 120 }}>Status</th>
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
            <Button icon={Icon.Package} onClick={submitCreate}>Salvar produto</Button>
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
        </div>
      </Modal>
    </div>
  );
}

export { StockPage, StockLevelBar };
