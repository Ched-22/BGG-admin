import React, { useState } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, Field, Input, Select, Textarea, Modal, fmtBRL, StatusBadge } from "../components/ui";

function CustomersPage({ onOpenTask }) {
  const all = BGG_DATA.customers;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [view, setView] = useState("table"); // table | cards
  const [detail, setDetail] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = all.filter(c => {
    if (status !== "Todos" && c.status !== status) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.name.toLowerCase().includes(s) && !c.email.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const totals = {
    ativos: all.filter(c => c.status === "Ativo").length,
    vip: all.filter(c => c.status === "VIP").length,
    inativos: all.filter(c => c.status === "Inativo").length,
    receita: all.reduce((s, c) => s + c.totalGasto, 0),
  };

  return (
    <>
      <div className="page">
        <div className="page-head">
          <div className="titles">
            <span className="eyebrow-sm">Gestão</span>
            <h2 className="page-title">Clientes</h2>
            <div className="page-sub">{all.length} clientes cadastrados · {totals.vip} VIPs · LTV total {fmtBRL(totals.receita)}</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Button variant="secondary" icon={Icon.Download}>Exportar</Button>
            <Button icon={Icon.Plus} onClick={() => setShowNew(true)}>Novo cliente</Button>
          </div>
        </div>

        {/* KPI row */}
        <div className="dash-grid" style={{ marginBottom: 22 }}>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Clientes ativos</span>
              <div className="stat">
                <div className="num">{totals.ativos}</div>
                <div className="delta up">+3 este mês</div>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Clientes VIP</span>
              <div className="stat">
                <div className="num">{totals.vip}</div>
                <div className="delta">Receita acima de R$ 20k</div>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Receita total (LTV)</span>
              <div className="stat">
                <div className="num" style={{ fontSize: 30 }}>{fmtBRL(totals.receita).replace("R$ ", "R$ ")}</div>
                <div className="delta">Histórico completo</div>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Ticket médio</span>
              <div className="stat">
                <div className="num">{fmtBRL(totals.receita / all.reduce((s, c) => s + c.tarefas, 0)).replace("R$ ", "R$ ")}</div>
                <div className="delta">Por tarefa</div>
              </div>
            </div>
          </div>
        </div>

        <div className="entity-toolbar">
          <div className="searchbar" style={{ width: 280, background: "var(--bg)", border: "1px solid var(--border)" }}>
            <Icon.Search size={14}/>
            <input
              placeholder="Buscar cliente por nome ou e-mail…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-tabs">
            {["Todos", "Ativo", "VIP", "Inativo"].map(s => (
              <button key={s} className={status === s ? "active" : ""} onClick={() => setStatus(s)}>
                {s}
                <span style={{ marginLeft: 6, color: "var(--fg-6)", fontSize: 10 }}>
                  {s === "Todos" ? all.length : all.filter(c => c.status === s).length}
                </span>
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }}/>
          <div className="view-toggle">
            <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title="Tabela">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="4"/><rect x="3" y="10" width="18" height="4"/><rect x="3" y="16" width="18" height="4"/></svg>
            </button>
            <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")} title="Cards">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
          </div>
        </div>

        {view === "table" ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contato</th>
                  <th>Localização</th>
                  <th style={{ width: 90, textAlign: "right" }}>Tarefas</th>
                  <th style={{ width: 90, textAlign: "right" }}>Ativas</th>
                  <th style={{ width: 140, textAlign: "right" }}>LTV</th>
                  <th style={{ width: 120 }}>Última tarefa</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.name} onClick={() => setDetail(c)}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <div className="avatar" style={{
                          background: c.status === "VIP" ? "var(--gold)" : c.status === "Inativo" ? "var(--bg-elevated)" : "rgba(194,164,109,0.18)",
                          color: c.status === "VIP" ? "var(--gold-on)" : c.status === "Inativo" ? "var(--fg-5)" : "var(--gold)",
                          border: c.status === "VIP" ? "none" : "1px solid var(--gold-30)"
                        }}>{c.name.split(" ").pop().slice(0, 2)}</div>
                        <div>
                          <div style={{ color: "var(--fg)", fontWeight: 500 }}>{c.name}</div>
                          <div className="muted small">Cliente desde {c.since}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>{c.email}</div>
                      <div className="muted small mono">{c.tel}</div>
                    </td>
                    <td className="muted small">{c.endereco.cidade}/{c.endereco.estado}</td>
                    <td className="mono" style={{ textAlign: "right", color: "var(--fg)" }}>{c.tarefas}</td>
                    <td className="mono" style={{ textAlign: "right", color: c.ativas > 0 ? "var(--gold)" : "var(--fg-6)" }}>{c.ativas}</td>
                    <td className="amount" style={{ textAlign: "right", color: "var(--gold)" }}>{fmtBRL(c.totalGasto)}</td>
                    <td className="muted small mono">{c.ultima}</td>
                    <td>
                      <span className={`badge ${c.status === "VIP" ? "gold" : c.status === "Ativo" ? "success" : "muted"}`}>
                        <span className="dot"></span>{c.status}
                      </span>
                    </td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button className="row-action" title="Detalhes" onClick={() => setDetail(c)}><Icon.Eye size={14}/></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: "center", padding: 48, color: "var(--fg-5)" }}>Nenhum cliente encontrado.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="entity-grid">
            {filtered.map(c => (
              <div key={c.name} className="entity-card" onClick={() => setDetail(c)}>
                <div className="head">
                  <div className="avatar" style={{
                    background: c.status === "VIP" ? "var(--gold)" : "rgba(194,164,109,0.18)",
                    color: c.status === "VIP" ? "var(--gold-on)" : "var(--gold)",
                    border: c.status === "VIP" ? "none" : "1px solid var(--gold-30)"
                  }}>{c.name.split(" ").pop().slice(0, 2)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="name">{c.name}</div>
                    <div className="role">{c.status} · Cliente desde {c.since}</div>
                  </div>
                  <span className={`badge ${c.status === "VIP" ? "gold" : c.status === "Ativo" ? "success" : "muted"}`} style={{ fontSize: 9, padding: "2px 6px" }}>
                    <span className="dot"></span>{c.status}
                  </span>
                </div>
                <div className="stats">
                  <div>
                    <div className="k">Tarefas</div>
                    <div className="v">{c.tarefas}</div>
                  </div>
                  <div>
                    <div className="k">LTV</div>
                    <div className="v" style={{ fontSize: 16 }}>{fmtBRL(c.totalGasto)}</div>
                  </div>
                </div>
                <div className="meta">
                  <div className="row"><span className="ico"><Icon.Mail size={12}/></span> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</span></div>
                  <div className="row"><span className="ico"><Icon.Phone size={12}/></span> <span className="mono">{c.tel}</span></div>
                  <div className="row"><span className="ico"><Icon.MapPin size={12}/></span> <span>{c.endereco.cidade}/{c.endereco.estado}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.name : ""}
        sub={detail ? `Cliente desde ${detail.since} · ${detail.status}` : ""}
        size="lg"
        footer={
          <>
            <Button variant="secondary" icon={Icon.Edit}>Editar</Button>
            <Button icon={Icon.Plus} onClick={() => setDetail(null)}>Criar tarefa</Button>
          </>
        }
      >
        {detail ? (
          <div className="col" style={{ gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div className="kpi" style={{ padding: 14 }}>
                <span className="label" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-5)" }}>Tarefas totais</span>
                <div className="serif" style={{ color: "var(--gold)", fontSize: 28, fontWeight: 500 }}>{detail.tarefas}</div>
              </div>
              <div className="kpi" style={{ padding: 14 }}>
                <span className="label" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-5)" }}>Ativas</span>
                <div className="serif" style={{ color: detail.ativas > 0 ? "var(--gold)" : "var(--fg-5)", fontSize: 28, fontWeight: 500 }}>{detail.ativas}</div>
              </div>
              <div className="kpi" style={{ padding: 14 }}>
                <span className="label" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-5)" }}>LTV</span>
                <div className="serif" style={{ color: "var(--gold)", fontSize: 22, fontWeight: 500 }}>{fmtBRL(detail.totalGasto)}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Contato</div>
              <div className="kv-row">
                <span className="k">E-mail</span>
                <span className="v"><Icon.Mail size={12} style={{ color: "var(--gold)", marginRight: 6, verticalAlign: "middle" }}/>{detail.email}</span>
              </div>
              <div className="kv-row">
                <span className="k">Telefone</span>
                <span className="v mono"><Icon.Phone size={12} style={{ color: "var(--gold)", marginRight: 6, verticalAlign: "middle" }}/>{detail.tel}</span>
              </div>
              <div className="kv-row">
                <span className="k">Endereço</span>
                <span className="v">
                  {detail.endereco.unidade} · {detail.endereco.logradouro}<br/>
                  <span className="muted">{detail.endereco.cidade} — {detail.endereco.estado} · CEP {detail.endereco.cep}</span>
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Tarefas recentes</div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Projeto</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BGG_DATA.tasks.filter(t => t.cliente === detail.name).slice(0, 5).map(t => (
                      <tr key={t.id} onClick={() => { setDetail(null); onOpenTask(t.id); }}>
                        <td className="id">{t.id}</td>
                        <td>{t.projeto}</td>
                        <td><StatusBadge>{t.status}</StatusBadge></td>
                        <td className="amount" style={{ textAlign: "right" }}>{fmtBRL(t.orcamento.valor)}</td>
                      </tr>
                    ))}
                    {BGG_DATA.tasks.filter(t => t.cliente === detail.name).length === 0 ? (
                      <tr><td colSpan="4" className="muted small" style={{ textAlign: "center", padding: 24 }}>Nenhuma tarefa registrada para este cliente.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Novo cliente"
        sub="Cadastro manual"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button icon={Icon.Plus} onClick={() => setShowNew(false)}>Criar cliente</Button>
          </>
        }
      >
        <div className="col" style={{ gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Primeiro nome"><Input placeholder="João"/></Field>
            <Field label="Sobrenome"><Input placeholder="Silva"/></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="E-mail"><Input type="email" leading={<Icon.Mail size={14}/>} placeholder="cliente@exemplo.com"/></Field>
            <Field label="Telefone"><Input leading={<Icon.Phone size={14}/>} placeholder="+55 11 9 …"/></Field>
          </div>
          <Field label="Endereço padrão"><Input placeholder="Rua, número, complemento"/></Field>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <Field label="Cidade"><Input placeholder="São Paulo"/></Field>
            <Field label="Estado">
              <Select defaultValue=""><option value="">UF</option>{BGG_DATA.estados.map(s => <option key={s}>{s}</option>)}</Select>
            </Field>
            <Field label="CEP"><Input placeholder="00000-000"/></Field>
          </div>
          <Field label="Anotações" optional><Textarea placeholder="Preferências, veículos cadastrados, observações…"/></Field>
        </div>
      </Modal>
    </>
  );
}


export { CustomersPage };
