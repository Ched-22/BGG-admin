import React, { useState, Fragment, useMemo } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Icon, PageRefreshButton } from "../components/ui";
import { ExportMenu } from "../components/ExportMenu";
import { CALENDAR_EXPORT_COLUMNS } from "../lib/exportColumns";
import { ScheduleModal } from "../components/modals/TaskModals";
import { mapTechniciansForPicker } from "../lib/technicianApi";
import { formatDurationHours, buildMonthDays, formatISODate, todayISO, getEventSlot, getWeekGridEndHour, formatEventTimeRange, WORK_START_MIN } from "../lib/scheduling";

const PT_MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const PT_DOW_LONG = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const PT_DOW_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function serviceClass(s) {
  if (!s) return "";
  if (s.includes("Exterior")) return "s-ext";
  if (s.includes("Interior") || s.includes("Couro") || s.includes("Higienização")) return "s-int";
  if (s.includes("Cerâmica") || s.includes("Vitrificação") || s.includes("Polimento") || s.includes("Proteção")) return "s-cer";
  if (s.includes("PPF")) return "s-ppf";
  if (s.includes("Motos")) return "s-mot";
  return "";
}

/** Marcador compacto no horário agendado (sem altura proporcional à duração). */
function buildWeekEventMarkers(dayEvents) {
  const byStart = new Map();
  for (const e of dayEvents) {
    const start = getEventSlot(e).start;
    if (!byStart.has(start)) byStart.set(start, []);
    byStart.get(start).push(e);
  }
  return dayEvents.map((e) => {
    const start = getEventSlot(e).start;
    const siblings = byStart.get(start) || [e];
    const laneIndex = siblings.findIndex((x) => x.id === e.id);
    return { event: e, start, laneIndex, laneCount: siblings.length };
  });
}

function CalendarPage({ readOnly = false, onOpenTask, events = [], tasks = [], technicians = [], onSaveSchedule, onRefresh }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [view, setView] = useState("month"); // month | week | day
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [techFilter, setTechFilter] = useState("Todos");
  const [serviceFilter, setServiceFilter] = useState("Todos");
  const [showCreate, setShowCreate] = useState(false);
  const techPicker = useMemo(() => mapTechniciansForPicker(technicians), [technicians]);

  const filteredEvents = events.filter(e =>
    (techFilter === "Todos" || e.tecnico === techFilter) &&
    (serviceFilter === "Todos" || e.servico === serviceFilter)
  );

  // Build month grid (always 6 weeks)
  const days = buildMonthDays(cursor.y, cursor.m);
  const todayISOValue = todayISO();

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
  const weekIsos = weekDays.map((d) => formatISODate(d));
  const gridEndHour = useMemo(
    () => getWeekGridEndHour(filteredEvents, weekIsos),
    [filteredEvents, weekIsos.join("|")],
  );
  const hours = useMemo(
    () => Array.from({ length: gridEndHour - 8 + 1 }, (_, i) => i + 8),
    [gridEndHour],
  );
  const hourCount = hours.length;
  const weekGridMinutes = hourCount * 60;

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
            <PageRefreshButton onClick={onRefresh}/>
            <ExportMenu
              filenameBase="calendario"
              sheetName="Calendário"
              columns={CALENDAR_EXPORT_COLUMNS}
              rows={[...filteredEvents].sort((a, b) => {
                const byDate = (a.data || '').localeCompare(b.data || '');
                if (byDate !== 0) return byDate;
                return (a.horario || '').localeCompare(b.horario || '');
              })}
            />
            {!readOnly ? (
              <Button icon={Icon.Plus} onClick={() => setShowCreate(true)}>Novo agendamento</Button>
            ) : null}
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
          <Button size="sm" variant="ghost" onClick={() => {
            const t = new Date();
            setCursor({ y: t.getFullYear(), m: t.getMonth() });
            setSelectedDate(formatISODate(t));
          }}>Hoje</Button>

          <div style={{ flex: 1 }}/>

          <div className="select-wrap">
            <select className="select" value={techFilter} onChange={(e) => setTechFilter(e.target.value)} style={{ minWidth: 180 }}>
              <option value="Todos">Técnico: Todos</option>
              {techPicker.map((t) => <option key={t.id || t.name} value={t.name}>{t.name}</option>)}
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
                  const iso = formatISODate(d);
                  const inMonth = d.getMonth() === cursor.m;
                  const isToday = iso === todayISOValue;
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
                    <div className="time">{formatEventTimeRange({ ...e, data: e.data })}</div>
                    <div className="tiny muted">{formatDurationHours(e.duracaoHoras ?? (e.duracao ? e.duracao / 60 : 1.5))}</div>
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
                    const iso = formatISODate(d);
                    const dayEvs = eventsForDay(iso);
                    const inMonth = d.getMonth() === cursor.m;
                    const isToday = iso === todayISOValue;
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
                <div
                  className="cal-week-grid"
                  style={{ gridTemplateRows: `60px repeat(${hourCount}, 1fr)` }}
                >
                  <div className="cell head corner" style={{ gridColumn: 1, gridRow: 1 }} aria-hidden="true" />
                  {weekDays.map((d, i) => {
                    const iso = formatISODate(d);
                    const isToday = iso === todayISOValue;
                    const isSelected = iso === selectedDate;
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`cell head dow ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                        style={{ gridColumn: i + 2, gridRow: 1 }}
                        onClick={() => setSelectedDate(iso)}
                      >
                        <span>{PT_DOW_SHORT[d.getDay()]}</span>
                        <span className="day-num">{d.getDate()}</span>
                      </button>
                    );
                  })}
                  {hours.map((h, hi) => (
                    <Fragment key={h}>
                      <div className="cell t" style={{ gridColumn: 1, gridRow: hi + 2 }}>
                        {String(h).padStart(2, "0")}:00
                      </div>
                      {weekDays.map((d, di) => {
                        const iso = formatISODate(d);
                        const isToday = iso === todayISOValue;
                        const isSelected = iso === selectedDate;
                        return (
                          <div
                            key={di}
                            className={`cell slot ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                            style={{ gridColumn: di + 2, gridRow: hi + 2 }}
                            onClick={() => setSelectedDate(iso)}
                          />
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
                <div
                  className="cal-week-events-layer"
                  style={{ gridTemplateRows: `60px repeat(${hourCount}, 1fr)` }}
                >
                  {weekDays.map((d, di) => {
                    const iso = formatISODate(d);
                    return (
                      <div
                        key={`overlay-${iso}`}
                        className="cal-week-day-events"
                        style={{ gridColumn: di + 2, gridRow: `2 / span ${hourCount}` }}
                      >
                        {buildWeekEventMarkers(eventsForDay(iso)).map(({ event: e, start, laneIndex, laneCount }) => {
                          const topPct = ((start - WORK_START_MIN) / weekGridMinutes) * 100;
                          const laneWidthPct = 100 / laneCount;
                          const markerStyle = {
                            top: `${topPct}%`,
                            ...(laneCount > 1 ? {
                              left: `calc(4px + ${laneIndex * laneWidthPct}%)`,
                              right: "auto",
                              width: `calc(${laneWidthPct}% - 6px)`,
                            } : {}),
                          };
                          return (
                            <div
                              key={e.id}
                              className={`ev cal-week-marker ${serviceClass(e.servico) || "s-cer"}`}
                              style={markerStyle}
                              onClick={(ev) => { ev.stopPropagation(); onOpenTask(e.id); }}
                              title={`${formatEventTimeRange({ ...e, data: e.data })} · Baia ${e.baia ?? 1} · ${e.title}`}
                            >
                              <span className="time">{e.horario}</span>
                              B{e.baia ?? 1} · {e.title}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScheduleModal
        open={showCreate && !readOnly}
        task={null}
        tasks={tasks}
        events={events}
        technicians={technicians}
        defaultDate={selectedDate}
        onClose={() => setShowCreate(false)}
        onSave={onSaveSchedule}
      />
    </>
  );
}


export { serviceClass, CalendarPage };
