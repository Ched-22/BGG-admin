import React, { useState } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, Field, Input, Select, Modal, StatusBadge } from "../components/ui";

function TechniciansPage({ onOpenTask }) {
  // Enrich tech data
  const baseTechs = BGG_DATA.techs;
  const tasks = BGG_DATA.tasks;
  const techs = baseTechs.map(t => {
    const myTasks = tasks.filter(x => x.tecnico === t.name);
    const ativas = myTasks.filter(x => ["Agendado","Em andamento","Sem técnico"].includes(x.status)).length;
    const concluidas = 40 + Math.floor(Math.random() * 80); // simulated
    const rating = (4.6 + Math.random() * 0.4).toFixed(2);
    return { ...t, myTasks, ativas, concluidas, rating };
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [view, setView] = useState("cards");
  const [detail, setDetail] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = techs.filter(t => {
    if (filter === "Disponíveis" && !t.disponivel) return false;
    if (filter === "Conflitos" && !t.conflito) return false;
    if (filter === "Indisponíveis" && t.disponivel) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.skills.join(" ").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalAtivas = techs.reduce((s, t) => s + t.ativas, 0);
  const totalConcluidas = techs.reduce((s, t) => s + t.concluidas, 0);
  const utilizacaoMedia = Math.round(techs.reduce((s, t) => s + (t.carga / 8) * 100, 0) / techs.length);

  return (
    <>
      <div className="page">
        <div className="page-head">
          <div className="titles">
            <span className="eyebrow-sm">Gestão</span>
            <h2 className="page-title">Técnicos</h2>
            <div className="page-sub">{techs.length} técnicos · {totalAtivas} tarefas ativas · {utilizacaoMedia}% utilização média</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Button variant="secondary" icon={Icon.Calendar}>Ver escala</Button>
            <Button icon={Icon.Plus} onClick={() => setShowNew(true)}>Novo técnico</Button>
          </div>
        </div>

        {/* KPI */}
        <div className="dash-grid" style={{ marginBottom: 22 }}>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Total da equipe</span>
              <div className="stat">
                <div className="num">{techs.length}</div>
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
                <div className="delta up">+12% vs mês anterior</div>
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

        {view === "cards" ? (
          <div className="entity-grid">
            {filtered.map(t => {
              const util = Math.round((t.carga / 8) * 100);
              const utilClass = util > 85 ? "high" : util > 60 ? "med" : "";
              return (
                <div key={t.name} className="entity-card" onClick={() => setDetail(t)}>
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
                      <div className={`fill ${utilClass}`} style={{ width: `${util}%` }}></div>
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
                      {t.skills.map(s => <span key={s} className="tag" style={{ fontSize: 10 }}>{s}</span>)}
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
                  const util = Math.round((t.carga / 8) * 100);
                  const utilClass = util > 85 ? "high" : util > 60 ? "med" : "";
                  return (
                    <tr key={t.name} onClick={() => setDetail(t)}>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          <div className="avatar tech">{t.name.split(" ").pop()}</div>
                          <span style={{ color: "var(--fg)", fontWeight: 500 }}>{t.name}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 240 }}>
                        <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                          {t.skills.slice(0, 3).map(s => <span key={s} className="tag" style={{ fontSize: 10 }}>{s}</span>)}
                        </div>
                      </td>
                      <td className="muted small">{t.agenda}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                          <div className="load-bar" style={{ width: 60 }}>
                            <div className={`fill ${utilClass}`} style={{ width: `${util}%` }}></div>
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

      {/* Detail */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.name : ""}
        sub={detail ? `Especialista BGG · ★ ${detail.rating} · ${detail.skills.length} habilidades` : ""}
        size="lg"
        footer={
          <>
            <Button variant="secondary" icon={Icon.Edit}>Editar</Button>
            <Button icon={Icon.Calendar}>Ver escala</Button>
          </>
        }
      >
        {detail ? (
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
                {detail.skills.map(s => <span key={s} className="tag" style={{ padding: "4px 10px" }}>{s}</span>)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Disponibilidade — próximos 7 dias</div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
              }}>
                {["Hoje","Sex","Sáb","Dom","Seg","Ter","Qua"].map((label, i) => {
                  const busy = detail.conflito && (i === 0 || i === 4);
                  return (
                    <div key={i} style={{
                      border: "1px solid var(--border)",
                      borderRadius: 2,
                      padding: 10,
                      background: "var(--bg-elevated)",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 9, color: "var(--fg-6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
                      <div className="mono" style={{ fontSize: 14, color: "var(--fg)", margin: "4px 0" }}>{21 + i > 31 ? (21 + i - 31) : 21 + i}/05</div>
                      <div className="tiny" style={{ color: busy ? "var(--destructive)" : i === 3 ? "var(--fg-6)" : "#8fbf6a" }}>
                        {busy ? "Conflito" : i === 3 ? "Folga" : detail.agenda.split(" · ")[1] || "08-18h"}
                      </div>
                    </div>
                  );
                })}
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
            <Button icon={Icon.Plus} onClick={() => setShowNew(false)}>Cadastrar técnico</Button>
          </>
        }
      >
        <div className="col" style={{ gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nome completo"><Input placeholder="Ex: Pedro Detalhista"/></Field>
            <Field label="E-mail"><Input type="email" leading={<Icon.Mail size={14}/>}/></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Telefone"><Input leading={<Icon.Phone size={14}/>}/></Field>
            <Field label="Início"><Input type="date"/></Field>
          </div>
          <Field label="Habilidades & Especialidades">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {BGG_DATA.serviceTypes.map(s => (
                <label key={s} className="checkbox">
                  <input type="checkbox"/>
                  <span className="box"></span>
                  <span style={{ fontSize: 11 }}>{s}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Agenda padrão" hint="Pode ser ajustado depois">
            <Input placeholder="Seg–Sex · 08:00–18:00"/>
          </Field>
        </div>
      </Modal>
    </>
  );
}


export { TechniciansPage };
