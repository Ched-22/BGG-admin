import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, PageRefreshButton, Field, Input, Modal, StatusBadge, Checkbox, Select, useConfirm } from "../components/ui";
import { useToast } from "../components/ui";
import { ExportMenu } from "../components/ExportMenu";
import { PhoneInput } from "../components/PhoneInput";
import { TECHNICIANS_EXPORT_COLUMNS } from "../lib/exportColumns";
import { DEFAULT_PHONE_COUNTRY_CODE } from "../lib/phoneCountries";
import { formatPhoneDisplay } from "../lib/phoneUtils";
import { TechnicianScheduleModal } from "../components/modals/TechnicianScheduleModal";
import {
  createTechnician,
  getTechnician,
  listTechnicians,
  updateTechnician,
} from "../lib/technicianApi";
import { listCatalogServices } from "../lib/catalogApi";
import {
  COVERAGE_LEGEND,
  coverageClassName,
  technicianCoverageStyle,
} from "../lib/technicianCoverage";

const FILTER_MAP = {
  Todos: { includeInactive: true },
  Disponíveis: { includeInactive: true, available: true, active: true },
  Conflitos: { includeInactive: true, hasScheduleConflict: true, active: true },
  Indisponíveis: { includeInactive: true, available: false, active: true },
  Inativos: { includeInactive: true, active: false },
};

function technicianCardProps(tech) {
  const profile = tech.coverageProfile || 'NONE';
  return {
    className: `entity-card ${coverageClassName(profile)}`,
    style: technicianCoverageStyle(tech),
  };
}

function CoverageLegend() {
  return (
    <div className="tech-coverage-legend">
      {COVERAGE_LEGEND.map(({ profile, label }) => (
        <span key={profile} className={`tech-coverage-legend-item ${coverageClassName(profile)}`}>
          <span className="tech-coverage-legend-swatch" />
          {label}
        </span>
      ))}
    </div>
  );
}
function renderTechStatusBadge(t) {
  if (t.active === false) {
    return <span className="badge muted" style={{ fontSize: 9, padding: "2px 6px" }}><span className="dot"></span>Inativo</span>;
  }
  if (t.conflito) {
    return <span className="badge danger" style={{ fontSize: 9, padding: "2px 6px" }}><span className="dot"></span>Conflito</span>;
  }
  if (!t.disponivel) {
    return <span className="badge muted" style={{ fontSize: 9, padding: "2px 6px" }}><span className="dot"></span>Off</span>;
  }
  return <span className="badge success" style={{ fontSize: 9, padding: "2px 6px" }}><span className="dot"></span>Disponível</span>;
}

function mapTechForUi(t) {
  return {
    ...t,
    active: t.active !== false,
    disponivel: t.available,
    conflito: t.hasScheduleConflict,
    agenda: t.scheduleLabel || "—",
    carga: t.workloadHours ?? 0,
    ativas: t.activeAppointmentsCount ?? 0,
    concluidas: t.completedCount ?? 0,
    util: t.utilizationPercent ?? 0,
  };
}

function technicianServiceLabels(tech, catalogServices = []) {
  if (Array.isArray(tech.services) && tech.services.length) {
    return tech.services.map((s) => s.name || s.code).filter(Boolean);
  }
  const ids = tech.serviceIds || [];
  if (!ids.length) return [];
  const byId = Object.fromEntries(catalogServices.map((s) => [s.id, s.name]));
  return ids.map((id) => byId[id]).filter(Boolean);
}

const EMPTY_TECH_FORM = {
  name: "",
  email: "",
  password: "",
  phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
  phoneNationalNumber: "",
  startedAt: "",
  scheduleLabel: "",
  skills: [],
  serviceIds: [],
  workloadHours: "0",
  available: true,
  active: true,
};

function formatDateInput(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

function technicianToForm(tech) {
  return {
    name: tech.name || "",
    email: tech.email || "",
    password: "",
    phoneCountryCode: tech.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    phoneNationalNumber: tech.phoneNationalNumber || "",
    startedAt: formatDateInput(tech.startedAt),
    scheduleLabel: tech.scheduleLabel || "",
    skills: [...(tech.skills || [])],
    serviceIds: [...(tech.serviceIds || [])],
    workloadHours: String(tech.workloadHours ?? 0),
    available: tech.available !== false,
    active: tech.active !== false,
  };
}

function TechnicianFormFields({ form, setForm, catalogServices = [], passwordRequired = false, showStatus = false }) {
  const toggleServiceId = (serviceId) => {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(serviceId)
        ? f.serviceIds.filter((id) => id !== serviceId)
        : [...f.serviceIds, serviceId],
    }));
  };

  return (
    <div className="col" style={{ gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nome completo">
          <Input
            placeholder="Ex: Pedro Detalhista"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>
        <Field label="E-mail">
          <Input
            type="email"
            leading={<Icon.Mail size={14}/>}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </Field>
      </div>
      <Field
        label={passwordRequired ? "Senha (mín. 8 caracteres)" : "Nova senha"}
        optional={!passwordRequired}
        hint={passwordRequired ? undefined : "Deixe em branco para manter a senha atual"}
      >
        <Input
          type="password"
          placeholder={passwordRequired ? "" : "Opcional"}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Telefone">
          <PhoneInput
            countryCode={form.phoneCountryCode}
            nationalNumber={form.phoneNationalNumber}
            onChange={({ countryCode, nationalNumber }) =>
              setForm((f) => ({
                ...f,
                phoneCountryCode: countryCode,
                phoneNationalNumber: nationalNumber,
              }))
            }
          />
        </Field>
        <Field label="Data de início">
          <Input
            type="date"
            value={form.startedAt}
            onChange={(e) => setForm((f) => ({ ...f, startedAt: e.target.value }))}
          />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Carga horária diária" hint="Capacidade máxima do dia (0–8 h). A utilização sobe com agendamentos.">
          <Input
            type="number"
            min={0}
            max={8}
            step={1}
            value={form.workloadHours}
            onChange={(e) => setForm((f) => ({ ...f, workloadHours: e.target.value }))}
          />
        </Field>
        <Field label="Disponibilidade">
          <Checkbox
            checked={form.available}
            onChange={(checked) => setForm((f) => ({ ...f, available: checked }))}
            label="Disponível para novos atendimentos"
          />
        </Field>
      </div>
      {showStatus ? (
        <Field label="Status da conta" hint="Técnicos inativos não aparecem em designações nem no login.">
          <Select
            value={form.active ? "active" : "inactive"}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "active" }))}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </Select>
        </Field>
      ) : null}
      <Field label="Serviços que executa">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {catalogServices.filter((s) => s.active).map((s) => (
            <label key={s.id} className="checkbox">
              <input
                type="checkbox"
                checked={form.serviceIds.includes(s.id)}
                onChange={() => toggleServiceId(s.id)}
              />
              <span className="box"></span>
              <span style={{ fontSize: 11 }}>{s.name}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Agenda padrão">
        <Input
          placeholder="Seg–Sex · 08:00–18:00"
          value={form.scheduleLabel}
          onChange={(e) => setForm((f) => ({ ...f, scheduleLabel: e.target.value }))}
        />
      </Field>
    </div>
  );
}

function formatAppointmentWhen(scheduledAt) {
  if (!scheduledAt) return "—";
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapAssignedTaskFromApi(task) {
  return {
    id: task.id || task.displayId,
    projeto: task.projeto,
    cliente: task.cliente,
    dataAgendada: task.dataAgendada,
    horario: task.horario,
    status: task.status,
  };
}

function filterTasksForTechnician(taskRows, technicianName) {
  const norm = (technicianName || "").trim().toLowerCase();
  if (!norm) return [];
  return (taskRows || []).filter(
    (t) => t.tecnico?.trim().toLowerCase() === norm && t.status !== "Cancelado",
  );
}

function buildTechnicianAgendamentos(appointments, assignedTasks) {
  const fromAppointments = (appointments || []).map((a) => ({
    ...a,
    source: "appointment",
    label: a.vehicle
      ? `${a.vehicle.brand || ""} ${a.vehicle.model || ""} · ${a.vehicle.plate || "—"}`.trim()
      : "—",
  }));

  const fromTasks = (assignedTasks || [])
    .filter((t) => t.dataAgendada && t.horario)
    .map((t) => {
      const time = String(t.horario).length === 5 ? `${t.horario}:00` : String(t.horario);
      return {
        id: `task-${t.id}`,
        taskId: t.id,
        scheduledAt: `${t.dataAgendada}T${time}`,
        status: t.status,
        source: "task",
        label: t.projeto || t.servico || t.id,
      };
    });

  return [...fromTasks, ...fromAppointments].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );
}

function buildTechnicianDetailState(full, mapped, tasksFromApp) {
  const assignedFromApi = (full.assignedTasks || []).map(mapAssignedTaskFromApi);
  const myTasks = assignedFromApi.length
    ? assignedFromApi
    : filterTasksForTechnician(tasksFromApp, mapped.name).map((t) => ({
        id: t.id,
        projeto: t.projeto,
        cliente: t.cliente,
        dataAgendada: t.dataAgendada,
        horario: t.horario,
        status: t.status,
      }));

  return {
    ...mapped,
    myTasks,
    agendamentos: buildTechnicianAgendamentos(full.appointments, myTasks),
  };
}

function TechniciansPage({ readOnly = false, tasks = [], onOpenTask }) {
  const toast = useToast();
  const [confirm, ConfirmEl] = useConfirm();
  const PAGE_SIZE = 15;

  const [techs, setTechs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [view, setView] = useState("cards");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState({ ...EMPTY_TECH_FORM });
  const [editForm, setEditForm] = useState({ ...EMPTY_TECH_FORM });
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleFocusTech, setScheduleFocusTech] = useState(null);
  const [catalogServices, setCatalogServices] = useState([]);

  useEffect(() => {
    listCatalogServices()
      .then(({ data }) => setCatalogServices(data))
      .catch(() => setCatalogServices([]));
  }, []);

  const openTeamSchedule = (tech = null) => {
    setScheduleFocusTech(tech ? { id: tech.id, name: tech.name } : null);
    setShowSchedule(true);
  };

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...FILTER_MAP[filter],
      };
      const res = await listTechnicians(params);
      setTechs((res.data || []).map(mapTechForUi));
      setTotal(res.total ?? res.data?.length ?? 0);
      setTotalPages(res.totalPages ?? 1);
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
  }, [search, filter, page, toast]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  useEffect(() => {
    const t = setTimeout(() => loadList(), 300);
    return () => clearTimeout(t);
  }, [loadList]);

  const openDetail = async (tech) => {
    setDetail({ ...tech, myTasks: [], agendamentos: [] });
    setDetailLoading(true);
    try {
      const full = await getTechnician(tech.id);
      const mapped = mapTechForUi(full);
      setDetail(buildTechnicianDetailState(full, mapped, tasks));
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

  const buildTechnicianPayload = (form, { requirePassword = false } = {}) => {
    if (!form.name?.trim() || !form.email?.trim()) {
      return { error: "Nome e e-mail são obrigatórios." };
    }
    if (requirePassword && !form.password?.trim()) {
      return { error: "Senha é obrigatória no cadastro." };
    }
    if (form.password?.trim() && form.password.trim().length < 8) {
      return { error: "A senha deve ter pelo menos 8 caracteres." };
    }
    const workloadHours = Number(form.workloadHours);
    if (Number.isNaN(workloadHours) || workloadHours < 0 || workloadHours > 8) {
      return { error: "Carga horária deve ser entre 0 e 8." };
    }

    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      phoneCountryCode: form.phoneCountryCode || undefined,
      phoneNationalNumber: form.phoneNationalNumber || undefined,
      startedAt: form.startedAt || undefined,
      scheduleLabel: form.scheduleLabel?.trim() || undefined,
      skills: form.skills,
      serviceIds: form.serviceIds,
      workloadHours,
      available: form.available,
    };
    if (form.active !== undefined) body.active = form.active;
    if (form.password?.trim()) body.password = form.password.trim();
    return { body };
  };

  const refreshDetail = async (techId) => {
    const full = await getTechnician(techId);
    const mapped = mapTechForUi(full);
    const next = buildTechnicianDetailState(full, mapped, tasks);
    setDetail(next);
    return next;
  };

  const handleCreate = async () => {
    const { body, error } = buildTechnicianPayload(newForm, { requirePassword: true });
    if (error) {
      toast({ kind: "error", title: "Campos inválidos", desc: error });
      return;
    }
    setSaving(true);
    try {
      await createTechnician(body);
      toast({ kind: "success", title: "Técnico cadastrado", desc: newForm.name });
      setShowNew(false);
      setNewForm({ ...EMPTY_TECH_FORM });
      loadList();
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Erro ao cadastrar",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Técnico",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    if (!detail) return;
    setEditForm(technicianToForm(detail));
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    if (!detail?.id) return;
    const { body, error } = buildTechnicianPayload(editForm);
    if (error) {
      toast({ kind: "error", title: "Campos inválidos", desc: error });
      return;
    }
    setSaving(true);
    try {
      await updateTechnician(detail.id, body);
      await refreshDetail(detail.id);
      toast({ kind: "success", title: "Técnico atualizado", desc: editForm.name });
      setShowEdit(false);
      loadList();
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Erro ao atualizar",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Técnico",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!detail?.id || readOnly) return;
    const nextActive = !detail.active;
    const ok = await confirm({
      title: nextActive ? "Reativar técnico?" : "Inativar técnico?",
      body: nextActive
        ? `${detail.name} voltará a poder fazer login e ser designado em tarefas.`
        : `${detail.name} deixará de aparecer em designações e não poderá fazer login.`,
      ok: nextActive ? "Reativar" : "Inativar",
      danger: !nextActive,
    });
    if (!ok) return;
    setSaving(true);
    try {
      await updateTechnician(detail.id, { active: nextActive });
      await refreshDetail(detail.id);
      toast({
        kind: "success",
        title: nextActive ? "Técnico reativado" : "Técnico inativado",
        desc: detail.name,
      });
      loadList();
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Erro ao atualizar status",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Técnico",
      });
    } finally {
      setSaving(false);
    }
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
            <PageRefreshButton onClick={loadList} loading={loading}/>
            <ExportMenu
              filenameBase="tecnicos"
              sheetName="Técnicos"
              columns={TECHNICIANS_EXPORT_COLUMNS}
              rows={filtered}
              disabled={loading}
            />
            <Button variant="secondary" icon={Icon.Calendar} onClick={() => openTeamSchedule()}>Ver escala</Button>
            {!readOnly ? (
              <Button icon={Icon.Plus} onClick={() => setShowNew(true)}>Novo técnico</Button>
            ) : null}
          </div>
        </div>

        <div className="dash-grid" style={{ marginBottom: 22 }}>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Total da equipe</span>
              <div className="stat">
                <div className="num">{total}</div>
                <div className="delta">Profissionais cadastrados</div>
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
            {["Todos", "Disponíveis", "Conflitos", "Indisponíveis", "Inativos"].map(s => (
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

        <CoverageLegend />

        {loading ? (
          <div className="muted small" style={{ padding: 40, textAlign: "center" }}>A carregar técnicos…</div>
        ) : filtered.length === 0 ? (
          <div className="muted small" style={{ padding: 40, textAlign: "center" }}>Nenhum técnico encontrado.</div>
        ) : view === "cards" ? (
          <div className="entity-grid">
            {filtered.map(t => {
              const util = t.util;
              const utilClass = util > 85 ? "high" : util > 60 ? "med" : "";
              const cardProps = technicianCardProps(t);
              return (
                <div
                  key={t.id}
                  className={cardProps.className}
                  style={cardProps.style}
                  onClick={() => openDetail(t)}
                >
                  <div className="head">
                    <div className="avatar" style={{ background: "var(--bg-elevated)", color: "var(--fg)", border: "1px solid var(--border)" }}>
                      {t.name.split(" ").pop()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="name">{t.name}</div>
                      <div className="role">Especialista BGG</div>
                    </div>
                    {renderTechStatusBadge(t)}
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
                    <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-6)", marginBottom: 6 }}>Serviços</div>
                    <div className="skills">
                      {technicianServiceLabels(t, catalogServices).map((s) => <span key={s} className="tag" style={{ fontSize: 10 }}>{s}</span>)}
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
                  <th>Serviços</th>
                  <th>Agenda</th>
                  <th style={{ width: 110, textAlign: "right" }}>Utilização</th>
                  <th style={{ width: 80, textAlign: "right" }}>Ativas</th>
                  <th style={{ width: 100, textAlign: "right" }}>Concluídas</th>
                  <th style={{ width: 100 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const util = t.util;
                  const utilClass = util > 85 ? "high" : util > 60 ? "med" : "";
                  const cardProps = technicianCardProps(t);
                  return (
                    <tr key={t.id} onClick={() => openDetail(t)}>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          <div
                            className={`avatar tech tech-coverage-avatar ${coverageClassName(t.coverageProfile || 'NONE')}`}
                            style={technicianCoverageStyle(t)}
                          >
                            {t.name.split(" ").pop()}
                          </div>
                          <span style={{ color: "var(--fg)", fontWeight: 500 }}>{t.name}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 240 }}>
                        <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                          {technicianServiceLabels(t, catalogServices).slice(0, 3).map((s) => <span key={s} className="tag" style={{ fontSize: 10 }}>{s}</span>)}
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
                      <td>
                        {renderTechStatusBadge(t)}
                      </td>
                    </tr>
                  );
                })}
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

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.name : ""}
        sub={detail ? `Especialista BGG · ${technicianServiceLabels(detail, catalogServices).length} serviços` : ""}
        size="lg"
        footer={readOnly ? (
          <Button icon={Icon.Calendar} onClick={() => openTeamSchedule(detail)}>Ver escala</Button>
        ) : (
          <>
            <Button
              variant={detail?.active === false ? "primary" : "danger"}
              disabled={saving}
              onClick={handleToggleActive}
            >
              {detail?.active === false ? "Reativar técnico" : "Inativar técnico"}
            </Button>
            <Button variant="secondary" icon={Icon.Edit} onClick={openEdit}>Editar</Button>
            <Button icon={Icon.Calendar} onClick={() => openTeamSchedule(detail)}>Ver escala</Button>
          </>
        )}
      >
        {detailLoading ? (
          <div className="muted small" style={{ padding: 24, textAlign: "center" }}>A carregar…</div>
        ) : detail ? (
          <div className="col" style={{ gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
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
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Informações de contacto</div>
              <div className="kv-row"><span className="k">E-mail</span><span className="v">{detail.email || "—"}</span></div>
              <div className="kv-row"><span className="k">Telefone</span><span className="v">{formatPhoneDisplay(detail.phoneCountryCode, detail.phoneNationalNumber)}</span></div>
              <div className="kv-row"><span className="k">Início</span><span className="v">{detail.startedAt ? formatDateInput(detail.startedAt) : "—"}</span></div>
              <div className="kv-row"><span className="k">Agenda</span><span className="v">{detail.scheduleLabel || "—"}</span></div>
              <div className="kv-row"><span className="k">Carga diária</span><span className="v">{detail.workloadHours ?? 0} h</span></div>
              <div className="kv-row">
                <span className="k">Status da conta</span>
                <span className="v">{detail.active === false ? "Inativo" : "Ativo"}</span>
              </div>
              <div className="kv-row">
                <span className="k">Disponível</span>
                <span className="v">{detail.available ? "Sim" : "Não"}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Serviços do catálogo</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {technicianServiceLabels(detail, catalogServices).map((s) => <span key={s} className="tag" style={{ padding: "4px 10px" }}>{s}</span>)}
                {technicianServiceLabels(detail, catalogServices).length === 0 ? (
                  <span className="muted small">Nenhum serviço associado.</span>
                ) : null}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Agendamentos</div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Veículo / Projeto</th>
                      <th>Quando</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.agendamentos || []).map((a) => (
                      <tr
                        key={a.id}
                        style={a.taskId ? { cursor: "pointer" } : undefined}
                        onClick={a.taskId ? () => { setDetail(null); onOpenTask(a.taskId); } : undefined}
                      >
                        <td className="id mono small">{a.taskId || a.id.slice(0, 8)}</td>
                        <td>{a.label}</td>
                        <td className="mono muted small">{formatAppointmentWhen(a.scheduledAt)}</td>
                        <td><StatusBadge>{a.status}</StatusBadge></td>
                      </tr>
                    ))}
                    {(detail.agendamentos || []).length === 0 ? (
                      <tr><td colSpan="4" className="muted small" style={{ textAlign: "center", padding: 24 }}>Nenhum agendamento.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Tarefas designadas</div>
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
        <TechnicianFormFields form={newForm} setForm={setNewForm} catalogServices={catalogServices} passwordRequired/>
      </Modal>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Editar técnico"
        sub={detail ? detail.name : ""}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button icon={Icon.Check} disabled={saving} onClick={handleUpdate}>
              {saving ? "A guardar…" : "Guardar alterações"}
            </Button>
          </>
        }
      >
        <TechnicianFormFields form={editForm} setForm={setEditForm} catalogServices={catalogServices} showStatus/>
      </Modal>

      {ConfirmEl}

      <TechnicianScheduleModal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        technicians={techs}
        tasks={tasks}
        initialTechName={scheduleFocusTech?.name ?? null}
        onOpenTask={(taskId) => {
          setShowSchedule(false);
          onOpenTask?.(taskId);
        }}
      />
    </>
  );
}

export { TechniciansPage };
