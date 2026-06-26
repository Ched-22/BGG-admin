import React, { useState, useEffect, useCallback } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, PageRefreshButton, formatEUR, useToast, useConfirm } from "../components/ui";
import { ExportMenu } from "../components/ExportMenu";
import { QUOTES_EXPORT_COLUMNS } from "../lib/exportColumns";
import { QuoteDetailModal } from "../components/modals/QuoteDetailModal";
import { openWhatsAppQuoteSend } from "../lib/whatsapp";
import { resolveClientPreferredLanguage } from "../lib/clientLanguage";
import {
  isQuoteDraft,
  isQuotePending,
  listQuotes,
  mapQuotesFromApi,
  QUOTE_TONE,
} from "../lib/quoteApi";
import api from "../lib/api";

const QUOTE_STATUSES = ["Todos", "Pendente", "Enviado", "Aprovado", "Rejeitado", "Expirado"];
const PAGE_SIZE = 15;

const EMPTY_PIPELINE = {
  pendente: { count: 0, total: 0 },
  enviado: { count: 0, total: 0 },
  aprovado: { count: 0, total: 0 },
  rejeitadoExpirado: { count: 0, total: 0 },
  todos: { count: 0, total: 0 },
};

function QuotesPage({ canApproveQuotes = true, onOpenTask, onScheduleFromQuote }) {
  const [quotes, setQuotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pipeline, setPipeline] = useState(EMPTY_PIPELINE);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [servico, setServico] = useState("Todos");
  const [detail, setDetail] = useState(null);
  const [detailEdit, setDetailEdit] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirm, ConfirmEl] = useConfirm();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listQuotes({
        page,
        limit: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status !== "Todos" ? { status } : {}),
        ...(servico !== "Todos" ? { service: servico } : {}),
      });
      setQuotes(mapQuotesFromApi(res));
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
      setPipeline(res.pipeline || EMPTY_PIPELINE);
    } catch {
      setQuotes([]);
      setTotal(0);
      setTotalPages(1);
      setPipeline(EMPTY_PIPELINE);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, servico]);

  useEffect(() => {
    setPage(1);
  }, [search, status, servico]);

  useEffect(() => {
    const t = setTimeout(() => fetchQuotes(), 300);
    return () => clearTimeout(t);
  }, [fetchQuotes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchQuotes();
      toast({ kind: "success", title: "Atualizado", desc: "Orçamentos atualizados." });
    } finally {
      setRefreshing(false);
    }
  };

  const openDetail = (q, edit = false) => {
    setCreating(false);
    setDetail(q);
    setDetailEdit(edit);
  };

  const openCreate = () => {
    setDetail(null);
    setDetailEdit(true);
    setCreating(true);
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailEdit(false);
    setCreating(false);
  };

  const handleSaved = (quote) => {
    if (creating && quote) {
      setCreating(false);
      setDetail(quote);
      setDetailEdit(false);
    }
    fetchQuotes();
  };

  const handleApprove = async (id) => {
    const ok = await confirm({
      title: "Aprovar orçamento?",
      body: "Tem certeza de que deseja aprovar este orçamento?",
      ok: "Aprovar"
    });
    if (!ok) return null;
    try {
      await api.patch(`/quotes/${id}/approve`);
      await fetchQuotes();
      toast({ kind: 'success', title: 'Orçamento aprovado', desc: id });
      return quotes.find((q) => q.id === id) ?? null;
    } catch {
      toast({ kind: 'error', title: 'Erro ao aprovar', desc: 'Não foi possível aprovar o orçamento.' });
      return null;
    }
  };

  const handleSubmit = async (id) => {
    const ok = await confirm({
      title: "Enviar para aprovação?",
      body: "O orçamento será enviado para revisão interna. Apenas um administrador poderá aprová-lo.",
      ok: "Enviar"
    });
    if (!ok) return;
    try {
      await api.patch(`/quotes/${id}/submit`);
      await fetchQuotes();
      toast({ kind: 'success', title: 'Enviado para aprovação', desc: id });
    } catch {
      toast({ kind: 'error', title: 'Erro ao enviar', desc: 'Não foi possível enviar para aprovação.' });
    }
  };

  const onSend = async (id) => {
    const ok = await confirm({ title: "Enviar orçamento ao cliente?", body: "Tem certeza de que deseja enviar este orçamento ao cliente?", ok: "Enviar" });
    if (!ok) return;
    const quote = quotes.find((q) => q.id === id);
    try {
      await api.patch(`/quotes/${id}/send`);
      await fetchQuotes();
      toast({ kind: "success", title: "Orçamento enviado", desc: `Cliente notificado — ${id}` });
      if (quote) {
        openWhatsAppQuoteSend({
          phone: {
            countryCode: quote.clientPhoneCountryCode,
            nationalNumber: quote.clientPhoneNationalNumber,
          },
          quote,
          toast,
          preferredLanguage: resolveClientPreferredLanguage({ quote }),
        });
      }
    } catch {
      toast({ kind: "error", title: "Erro ao enviar", desc: "Não foi possível enviar o orçamento ao cliente." });
    }
  };

  return (
    <>
      <div className="page">
        <div className="page-head">
          <div className="titles">
            <span className="eyebrow-sm">Gestão</span>
            <h2 className="page-title">Orçamentos</h2>
            <div className="page-sub">{pipeline.todos.count} orçamentos no funil · {formatEUR(pipeline.todos.total)} em valor total</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <PageRefreshButton onClick={handleRefresh} loading={refreshing || loading}/>
            <ExportMenu
              filenameBase="orcamentos"
              sheetName="Orçamentos"
              columns={QUOTES_EXPORT_COLUMNS}
              rows={quotes}
              disabled={refreshing || loading}
            />
            <Button icon={Icon.Plus} onClick={openCreate}>Novo orçamento</Button>
          </div>
        </div>

        <div className="quote-pipeline">
          <div className="q-stage warn" onClick={() => setStatus("Pendente")} style={{ cursor: "pointer" }}>
            <div className="stage-label">Pendentes</div>
            <div className="stage-count">{pipeline.pendente.count}</div>
            <div className="stage-value">{formatEUR(pipeline.pendente.total)}</div>
          </div>
          <div className="q-stage" onClick={() => setStatus("Enviado")} style={{ cursor: "pointer" }}>
            <div className="stage-label">Enviados</div>
            <div className="stage-count">{pipeline.enviado.count}</div>
            <div className="stage-value">{formatEUR(pipeline.enviado.total)}</div>
          </div>
          <div className="q-stage success" onClick={() => setStatus("Aprovado")} style={{ cursor: "pointer" }}>
            <div className="stage-label">Aprovados</div>
            <div className="stage-count">{pipeline.aprovado.count}</div>
            <div className="stage-value">{formatEUR(pipeline.aprovado.total)}</div>
          </div>
          <div className="q-stage danger" onClick={() => setStatus("Rejeitado")} style={{ cursor: "pointer" }}>
            <div className="stage-label">Rejeitados / Expirados</div>
            <div className="stage-count">{pipeline.rejeitadoExpirado.count}</div>
            <div className="stage-value">{formatEUR(pipeline.rejeitadoExpirado.total)}</div>
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
            <span className="tag mono">{quotes.length}</span>
            <span className="tiny muted">/ {total}</span>
          </div>
        </div>

        {loading ? (
          <div className="muted small" style={{ padding: 40, textAlign: "center" }}>A carregar orçamentos…</div>
        ) : (
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
                {quotes.map(q => (
                  <tr key={q.id} onClick={() => openDetail(q, false)}>
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
                    <td className="amount" style={{ textAlign: "right", color: "var(--gold)" }}>{formatEUR(q.valor)}</td>
                    <td><span className={`badge ${QUOTE_TONE[q.status] || "muted"}`}><span className="dot"></span>{q.status}</span></td>
                    <td className="muted small mono">{q.validade}</td>
                    <td className="muted small">{q.responsavel}</td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      {isQuoteDraft(q) ? (
                        <button className="row-action" title="Enviar para aprovação" onClick={() => handleSubmit(q.id)}><Icon.Send size={14}/></button>
                      ) : null}
                      {canApproveQuotes && isQuotePending(q) ? (
                        <button className="row-action" title="Aprovar" onClick={() => handleApprove(q.id)}><Icon.Check size={14}/></button>
                      ) : null}
                      {q.status === "Aprovado" ? (
                        <>
                          {onScheduleFromQuote ? (
                            <button className="row-action" title="Agendar tarefa" onClick={() => onScheduleFromQuote(q)}><Icon.Calendar size={14}/></button>
                          ) : null}
                          <button className="row-action" title="Enviar" onClick={() => onSend(q.id)}><Icon.Send size={14}/></button>
                        </>
                      ) : null}
                      <button className="row-action" title="Detalhes" onClick={() => openDetail(q, false)}><Icon.Eye size={14}/></button>
                      {isQuotePending(q) ? (
                        <button className="row-action" title="Editar" onClick={() => openDetail(q, true)}><Icon.Edit size={14}/></button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {quotes.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: "center", padding: 48, color: "var(--fg-5)" }}>Nenhum orçamento corresponde aos filtros.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 16 }}>
            <Button variant="ghost" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="muted small">Página {page} de {totalPages}</span>
            <Button variant="ghost" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              Seguinte
            </Button>
          </div>
        ) : null}
      </div>

      <QuoteDetailModal
        open={!!detail || creating}
        quote={detail}
        creating={creating}
        initialEdit={detailEdit}
        onClose={closeDetail}
        onSaved={handleSaved}
        onApprove={canApproveQuotes ? handleApprove : undefined}
        onSend={onSend}
        onScheduleFromQuote={onScheduleFromQuote}
      />
      {ConfirmEl}
    </>
  );
}


export { QuotesPage };
