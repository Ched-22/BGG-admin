import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, Field, Input, Modal, StatusBadge } from "../components/ui";
import { useToast } from "../components/ui";
import {
  createTechnician,
  getTechnician,
  listTechnicians,
} from "../lib/technicianApi";

const FILTER_MAP = {
  Todos: {},
  Disponíveis: { available: true },
  Conflitos: { hasScheduleConflict: true },
  Indisponíveis: { available: false },
};

function mapTechForUi(t) {
  return {
    ...t,
    disponivel: t.available,
    conflito: t.hasScheduleConflict,
    agenda: t.scheduleLabel || "—",
    carga: t.workloadHours ?? 0,
    ativas: t.activeAppointmentsCount ?? 0,
    concluidas: t.completedCount ?? 0,
    util: t.utilizationPercent ?? 0,
  };
}

function TechniciansPage({ onOpenTask }) {
  const toast = useToast();
  const mockTasks = BGG_DATA.tasks;

  const [techs, setTechs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [view, setView] = useState("cards");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    startedAt: "",
    scheduleLabel: "",
    skills: [],
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: 1,
        limit: 100,
        ...(search ? { search } : {}),
        ...FILTER_MAP[filter],
      };
      const res = await listTechnicians(params);
      setTechs((res.data || []).map(mapTechForUi));
      setTotal(res.total ?? res.data?.length ?? 0);
    } catch (err) {
      const msg = err.response?.data?.message;
      const desc = Array.isArray(msg) ? msg.join(', ') : msg || 'Técnicos';
      if (err.response?.status === 403) {
        toast({
          kind: "error",
          title: "Sem permissão",
          desc: desc.includes('administrador')
            ? desc
            : 'Faça login com uma conta ADMIN (ex.: admin@bgggarage.com).',
        });
      } else {
        toast({ kind: "error", title: "Erro ao carregar", desc });
      }
      setTechs([]);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    const t = setTimeout(() => loadList(), 300);
    return () => clearTimeout(t);
  }, [loadList]);

  const openDetail = async (tech) => {
    setDetail({ ...tech, myTasks: [], appointments: [] });
    setDetailLoading(true);
    try {
      const full = await getTechnician(tech.id);
      const mapped = mapTechForUi(full);
      const myTasks = mockTasks.filter((x) => x.tecnico === mapped.name);
      setDetail({
        ...mapped,
        myTasks,
        appointments: full.appointments || [],
      });
    } catch (err) {
      toast({ kind: "error", title: "Erro ao carregar", desc: err.response?.data?.message || "Técnico" });
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = techs;

  const totalAtivas = useMemo(
    () => techs.reduce((s, t) => s + t.ativas, 0),
    [techs],
  );
  const totalConcluidas = useMemo(
    () => techs.reduce((s, t) => s + t.concluidas, 0),
    [techs],
  );
  const utilizacaoMedia = useMemo(() => {
    if (!techs.length) return 0;
    return Math.round(techs.reduce((s, t) => s + t.util, 0) / techs.length);
  }, [techs]);

  const toggleSkill = (skill) => {
    setNewForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));
  };

  const handleCreate = async () => {
    if (!newForm.name || !newForm.email || !newForm.password) {
      toast({ kind: "error", title: "Campos obrigatórios", desc: "Nome, e-mail e senha" });
      return;
    }
    setSaving(true);
    try {
      await createTechnician({
        name: newForm.name,
        email: newForm.email,
        password: newForm.password,
        phone: newForm.phone || undefined,
        startedAt: newForm.startedAt || undefined,
        scheduleLabel: newForm.scheduleLabel || undefined,
        skills: newForm.skills,
      });
      toast({ kind: "success", title: "Técnico cadastrado", desc: newForm.name });
      setShowNew(false);
      setNewForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        startedAt: "",
        scheduleLabel: "",
        skills: [],
      });
      loadList();
    } catch (err) {
      toast({ kind: "error", title: "Erro ao cadastrar", desc: err.response?.data?.message || "Técnico" });
    } finally {
      setSaving(false);
    }
  };

  const formatAppointmentWhen = (scheduledAt) => {
    if (!scheduledAt) return "—";
    const d = new Date(scheduledAt);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="page">
        <div className="page-head">
          <div className="titles">
            <span className="eyebrow-sm">Gestão</span>
            <h2 className="page-title">Técnicos</h2>
            <div className="page-sub">
              {loading ? "A carregar…" : `${total} técnicos · ${totalAtivas} tarefas ativas · ${utilizacaoMedia}% utilização média`}
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Button variant="secondary" icon={Icon.Calendar}>Ver escala</Button>
            <Button icon={Icon.Plus} onClick={() => setShowNew(true)}>Novo técnico</Button>
          </div>
        </div>

        <div className="dash-grid" style={{ marginBottom: 22 }}>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Total da equipe</span>
              <div className="stat">
                <div className="num">{total}</div>
                <div className="delta">Profissionais ativos</div>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Tarefas ativas</span>
              <div className="stat">
                <div className="num">{totalAtivas}</div>
                <div className="delta">Em execução</div>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Concluídas (mês)</span>
              <div className="stat">
                <div className="num">{totalConcluidas}</div>
                <div className="delta up">API · mês corrente</div>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Utilização média</span>
              <div className="stat">
                <div className="num" style={{ color: utilizacaoMedia > 80 ? "#d4a017" : "var(--gold)" }}>{utilizacaoMedia}<span style={{ fontSize: 18, marginLeft: 2 }}>%</span></div>
                <div className="delta">Capacidade alocada</div>
              </div>
            </div>
          </div>
        </div>

        <div className="entity-toolbar">
          <div className="searchbar" style={{ width: 280, background: "var(--bg)", border: "1px solid var(--border)" }}>
            <Icon.Search size={14}/>
            <input placeholder="Buscar por nome ou habilidade…" value={search} onChange={(e) => setSearch(e.target.value)}/>
          </div>
          <div className="toolbar-tabs">
            {["Todos", "Disponíveis", "Conflitos", "Indisponíveis"].map(s => (
              <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
          <div style={{ flex: 1 }}/>
          <div className="view-toggle">
            <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")} title="Cards">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title="Tabela">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="4"/><rect x="3" y="10" width="18" height="4"/><rect x="3" y="16" width="18" height="4"/></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="muted small" style={{ padding: 40, textAlign: "center" }}>A carregar técnicos…</div>
        ) : filtered.length === 0 ? (
          <div className="muted small" style={{ padding: 40, textAlign: "center" }}>Nenhum técnico encontrado.</div>
        ) : view === "cards" ? (
          <div className="entity-grid">
            {filtered.map(t => {
              const util = t.util;
              const utilClass = util > 85 ? "high" : util > 60 ? "med" : "";
              return (
                <div key={t.id} className="entity-card" onClick={() => openDetail(t)}>
                  <div className="head">
                    <div className="avatar" style={{ background: "var(--bg-elevated)", color: "var(--fg)", border: "1px solid var(--border)" }}>
                      {t.name.split(" ").pop()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="name">{t.name}</div>
                      <div className="role">Especialista · ★ {t.rating}</div>
                    </div>
                    {t.conflito ? <span className="badge danger" style={{ fontSize: 9, padding: "2px 6px" }}><span className="dot"></span>Conflito</span>
                      : !t.disponivel ? <span className="badge muted" style={{ fontSize: 9, padding: "2px 6px" }}><span className="dot"></span>Off</span>
                      : <span className="badge success" style={{ fontSize: 9, padding: "2px 6px" }}><span className="dot"></span>Disponível</span>}
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--fg-5)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                      <span>Utilização</span>
                      <span style={{ color: util > 85 ? "var(--destructive)" : util > 60 ? "#d4a017" : "var(--gold)" }}>{util}%</span>
                    </div>
                    <div className="load-bar">
                      <div className={`fill ${utilClass}`} style={{ width: `${Math.min(100, util)}%` }}></div>
                    </div>
                  </div>

                  <div className="stats">
                    <div>
                      <div className="k">Ativas</div>
                      <div className="v">{t.ativas}</div>
                    </div>
                    <div>
                      <div className="k">Concluídas</div>
                      <div className="v">{t.concluidas}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-6)", marginBottom: 6 }}>Habilidades</div>
                    <div className="skills">
                      {(t.skills || []).map(s => <span key={s} className="tag" style={{ fontSize: 10 }}>{s}</span>)}
                    </div>
                  </div>

                  <div className="meta">
                    <div className="row"><span className="ico"><Icon.Calendar size={12}/></span> {t.agenda}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Técnico</th>
                  <th>Habilidades</th>
                  <th>Agenda</th>
                  <th style={{ width: 110, textAlign: "right" }}>Utilização</th>
                  <th style={{ width: 80, textAlign: "right" }}>Ativas</th>
                  <th style={{ width: 100, textAlign: "right" }}>Concluídas</th>
                  <th style={{ width: 80, textAlign: "right" }}>Rating</th>
                  <th style={{ width: 100 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const util = t.util;
                  const utilClass = util > 85 ? "high" : util > 60 ? "med" : "";
                  return (
                    <tr key={t.id} onClick={() => openDetail(t)}>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          <div className="avatar tech">{t.name.split(" ").pop()}</div>
                          <span style={{ color: "var(--fg)", fontWeight: 500 }}>{t.name}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 240 }}>
                        <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                          {(t.skills || []).slice(0, 3).map(s => <span key={s} className="tag" style={{ fontSize: 10 }}>{s}</span>)}
                        </div>
                      </td>
                      <td className="muted small">{t.agenda}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                          <div className="load-bar" style={{ width: 60 }}>
                            <div className={`fill ${utilClass}`} style={{ width: `${Math.min(100, util)}%` }}></div>
                          </div>
                          <span className="mono" style={{ width: 36, textAlign: "right", color: util > 85 ? "var(--destructive)" : "var(--fg)" }}>{util}%</span>
                        </div>
                      </td>
                      <td className="mono" style={{ textAlign: "right" }}>{t.ativas}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{t.concluidas}</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--gold)" }}>★ {t.rating}</td>
                      <td>
                        {t.conflito ? <span className="badge danger"><span className="dot"></span>Conflito</span>
                          : !t.disponivel ? <span className="badge muted"><span className="dot"></span>Off</span>
                          : <span className="badge success"><span className="dot"></span>Disponível</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.name : ""}
        sub={detail ? `Especialista BGG · ★ ${detail.rating} · ${(detail.skills || []).length} habilidades` : ""}
        size="lg"
        footer={
          <>
            <Button variant="secondary" icon={Icon.Edit}>Editar</Button>
            <Button icon={Icon.Calendar}>Ver escala</Button>
          </>
        }
      >
        {detailLoading ? (
          <div className="muted small" style={{ padding: 24, textAlign: "center" }}>A carregar…</div>
        ) : detail ? (
          <div className="col" style={{ gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <div className="kpi" style={{ padding: 12 }}>
                <span className="label" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-5)" }}>Ativas</span>
                <div className="serif" style={{ color: "var(--gold)", fontSize: 24, fontWeight: 500 }}>{detail.ativas}</div>
              </div>
              <div className="kpi" style={{ padding: 12 }}>
                <span className="label" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-5)" }}>Concluídas</span>
                <div className="serif" style={{ color: "var(--gold)", fontSize: 24, fontWeight: 500 }}>{detail.concluidas}</div>
              </div>
              <div className="kpi" style={{ padding: 12 }}>
                <span className="label" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-5)" }}>Carga</span>
                <div className="serif" style={{ color: "var(--gold)", fontSize: 24, fontWeight: 500 }}>{detail.carga}/8</div>
              </div>
              <div className="kpi" style={{ padding: 12 }}>
                <span className="label" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-5)" }}>Rating</span>
                <div className="serif" style={{ color: "var(--gold)", fontSize: 24, fontWeight: 500 }}>★ {detail.rating}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Habilidades & Especialidades</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(detail.skills || []).map(s => <span key={s} className="tag" style={{ padding: "4px 10px" }}>{s}</span>)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Agendamentos (API)</div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Veículo</th>
                      <th>Quando</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.appointments || []).map((a) => (
                      <tr key={a.id}>
                        <td className="id mono small">{a.id.slice(0, 8)}…</td>
                        <td>{a.vehicle?.brand} {a.vehicle?.model} · {a.vehicle?.plate}</td>
                        <td className="mono muted small">{formatAppointmentWhen(a.scheduledAt)}</td>
                        <td><StatusBadge>{a.status}</StatusBadge></td>
                      </tr>
                    ))}
                    {(detail.appointments || []).length === 0 ? (
                      <tr><td colSpan="4" className="muted small" style={{ textAlign: "center", padding: 24 }}>Nenhum agendamento.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Tarefas designadas (mock)</div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Projeto</th>
                      <th>Cliente</th>
                      <th>Quando</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.myTasks.map(t => (
                      <tr key={t.id} onClick={() => { setDetail(null); onOpenTask(t.id); }}>
                        <td className="id">{t.id}</td>
                        <td>{t.projeto}</td>
                        <td>{t.cliente}</td>
                        <td className="mono muted small">{t.dataAgendada || "—"} · {t.horario || "—"}</td>
                        <td><StatusBadge>{t.status}</StatusBadge></td>
                      </tr>
                    ))}
                    {detail.myTasks.length === 0 ? (
                      <tr><td colSpan="5" className="muted small" style={{ textAlign: "center", padding: 24 }}>Nenhuma tarefa designada no momento.</td></tr>
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
        title="Novo técnico"
        sub="Cadastro da equipe técnica"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button icon={Icon.Plus} disabled={saving} onClick={handleCreate}>{saving ? "A guardar…" : "Cadastrar técnico"}</Button>
          </>
        }
      >
        <div className="col" style={{ gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nome completo">
              <Input placeholder="Ex: Pedro Detalhista" value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}/>
            </Field>
            <Field label="E-mail">
              <Input type="email" leading={<Icon.Mail size={14}/>} value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))}/>
            </Field>
          </div>
          <Field label="Senha (mín. 8 caracteres)">
            <Input type="password" value={newForm.password} onChange={(e) => setNewForm((f) => ({ ...f, password: e.target.value }))}/>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Telefone">
              <Input leading={<Icon.Phone size={14}/>} value={newForm.phone} onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))}/>
            </Field>
            <Field label="Início">
              <Input type="date" value={newForm.startedAt} onChange={(e) => setNewForm((f) => ({ ...f, startedAt: e.target.value }))}/>
            </Field>
          </div>
          <Field label="Habilidades & Especialidades">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {BGG_DATA.serviceTypes.map(s => (
                <label key={s} className="checkbox">
                  <input type="checkbox" checked={newForm.skills.includes(s)} onChange={() => toggleSkill(s)}/>
                  <span className="box"></span>
                  <span style={{ fontSize: 11 }}>{s}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Agenda padrão" hint="Pode ser ajustado depois">
            <Input placeholder="Seg–Sex · 08:00–18:00" value={newForm.scheduleLabel} onChange={(e) => setNewForm((f) => ({ ...f, scheduleLabel: e.target.value }))}/>
          </Field>
        </div>
      </Modal>
    </>
  );
}

export { TechniciansPage };
