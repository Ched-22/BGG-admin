import React, { useState } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, Field, Input, Select, Modal, StatusBadge, fmtBRL, useToast, useConfirm } from "../components/ui";

const QUOTE_STATUSES = ["Todos", "Pendente", "Pronto para envio", "Enviado", "Aprovado", "Rejeitado", "Expirado"];
const QUOTE_TONE = {
  "Pendente": "warn",
  "Pronto para envio": "info",
  "Enviado": "gold",
  "Aprovado": "success",
  "Rejeitado": "danger",
  "Expirado": "muted",
};

function QuotesPage({ onOpenTask }) {
  const quotes = BGG_DATA.quotes;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [servico, setServico] = useState("Todos");
  const [detail, setDetail] = useState(null);
  const [confirm, ConfirmEl] = useConfirm();
  const toast = useToast();

  const filtered = quotes.filter(q => {
    if (status !== "Todos" && q.status !== status) return false;
    if (servico !== "Todos" && q.servico !== servico) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!q.id.toLowerCase().includes(s) && !q.cliente.toLowerCase().includes(s) && !q.projeto.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const byStatus = (s) => quotes.filter(q => q.status === s);
  const sumByStatus = (s) => byStatus(s).reduce((sum, q) => sum + q.valor, 0);

  const onApprove = async (id) => {
    const ok = await confirm({ title: "Aprovar orçamento?", body: "Tem certeza de que deseja aprovar este orçamento?", ok: "Aprovar" });
    if (!ok) return;
    toast({ kind: "success", title: "Orçamento aprovado", desc: id });
  };
  const onSend = async (id) => {
    const ok = await confirm({ title: "Enviar orçamento ao cliente?", body: "Tem certeza de que deseja enviar este orçamento ao cliente?", ok: "Enviar" });
    if (!ok) return;
    toast({ kind: "success", title: "Orçamento enviado", desc: `Cliente notificado — ${id}` });
  };

  return (
    <>
      <div className="page">
        <div className="page-head">
          <div className="titles">
            <span className="eyebrow-sm">Gestão</span>
            <h2 className="page-title">Orçamentos</h2>
            <div className="page-sub">{quotes.length} orçamentos no funil · {fmtBRL(quotes.reduce((s, q) => s + q.valor, 0))} em valor total</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Button variant="secondary" icon={Icon.Download}>Exportar</Button>
            <Button icon={Icon.Plus}>Novo orçamento</Button>
          </div>
        </div>

        {/* Pipeline */}
        <div className="quote-pipeline">
          <div className="q-stage warn" onClick={() => setStatus("Pendente")} style={{ cursor: "pointer" }}>
            <div className="stage-label">Pendentes</div>
            <div className="stage-count">{byStatus("Pendente").length}</div>
            <div className="stage-value">{fmtBRL(sumByStatus("Pendente"))}</div>
          </div>
          <div className="q-stage" onClick={() => setStatus("Pronto para envio")} style={{ cursor: "pointer" }}>
            <div className="stage-label">Prontos p/ envio</div>
            <div className="stage-count">{byStatus("Pronto para envio").length}</div>
            <div className="stage-value">{fmtBRL(sumByStatus("Pronto para envio"))}</div>
          </div>
          <div className="q-stage" onClick={() => setStatus("Enviado")} style={{ cursor: "pointer" }}>
            <div className="stage-label">Enviados</div>
            <div className="stage-count">{byStatus("Enviado").length}</div>
            <div className="stage-value">{fmtBRL(sumByStatus("Enviado"))}</div>
          </div>
          <div className="q-stage success" onClick={() => setStatus("Aprovado")} style={{ cursor: "pointer" }}>
            <div className="stage-label">Aprovados</div>
            <div className="stage-count">{byStatus("Aprovado").length}</div>
            <div className="stage-value">{fmtBRL(sumByStatus("Aprovado"))}</div>
          </div>
          <div className="q-stage danger" onClick={() => setStatus("Rejeitado")} style={{ cursor: "pointer" }}>
            <div className="stage-label">Rejeitados / Expirados</div>
            <div className="stage-count">{byStatus("Rejeitado").length + byStatus("Expirado").length}</div>
            <div className="stage-value">{fmtBRL(sumByStatus("Rejeitado") + sumByStatus("Expirado"))}</div>
          </div>
        </div>

        <div className="filters">
          <div className="searchbar" style={{ width: 260 }}>
            <Icon.Search size={14}/>
            <input placeholder="Buscar por ID, cliente ou projeto…" value={search} onChange={(e) => setSearch(e.target.value)}/>
          </div>
          <div className="select-wrap">
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 200 }}>
              {QUOTE_STATUSES.map(s => <option key={s}>{s === "Todos" ? "Status: Todos" : s}</option>)}
            </select>
          </div>
          <div className="select-wrap">
            <select className="select" value={servico} onChange={(e) => setServico(e.target.value)} style={{ minWidth: 200 }}>
              <option value="Todos">Serviço: Todos</option>
              {BGG_DATA.serviceTypes.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {(status !== "Todos" || servico !== "Todos" || search) ? (
            <button className="btn ghost sm" onClick={() => { setSearch(""); setStatus("Todos"); setServico("Todos"); }}>
              Limpar filtros <Icon.Close size={12}/>
            </button>
          ) : null}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span className="tiny muted">Exibindo</span>
            <span className="tag mono">{filtered.length}</span>
            <span className="tiny muted">/ {quotes.length}</span>
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 110 }}>ID</th>
                <th>Projeto</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th style={{ width: 130, textAlign: "right" }}>Valor</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 110 }}>Validade</th>
                <th style={{ width: 130 }}>Responsável</th>
                <th style={{ width: 110, textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} onClick={() => setDetail(q)}>
                  <td className="id">{q.id}</td>
                  <td style={{ maxWidth: 260 }}>
                    <div style={{ color: "var(--fg)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.projeto}</div>
                    <div className="muted small mono">Criado em {q.dataCriacao}</div>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <div className="avatar sm outline">{q.cliente.split(" ").pop().slice(0, 2)}</div>
                      <span>{q.cliente}</span>
                    </div>
                  </td>
                  <td>{q.servico}</td>
                  <td className="amount" style={{ textAlign: "right", color: "var(--gold)" }}>{fmtBRL(q.valor)}</td>
                  <td><span className={`badge ${QUOTE_TONE[q.status] || "muted"}`}><span className="dot"></span>{q.status}</span></td>
                  <td className="muted small mono">{q.validade}</td>
                  <td className="muted small">{q.responsavel}</td>
                  <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                    {q.status === "Pendente" ? (
                      <button className="row-action" title="Aprovar" onClick={() => onApprove(q.id)}><Icon.Check size={14}/></button>
                    ) : null}
                    {q.status === "Pronto para envio" || q.status === "Aprovado" ? (
                      <button className="row-action" title="Enviar" onClick={() => onSend(q.id)}><Icon.Send size={14}/></button>
                    ) : null}
                    <button className="row-action" title="Detalhes" onClick={() => setDetail(q)}><Icon.Eye size={14}/></button>
                    <button className="row-action" title="Editar"><Icon.Edit size={14}/></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: "center", padding: 48, color: "var(--fg-5)" }}>Nenhum orçamento corresponde aos filtros.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Orçamento ${detail.id}` : ""}
        sub={detail ? detail.projeto : ""}
        size="lg"
        footer={detail ? (
          <>
            <Button variant="ghost" icon={Icon.Download}>Baixar PDF</Button>
            <Button variant="secondary" icon={Icon.Edit}>Editar</Button>
            {detail.status === "Pendente" ? <Button icon={Icon.Check} onClick={() => { onApprove(detail.id); setDetail(null); }}>Aprovar</Button> : null}
            {detail.status === "Pronto para envio" || detail.status === "Aprovado" ? <Button icon={Icon.Send} onClick={() => { onSend(detail.id); setDetail(null); }}>Enviar ao cliente</Button> : null}
            {detail.status === "Enviado" ? <Button variant="secondary" icon={Icon.RefreshCw}>Reenviar</Button> : null}
          </>
        ) : null}
      >
        {detail ? (
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
                <div className="serif" style={{ color: "var(--gold)", fontSize: 32, fontWeight: 500, lineHeight: 1 }}>{fmtBRL(detail.valor)}</div>
                <div className="tiny muted" style={{ marginTop: 4 }}>Validade: {detail.validade}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Cliente</div>
              <div className="kv-row">
                <span className="k">Nome</span>
                <span className="v">{detail.cliente}</span>
              </div>
              <div className="kv-row">
                <span className="k">Endereço</span>
                <span className="v">{detail.endereco}</span>
              </div>
              <div className="kv-row">
                <span className="k">Responsável</span>
                <span className="v">{detail.responsavel}</span>
              </div>
              <div className="kv-row">
                <span className="k">Criado em</span>
                <span className="v mono">{detail.dataCriacao}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Composição do orçamento</div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ width: 80, textAlign: "right" }}>Qtde</th>
                      <th style={{ width: 140, textAlign: "right" }}>Valor unit.</th>
                      <th style={{ width: 140, textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{detail.servico} — serviço base</td>
                      <td className="mono" style={{ textAlign: "right" }}>1</td>
                      <td className="amount" style={{ textAlign: "right" }}>{fmtBRL(detail.valor * 0.78)}</td>
                      <td className="amount" style={{ textAlign: "right" }}>{fmtBRL(detail.valor * 0.78)}</td>
                    </tr>
                    <tr>
                      <td>Produtos premium</td>
                      <td className="mono" style={{ textAlign: "right" }}>1</td>
                      <td className="amount" style={{ textAlign: "right" }}>{fmtBRL(detail.valor * 0.15)}</td>
                      <td className="amount" style={{ textAlign: "right" }}>{fmtBRL(detail.valor * 0.15)}</td>
                    </tr>
                    <tr>
                      <td>Mão de obra adicional</td>
                      <td className="mono" style={{ textAlign: "right" }}>1</td>
                      <td className="amount" style={{ textAlign: "right" }}>{fmtBRL(detail.valor * 0.07)}</td>
                      <td className="amount" style={{ textAlign: "right" }}>{fmtBRL(detail.valor * 0.07)}</td>
                    </tr>
                    <tr style={{ background: "rgba(194,164,109,0.06)" }}>
                      <td colSpan="3" style={{ textAlign: "right", color: "var(--gold)", fontWeight: 500, letterSpacing: "0.04em" }}>TOTAL</td>
                      <td className="amount" style={{ textAlign: "right", color: "var(--gold)", fontSize: 14, fontWeight: 600 }}>{fmtBRL(detail.valor)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="row" style={{ gap: 8, padding: "12px 14px", background: "rgba(194,164,109,0.06)", border: "1px solid var(--gold-30)", borderRadius: 4 }}>
              <Icon.Info size={14} style={{ color: "var(--gold)" }}/>
              <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
                Este orçamento {detail.status === "Aprovado" ? "foi aprovado e está vinculado a uma tarefa em execução." : detail.status === "Enviado" ? "está aguardando resposta do cliente." : detail.status === "Pendente" ? "ainda não foi revisado internamente." : detail.status === "Expirado" ? "expirou. Atualize a validade antes de reenviar." : "está pronto para ser enviado ao cliente."}
              </span>
            </div>
          </div>
        ) : null}
      </Modal>
      {ConfirmEl}
    </>
  );
}


export { QuotesPage };
