import React, { useState, useEffect } from "react";
import { BGG_DATA } from "../data/bggData";
import {
  Button, Icon, Field, Input, Select, Textarea, StatusBadge, Modal, fmtBRL, useToast,
} from "../components/ui";

const TASK_STATUSES = [
  "Todos", "Nova solicitação", "Aguardando orçamento", "Não agendado",
  "Sem técnico", "Agendado", "Em andamento", "Pronto para QA", "Concluído", "Cancelado"
];

// ----- Open Tasks page -----
function TasksPage({ tasks, onOpenTask, onSchedule, onAssignTech, onCreateTask, onCancelTask, externalFilter, onConsumeFilter }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [servico, setServico] = useState("Todos");
  const [dataFiltro, setDataFiltro] = useState("");

  // sync external filters from dashboard navigation
  useEffect(() => {
    if (!externalFilter) return;
    const map = {
      novas: "Nova solicitação",
      naoAgendadas: "Não agendado",
      semTecnico: "Sem técnico",
      qa: "Pronto para QA",
    };
    if (map[externalFilter]) setStatus(map[externalFilter]);
    onConsumeFilter && onConsumeFilter();
  }, [externalFilter]);

  const filtered = tasks.filter(t => {
    if (status !== "Todos" && t.status !== status) return false;
    if (servico !== "Todos" && t.servico !== servico) return false;
    if (dataFiltro && t.dataAgendada !== dataFiltro) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!t.id.toLowerCase().includes(s)
        && !t.cliente.toLowerCase().includes(s)
        && !t.projeto.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="page">
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow-sm">Operações</span>
          <h2 className="page-title">Tarefas Abertas</h2>
          <div className="page-sub">{filtered.length} de {tasks.length} tarefas · gestão completa do funil operacional</div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Button variant="secondary" icon={Icon.RefreshCw}>Atualizar</Button>
          <Button icon={Icon.Plus} onClick={onCreateTask}>Criar Tarefa</Button>
        </div>
      </div>

      <div className="filters">
        <div className="searchbar" style={{ width: 260 }}>
          <Icon.Search size={14}/>
          <input
            placeholder="Buscar por ID, cliente ou projeto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="select-wrap">
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 200 }}>
            {TASK_STATUSES.map(s => <option key={s} value={s}>{s === "Todos" ? "Status: Todos" : s}</option>)}
          </select>
        </div>

        <div className="select-wrap">
          <select className="select" value={servico} onChange={(e) => setServico(e.target.value)} style={{ minWidth: 200 }}>
            <option value="Todos">Serviço: Todos</option>
            {BGG_DATA.serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <input
          type="date"
          className="input"
          style={{ width: 160 }}
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
        />

        {(status !== "Todos" || servico !== "Todos" || dataFiltro || search) ? (
          <button className="btn ghost sm" onClick={() => { setSearch(""); setStatus("Todos"); setServico("Todos"); setDataFiltro(""); }}>
            Limpar filtros <Icon.Close size={12}/>
          </button>
        ) : null}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span className="tiny muted">Exibindo</span>
          <span className="tag mono">{filtered.length}</span>
          <span className="tiny muted">/ {tasks.length}</span>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 100 }}>ID</th>
              <th>Cliente</th>
              <th>Título do Projeto</th>
              <th>Tipo de Serviço</th>
              <th>Status</th>
              <th>Agendamento</th>
              <th>Técnico</th>
              <th style={{ width: 140 }}>Criada em</th>
              <th className="actions-head">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} onClick={() => onOpenTask(t.id)}>
                <td className="id">{t.id}</td>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="avatar sm outline">{t.cliente.split(" ").pop().slice(0,2)}</div>
                    <span style={{ color: "var(--fg)", fontWeight: 500 }}>{t.cliente}</span>
                  </div>
                </td>
                <td style={{ maxWidth: 240 }}>
                  <div style={{ color: "var(--fg)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.projeto}</div>
                  <div className="muted small" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.endereco.cidade}/{t.endereco.estado}</div>
                </td>
                <td>{t.servico}</td>
                <td><StatusBadge>{t.status}</StatusBadge></td>
                <td>
                  {t.dataAgendada ? (
                    <div>
                      <div className="mono" style={{ color: "var(--fg)" }}>{t.dataAgendada}</div>
                      <div className="muted small">{t.horario}</div>
                    </div>
                  ) : <span className="muted">—</span>}
                </td>
                <td>
                  {t.tecnico ? (
                    <div className="row" style={{ gap: 8 }}>
                      <div className="avatar sm tech">{t.tecnico.split(" ").pop()}</div>
                      <span style={{ fontSize: 12 }}>{t.tecnico}</span>
                    </div>
                  ) : <span className="muted">—</span>}
                </td>
                <td className="muted small mono">{t.dataCriacao.split(" ")[0]}</td>
                <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                  <div className="actions-toolbar">
                    <div className="action-slot">
                      {!t.dataAgendada && t.status !== "Cancelado" ? (
                        <button type="button" className="row-action" title="Agendar" onClick={() => onSchedule(t.id)}>
                          <Icon.Calendar size={14}/>
                        </button>
                      ) : null}
                    </div>
                    <div className="action-slot">
                      {!t.tecnico && t.status !== "Cancelado" ? (
                        <button type="button" className="row-action" title="Designar técnico" onClick={() => onAssignTech(t.id)}>
                          <Icon.UserPlus size={14}/>
                        </button>
                      ) : null}
                    </div>
                    <div className="action-slot">
                      <button type="button" className="row-action" title="Abrir" onClick={() => onOpenTask(t.id)}>
                        <Icon.ArrowRight size={14}/>
                      </button>
                    </div>
                    <div className="action-slot">
                      {t.status !== "Cancelado" && t.status !== "Concluído" ? (
                        <button type="button" className="row-action danger" title="Cancelar" onClick={() => onCancelTask(t.id)}>
                          <Icon.XCircle size={14}/>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: 48, color: "var(--fg-5)" }}>
                  Nenhuma tarefa corresponde aos filtros atuais.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----- Task Detail -----
function TaskDetail({ task, onAssignTech, onSchedule, onApproveQuote, onSendQuote, onResendQuote, onSaveQA, onEditQuote }) {
  const [qaNotes, setQaNotes] = useState(task.qa.notas || "");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const toast = useToast();

  return (
    <div className="page">
      <div className="page-head">
        <div className="titles">
          <div className="row" style={{ gap: 12, alignItems: "center" }}>
            <span className="eyebrow-sm" style={{ background: "rgba(194,164,109,0.10)", padding: "4px 10px", border: "1px solid var(--gold-30)", borderRadius: 2 }}>{task.id}</span>
            <StatusBadge>{task.status}</StatusBadge>
            <span className="tiny muted">Tipo: <span style={{ color: "var(--fg-3)" }}>{task.servico}</span></span>
          </div>
          <h2 className="page-title" style={{ marginTop: 6 }}>{task.projeto}</h2>
          <div className="page-sub">
            Criada em <span className="mono" style={{ color: "var(--fg-3)" }}>{task.dataCriacao}</span> ·
            Atualizada em <span className="mono" style={{ color: "var(--fg-3)" }}>{task.ultimaAtualizacao}</span>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {!task.tecnico && task.status !== "Cancelado" ? (
            <Button variant="secondary" icon={Icon.UserPlus} onClick={() => onAssignTech(task.id)}>Designar técnico</Button>
          ) : null}
          {!task.dataAgendada && task.status !== "Cancelado" ? (
            <Button icon={Icon.Calendar} onClick={() => onSchedule(task.id)}>Agendar tarefa</Button>
          ) : null}
        </div>
      </div>

      <div className="task-detail">
        <div className="col" style={{ gap: 18 }}>
          {/* Cliente */}
          <div className="card">
            <div className="card-head">
              <h3><Icon.Users size={18}/> Informações do Cliente</h3>
              <span className="tag mono">{task.cliente}</span>
            </div>
            <div className="card-body">
              <div className="kv-row">
                <span className="k">Nome do Cliente</span>
                <span className="v clickable" style={{ color: "var(--gold)" }}>{task.cliente}</span>
              </div>
              <div className="kv-row">
                <span className="k">Contato</span>
                <span className="v">
                  <span className="row" style={{ gap: 16 }}>
                    <span className="row" style={{ gap: 6 }}><Icon.Phone size={12} style={{ color: "var(--gold)" }}/> {task.clienteTel}</span>
                    <span className="row" style={{ gap: 6 }}><Icon.Mail size={12} style={{ color: "var(--gold)" }}/> {task.clienteEmail}</span>
                  </span>
                </span>
              </div>
              <div className="kv-row">
                <span className="k">Endereço da Propriedade</span>
                <span className="v clickable">
                  {task.endereco.unidade} · {task.endereco.logradouro}<br/>
                  <span className="muted">{task.endereco.cidade} — {task.endereco.estado} · CEP {task.endereco.cep}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Detalhes da Tarefa */}
          <div className="card">
            <div className="card-head">
              <h3><Icon.FileText size={18}/> Detalhes da Tarefa</h3>
            </div>
            <div className="card-body">
              <div className="kv-row">
                <span className="k">Descrição</span>
                <span className="v" style={{ lineHeight: 1.6 }}>{task.descricao}</span>
              </div>
              <div className="kv-row">
                <span className="k">Agenda Solicitada</span>
                <span className="v">{task.agendaPreferencial}</span>
              </div>
              <div className="kv-row">
                <span className="k">Anexos</span>
                <span className="v">
                  {task.anexos.length ? (
                    <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                      {task.anexos.map((a, i) => (
                        <div key={i} className="attach">
                          <span className="ico">{a.type === "image" ? <Icon.Image size={14}/> : <Icon.FileText size={14}/>}</span>
                          <span>{a.name}</span>
                          <div className="actions">
                            <button title="Visualizar"><Icon.Eye size={12}/></button>
                            <button title="Baixar"><Icon.Download size={12}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <span className="muted">Nenhum anexo enviado.</span>}
                </span>
              </div>
            </div>
          </div>

          {/* QA */}
          {(task.status === "Pronto para QA" || task.status === "Concluído") ? (
            <div className="card" style={{ borderColor: "var(--gold-30)" }}>
              <div className="card-head">
                <h3><Icon.CheckCircle size={18}/> QA · Revisão da Conclusão</h3>
                <StatusBadge tone="info">{task.qa.status}</StatusBadge>
              </div>
              <div className="card-body">
                <div className="kv-row">
                  <span className="k">Concluída em</span>
                  <span className="v mono">{task.qa.concluidoEm}</span>
                </div>
                <div className="kv-row">
                  <span className="k">Anotações do Técnico</span>
                  <span className="v">{task.tecnicoNotas || <span className="muted">Sem anotações.</span>}</span>
                </div>
                <div className="kv-row">
                  <span className="k">Fotos de Conclusão</span>
                  <span className="v">
                    <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                      {task.qa.fotos.map((f, i) => (
                        <div key={i} style={{
                          width: 80, height: 60, background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)",
                          border: "1px solid var(--border)", borderRadius: 4,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "var(--gold)", position: "relative"
                        }}>
                          <Icon.Image size={20}/>
                          <span className="tiny" style={{ position: "absolute", bottom: 2, left: 4, right: 4, color: "var(--fg-6)", fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </span>
                </div>
                <div className="kv-row">
                  <span className="k" style={{ alignSelf: "flex-start", paddingTop: 6 }}>Anotações de QA</span>
                  <span className="v">
                    <Textarea
                      value={qaNotes}
                      onChange={(e) => setQaNotes(e.target.value)}
                      placeholder="Notas internas da revisão de qualidade…"
                      disabled={task.status === "Concluído"}
                    />
                    {task.status === "Concluído" ? (
                      <div className="hint" style={{ marginTop: 6, color: "var(--fg-6)" }}>
                        Anotações de QA não podem mais ser editadas porque esta tarefa já foi concluída.
                      </div>
                    ) : null}
                  </span>
                </div>
              </div>
              <div className="card-foot">
                <Button variant="ghost" icon={Icon.RefreshCw}>Solicitar revisão</Button>
                <Button
                  disabled={task.status === "Concluído"}
                  onClick={() => {
                    onSaveQA(task.id, qaNotes);
                    toast({ kind: "success", title: "Anotações de QA salvas", desc: "Tarefa aprovada e movida para Concluído." });
                  }}
                  icon={Icon.Check}
                >
                  Aprovar conclusão
                </Button>
              </div>
            </div>
          ) : null}

          {/* Activity log */}
          <div className="card">
            <div className="card-head"><h3><Icon.Clock size={18}/> Registro de Atividade</h3></div>
            <div className="card-body">
              <div className="timeline">
                {task.log.map((l, i) => (
                  <div key={i} className="row">
                    <span></span>
                    <div>
                      <div className="t">{l.t}</div>
                      <span className="who">{l.w}</span>
                    </div>
                    <span className="when mono">{l.when}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col" style={{ gap: 18 }}>
          {/* Schedule + Tech */}
          <div className="card">
            <div className="card-head"><h3><Icon.Calendar size={18}/> Agenda &amp; Técnico</h3></div>
            <div className="card-body">
              <div className="kv-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <div className="k" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-5)", marginBottom: 4 }}>Data</div>
                  <div className="mono" style={{ color: "var(--gold)", fontSize: 15, fontWeight: 500 }}>{task.dataAgendada || "—"}</div>
                </div>
                <div>
                  <div className="k" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-5)", marginBottom: 4 }}>Horário</div>
                  <div className="mono" style={{ color: "var(--gold)", fontSize: 15, fontWeight: 500 }}>{task.horario || "—"}</div>
                </div>
              </div>
              {task.dataAgendada ? (
                <div className="kv-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div>
                    <div className="k" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-5)", marginBottom: 4 }}>Baia</div>
                    <div className="mono" style={{ color: "var(--gold)", fontSize: 15, fontWeight: 500 }}>{task.baia ? `Baia ${task.baia}` : "—"}</div>
                  </div>
                  <div>
                    <div className="k" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-5)", marginBottom: 4 }}>Duração</div>
                    <div className="mono" style={{ color: "var(--gold)", fontSize: 15, fontWeight: 500 }}>
                      {task.duracaoHoras ? `${String(task.duracaoHoras).replace(".", ",")} h` : task.duracao ? `${task.duracao} min` : "—"}
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="kv-row">
                <span className="k">Técnico Designado</span>
                <span className="v">
                  {task.tecnico ? (
                    <div className="row" style={{ gap: 10 }}>
                      <div className="avatar sm tech">{task.tecnico.split(" ").pop()}</div>
                      <div>
                        <div style={{ color: "var(--gold)" }}>{task.tecnico}</div>
                        <div className="tiny muted">{task.clienteTel}</div>
                      </div>
                    </div>
                  ) : <span className="muted">Ainda não designado</span>}
                </span>
              </div>
              <div className="kv-row">
                <span className="k">Status do Técnico</span>
                <span className="v">{task.tecnicoStatus !== "—" ? <StatusBadge>{task.tecnicoStatus}</StatusBadge> : <span className="muted">—</span>}</span>
              </div>
              <div className="kv-row">
                <span className="k">Anotações do Técnico</span>
                <span className="v" style={{ fontSize: 12.5 }}>{task.tecnicoNotas || <span className="muted">—</span>}</span>
              </div>
            </div>
            <div className="card-foot">
              {!task.tecnico && task.status !== "Cancelado" ? (
                <Button variant="secondary" size="sm" icon={Icon.UserPlus} onClick={() => onAssignTech(task.id)}>Designar técnico</Button>
              ) : null}
              {!task.dataAgendada && task.status !== "Cancelado" ? (
                <Button size="sm" icon={Icon.Calendar} onClick={() => onSchedule(task.id)}>Agendar tarefa</Button>
              ) : null}
              {task.tecnico && task.dataAgendada ? (
                <Button variant="ghost" size="sm" onClick={() => onSchedule(task.id)}>Reagendar</Button>
              ) : null}
            </div>
          </div>

          {/* Quote + Payment */}
          <div className="card">
            <div className="card-head"><h3><Icon.DollarSign size={18}/> Orçamento &amp; Pagamento</h3></div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <div className="k" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-5)", marginBottom: 4 }}>Valor do Orçamento</div>
                  <div className="serif" style={{ color: "var(--gold)", fontSize: 26, fontWeight: 500 }}>{fmtBRL(task.orcamento.valor)}</div>
                </div>
                <div>
                  <div className="k" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-5)", marginBottom: 4 }}>Status</div>
                  <StatusBadge>{task.orcamento.status}</StatusBadge>
                </div>
              </div>
              <div className="kv-row">
                <span className="k">ID da Fatura</span>
                <span className="v mono">{task.orcamento.fatura}</span>
              </div>
              <div className="kv-row">
                <span className="k">Método de Pagamento</span>
                <span className="v">{task.orcamento.metodo}</span>
              </div>
              <div className="kv-row">
                <span className="k">Depósito</span>
                <span className="v mono">{fmtBRL(task.orcamento.deposito)}</span>
              </div>
              <div className="kv-row">
                <span className="k">Saldo Restante</span>
                <span className="v mono" style={{ color: task.orcamento.saldo > 0 ? "#d4a017" : "#8fbf6a" }}>{fmtBRL(task.orcamento.saldo)}</span>
              </div>
            </div>
            <div className="card-foot" style={{ flexWrap: "wrap" }}>
              <Button variant="ghost" size="sm" icon={Icon.Edit} onClick={() => onEditQuote(task.id)}>Editar</Button>
              {task.orcamento.status === "Pendente" ? (
                <Button variant="secondary" size="sm" icon={Icon.Check} onClick={() => onApproveQuote(task.id)}>Aprovar</Button>
              ) : null}
              {task.orcamento.status === "Aprovado" ? (
                <Button size="sm" icon={Icon.Send} onClick={() => onSendQuote(task.id)}>Enviar p/ cliente</Button>
              ) : null}
              <Button variant="ghost" size="sm" icon={Icon.RefreshCw} onClick={() => onResendQuote(task.id)}>Reenviar</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export { TasksPage, TaskDetail };
