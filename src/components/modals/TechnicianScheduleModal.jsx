import React, { useEffect, useMemo, useState } from "react";
import { Button, Icon, Modal } from "../ui";
import {
  buildWeekDays,
  formatWeekRangeLabel,
  findTaskSlotConflicts,
  serviceTypeClass,
  startOfWeekMonday,
  tasksForTechnicianOnDay,
  todayISO,
} from "../../lib/scheduling";
import { isClosedTaskStatus } from "../../lib/taskApi";

const PT_DOW_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function TechnicianScheduleModal({
  open,
  onClose,
  technicians = [],
  tasks = [],
  initialTechName = null,
  onOpenTask,
}) {
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeekMonday(new Date()));
  const [techFilter, setTechFilter] = useState("Todos");

  useEffect(() => {
    if (!open) return;
    setWeekAnchor(startOfWeekMonday(new Date()));
    setTechFilter(initialTechName || "Todos");
  }, [open, initialTechName]);

  const weekDays = useMemo(() => buildWeekDays(weekAnchor), [weekAnchor]);
  const weekLabel = useMemo(() => formatWeekRangeLabel(weekDays), [weekDays]);
  const weekIsos = useMemo(() => new Set(weekDays.map((d) => d.iso)), [weekDays]);
  const today = todayISO();

  const visibleTechs = useMemo(() => {
    const rows = technicians.map((t) => ({ id: t.id, name: t.name }));
    if (techFilter === "Todos") return rows;
    return rows.filter((t) => t.name === techFilter);
  }, [technicians, techFilter]);

  const hasAnyInWeek = useMemo(
    () => tasks.some((t) => (
      t.dataAgendada
      && weekIsos.has(t.dataAgendada)
      && !isClosedTaskStatus(t.status)
      && t.tecnico
      && (techFilter === "Todos" || t.tecnico === techFilter)
    )),
    [tasks, weekIsos, techFilter],
  );

  const shiftWeek = (delta) => {
    setWeekAnchor((cur) => {
      const next = new Date(cur);
      next.setDate(next.getDate() + delta * 7);
      return startOfWeekMonday(next);
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Escala da equipe"
      sub={weekLabel}
      size="xl"
      footer={(
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
      )}
    >
      <div className="team-schedule-wrap">
        <div className="team-schedule-controls">
          <button type="button" className="cal-nav-btn" onClick={() => shiftWeek(-1)} aria-label="Semana anterior">
            <Icon.ChevronLeft size={14}/>
          </button>
          <button type="button" className="cal-nav-btn" onClick={() => setWeekAnchor(startOfWeekMonday(new Date()))}>
            Hoje
          </button>
          <button type="button" className="cal-nav-btn" onClick={() => shiftWeek(1)} aria-label="Próxima semana">
            <Icon.Chevron size={14}/>
          </button>
          <div className="select-wrap" style={{ minWidth: 200, marginLeft: 12 }}>
            <select
              className="select"
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
            >
              <option value="Todos">Técnico: Todos</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {visibleTechs.length === 0 ? (
          <div className="muted small" style={{ padding: "32px 0", textAlign: "center" }}>
            Nenhum técnico encontrado.
          </div>
        ) : (
          <>
            {!hasAnyInWeek ? (
              <div className="muted small" style={{ textAlign: "center" }}>
                Nenhum agendamento nesta semana.
              </div>
            ) : null}
            <div className="team-schedule-grid">
            <div className="team-schedule-row team-schedule-row-head">
              <div className="team-schedule-head corner">Técnico</div>
              {weekDays.map(({ date, iso }) => {
                const isToday = iso === today;
                const dow = PT_DOW_SHORT[date.getDay()];
                return (
                  <div key={iso} className={`team-schedule-head ${isToday ? "today" : ""}`}>
                    <span className="dow">{dow}</span>
                    <span className="day-num">{date.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {visibleTechs.map((tech, index) => (
              <div
                key={`${tech.id ?? "tech"}-${tech.name}-${index}`}
                className="team-schedule-row"
              >
                <div className="team-schedule-tech">
                  <span className="name">{tech.name}</span>
                </div>
                {weekDays.map(({ iso }) => {
                  const dayTasks = tasksForTechnicianOnDay(tasks, tech.name, iso);
                  const conflicts = findTaskSlotConflicts(dayTasks);
                  const isToday = iso === today;
                  return (
                    <div key={iso} className={`team-schedule-cell ${isToday ? "today" : ""}`}>
                      <div className="team-schedule-cell-inner">
                        {dayTasks.map((task) => {
                          const conflict = conflicts.has(task.id);
                          const svcClass = serviceTypeClass(task.servico);
                          return (
                            <button
                              key={task.id}
                              type="button"
                              className={`team-schedule-ev ${svcClass}${conflict ? " conflict" : ""}`}
                              onClick={() => onOpenTask?.(task.id)}
                              title={conflict ? "Conflito de horário" : task.projeto}
                            >
                              <span className="time mono">{task.horario}</span>
                              <span className="label">{task.id} · {task.cliente || task.projeto}</span>
                              {conflict ? <span className="conflict-badge">Conflito</span> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export { TechnicianScheduleModal };
