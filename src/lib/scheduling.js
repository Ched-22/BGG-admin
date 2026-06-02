/** Horário comercial e baias da oficina */
export const BAIAS = [1, 2];
export const WORK_START_MIN = 8 * 60;
export const WORK_END_MIN = 18 * 60;
export const MAX_PRESET_DURATION_HOURS = 8;
export const DURATION_OTHER = "other";
export const DURATION_HOUR_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

export function isPresetDurationHours(hours) {
  const h = Number(hours);
  return h > 0 && h <= MAX_PRESET_DURATION_HOURS && DURATION_HOUR_OPTIONS.includes(h);
}

export function resolveDurationHours({ durationMode, duracaoHoras, customDuracaoHoras }) {
  if (durationMode === DURATION_OTHER) return Number(customDuracaoHoras);
  return Number(duracaoHoras);
}

export function parseTimeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = String(time).split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getDurationMinutes(item) {
  if (item.duracaoHoras != null && item.duracaoHoras > 0) {
    return Math.round(Number(item.duracaoHoras) * 60);
  }
  if (item.duracao != null && item.duracao > 0) return Number(item.duracao);
  return 60;
}

export function getEventSlot(event) {
  const start = parseTimeToMinutes(event.horario);
  const end = start + getDurationMinutes(event);
  return {
    id: event.id,
    data: event.data,
    baia: Number(event.baia) || 1,
    start,
    end,
  };
}

export function slotsOverlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

export function formatDurationHours(hours) {
  const h = Number(hours);
  if (h === 1) return "1 hora";
  if (Number.isInteger(h)) return `${h} horas`;
  return `${String(h).replace(".", ",")} h`;
}

/** Retorna o evento que conflita na mesma baia, ou null */
export function findBayConflict(events, candidate, excludeId = null) {
  if (!candidate.data || !candidate.horario || !candidate.baia) return null;
  const candSlot = getEventSlot({
    id: excludeId || candidate.id || "__candidate__",
    data: candidate.data,
    horario: candidate.horario,
    baia: candidate.baia,
    duracaoHoras: candidate.duracaoHoras,
    duracao: candidate.duracao,
  });

  for (const e of events) {
    if (excludeId && e.id === excludeId) continue;
    if (e.data !== candidate.data) continue;
    if (Number(e.baia) !== Number(candidate.baia)) continue;
    if (slotsOverlap(candSlot, getEventSlot(e))) return e;
  }
  return null;
}

export function endsAfterClosing(horario, duracaoHoras) {
  return parseTimeToMinutes(horario) + Number(duracaoHoras) * 60 > WORK_END_MIN;
}

export function getBlockedTimeSlots(events, { data, duracaoHoras, baia, excludeId }, timeSlots) {
  return timeSlots.filter(
    (t) =>
      endsAfterClosing(t, duracaoHoras) ||
      !!findBayConflict(events, { data, horario: t, duracaoHoras, baia }, excludeId)
  );
}

export function buildCalendarEvents(tasks, extras = []) {
  const fromTasks = tasks
    .filter((t) => t.dataAgendada && t.status !== "Cancelado")
    .map((t) => {
      const duracaoHoras = t.duracaoHoras ?? (t.duracao ? t.duracao / 60 : 1.5);
      return {
        id: t.id,
        title: t.projeto,
        cliente: t.cliente,
        servico: t.servico,
        tecnico: t.tecnico,
        data: t.dataAgendada,
        horario: t.horario,
        baia: t.baia ?? 1,
        duracaoHoras,
        duracao: Math.round(duracaoHoras * 60),
        status: t.status,
        endereco: t.endereco,
      };
    });
  return [...fromTasks, ...extras];
}
