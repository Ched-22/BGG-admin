import React, { useState, Fragment } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon } from "../components/ui";
import { ScheduleModal } from "../components/modals/TaskModals";
import { formatDurationHours } from "../lib/scheduling";

const PT_MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const PT_DOW_LONG = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const PT_DOW_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function serviceClass(s) {
  if (!s) return "";
  if (s.includes("Exterior")) return "s-ext";
  if (s.includes("Interior") || s.includes("Couro") || s.includes("Higienização")) return "s-int";
  if (s.includes("Cerâmica") || s.includes("Vitrificação") || s.includes("Polimento")) return "s-cer";
  if (s.includes("PPF")) return "s-ppf";
  if (s.includes("Motos")) return "s-mot";
  return "";
}

function CalendarPage({ onOpenTask, events = [], tasks = [], onSaveSchedule }) {
  // Default to May 2026
  const [cursor, setCursor] = useState({ y: 2026, m: 4 }); // m is 0-indexed
  const [view, setView] = useState("month"); // month | week | day
  const [selectedDate, setSelectedDate] = useState("2026-05-21");
  const [techFilter, setTechFilter] = useState("Todos");
  const [serviceFilter, setServiceFilter] = useState("Todos");
  const [showCreate, setShowCreate] = useState(false);

  const filteredEvents = events.filter(e =>
    (techFilter === "Todos" || e.tecnico === techFilter) &&
    (serviceFilter === "Todos" || e.servico === serviceFilter)
  );

  // Build month grid (always 6 weeks)
  const firstOfMonth = new Date(cursor.y, cursor.m, 1);
  const startDow = firstOfMonth.getDay();
  const gridStart = new Date(cursor.y, cursor.m, 1 - startDow);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  const todayISO = BGG_DATA.today;

  const formatISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const eventsForDay = (iso) => filteredEvents.filter(e => e.data === iso).sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));

  const selDate = new Date(selectedDate + "T00:00:00");
  const selEvents = eventsForDay(selectedDate);

  // Week navigation helpers
  const weekStart = new Date(selDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 08..18

  return (
    <>
      <div className="page">
        <div className="page-head">
          <div className="titles">
            <span className="eyebrow-sm">Operações · Agenda</span>
            <h2 className="page-title">Calendário</h2>
            <div className="page-sub">{filteredEvents.length} tarefas agendadas · visão consolidada da operação</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Button variant="secondary" icon={Icon.Download}>Exportar</Button>
            <Button icon={Icon.Plus} onClick={() => setShowCreate(true)}>Novo agendamento</Button>
          </div>
        </div>

        <div className="cal-controls">
          <button className="cal-nav-btn" onClick={() => {
            const m = cursor.m - 1;
            setCursor(m < 0 ? { y: cursor.y - 1, m: 11 } : { y: cursor.y, m });
          }}><Icon.ChevronLeft size={14}/></button>
          <div style={{
            fontFamily: "var(--font-display)",
            color: "var(--gold)",
            fontSize: 22,
            letterSpacing: "0.03em",
            minWidth: 200,
          }}>
            {PT_MONTHS[cursor.m]} <span style={{ color: "var(--fg-5)" }}>· {cursor.y}</span>
          </div>
          <button className="cal-nav-btn" onClick={() => {
            const m = cursor.m + 1;
            setCursor(m > 11 ? { y: cursor.y + 1, m: 0 } : { y: cursor.y, m });
          }}><Icon.Chevron size={14}/></button>
          <Button size="sm" variant="ghost" onClick={() => { setCursor({ y: 2026, m: 4 }); setSelectedDate("2026-05-21"); }}>Hoje</Button>

          <div style={{ flex: 1 }}/>

          <div className="select-wrap">
            <select className="select" value={techFilter} onChange={(e) => setTechFilter(e.target.value)} style={{ minWidth: 180 }}>
              <option value="Todos">Técnico: Todos</option>
              {BGG_DATA.techs.map(t => <option key={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div className="select-wrap">
            <select className="select" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} style={{ minWidth: 200 }}>
              <option value="Todos">Serviço: Todos</option>
              {BGG_DATA.serviceTypes.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="view-switcher">
            <button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Mês</button>
            <button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Semana</button>
          </div>
        </div>

        <div className="cal-page-wrap">
          {/* Left column: mini cal + day events */}
          <div>
            <div className="mini-cal">
              <div className="mini-cal-head">
                <span className="month">{PT_MONTHS[cursor.m]}</span>
                <div className="row" style={{ gap: 4 }}>
                  <button className="cal-nav-btn" style={{ width: 26, height: 26 }} onClick={() => {
                    const m = cursor.m - 1;
                    setCursor(m < 0 ? { y: cursor.y - 1, m: 11 } : { y: cursor.y, m });
                  }}><Icon.ChevronLeft size={11}/></button>
                  <button className="cal-nav-btn" style={{ width: 26, height: 26 }} onClick={() => {
                    const m = cursor.m + 1;
                    setCursor(m > 11 ? { y: cursor.y + 1, m: 0 } : { y: cursor.y, m });
                  }}><Icon.Chevron size={11}/></button>
                </div>
              </div>
              <div className="cal">
                {PT_DOW_SHORT.map(d => <div key={d} className="h">{d.slice(0, 1)}</div>)}
                {days.map((d, i) => {
                  const iso = formatISO(d);
                  const inMonth = d.getMonth() === cursor.m;
                  const isToday = iso === todayISO;
                  const sel = iso === selectedDate;
                  const has = filteredEvents.some(e => e.data === iso);
                  return (
                    <button
                      key={i}
                      className={`d ${!inMonth ? "muted" : ""} ${sel ? "sel" : ""} ${isToday && !sel ? "today" : ""}`}
                      style={{ position: "relative", height: 28, fontSize: 11 }}
                      onClick={() => setSelectedDate(iso)}
                    >
                      {d.getDate()}
                      {has && !sel ? <span style={{
                        position: "absolute", bottom: 2,
                        width: 3, height: 3,
                        background: inMonth ? "var(--gold)" : "var(--fg-6)",
                        borderRadius: "50%"
                      }}></span> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="cal-legend mini-cal" style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 6 }}>Legenda</div>
              <div className="item"><span className="dot" style={{ background: "var(--gold)" }}></span>Proteção / Vitrificação</div>
              <div className="item"><span className="dot" style={{ background: "#8fbf6a" }}></span>Detalhamento Exterior</div>
              <div className="item"><span className="dot" style={{ background: "#6a9fbf" }}></span>Interior / Couro</div>
              <div className="item"><span className="dot" style={{ background: "#d4a017" }}></span>PPF</div>
              <div className="item"><span className="dot" style={{ background: "#c46aef" }}></span>Motos</div>
            </div>

            {/* Day events */}
            <div className="day-events">
              <h4>
                {selDate.getDate()} de {PT_MONTHS[selDate.getMonth()]} · {PT_DOW_LONG[selDate.getDay()]}
                <span style={{ float: "right", color: "var(--fg-5)", letterSpacing: 0 }}>{selEvents.length} tarefa{selEvents.length === 1 ? "" : "s"}</span>
              </h4>
              {selEvents.length === 0 ? (
                <div className="muted small" style={{ padding: 10, textAlign: "center" }}>Sem agendamentos nesta data.</div>
              ) : null}
              {selEvents.map(e => (
                <div
                  key={e.id}
                  className={`day-event-row ${serviceClass(e.servico) || "s-cer"}`}
                  onClick={() => onOpenTask(e.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <div className="time">{e.horario}</div>
                    <div className="tiny muted">{e.duracao}min</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="ttl">{e.title}</div>
                    <div className="sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Baia {e.baia ?? 1} · {formatDurationHours(e.duracaoHoras ?? (e.duracao ? e.duracao / 60 : 1.5))} · {e.cliente}
                    </div>
                    <div className="row" style={{ gap: 6, marginTop: 4 }}>
                      {e.tecnico ? <span className="tag" style={{ fontSize: 9, padding: "1px 5px" }}>{e.tecnico}</span> : null}
                      <span className="tag" style={{ fontSize: 9, padding: "1px 5px" }}>{e.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: month or week grid */}
          <div>
            {view === "month" ? (
              <div className="cal-month">
                <div className="cal-month-grid">
                  {PT_DOW_SHORT.map(d => (
                    <div key={d} className="cell head dow">{d}</div>
                  ))}
                  {days.map((d, i) => {
                    const iso = formatISO(d);
                    const dayEvs = eventsForDay(iso);
                    const inMonth = d.getMonth() === cursor.m;
                    const isToday = iso === todayISO;
                    const sel = iso === selectedDate;
                    return (
                      <div
                        key={i}
                        className={`cell cal-day ${!inMonth ? "other-month" : ""} ${isToday ? "today" : ""} ${sel ? "selected" : ""}`}
                        onClick={() => setSelectedDate(iso)}
                      >
                        <div className="num">
                          {d.getDate()}
                          {isToday ? <span className="tiny" style={{ float: "right", color: "var(--gold)", fontSize: 9, letterSpacing: "0.1em" }}>HOJE</span> : null}
                        </div>
                        {dayEvs.slice(0, 3).map(e => (
                          <div
                            key={e.id}
                            className={`ev ${serviceClass(e.servico) || "s-cer"}`}
                            onClick={(ev) => { ev.stopPropagation(); onOpenTask(e.id); }}
                            title={`${e.horario} · Baia ${e.baia ?? 1} · ${e.title}`}
                          >
                            <span className="time">{e.horario}</span>
                            B{e.baia ?? 1} · {e.title}
                          </div>
                        ))}
                        {dayEvs.length > 3 ? <div className="more">+{dayEvs.length - 3} mais</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="cal-week">
                <div className="cal-week-grid">
                  <div className="cell head corner" aria-hidden="true" />
                  {weekDays.map((d, i) => {
                    const iso = formatISO(d);
                    const isToday = iso === todayISO;
                    const isSelected = iso === selectedDate;
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`cell head dow ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedDate(iso)}
                      >
                        <span>{PT_DOW_SHORT[d.getDay()]}</span>
                        <span className="day-num">{d.getDate()}</span>
                      </button>
                    );
                  })}
                  {hours.map((h) => (
                    <Fragment key={h}>
                      <div className="cell t">{String(h).padStart(2, "0")}:00</div>
                      {weekDays.map((d, di) => {
                        const iso = formatISO(d);
                        const isToday = iso === todayISO;
                        const isSelected = iso === selectedDate;
                        const evHere = eventsForDay(iso).filter(e => parseInt(e.horario.split(":")[0], 10) === h);
                        return (
                          <div
                            key={di}
                            className={`cell slot ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                            onClick={() => setSelectedDate(iso)}
                          >
                            {evHere.map((e) => {
                              const mins = parseInt(e.horario.split(":")[1] || "0", 10);
                              const topPct = (mins / 60) * 100;
                              const heightPct = Math.min((e.duracao / 60) * 100, 100 - topPct) - 1;
                              return (
                                <div
                                  key={e.id}
                                  className={`ev ${serviceClass(e.servico) || "s-cer"}`}
                                  style={{ top: `calc(${topPct}% + 2px)`, height: `max(${heightPct}%, 18px)` }}
                                  onClick={(ev) => { ev.stopPropagation(); onOpenTask(e.id); }}
                                  title={`${e.horario} · Baia ${e.baia ?? 1} · ${e.title}`}
                                >
                                  <span className="time">{e.horario}</span>
                                  B{e.baia ?? 1} · {e.title}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScheduleModal
        open={showCreate}
        task={null}
        tasks={tasks}
        events={events}
        defaultDate={selectedDate}
        onClose={() => setShowCreate(false)}
        onSave={onSaveSchedule}
      />
    </>
  );
}


export { serviceClass, CalendarPage };
