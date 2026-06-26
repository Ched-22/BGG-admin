import React, { Fragment, createElement, useMemo } from "react";
import { Button, Icon, PageRefreshButton, StatusBadge, formatEUR, useConfirm, useToast } from "../components/ui";
import api from "../lib/api";
import { needsRestock, stockLevelRatio, suggestedOrderQty } from "../lib/stock";
import { StockLevelBar } from "./Stock";
import { isQuotePending, quoteSortDate } from "../lib/quoteApi";
import { countOpenTasks, isClosedTaskStatus } from "../lib/taskApi";
import { formatISODate, todayISO } from "../lib/scheduling";
import { buildDashboardAlerts, greetingFirstName } from "../lib/dashboardAlerts";
import { useAuth } from "../context/AuthContext";

const PT_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const PT_DOW_LONG = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function MiniRow({ item, columns, actions }) {
  return (
    <div className="task-list-row">
      <span className="id mono">{item[columns[0]]}</span>
      <div style={{ minWidth: 0 }}>
        <div className="title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item[columns[1]]}</div>
        <div className="meta">
          {columns.slice(2).map((c, i) => (
            <Fragment key={c}>
              {i > 0 ? <span className="dotsep"></span> : null}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{item[c]}</span>
            </Fragment>
          ))}
        </div>
      </div>
      <div className="right">{actions}</div>
    </div>
  );
}

function DashboardCard({ title, count, total, icon, action, children, tone = "gold" }) {
  const IconEl = Icon[icon] || Icon.Tasks;
  return (
    <div className="card">
      <div className="card-head">
        <h3>
          <span style={{ color: `var(--${tone === "danger" ? "destructive" : "gold"})`, display: "flex" }}>
            <IconEl size={18}/>
          </span>
          {title}
          {count !== undefined ? <span className="count">{count}</span> : null}
        </h3>
        {action ? <div className="actions">{action}</div> : null}
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

// ------- Today's tasks block -------
function TodayBlock({ tasks, onOpenTask }) {
  const todays = tasks.filter(
    (t) => t.dataAgendada === todayISO() && !isClosedTaskStatus(t.status),
  );
  const now = new Date();
  const dateLabel = `${now.getDate()} ${PT_MONTHS[now.getMonth()].toLowerCase()} · ${PT_DOW_LONG[now.getDay()]}`;
  return (
    <div className="card">
      <div className="card-head">
        <h3><Icon.Calendar size={18}/> Tarefas de hoje<span className="count">{todays.length}</span></h3>
        <div className="actions">
          <span className="eyebrow-sm" style={{ fontSize: 10 }}>{dateLabel}</span>
        </div>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="tbl-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Horário</th>
                <th style={{ width: 110 }}>Tarefa</th>
                <th>Cliente · Serviço</th>
                <th>Endereço</th>
                <th>Técnico</th>
                <th style={{ width: 110 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {todays.map((t) => (
                <tr key={t.id} onClick={() => onOpenTask(t.id)}>
                  <td className="mono gold" style={{ fontWeight: 500 }}>{t.horario}</td>
                  <td className="id">{t.id}</td>
                  <td>
                    <div style={{ color: "var(--fg)", fontWeight: 500 }}>{t.cliente}</div>
                    <div className="muted small">{t.servico}</div>
                  </td>
                  <td className="muted small">{t.endereco.logradouro} — {t.endereco.cidade}/{t.endereco.estado}</td>
                  <td>
                    {t.tecnico ? (
                      <div className="row" style={{ gap: 8 }}>
                        <div className="avatar sm tech">{t.tecnico.split(" ").pop()}</div>
                        <span style={{ fontSize: 12 }}>{t.tecnico}</span>
                      </div>
                    ) : <span className="muted">—</span>}
                  </td>
                  <td><StatusBadge>{t.tecnicoStatus !== "—" ? t.tecnicoStatus : t.status}</StatusBadge></td>
                </tr>
              ))}
              {todays.length === 0 ? (
                <tr>
                  <td colSpan="6" className="muted small" style={{ textAlign: "center", padding: 28 }}>
                    Nenhuma tarefa agendada para hoje.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({
  readOnly = false,
  canApproveQuotes = false,
  onNav,
  onOpenTask,
  onEditQuote,
  onQuotesRefresh,
  onTasksRefresh,
  onRefresh,
  onAssignTech,
  onSchedule,
  inventory,
  quotes = [],
  tasks = [],
  technicians = [],
}) {
  const { user } = useAuth();
  const [confirm, ConfirmEl] = useConfirm();
  const toast = useToast();
  const alerts = useMemo(
    () => buildDashboardAlerts({ tasks, inventory, technicians }),
    [tasks, inventory, technicians],
  );
  const openTasks = countOpenTasks(tasks);
  const quotesPending = quotes
    .filter(isQuotePending)
    .sort((a, b) => quoteSortDate(b) - quoteSortDate(a));
  const compraUrgente = (inventory || []).filter(needsRestock);
  const today = todayISO();
  const weekEnd = formatISODate(new Date(Date.now() + 7 * 86400000));
  const proximosAgendamentos = tasks
    .filter((t) => (
      t.dataAgendada
      && t.dataAgendada > today
      && t.dataAgendada <= weekEnd
      && !isClosedTaskStatus(t.status)
    ))
    .sort((a, b) => {
      const byDate = a.dataAgendada.localeCompare(b.dataAgendada);
      if (byDate !== 0) return byDate;
      return (a.horario || "").localeCompare(b.horario || "");
    });
  const naoAgendadas = tasks.filter(t => t.status === "Não agendado");
  const semTecnico = tasks.filter(t => t.status === "Sem técnico");
  const qa = tasks.filter(t => t.status === "Pronto para QA");

  const handleApproveQuote = async (id) => {
    if (!canApproveQuotes || !id) return;
    const ok = await confirm({
      title: "Aprovar orçamento?",
      body: "Tem certeza de que deseja aprovar este orçamento?",
      ok: "Aprovar",
    });
    if (!ok) return;
    try {
      await api.patch(`/quotes/${id}/approve`);
      await onQuotesRefresh?.();
      await onTasksRefresh?.();
      toast({ kind: "success", title: "Orçamento aprovado", desc: `Aprovado — ${id}.` });
    } catch {
      toast({ kind: "error", title: "Erro ao aprovar", desc: "Não foi possível aprovar o orçamento." });
    }
  };

  return (
    <>
    {ConfirmEl}
    <div className="page">
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow-sm">Bom dia, {greetingFirstName(user)}</span>
          <h2 className="page-title">Visão geral da operação</h2>
          <div className="page-sub page-sub-bold">
            {openTasks} tarefas ativas · {quotesPending.length} orçamentos pendentes
            {proximosAgendamentos.length > 0 ? (
              <span> · {proximosAgendamentos.length} agendadas nos próximos 7 dias</span>
            ) : null}
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <PageRefreshButton onClick={onRefresh}/>
          {!readOnly ? (
            <Button icon={Icon.Plus} onClick={() => onNav({ page: "tasks", openCreate: true })}>Criar Tarefa</Button>
          ) : null}
        </div>
      </div>

      {/* Orçamentos & Estoque */}
      <div className="dash-section-title">
        <span>Orçamentos & Estoque</span>
        <div className="rule"></div>
      </div>
      <div className="dash-grid">
        <div className="col-6">
          <DashboardCard
            title="Orçamentos Pendentes"
            icon="FileText"
            count={quotesPending.length}
            action={<button className="link-underline" onClick={() => onNav({ page: "quotes", filter: "Pendente" })} style={{ fontSize: 10 }}>Ver todos</button>}
          >
            {quotesPending.length === 0 ? (
              <div className="muted small" style={{ padding: 8 }}>Nenhum orçamento pendente de revisão.</div>
            ) : null}
            {quotesPending.slice(0, 6).map((q) => (
              <div key={q.id} className="task-list-row">
                <span className="id mono">{q.id}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.projeto}</div>
                  <div className="meta">
                    <span>{q.cliente}</span>
                    <span className="dotsep"></span>
                    <span>{q.servico}</span>
                    <span className="dotsep"></span>
                    <span className="warn-text" style={{ color: "#d4a017" }}>{q.idade}</span>
                  </div>
                </div>
                <div className="right">
                  <span className="amount mono" style={{ color: "var(--gold)", fontWeight: 500 }}>{formatEUR(q.valor)}</span>
                  {!readOnly ? (
                    <>
                      <button type="button" className="row-action" title="Editar" onClick={(e) => { e.stopPropagation(); onEditQuote?.(q.id); }}><Icon.Edit size={14}/></button>
                      {canApproveQuotes ? (
                        <button type="button" className="row-action" title="Aprovar" onClick={(e) => { e.stopPropagation(); handleApproveQuote(q.id); }}><Icon.Check size={14}/></button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </DashboardCard>
        </div>
        <div className="col-6">
          <div className="card stock-dash-mini" style={{ height: "100%" }}>
            <div className="card-head">
              <h3>
                <span style={{ color: "var(--destructive)", display: "flex" }}><Icon.Package size={18}/></span>
                Compras urgentes
                <span className="count">{compraUrgente.length}</span>
              </h3>
              <div className="actions">
                <button type="button" className="link-underline" onClick={() => onNav({ page: "stock" })} style={{ fontSize: 10 }}>
                  Ver estoque
                </button>
              </div>
            </div>
            <div className="card-body stock-dash-mini-body">
              {compraUrgente.length === 0 ? (
                <div className="muted small" style={{ padding: "8px 0", textAlign: "center" }}>
                  Nenhum produto abaixo de 20% da capacidade.
                </div>
              ) : (
                compraUrgente.slice(0, 6).map((p) => (
                  <div key={p.id} className="stock-dash-row" onClick={() => onNav({ page: "stock" })} role="button">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="title" style={{ fontSize: 12 }}>{p.nome}</div>
                      <div className="meta mono" style={{ fontSize: 10 }}>{p.sku} · sugerido +{suggestedOrderQty(p)} {p.unidade}</div>
                    </div>
                    <div style={{ width: 88, flexShrink: 0 }}>
                      <StockLevelBar ratio={stockLevelRatio(p)}/>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section: Tarefas */}
      <div className="dash-section-title">
        <span>Tarefas</span>
        <div className="rule"></div>
      </div>
      <div className="dash-grid">
        {/* KPIs */}
        <div className="col-4">
          <div className="kpi tall" onClick={() => onNav({ page: "tasks", filter: "naoAgendadas" })} style={{ cursor: "pointer" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Não agendadas</span>
              <Icon.Calendar size={14} style={{ color: "var(--gold)" }}/>
            </div>
            <div className="stat">
              <div className="num">{naoAgendadas.length}</div>
              <div className="delta">Pendentes de agenda</div>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="kpi tall" onClick={() => onNav({ page: "tasks", filter: "semTecnico" })} style={{ cursor: "pointer" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Sem técnico</span>
              <Icon.Users size={14} style={{ color: "var(--gold)" }}/>
            </div>
            <div className="stat">
              <div className="num">{semTecnico.length}</div>
              <div className="delta down">Designar agora</div>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="kpi tall" onClick={() => onNav({ page: "tasks", filter: "qa" })} style={{ cursor: "pointer" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Pronto para QA</span>
              <Icon.CheckCircle size={14} style={{ color: "var(--gold)" }}/>
            </div>
            <div className="stat">
              <div className="num">{qa.length}</div>
              <div className="delta up">Aguardando revisão</div>
            </div>
          </div>
        </div>

        {/* Próximos agendamentos (7 dias) */}
        <div className="col-6">
          <DashboardCard
            title="Próximos agendamentos"
            icon="Calendar"
            count={proximosAgendamentos.length}
            action={(
              <button
                type="button"
                className="link-underline"
                onClick={() => onNav({ page: "calendar" })}
                style={{ fontSize: 10 }}
              >
                Ver calendário
              </button>
            )}
          >
            {proximosAgendamentos.length === 0 ? (
              <div className="muted small" style={{ padding: 8 }}>
                Nenhuma tarefa agendada para os próximos 7 dias.
              </div>
            ) : null}
            {proximosAgendamentos.slice(0, 6).map((t) => (
              <div key={t.id} className="task-list-row" onClick={() => onOpenTask(t.id)} role="button">
                <span className="id mono">{t.id}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.projeto}</div>
                  <div className="meta">
                    <span>{t.cliente}</span>
                    <span className="dotsep"></span>
                    <span>{t.servico}</span>
                    <span className="dotsep"></span>
                    <span style={{ color: "var(--gold)" }}>{t.dataAgendada} · {t.horario || "—"}</span>
                  </div>
                </div>
                <div className="right">
                  {t.tecnico ? (
                    <span className="muted small">{t.tecnico.split(" ").pop()}</span>
                  ) : (
                    <span className="warn-text" style={{ color: "#d4a017", fontSize: 10 }}>Sem técnico</span>
                  )}
                  <StatusBadge>{t.status}</StatusBadge>
                </div>
              </div>
            ))}
          </DashboardCard>
        </div>

        {/* Sem técnico detail */}
        <div className="col-6">
          <DashboardCard
            title="Tarefas sem Técnico"
            icon="Users"
            count={semTecnico.length}
            action={<button className="link-underline" onClick={() => onNav({ page: "tasks", filter: "semTecnico" })} style={{ fontSize: 10 }}>Ver todas</button>}
          >
            {semTecnico.length === 0 ? <div className="muted small" style={{ padding: 8 }}>Tudo designado.</div> : null}
            {semTecnico.map((t) => (
              <div key={t.id} className="task-list-row">
                <span className="id mono">{t.id}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.projeto}</div>
                  <div className="meta">
                    <span>{t.cliente}</span>
                    <span className="dotsep"></span>
                    <span>{t.servico}</span>
                    <span className="dotsep"></span>
                    <span style={{ color: "var(--gold)" }}>{t.dataAgendada ? `${t.dataAgendada} · ${t.horario}` : "Sem agenda"}</span>
                  </div>
                </div>
                <div className="right">
                  {!readOnly ? (
                    <Button size="sm" onClick={() => onAssignTech(t.id)}>Designar</Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => onOpenTask(t.id)}>Ver</Button>
                  )}
                </div>
              </div>
            ))}
          </DashboardCard>
        </div>

        {/* Não agendadas */}
        <div className="col-6">
          <DashboardCard
            title="Tarefas Não Agendadas"
            icon="Calendar"
            count={naoAgendadas.length}
            action={<button className="link-underline" onClick={() => onNav({ page: "tasks", filter: "naoAgendadas" })} style={{ fontSize: 10 }}>Ver todas</button>}
          >
            {naoAgendadas.map((t) => (
              <div key={t.id} className="task-list-row">
                <span className="id mono">{t.id}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.projeto}</div>
                  <div className="meta">
                    <span>{t.cliente}</span>
                    <span className="dotsep"></span>
                    <span>{t.servico}</span>
                    <span className="dotsep"></span>
                    <span>Pref. {t.agendaPreferencial}</span>
                  </div>
                </div>
                <div className="right">
                  {!readOnly ? (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); onSchedule(t.id); }}>Agendar</Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onOpenTask(t.id); }}>Ver</Button>
                  )}
                </div>
              </div>
            ))}
          </DashboardCard>
        </div>

        {/* Pronto para QA */}
        <div className="col-6">
          <DashboardCard
            title="Pronto para QA / Revisão"
            icon="CheckCircle"
            count={qa.length}
            action={<button className="link-underline" onClick={() => onNav({ page: "tasks", filter: "qa" })} style={{ fontSize: 10 }}>Ver todas</button>}
          >
            {qa.map((t) => (
              <div key={t.id} className="task-list-row">
                <span className="id mono">{t.id}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.projeto}</div>
                  <div className="meta">
                    <span>{t.cliente}</span>
                    <span className="dotsep"></span>
                    <span>{t.servico}</span>
                    <span className="dotsep"></span>
                    <span>Concluída {(t.qa?.concluidoEm || "—").split(" ")[0]}</span>
                  </div>
                </div>
                <div className="right">
                  <Button size="sm" variant="secondary" onClick={() => onOpenTask(t.id)}>Revisar</Button>
                </div>
              </div>
            ))}
          </DashboardCard>
        </div>

        {/* Today */}
        <div className="col-12">
          <TodayBlock tasks={tasks} onOpenTask={onOpenTask}/>
        </div>

        <div className="col-12">
          <DashboardCard title="Alertas" icon="AlertTriangle" count={alerts.length} tone="danger">
            {alerts.length === 0 ? (
              <div className="muted small" style={{ padding: 8 }}>Nenhum alerta no momento.</div>
            ) : null}
            {alerts.map((a, i) => {
              const ico = a.kind === "success" ? Icon.CheckCircle : a.kind === "danger" ? Icon.XCircle : a.kind === "warn" ? Icon.AlertTriangle : Icon.Info;
              const c = a.kind === "success" ? "#8fbf6a" : a.kind === "danger" ? "var(--destructive)" : a.kind === "warn" ? "#d4a017" : "var(--neutral)";
              return (
                <div key={i} className="task-list-row" style={{ gridTemplateColumns: "24px 1fr auto" }}>
                  <span style={{ color: c, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {createElement(ico, { size: 16 })}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="title">{a.title}</div>
                    <div className="meta"><span>{a.desc}</span></div>
                  </div>
                  <div className="right tiny muted">{a.when}</div>
                </div>
              );
            })}
          </DashboardCard>
        </div>
      </div>
    </div>
    </>
  );
}


export { MiniRow, DashboardCard, TodayBlock, DashboardPage };
