/** Horário comercial e baias da oficina */
import { isClosedTaskStatus } from './taskApi';

export const BAIAS = [1, 2];
export const WORK_START_MIN = 8 * 60;
export const WORK_END_MIN = 19 * 60;
export const SATURDAY_WORK_END_MIN = 13 * 60;
/** Início do serviço em dias de continuação (após ultrapassar o fechamento). */
export const WORK_CONTINUE_START_MIN = 9 * 60;
export const MAX_PRESET_DURATION_HOURS = 8;
export const DURATION_OTHER = "other";
export const DURATION_HOUR_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];
export const SCHEDULE_TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30",
];

/** Opções de horário 24h para dropdown (intervalos de 30 min). */
export function buildTimeDropdownOptions({
  startHour = 6,
  endHour = 22,
  stepMinutes = 30,
} = {}) {
  const options = [];
  const endMin = endHour * 60 + 59;
  for (let min = startHour * 60; min <= endMin; min += stepMinutes) {
    options.push(minutesToTime(min));
  }
  return options;
}

export function withTimeOption(options, value) {
  const normalized = normalizeTime24(value);
  if (!normalized || options.includes(normalized)) return options;
  return [...options, normalized].sort();
}

export function isPresetDurationHours(hours) {
  const h = Number(hours);
  return h > 0 && h <= MAX_PRESET_DURATION_HOURS && DURATION_HOUR_OPTIONS.includes(h);
}

export function isLongDurationHours(hours) {
  return Number(hours) > MAX_PRESET_DURATION_HOURS;
}

function normalizeTechnicianName(name) {
  return String(name || "").trim().toLowerCase();
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

/** Normaliza horário para HH:MM (24h) ou null se inválido. */
export function normalizeTime24(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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

/** Retorna o evento do mesmo técnico que conflita no dia, ou null */
export function findTechnicianConflict(events, candidate, excludeId = null) {
  const tech = normalizeTechnicianName(candidate.tecnico);
  if (!tech || !candidate.data || !candidate.horario) return null;

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
    if (normalizeTechnicianName(e.tecnico) !== tech) continue;
    if (slotsOverlap(candSlot, getEventSlot(e))) return e;
  }
  return null;
}

export function endsAfterClosing(horario, duracaoHoras) {
  return parseTimeToMinutes(horario) + Number(duracaoHoras) * 60 > WORK_END_MIN;
}

export function getBlockedTimeSlots(events, { data, duracaoHoras, baia, tecnico, excludeId }, timeSlots) {
  const longDuration = isLongDurationHours(duracaoHoras);
  return timeSlots.filter((t) => {
    if (!longDuration && endsAfterClosing(t, duracaoHoras)) return true;
    if (findBayConflict(events, { data, horario: t, duracaoHoras, baia }, excludeId)) return true;
    if (tecnico && findTechnicianConflict(
      events,
      { data, horario: t, duracaoHoras, baia, tecnico },
      excludeId,
    )) return true;
    return false;
  });
}

export function getFreeTimeSlotsOnDate(
  events,
  { data, duracaoHoras, baia, tecnico, excludeId },
  timeSlots = SCHEDULE_TIME_SLOTS,
) {
  if (!data || !duracaoHoras || !baia) return [];
  return timeSlots.filter(
    (slot) => !getBlockedTimeSlots(
      events,
      { data, duracaoHoras, baia, tecnico, excludeId },
      [slot],
    ).includes(slot),
  );
}

export function hasAvailableSlotOnDate(
  events,
  { data, duracaoHoras, baia, tecnico, excludeId },
  timeSlots = SCHEDULE_TIME_SLOTS,
) {
  if (!data || !duracaoHoras || !baia) return true;
  return getFreeTimeSlotsOnDate(
    events,
    { data, duracaoHoras, baia, tecnico, excludeId },
    timeSlots,
  ).length > 0;
}

export function filterTechniciansForScheduleDate(
  technicians,
  task,
  events,
  { date, duracaoHoras, baia, excludeId, coversTask },
  timeSlots = SCHEDULE_TIME_SLOTS,
) {
  return technicians.filter((technician) => {
    if (!technician.disponivel || technician.conflito) return false;
    if (task && coversTask && !coversTask(technician, task)) return false;
    if (!date) return true;
    return hasAvailableSlotOnDate(
      events,
      {
        data: date,
        duracaoHoras,
        baia,
        tecnico: technician.name,
        excludeId,
      },
      timeSlots,
    );
  });
}

export function isServiceDateAvailableForTechnician(
  events,
  { date, tecnico, duracaoHoras, baia, excludeId },
  timeSlots = SCHEDULE_TIME_SLOTS,
) {
  if (!date || !tecnico) return true;
  return hasAvailableSlotOnDate(
    events,
    { data: date, duracaoHoras, baia, tecnico, excludeId },
    timeSlots,
  );
}

export function countEligibleTechniciansOnDate(
  technicians,
  task,
  events,
  { date, duracaoHoras, baia, excludeId, coversTask },
  timeSlots = SCHEDULE_TIME_SLOTS,
) {
  return filterTechniciansForScheduleDate(
    technicians,
    task,
    events,
    { date, duracaoHoras, baia, excludeId, coversTask },
    timeSlots,
  ).length;
}

export function formatEventTimeRange(event) {
  const segments = splitEventIntoBusinessSegments(event);
  if (!segments.length) return "—";
  if (segments.length === 1) return formatSegmentTimeRange(segments[0]);
  const first = segments[0];
  const last = segments[segments.length - 1];
  if (first.date === last.date) return formatSegmentTimeRange(first);
  return `${minutesToTime(first.start)} (${formatShortDate(first.date)}) → ${minutesToTime(last.end)} (${formatShortDate(last.date)})`;
}

export function formatSegmentTimeRange(segment) {
  return `${minutesToTime(segment.start)}–${minutesToTime(segment.end)}`;
}

function formatShortDate(iso) {
  if (!iso) return "";
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function addDaysToIso(iso, days) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatISODate(d);
}

export function getIsoDayOfWeek(iso) {
  return new Date(`${iso}T12:00:00`).getDay();
}

export function isSunday(iso) {
  return getIsoDayOfWeek(iso) === 0;
}

export function isSaturday(iso) {
  return getIsoDayOfWeek(iso) === 6;
}

export function getWorkEndMinForDate(iso) {
  if (isSaturday(iso)) return SATURDAY_WORK_END_MIN;
  return WORK_END_MIN;
}

/** Próximo dia útil após esgotar o horário do dia (sábado → segunda; domingo ignorado). */
export function advanceToNextBusinessDate(iso) {
  if (isSaturday(iso)) {
    return addDaysToIso(iso, 2);
  }
  const next = addDaysToIso(iso, 1);
  if (isSunday(next)) {
    return addDaysToIso(next, 1);
  }
  return next;
}

/**
 * Divide o serviço em segmentos dentro do horário comercial.
 * Seg–sex até 19:00; sábado até 13:00; domingo fechado (continua na segunda às 9:00).
 */
export function splitEventIntoBusinessSegments(event) {
  if (!event?.data || !event?.horario) return [];

  const totalMinutes = getDurationMinutes(event);
  if (totalMinutes <= 0) return [];

  let remaining = totalMinutes;
  let currentDate = event.data;
  const segments = [];
  let dayIndex = 0;

  while (remaining > 0 && dayIndex < 366) {
    if (isSunday(currentDate)) {
      currentDate = addDaysToIso(currentDate, 1);
      dayIndex += 1;
      continue;
    }

    const workEnd = getWorkEndMinForDate(currentDate);
    const start = dayIndex === 0 ? parseTimeToMinutes(event.horario) : WORK_CONTINUE_START_MIN;

    if (start >= workEnd) {
      currentDate = advanceToNextBusinessDate(currentDate);
      dayIndex += 1;
      continue;
    }

    const availableToday = workEnd - start;
    const used = Math.min(remaining, availableToday);
    segments.push({
      event,
      date: currentDate,
      start,
      end: start + used,
      segmentIndex: segments.length,
    });
    remaining -= used;

    if (remaining > 0) {
      currentDate = advanceToNextBusinessDate(currentDate);
      dayIndex += 1;
    }
  }

  return segments.map((segment, index, all) => ({
    ...segment,
    segmentIndex: index,
    segmentCount: all.length,
    isContinuation: index > 0,
  }));
}

export function getEventSegmentOnDate(event, iso) {
  return splitEventIntoBusinessSegments(event).find((segment) => segment.date === iso) || null;
}

export function eventTouchesDate(event, iso) {
  return !!getEventSegmentOnDate(event, iso);
}

export function getEventEndHour(event) {
  const segments = splitEventIntoBusinessSegments(event);
  if (!segments.length) return Math.ceil(getEventSlot(event).end / 60);
  return Math.max(...segments.map((segment) => Math.ceil(segment.end / 60)));
}

export function getWeekGridEndHour(events, isoDates, minHour = WORK_END_MIN / 60) {
  let maxHour = minHour;
  const dateSet = new Set(isoDates || []);
  for (const e of events) {
    for (const segment of splitEventIntoBusinessSegments(e)) {
      if (!dateSet.has(segment.date)) continue;
      const endHour = Math.ceil(segment.end / 60);
      if (endHour > maxHour) maxHour = Math.min(endHour, WORK_END_MIN / 60);
    }
  }
  return maxHour;
}

function buildWeekEventBlockStyle(segment, weekGridMinutes, bays = BAIAS) {
  const gridStart = WORK_START_MIN;
  const gridEnd = gridStart + weekGridMinutes;
  const baia = Number(segment.event.baia) || 1;
  const laneIndex = Math.max(0, Math.min(baia - 1, bays.length - 1));
  const laneWidthPct = 100 / bays.length;

  const visibleStart = Math.max(segment.start, gridStart);
  const visibleEnd = Math.min(segment.end, gridEnd);
  if (visibleEnd <= visibleStart) return null;

  const topPct = ((visibleStart - gridStart) / weekGridMinutes) * 100;
  const heightPct = ((visibleEnd - visibleStart) / weekGridMinutes) * 100;

  return {
    top: `${topPct}%`,
    height: `${heightPct}%`,
    left: `calc(2px + ${laneIndex * laneWidthPct}%)`,
    width: `calc(${laneWidthPct}% - 4px)`,
  };
}

/** Posiciona segmentos do dia na grade semanal (com continuação em dias seguintes). */
export function buildWeekEventBlocksForDay(iso, events, weekGridMinutes, bays = BAIAS) {
  const blocks = [];
  for (const event of events) {
    for (const segment of splitEventIntoBusinessSegments(event)) {
      if (segment.date !== iso) continue;
      const style = buildWeekEventBlockStyle(segment, weekGridMinutes, bays);
      if (!style) continue;
      blocks.push({ event, segment, style });
    }
  }
  return blocks;
}

/** @deprecated Use buildWeekEventBlocksForDay */
export function buildWeekEventBlocks(dayEvents, weekGridMinutes, bays = BAIAS) {
  const blocks = [];
  for (const event of dayEvents) {
    for (const segment of splitEventIntoBusinessSegments(event)) {
      const style = buildWeekEventBlockStyle(segment, weekGridMinutes, bays);
      if (!style) continue;
      blocks.push({ event, segment, style });
    }
  }
  return blocks;
}

export function formatISODate(d) {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayISO() {
  return formatISODate(new Date());
}

export function buildMonthDays(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startDow = firstOfMonth.getDay();
  const gridStart = new Date(year, monthIndex, 1 - startDow);
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export function buildCalendarEvents(tasks, extras = []) {
  const fromTasks = tasks
    .filter((t) => t.dataAgendada && !isClosedTaskStatus(t.status))
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

/** Monday as first day of week (ISO-style operational week). */
export function startOfWeekMonday(date) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function buildWeekDays(anchorDate) {
  const start = startOfWeekMonday(anchorDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { date: d, iso: formatISODate(d) };
  });
}

export function formatWeekRangeLabel(weekDays) {
  if (!weekDays?.length) return "";
  const first = weekDays[0].date;
  const last = weekDays[weekDays.length - 1].date;
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const sameMonth = first.getMonth() === last.getMonth();
  if (sameMonth) {
    return `${first.getDate()}–${last.getDate()} ${months[first.getMonth()]} ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${months[first.getMonth()]} – ${last.getDate()} ${months[last.getMonth()]} ${last.getFullYear()}`;
}

export function serviceTypeClass(servico) {
  if (!servico) return "";
  if (servico.includes("Exterior")) return "s-ext";
  if (servico.includes("Interior") || servico.includes("Couro") || servico.includes("Higienização")) return "s-int";
  if (servico.includes("Cerâmica") || servico.includes("Vitrificação") || servico.includes("Polimento")) return "s-cer";
  if (servico.includes("PPF")) return "s-ppf";
  if (servico.includes("Motos")) return "s-mot";
  return "";
}

export function findTaskSlotConflicts(dayTasks) {
  const conflictingIds = new Set();
  for (let i = 0; i < dayTasks.length; i += 1) {
    for (let j = i + 1; j < dayTasks.length; j += 1) {
      const a = dayTasks[i];
      const b = dayTasks[j];
      const slotA = getEventSlot({ ...a, data: a.dataAgendada });
      const slotB = getEventSlot({ ...b, data: b.dataAgendada });
      if (slotsOverlap(slotA, slotB)) {
        conflictingIds.add(a.id);
        conflictingIds.add(b.id);
      }
    }
  }
  return conflictingIds;
}

export function tasksForTechnicianOnDay(tasks, techName, isoDate) {
  return tasks
    .filter((t) => (
      t.tecnico === techName
      && t.dataAgendada === isoDate
      && !isClosedTaskStatus(t.status)
      && t.horario
    ))
    .sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));
}
