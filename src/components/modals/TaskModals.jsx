import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { BGG_DATA } from "../../data/bggData";
import { Button, Icon, Field, Input, Select, Textarea, Checkbox, Modal, useToast, formatEUR } from "../ui";
import { AddressLocationFields } from "../AddressLocationFields";
import { TimeInput24 } from "../TimeInput24";
import { mapClientToTaskPrefill, searchClients } from "../../lib/clientApi";
import {
  BAIAS,
  DURATION_HOUR_OPTIONS,
  DURATION_OTHER,
  formatDurationHours,
  buildMonthDays,
  formatISODate,
  todayISO,
  isPresetDurationHours,
  isLongDurationHours,
  resolveDurationHours,
  SCHEDULE_TIME_SLOTS,
  normalizeTime24,
  filterTechniciansForScheduleDate,
  isServiceDateAvailableForTechnician,
  countEligibleTechniciansOnDate,
} from "../../lib/scheduling";
import {
  buildWhatsAppMessage,
  formatAddressForWhatsApp,
  formatDateBR,
  normalizeWhatsAppPhone,
  notifyWhatsAppResult,
  openWhatsAppClient,
} from "../../lib/whatsapp";
import { mapTechniciansForPicker } from "../../lib/technicianApi";
import { technicianCoversTaskServices, technicianCoverageHint } from "../../lib/taskServiceMatch";
import { PhoneInput } from "../PhoneInput";
import { ClientLanguageSelect } from "../ClientLanguageSelect";
import { DEFAULT_PHONE_COUNTRY_CODE } from "../../lib/phoneCountries";
import { formatPhoneDisplay } from "../../lib/phoneUtils";
import { DEFAULT_CLIENT_LANGUAGE, resolveClientPreferredLanguage } from "../../lib/clientLanguage";

const PT_MONTHS_SHORT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const EMPTY_TASKS = [];

// ----- Assign Technician -----
function AssignTechModal({ open, task, technicians = [], onClose, onSave }) {
  const [techName, setTechName] = useState("");
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState(true);
  const [err, setErr] = useState({});
  const toast = useToast();
  const techs = useMemo(() => mapTechniciansForPicker(technicians), [technicians]);
  const selected = techs.find(t => t.name === techName);

  useEffect(() => {
    if (open) {
      setTechName(task && task.tecnico ? task.tecnico : "");
      setNotes("");
      setErr({});
    }
  }, [open, task]);

  const submit = async () => {
    const next = {};
    if (!techName) next.tech = "Técnico é obrigatório.";
    if (notes.length > 500) next.notes = "As anotações de designação não devem exceder 500 caracteres.";
    if (selected && !selected.disponivel) next.tech = "O técnico selecionado não está disponível para esta tarefa.";
    if (selected && selected.conflito) next.tech = "O técnico selecionado tem um conflito de agenda. Por favor, selecione outro técnico.";
    if (selected && task && !technicianCoversTaskServices(selected, task)) {
      next.tech = technicianCoverageHint(selected, task);
    }
    setErr(next);
    if (Object.keys(next).length) return;
    try {
      await onSave(task.id, techName);
      toast({
        kind: "success",
        title: notify ? "Técnico designado e notificado" : "Técnico designado",
        desc: `${techName} foi designado para ${task.id}.`,
      });
      onClose();
    } catch {
      /* erro exibido pelo App */
    }
  };

  if (!open || !task) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Designar Técnico"
      sub={`${task.id} · ${task.projeto}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="secondary" icon={Icon.Bell} onClick={() => { setNotify(true); submit(); }}>Notificar &amp; Salvar</Button>
          <Button icon={Icon.Check} onClick={submit}>Salvar</Button>
        </>
      }
    >
      <div className="col" style={{ gap: 16 }}>
        <Field label="Técnico" error={err.tech}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {techs.map((t) => {
              const sel = techName === t.name;
              const dim = !t.disponivel;
              const conf = t.conflito;
              const lacksCoverage = task && !technicianCoversTaskServices(t, task);
              const blocked = dim || lacksCoverage;
              return (
                <button
                  key={t.name}
                  onClick={() => setTechName(t.name)}
                  style={{
                    border: `1px solid ${sel ? "var(--gold)" : "var(--border)"}`,
                    background: sel ? "rgba(181, 235, 12,0.10)" : "var(--bg-elevated)",
                    borderRadius: 4,
                    padding: 12,
                    textAlign: "left",
                    opacity: blocked ? 0.5 : 1,
                    cursor: blocked ? "not-allowed" : "pointer",
                    display: "flex", gap: 10, alignItems: "flex-start",
                    transition: "all 200ms var(--ease-out)",
                  }}
                  disabled={blocked}
                  title={lacksCoverage ? technicianCoverageHint(t, task) : undefined}
                >
                  <div className="avatar sm tech" style={{ background: sel ? "var(--gold)" : "var(--bg-elevated)", color: sel ? "var(--gold-on)" : "var(--fg)" }}>
                    {t.name.split(" ").pop()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                      <span style={{ color: sel ? "var(--gold)" : "var(--fg)", fontWeight: 500, fontSize: 13 }}>{t.name}</span>
                      {conf ? <span className="badge danger" style={{ fontSize: 9, padding: "2px 5px" }}>Conflito</span> :
                        dim ? <span className="badge muted" style={{ fontSize: 9, padding: "2px 5px" }}>Indisponível</span> :
                        <span className="badge success" style={{ fontSize: 9, padding: "2px 5px" }}>Disponível</span>}
                    </div>
                    <div className="tiny muted" style={{ marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(t.services?.length ? t.services.map((s) => s.name) : t.skills).join(" · ")}
                    </div>
                    <div className="tiny muted" style={{ marginTop: 2 }}>{t.agenda} · {t.carga} tarefas</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        {selected ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Habilidades">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(selected.services?.length ? selected.services.map((s) => s.name) : selected.skills).map((s) => (
                  <span key={s} className="tag">{s}</span>
                ))}
              </div>
            </Field>
            <Field label="Agenda">
              <div className="tag" style={{ alignSelf: "flex-start" }}>{selected.agenda}</div>
            </Field>
          </div>
        ) : null}

        <Field label="Disponibilidade — próximos 7 dias">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
            padding: 8,
            borderRadius: 4
          }}>
            {["Hoje 21/05", "Sex 22/05", "Sáb 23/05", "Dom 24/05", "Seg 25/05", "Ter 26/05", "Qua 27/05"].map((label, i) => {
              const busy = selected && (i === 0 || i === 4) && selected.conflito;
              const free = !!selected && !busy;
              return (
                <div key={i} style={{
                  border: "1px solid var(--border)",
                  borderRadius: 2,
                  padding: 8,
                  background: "var(--bg)",
                  textAlign: "center",
                }}>
                  <div className="tiny" style={{ color: "var(--fg-6)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 9 }}>{label.split(" ")[0]}</div>
                  <div className="mono" style={{ color: "var(--fg-3)", fontSize: 12, margin: "4px 0" }}>{label.split(" ")[1]}</div>
                  <div className="tiny" style={{ color: busy ? "var(--destructive)" : free ? "#8fbf6a" : "var(--fg-6)", fontSize: 10 }}>
                    {!selected ? "—" : busy ? "Conflito" : i === 3 ? "Folga" : "08–18h"}
                  </div>
                </div>
              );
            })}
          </div>
        </Field>

        <Field label="Anotações de designação" optional error={err.notes} hint={`${notes.length}/500 caracteres`}>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instruções específicas para este técnico…"
            err={!!err.notes}
            maxLength={500}
          />
        </Field>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-elevated)" }}>
          <div>
            <div style={{ color: "var(--fg)", fontSize: 13, fontWeight: 500 }}>Notificar o técnico</div>
            <div className="tiny muted">Envia notificação push ao técnico</div>
          </div>
          <Checkbox checked={notify} onChange={setNotify}/>
        </div>
      </div>
    </Modal>
  );
}

// ----- Schedule Task -----
function ScheduleModal({ open, task, tasks = EMPTY_TASKS, events = [], defaultDate = "", technicians = [], onClose, onSave, onCreateNewTask }) {
  const [pickedTaskId, setPickedTaskId] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [date, setDate] = useState("");
  const [calCursor, setCalCursor] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const [time, setTime] = useState("");
  const [tech, setTech] = useState("");
  const [baia, setBaia] = useState(1);
  const [durationMode, setDurationMode] = useState("preset");
  const [duracaoHoras, setDuracaoHoras] = useState(2);
  const [customDuracaoHoras, setCustomDuracaoHoras] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyTec, setNotifyTec] = useState(true);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState({});
  const toast = useToast();
  const scheduleInitKeyRef = useRef("");
  const techOptions = useMemo(() => mapTechniciansForPicker(technicians), [technicians]);

  const activeTask = task || tasks.find((t) => t.id === pickedTaskId) || null;
  const schedulableTasks = tasks.filter(
    (t) => t.status !== "Cancelado" && !t.dataAgendada
  );

  const applyDuration = (hours) => {
    const h = hours || 2;
    if (!isPresetDurationHours(h)) {
      setDurationMode(DURATION_OTHER);
      setCustomDuracaoHoras(String(h));
      setDuracaoHoras(2);
    } else {
      setDurationMode("preset");
      setDuracaoHoras(h);
      setCustomDuracaoHoras("");
    }
  };

  useEffect(() => {
    if (!open) {
      scheduleInitKeyRef.current = "";
      return;
    }
    const initKey = `${task?.id ?? ""}|${pickedTaskId}|${defaultDate}`;
    if (scheduleInitKeyRef.current === initKey) return;
    scheduleInitKeyRef.current = initKey;

    const source = task || tasks.find((t) => t.id === pickedTaskId);
    const initialServiceDate = source?.dataAgendada || defaultDate || todayISO();
    const initialDropoffDate = source?.clientDropoffDate || source?.dataAgendada || defaultDate || todayISO();
    if (source) {
      setDropoffDate(initialDropoffDate);
      setDropoffTime(normalizeTime24(source.clientDropoffTime || source.horario || "") || source.clientDropoffTime || source.horario || "");
      setDate(initialServiceDate);
      setTime(source.horario || "");
      setTech(source.tecnico || "");
      setBaia(source.baia || 1);
      applyDuration(source.duracaoHoras);
    } else {
      setPickedTaskId("");
      setDropoffDate(initialDropoffDate);
      setDropoffTime("");
      setDate(initialServiceDate);
      setTime("");
      setTech("");
      setBaia(1);
      applyDuration(2);
    }
    const initialDay = new Date(`${initialServiceDate}T00:00:00`);
    setCalCursor({ y: initialDay.getFullYear(), m: initialDay.getMonth() });
    setNotes("");
    setSaved(false);
    setErr({});
  }, [open, task, pickedTaskId, defaultDate, tasks]);

  const times = SCHEDULE_TIME_SLOTS;
  const activeTaskId = activeTask?.id;
  const effectiveDuracaoHoras = resolveDurationHours({ durationMode, duracaoHoras, customDuracaoHoras });
  const scheduleSlotContext = useMemo(() => ({
    duracaoHoras: effectiveDuracaoHoras,
    baia,
    excludeId: activeTaskId,
  }), [effectiveDuracaoHoras, baia, activeTaskId]);

  const eligibleTechOptions = useMemo(
    () => filterTechniciansForScheduleDate(
      techOptions,
      activeTask,
      events,
      { ...scheduleSlotContext, date: "", coversTask: technicianCoversTaskServices },
    ),
    [techOptions, activeTask, events, scheduleSlotContext],
  );

  const availableTechOptions = useMemo(
    () => filterTechniciansForScheduleDate(
      techOptions,
      activeTask,
      events,
      { ...scheduleSlotContext, date, coversTask: technicianCoversTaskServices },
    ),
    [techOptions, activeTask, events, scheduleSlotContext, date],
  );

  const isDaySelectable = useCallback((iso, inMonth) => {
    if (!inMonth) return false;
    if (iso < todayISO()) return false;
    if (!effectiveDuracaoHoras || !baia) return true;
    if (tech) {
      return isServiceDateAvailableForTechnician(
        events,
        { date: iso, tecnico: tech, ...scheduleSlotContext },
        times,
      );
    }
    return countEligibleTechniciansOnDate(
      techOptions,
      activeTask,
      events,
      { ...scheduleSlotContext, date: iso, coversTask: technicianCoversTaskServices },
      times,
    ) > 0;
  }, [tech, effectiveDuracaoHoras, baia, events, scheduleSlotContext, times, techOptions, activeTask]);

  const techPickerOptions = date ? availableTechOptions : eligibleTechOptions;

  useEffect(() => {
    if (!open || !date || !tech) return;
    if (!availableTechOptions.some((t) => t.name === tech)) {
      setTech("");
      setTime("");
    }
  }, [open, date, tech, availableTechOptions]);

  useEffect(() => {
    if (!open || !date || !tech) return;
    if (!isServiceDateAvailableForTechnician(
      events,
      { date, tecnico: tech, ...scheduleSlotContext },
      times,
    )) {
      setDate("");
      setTime("");
    }
  }, [open, tech, events, scheduleSlotContext, times, date]);

  const clientPhone = activeTask ? {
    countryCode: activeTask.clienteTelCountryCode,
    nationalNumber: activeTask.clienteTelNationalNumber,
  } : null;

  const sendWhatsAppToClient = () => {
    if (!activeTask) return;
    const message = buildWhatsAppMessage("schedule_confirm", {
      clientName: activeTask.cliente,
      date: formatDateBR(dropoffDate),
      time: dropoffTime,
      address: formatAddressForWhatsApp(activeTask.endereco),
    }, resolveClientPreferredLanguage({ task: activeTask }));
    const result = openWhatsAppClient({ phone: clientPhone, message });
    notifyWhatsAppResult(result, toast);
  };

  const handleClose = () => {
    setSaved(false);
    onClose();
  };

  if (!open) return null;

  const monthDays = buildMonthDays(calCursor.y, calCursor.m);
  const todayStr = todayISO();

  const submit = async () => {
    const next = {};
    if (!activeTask) next.task = "Selecione a tarefa a agendar.";
    if (!dropoffDate) next.dropoffDate = "A data de entrega é obrigatória.";
    if (!dropoffTime) next.dropoffTime = "O horário de entrega é obrigatório.";
    else if (!normalizeTime24(dropoffTime)) next.dropoffTime = "Use o formato 24 horas (ex: 20:00).";
    if (!date) next.date = "A data do serviço é obrigatória.";
    if (!time) next.time = "Horário do serviço é obrigatório.";
    if (!tech) next.tech = "Técnico é obrigatório.";
    const selectedTech = techPickerOptions.find((t) => t.name === tech);
    if (selectedTech && activeTask && !technicianCoversTaskServices(selectedTech, activeTask)) {
      next.tech = technicianCoverageHint(selectedTech, activeTask);
    }
    if (!baia) next.baia = "Selecione a baia.";
    if (durationMode === DURATION_OTHER) {
      if (!customDuracaoHoras) next.duracaoHoras = "Informe a quantidade de horas.";
      else if (!effectiveDuracaoHoras || effectiveDuracaoHoras <= 8) {
        next.duracaoHoras = "Em Outro, informe mais de 8 horas.";
      }
    } else if (!effectiveDuracaoHoras || effectiveDuracaoHoras <= 0) {
      next.duracaoHoras = "Informe a duração do serviço.";
    }
    if (notes.length > 500) next.notes = "As anotações da agenda não devem exceder 500 caracteres.";
    setErr(next);
    if (Object.keys(next).length) return;
    try {
      await onSave(activeTask.id, {
        clientDropoffDate: dropoffDate,
        clientDropoffTime: normalizeTime24(dropoffTime),
        dataAgendada: date,
        horario: time,
        tecnico: tech,
        baia,
        duracaoHoras: effectiveDuracaoHoras,
      });
      toast({
        kind: "success",
        title: "Tarefa agendada",
        desc: `${activeTask.id} · entrega ${dropoffDate} ${dropoffTime} · serviço ${date} ${time} · Baia ${baia}`,
      });
      if (notifyTec) toast({ kind: "success", title: "Técnico notificado", desc: tech });
      setSaved(true);
    } catch {
      /* erro exibido pelo App */
    }
  };

  const modalTitle = task ? "Agendar Tarefa" : "Novo agendamento";
  const modalSub = activeTask
    ? `${activeTask.id} · ${activeTask.projeto} · ${activeTask.cliente}`
    : "Selecione a tarefa e defina entrega do cliente, baia, duração e horário do serviço";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={modalTitle}
      sub={modalSub}
      size="xl"
      footer={
        saved ? (
          <>
            <Button variant="ghost" onClick={handleClose}>Fechar</Button>
            <Button
              variant="secondary"
              icon={Icon.WhatsApp}
              onClick={sendWhatsAppToClient}
              disabled={!normalizeWhatsAppPhone(clientPhone)}
              title={normalizeWhatsAppPhone(clientPhone) ? "Enviar confirmação ao cliente" : "Telefone do cliente inválido"}
            >
              Enviar WhatsApp ao cliente
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button icon={Icon.Calendar} onClick={submit}>Salvar agendamento</Button>
          </>
        )
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="col" style={{ gap: 16 }}>
          <div>
            <div className="tiny" style={{ color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
              Entrega do veículo (cliente)
            </div>
            <div className="col" style={{ gap: 12 }}>
              <Field label="Data de entrega" error={err.dropoffDate}>
                <Input
                  type="date"
                  value={dropoffDate}
                  onChange={(e) => setDropoffDate(e.target.value)}
                  err={!!err.dropoffDate}
                />
              </Field>
              <Field label="Hora de entrega" error={err.dropoffTime} hint="Selecione o horário em formato 24h · comunicado ao cliente (WhatsApp)">
                <TimeInput24
                  value={dropoffTime}
                  onChange={setDropoffTime}
                  err={!!err.dropoffTime}
                />
              </Field>
            </div>
          </div>

          <div>
            <div className="tiny" style={{ color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
              Início do serviço (técnico)
            </div>
          </div>

          <Field
            label="Data do serviço"
            error={err.date}
            hint={tech && !date
              ? "Selecione um dia com horário livre para o técnico escolhido"
              : date && !availableTechOptions.length
                ? "Nenhum técnico disponível nesta data — escolha outro dia"
                : undefined}
          >
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: 12, borderRadius: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <button
                  type="button"
                  className="icon-btn"
                  style={{ width: 24, height: 24 }}
                  onClick={() => {
                    const m = calCursor.m - 1;
                    setCalCursor(m < 0 ? { y: calCursor.y - 1, m: 11 } : { y: calCursor.y, m });
                  }}
                >
                  <Icon.ChevronLeft size={14}/>
                </button>
                <div className="serif" style={{ color: "var(--gold)", fontSize: 16, letterSpacing: "0.04em" }}>
                  {PT_MONTHS_SHORT[calCursor.m]} · {calCursor.y}
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  style={{ width: 24, height: 24 }}
                  onClick={() => {
                    const m = calCursor.m + 1;
                    setCalCursor(m > 11 ? { y: calCursor.y + 1, m: 0 } : { y: calCursor.y, m });
                  }}
                >
                  <Icon.Chevron size={14}/>
                </button>
              </div>
              <div className="cal">
                {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => <div key={d} className="h">{d}</div>)}
                {monthDays.map((d) => {
                  const iso = formatISODate(d);
                  const inMonth = d.getMonth() === calCursor.m;
                  const sel = iso === date;
                  const isToday = iso === todayStr;
                  const selectable = isDaySelectable(iso, inMonth);
                  const unavailable = inMonth && !selectable;
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`d ${!inMonth ? "muted" : ""} ${sel ? "sel" : ""} ${isToday && !sel ? "today" : ""} ${unavailable ? "busy" : ""}`}
                      onClick={() => selectable && setDate(iso)}
                      disabled={!selectable}
                      title={unavailable ? "Sem disponibilidade" : undefined}
                    >{d.getDate()}</button>
                  );
                })}
              </div>
              <div className="row" style={{ marginTop: 10, gap: 14, fontSize: 10, color: "var(--fg-6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <span className="row" style={{ gap: 4 }}><span style={{ width: 6, height: 6, background: "var(--gold)", borderRadius: "50%" }}></span>Hoje</span>
                <span className="row" style={{ gap: 4 }}><span style={{ width: 6, height: 6, background: "var(--destructive)", borderRadius: "50%" }}></span>Indisponível</span>
                {tech ? <span>· Dias livres para {tech}</span> : date ? <span>· Dias com técnico disponível</span> : null}
              </div>
            </div>
          </Field>

          <Field label="Baia" error={err.baia}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {BAIAS.map((b) => {
                const sel = baia === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBaia(b)}
                    style={{
                      border: `1px solid ${sel ? "var(--gold)" : "var(--border)"}`,
                      background: sel ? "rgba(181, 235, 12,0.10)" : "var(--bg-elevated)",
                      borderRadius: 4,
                      padding: "12px 14px",
                      textAlign: "left",
                      color: sel ? "var(--gold)" : "var(--fg)",
                      fontWeight: 500,
                      fontSize: 13,
                    }}
                  >
                    Baia {b}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label="Duração do serviço"
            error={err.duracaoHoras}
            hint={durationMode === DURATION_OTHER
              ? "Informe quantas horas a baia ficará reservada (acima de 8 h)"
              : "Tempo em que a baia ficará reservada (até 8 h)"}
          >
            <div className="col" style={{ gap: 8 }}>
              <Select
                value={durationMode === DURATION_OTHER ? DURATION_OTHER : String(duracaoHoras)}
                onChange={(e) => {
                  if (e.target.value === DURATION_OTHER) {
                    setDurationMode(DURATION_OTHER);
                    if (!customDuracaoHoras || Number(customDuracaoHoras) <= 8) {
                      setCustomDuracaoHoras("9");
                    }
                  } else {
                    setDurationMode("preset");
                    setDuracaoHoras(Number(e.target.value));
                  }
                }}
                err={!!err.duracaoHoras}
              >
                {DURATION_HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>{formatDurationHours(h)}</option>
                ))}
                <option value={DURATION_OTHER}>Outro</option>
              </Select>
              {durationMode === DURATION_OTHER ? (
                <Input
                  type="number"
                  min={8.5}
                  step={0.5}
                  value={customDuracaoHoras}
                  onChange={(e) => setCustomDuracaoHoras(e.target.value)}
                  placeholder="Quantidade de horas (ex: 10)"
                  err={!!err.duracaoHoras}
                />
              ) : null}
            </div>
          </Field>

          <Field
            label="Horário do serviço"
            error={err.time}
            hint="Selecione o horário de início — todos os horários estão disponíveis"
          >
            <div className="time-grid">
              {times.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`time-chip ${time === t ? "sel" : ""}`}
                  onClick={() => setTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="col" style={{ gap: 16 }}>
          {!task ? (
            <Field label="Tarefa" error={err.task}>
              <Select
                value={pickedTaskId}
                onChange={(e) => setPickedTaskId(e.target.value)}
                err={!!err.task}
              >
                <option value="">Selecione uma tarefa não agendada</option>
                {schedulableTasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.id} — {t.projeto} · {t.cliente}</option>
                ))}
              </Select>
              {onCreateNewTask ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={Icon.Plus}
                  style={{ marginTop: 8 }}
                  onClick={() => onCreateNewTask(date || defaultDate)}
                >
                  Criar nova tarefa
                </Button>
              ) : null}
            </Field>
          ) : null}

          <Field
            label="Técnico Designado"
            error={err.tech}
            hint={date
              ? (availableTechOptions.length
                ? `${availableTechOptions.length} técnico(s) disponível(is) em ${date}`
                : "Nenhum técnico executa este serviço ou está livre nesta data")
              : (tech
                ? "Escolha a data do serviço no calendário"
                : "Selecione a data ou o técnico — a lista filtra automaticamente")}
          >
            <Select value={tech} onChange={(e) => setTech(e.target.value)} err={!!err.tech}>
              <option value="">Selecione um técnico</option>
              {techPickerOptions.map((t) => {
                const labelServices = (t.services?.length ? t.services.map((s) => s.name) : t.skills).slice(0, 2).join(", ");
                return (
                  <option
                    key={t.id || t.name}
                    value={t.name}
                  >
                    {t.name}
                    {labelServices ? ` — ${labelServices}` : ""}
                  </option>
                );
              })}
            </Select>
            {date && availableTechOptions.length ? (
              <div className="row" style={{ flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {availableTechOptions.map((t) => {
                  const selected = tech === t.name;
                  return (
                    <button
                      key={t.id || t.name}
                      type="button"
                      onClick={() => setTech(t.name)}
                      style={{
                        border: `1px solid ${selected ? "var(--gold)" : "var(--border)"}`,
                        background: selected ? "rgba(181, 235, 12,0.12)" : "var(--bg-elevated)",
                        borderRadius: 4,
                        padding: "6px 10px",
                        fontSize: 11,
                        color: selected ? "var(--gold)" : "var(--fg)",
                        cursor: "pointer",
                      }}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </Field>

          <Field label="Resumo do agendamento">
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--gold-30)", borderRadius: 4, padding: 14 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span className="tiny" style={{ color: "var(--fg-6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Entrega cliente</span>
                <span className="mono" style={{ color: "var(--fg)", fontWeight: 500 }}>{dropoffDate || "—"} · {dropoffTime || "—"}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span className="tiny" style={{ color: "var(--fg-6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Serviço técnico</span>
                <span className="mono" style={{ color: "var(--gold)", fontWeight: 500 }}>{date || "—"} · {time || "—"}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span className="tiny" style={{ color: "var(--fg-6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Baia · Duração</span>
                <span className="mono" style={{ color: "var(--gold)", fontWeight: 500 }}>
                  {baia ? `Baia ${baia}` : "—"} · {effectiveDuracaoHoras > 0 ? formatDurationHours(effectiveDuracaoHoras) : "—"}
                </span>
              </div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span className="tiny" style={{ color: "var(--fg-6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cliente</span>
                <span style={{ color: "var(--fg)" }}>{activeTask?.cliente || "—"}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span className="tiny" style={{ color: "var(--fg-6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Endereço</span>
                <span className="muted small" style={{ textAlign: "right", maxWidth: "60%" }}>
                  {activeTask?.endereco ? `${activeTask.endereco.cidade}/${activeTask.endereco.estado}` : "—"}
                </span>
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="tiny" style={{ color: "var(--fg-6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Técnico</span>
                <span style={{ color: tech ? "var(--gold)" : "var(--fg-6)" }}>{tech || "—"}</span>
              </div>
            </div>
          </Field>

          <Field label="Anotações da agenda" optional error={err.notes} hint={`${notes.length}/500 caracteres`}>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações específicas deste agendamento…"
              err={!!err.notes}
              maxLength={500}
            />
          </Field>

          <div className="col" style={{ gap: 8 }}>
            {saved ? (
              <div className="muted small" style={{ padding: "8px 0" }}>
                Agendamento salvo. Use o botão abaixo para enviar a confirmação por WhatsApp ao cliente.
              </div>
            ) : null}
            <Checkbox checked={notifyTec} onChange={setNotifyTec} label="Notificar técnico"/>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ----- Create Task -----
const EMPTY_CREATE_TASK_DATA = {
  projeto: "", servico: "", descricao: "", anotInternas: "",
  clienteExistente: false, clientId: undefined, cliente: "", clienteEmail: "",
  clienteTelCountryCode: DEFAULT_PHONE_COUNTRY_CODE, clienteTelNationalNumber: "",
  clientePreferredLanguage: DEFAULT_CLIENT_LANGUAGE,
  unidade: "", logradouro: "", cidade: "", estado: "", cep: "", anotPropriedade: "",
  data: "", horario: "",
};

function CreateTaskModal({ open, onClose, onCreate, prefill }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ ...EMPTY_CREATE_TASK_DATA });
  const [err, setErr] = useState({});
  const [clientSearchMode, setClientSearchMode] = useState("name");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientResults, setClientResults] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const toast = useToast();

  const resetClientSearch = useCallback(() => {
    setClientSearchMode("name");
    setClientSearchQuery("");
    setClientResults([]);
    setSearchingClients(false);
  }, []);

  useEffect(() => {
    if (open) {
      setStep(1);
      const initial = prefill ? { ...EMPTY_CREATE_TASK_DATA, ...prefill } : { ...EMPTY_CREATE_TASK_DATA };
      setData(initial);
      setErr({});
      setClientSearchQuery(initial.cliente || "");
      setClientResults([]);
      setSearchingClients(false);
    }
  }, [open, prefill]);

  useEffect(() => {
    if (!open || !data.clienteExistente || data.clientId) {
      setClientResults([]);
      return undefined;
    }

    const query = clientSearchQuery.trim();
    if (query.length < 2) {
      setClientResults([]);
      setSearchingClients(false);
      return undefined;
    }

    setSearchingClients(true);
    const timer = setTimeout(() => {
      searchClients(query, clientSearchMode)
        .then((rows) => setClientResults(rows))
        .catch(() => setClientResults([]))
        .finally(() => setSearchingClients(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [open, data.clienteExistente, data.clientId, clientSearchQuery, clientSearchMode]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const selectClient = (client) => {
    setData((d) => ({ ...d, ...mapClientToTaskPrefill(client) }));
    setClientSearchQuery(client.name);
    setClientResults([]);
  };

  const clearSelectedClient = () => {
    setData((d) => ({
      ...d,
      clientId: undefined,
      cliente: "",
      clienteEmail: "",
      clienteTelCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
      clienteTelNationalNumber: "",
      unidade: "",
      logradouro: "",
      cidade: "",
      estado: "",
      cep: "",
      clientePreferredLanguage: DEFAULT_CLIENT_LANGUAGE,
    }));
    setClientSearchQuery("");
    setClientResults([]);
  };

  const skipAddressValidation = !!data.clientId;

  const buildErrors = (throughStep = 4) => {
    const e = {};

    if (throughStep >= 1) {
      if (!data.projeto?.trim()) e.projeto = "Título é obrigatório.";
      else if (data.projeto.length > 100) e.projeto = "O título do projeto não deve exceder 100 caracteres.";
      if (!data.servico) e.servico = "O tipo de serviço é obrigatório.";
      if (!data.descricao?.trim()) e.descricao = "A descrição da tarefa é obrigatória.";
      else if (data.descricao.length > 1000) e.descricao = "A descrição da tarefa não deve exceder 1.000 caracteres.";
    }

    if (throughStep >= 2) {
      if (data.clienteExistente) {
        if (!data.clientId) e.cliente = "Busque e selecione um cliente da lista.";
      } else if (!data.cliente?.trim()) {
        e.cliente = "O nome do cliente é obrigatório.";
      } else if (data.cliente.length > 100) {
        e.cliente = "O nome do cliente não deve exceder 100 caracteres.";
      }
      if (data.clienteEmail && !/^\S+@\S+\.\S+$/.test(data.clienteEmail)) {
        e.clienteEmail = "Digite um endereço de e-mail válido.";
      }
    }

    if (throughStep >= 3 && !skipAddressValidation) {
      if (!data.unidade?.trim()) e.unidade = "Unidade, apartamento ou sala é obrigatório.";
      if (!data.cidade?.trim()) e.cidade = "Cidade é obrigatória.";
      if (!data.estado?.trim()) e.estado = "Estado é obrigatório.";
      if (!data.cep?.trim()) e.cep = "Código postal é obrigatório.";
    }

    if (throughStep >= 4) {
      if (!data.data) e.data = "A data de agendamento é obrigatória.";
      if (!data.horario) e.horario = "O horário é obrigatório.";
    }

    return e;
  };

  const firstErrorStep = (e) => {
    const byStep = [
      ["projeto", "servico", "descricao"],
      ["cliente", "clienteEmail"],
      ["unidade", "cidade", "estado", "cep"],
      ["data", "horario"],
    ];
    for (let i = 0; i < byStep.length; i += 1) {
      if (i === 2 && skipAddressValidation) continue;
      if (byStep[i].some((field) => e[field])) return i + 1;
    }
    return 1;
  };

  const goNext = () => {
    const e = buildErrors(step);
    setErr(e);
    if (Object.keys(e).length > 0) {
      toast({
        kind: "error",
        title: "Campos obrigatórios",
        desc: "Preencha os campos desta etapa antes de continuar.",
      });
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const submit = async () => {
    const e = buildErrors(4);
    setErr(e);
    if (Object.keys(e).length > 0) {
      const errorStep = firstErrorStep(e);
      setStep(errorStep);
      toast({
        kind: "error",
        title: "Não foi possível criar a tarefa",
        desc: `Revise a etapa 0${errorStep} e tente novamente.`,
      });
      return;
    }
    try {
      await onCreate(data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Erro ao criar tarefa",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível salvar a tarefa. Tente novamente.",
      });
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Criar Tarefa Manualmente"
      sub="Criação interna — sem solicitação do cliente"
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          {step < 4 ? <Button onClick={goNext}>Continuar <Icon.ArrowRight size={14}/></Button> : null}
          {step === 4 ? <Button icon={Icon.Plus} onClick={submit}>Criar Tarefa</Button> : null}
        </>
      }
    >
      {/* Stepper */}
      <div className="sheet-tabs">
        {["Detalhes da Tarefa", "Cliente", "Propriedade", "Agenda &amp; Anexos"].map((s, i) => (
          <button
            key={i}
            className={step === i + 1 ? "active" : ""}
            onClick={() => setStep(i + 1)}
          >
            <span style={{ color: step === i + 1 ? "var(--gold)" : "var(--fg-6)", marginRight: 6 }}>0{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: s }}/>
          </button>
        ))}
      </div>

      {step === 1 ? (
        <div className="col" style={{ gap: 14 }}>
          <Field label="Título do Projeto" error={err.projeto}>
            <Input value={data.projeto} onChange={(e) => set("projeto", e.target.value)} placeholder="Ex: Vitrificação Carbon Pro — Coupé" err={!!err.projeto} maxLength={100}/>
          </Field>
          <Field label="Tipo de Serviço" error={err.servico}>
            <Select value={data.servico} onChange={(e) => set("servico", e.target.value)} err={!!err.servico}>
              <option value="">Selecione um tipo</option>
              {BGG_DATA.serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Descrição da Tarefa" error={err.descricao} hint={`${data.descricao.length}/1.000 caracteres`}>
            <Textarea value={data.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="O que será feito, condição atual do veículo, expectativas do cliente…" err={!!err.descricao} maxLength={1000} style={{ minHeight: 120 }}/>
          </Field>
          <Field label="Anotações Internas" optional hint={`${data.anotInternas.length}/1.000 caracteres`}>
            <Textarea value={data.anotInternas} onChange={(e) => set("anotInternas", e.target.value)} placeholder="Apenas para a equipe — não visível ao cliente." maxLength={1000}/>
          </Field>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="col" style={{ gap: 14 }}>
          <Checkbox
            checked={data.clienteExistente}
            onChange={(v) => {
              set("clienteExistente", v);
              if (!v) {
                clearSelectedClient();
                resetClientSearch();
              } else {
                clearSelectedClient();
              }
            }}
            label="Cliente existente (buscar no cadastro)"
          />

          {data.clienteExistente ? (
            <>
              <div className="view-switcher" style={{ width: "fit-content" }}>
                <button
                  type="button"
                  className={clientSearchMode === "name" ? "active" : ""}
                  onClick={() => {
                    setClientSearchMode("name");
                    if (!data.clientId) setClientResults([]);
                  }}
                >
                  Por nome
                </button>
                <button
                  type="button"
                  className={clientSearchMode === "phone" ? "active" : ""}
                  onClick={() => {
                    setClientSearchMode("phone");
                    if (!data.clientId) setClientResults([]);
                  }}
                >
                  Por telefone
                </button>
                <button
                  type="button"
                  className={clientSearchMode === "email" ? "active" : ""}
                  onClick={() => {
                    setClientSearchMode("email");
                    if (!data.clientId) setClientResults([]);
                  }}
                >
                  Por e-mail
                </button>
              </div>

              {data.clientId ? (
                <div style={{
                  border: "1px solid var(--gold-30)",
                  borderRadius: 4,
                  padding: 14,
                  background: "rgba(181, 235, 12,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "var(--fg)", fontWeight: 500 }}>{data.cliente}</div>
                    <div className="muted small" style={{ marginTop: 4 }}>
                      {formatPhoneDisplay(data.clienteTelCountryCode, data.clienteTelNationalNumber)} · {data.clienteEmail || "sem e-mail"}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={clearSelectedClient}>Trocar</Button>
                </div>
              ) : (
                <>
                  <Field
                    label={
                      clientSearchMode === "phone"
                        ? "Buscar por telefone"
                        : clientSearchMode === "email"
                          ? "Buscar por e-mail"
                          : "Buscar por nome"
                    }
                    error={err.cliente}
                    hint={
                      clientSearchMode === "phone"
                        ? "Digite ao menos 2 dígitos"
                        : clientSearchMode === "email"
                          ? "Digite ao menos 2 caracteres"
                          : "Digite ao menos 2 letras"
                    }
                  >
                    <Input
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      leading={
                        clientSearchMode === "phone"
                          ? <Icon.Phone size={14}/>
                          : clientSearchMode === "email"
                            ? <Icon.Mail size={14}/>
                            : <Icon.Search size={14}/>
                      }
                      placeholder={
                        clientSearchMode === "phone"
                          ? "Ex: 1198214422"
                          : clientSearchMode === "email"
                            ? "cliente@email.com"
                            : "Ex: João Silva"
                      }
                      err={!!err.cliente}
                    />
                  </Field>

                  {searchingClients ? (
                    <div className="muted small">A buscar clientes…</div>
                  ) : null}

                  {!searchingClients && clientSearchQuery.trim().length >= 2 && clientResults.length === 0 ? (
                    <div className="muted small">Nenhum cliente encontrado.</div>
                  ) : null}

                  {clientResults.length > 0 ? (
                    <div style={{
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      overflow: "hidden",
                      maxHeight: 220,
                      overflowY: "auto",
                    }}>
                      {clientResults.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => selectClient(client)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "12px 14px",
                            border: 0,
                            borderBottom: "1px solid var(--border)",
                            background: "var(--bg-elevated)",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ color: "var(--fg)", fontWeight: 500 }}>{client.name}</div>
                          <div className="muted small mono" style={{ marginTop: 2 }}>{client.tel}</div>
                          {client.email ? (
                            <div className="muted small" style={{ marginTop: 2 }}>{client.email}</div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              )}

              {data.clientId ? (
                <div style={{ border: "1px solid var(--gold-30)", padding: 12, borderRadius: 4, background: "rgba(181, 235, 12,0.06)", fontSize: 12.5, color: "var(--fg-3)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Icon.Info size={14} style={{ color: "var(--gold)", marginTop: 1 }}/>
                  <div>Endereço do cadastro será usado na etapa de propriedade. Você pode ajustar na próxima etapa.</div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <Field label="Nome do Cliente" error={err.cliente}>
                <Input
                  value={data.cliente}
                  onChange={(e) => set("cliente", e.target.value)}
                  placeholder="Nome completo"
                  err={!!err.cliente}
                  maxLength={100}
                />
              </Field>
              <Field label="Telefone" optional>
                <PhoneInput
                  countryCode={data.clienteTelCountryCode}
                  nationalNumber={data.clienteTelNationalNumber}
                  onChange={({ countryCode, nationalNumber }) =>
                    setData((d) => ({
                      ...d,
                      clienteTelCountryCode: countryCode,
                      clienteTelNationalNumber: nationalNumber,
                    }))
                  }
                />
              </Field>
              <Field label="E-mail" optional error={err.clienteEmail}>
                <Input
                  type="email"
                  value={data.clienteEmail}
                  onChange={(e) => set("clienteEmail", e.target.value)}
                  leading={<Icon.Mail size={14}/>}
                  placeholder="cliente@exemplo.com"
                  err={!!err.clienteEmail}
                />
              </Field>
            </>
          )}

          <ClientLanguageSelect
            value={data.clientePreferredLanguage}
            onChange={(lang) => set("clientePreferredLanguage", lang)}
            disabled={!!data.clientId}
            hint={data.clientId ? "Idioma definido no cadastro do cliente" : undefined}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="col" style={{ gap: 14 }}>
          {skipAddressValidation ? (
            <div style={{ border: "1px solid var(--gold-30)", padding: 12, borderRadius: 4, background: "rgba(181, 235, 12,0.06)", fontSize: 12.5, color: "var(--fg-3)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon.Info size={14} style={{ color: "var(--gold)", marginTop: 1 }}/>
              <div>Cliente já cadastrado — endereço é opcional. Preencha apenas se for diferente do cadastro.</div>
            </div>
          ) : null}
          <Field label="Unidade / Apartamento / Sala" optional={skipAddressValidation} error={err.unidade}>
            <Input value={data.unidade} onChange={(e) => set("unidade", e.target.value)} placeholder="Ex: Apto 1402, Torre B" err={!!err.unidade}/>
          </Field>
          <AddressLocationFields
            phoneCountryCode={data.clienteTelCountryCode}
            cidade={data.cidade}
            estado={data.estado}
            cep={data.cep}
            optional={skipAddressValidation}
            cidadeError={err.cidade}
            estadoError={err.estado}
            cepError={err.cep}
            onCidadeChange={(value) => set("cidade", value)}
            onEstadoChange={(value) => set("estado", value)}
            onCepChange={(value) => set("cep", value)}
          />
          <Field label="Anotações da Propriedade" optional hint="Ex: ponto de água, restrições de horário, vaga de garagem.">
            <Textarea value={data.anotPropriedade} onChange={(e) => set("anotPropriedade", e.target.value)} maxLength={1000}/>
          </Field>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="col" style={{ gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Data" error={err.data}>
              <Input type="date" value={data.data} onChange={(e) => set("data", e.target.value)} err={!!err.data}/>
            </Field>
            <Field label="Horário" error={err.horario}>
              <Input type="time" value={data.horario} onChange={(e) => set("horario", e.target.value)} err={!!err.horario}/>
            </Field>
          </div>
          <Field label="Anexos" optional hint="Fotos do veículo, documentos de referência. Máx. 25 MB por arquivo.">
            <div style={{
              border: "1px dashed var(--gold-30)",
              borderRadius: 4,
              padding: 30,
              background: "var(--bg-elevated)",
              textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8
            }}>
              <Icon.Paperclip size={22} style={{ color: "var(--gold)" }}/>
              <div style={{ color: "var(--fg-3)", fontSize: 13 }}>Arraste arquivos aqui ou <span style={{ color: "var(--gold)" }}>clique para enviar</span></div>
              <div className="tiny muted">Fotos · vídeos · documentos · até 5 arquivos</div>
            </div>
          </Field>
          <div style={{ border: "1px solid var(--gold-30)", background: "rgba(181, 235, 12,0.05)", padding: 14, borderRadius: 4 }}>
            <div style={{ color: "var(--gold)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, fontWeight: 500 }}>Resumo</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12.5 }}>
              <div><span className="muted">Projeto: </span><span style={{ color: "var(--fg)" }}>{data.projeto || "—"}</span></div>
              <div><span className="muted">Serviço: </span><span style={{ color: "var(--fg)" }}>{data.servico || "—"}</span></div>
              <div><span className="muted">Cliente: </span><span style={{ color: "var(--fg)" }}>{data.cliente || "—"}</span></div>
              <div><span className="muted">Endereço: </span><span style={{ color: "var(--fg)" }}>{data.cidade ? `${data.cidade}/${data.estado}` : "—"}</span></div>
              <div><span className="muted">Quando: </span><span className="mono" style={{ color: "var(--gold)" }}>{data.data || "—"} · {data.horario || "—"}</span></div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}


function TaskOrcamentoModal({ open, task, onClose, onSave }) {
  const [form, setForm] = useState({
    valor: "",
    status: "Pendente",
    fatura: "",
    metodo: "",
    deposito: "",
    saldo: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState({});
  const toast = useToast();

  useEffect(() => {
    if (!open || !task) return;
    const o = task.orcamento || {};
    setForm({
      valor: String(o.valor ?? 0),
      status: o.status || "Pendente",
      fatura: o.fatura && o.fatura !== "—" ? o.fatura : "",
      metodo: o.metodo && o.metodo !== "—" ? o.metodo : "",
      deposito: String(o.deposito ?? 0),
      saldo: String(o.saldo ?? 0),
    });
    setErr({});
  }, [open, task?.id]);

  if (!open || !task) return null;

  const submit = async () => {
    const next = {};
    const valor = Number(form.valor);
    const deposito = Number(form.deposito);
    if (!form.valor || Number.isNaN(valor) || valor < 0) next.valor = "Informe um valor válido.";
    if (Number.isNaN(deposito) || deposito < 0) next.deposito = "Depósito inválido.";
    if (deposito > valor) next.deposito = "Depósito não pode exceder o valor total.";
    setErr(next);
    if (Object.keys(next).length) return;

    const saldo = form.saldo !== "" && !Number.isNaN(Number(form.saldo))
      ? Number(form.saldo)
      : Math.max(0, valor - deposito);

    setSaving(true);
    try {
      await onSave(task.id, {
        valor,
        status: form.status,
        fatura: form.fatura.trim() || "—",
        metodo: form.metodo.trim() || "—",
        deposito,
        saldo,
      });
      toast({ kind: "success", title: "Orçamento atualizado", desc: task.id });
      onClose();
    } catch {
      /* erro exibido pelo App */
    } finally {
      setSaving(false);
    }
  };

  const previewSaldo = (() => {
    const valor = Number(form.valor) || 0;
    const deposito = Number(form.deposito) || 0;
    if (form.saldo !== "" && !Number.isNaN(Number(form.saldo))) return Number(form.saldo);
    return Math.max(0, valor - deposito);
  })();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Editar orçamento · ${task.id}`}
      sub={`${task.projeto} · ${task.cliente}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button icon={Icon.Check} disabled={saving} onClick={submit}>
            {saving ? "A guardar…" : "Guardar alterações"}
          </Button>
        </>
      }
    >
      <div className="col" style={{ gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Valor do orçamento" error={err.valor}>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
              err={!!err.valor}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="Pendente">Pendente</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Cancelado">Cancelado</option>
            </Select>
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="ID da fatura">
            <Input
              value={form.fatura}
              onChange={(e) => setForm((f) => ({ ...f, fatura: e.target.value }))}
              placeholder="FAT-00829"
            />
          </Field>
          <Field label="Método de pagamento">
            <Select
              value={form.metodo}
              onChange={(e) => setForm((f) => ({ ...f, metodo: e.target.value }))}
            >
              <option value="">—</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Pix">Pix</option>
              <option value="Transferência">Transferência</option>
              <option value="Dinheiro">Dinheiro</option>
            </Select>
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Depósito" error={err.deposito}>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={form.deposito}
              onChange={(e) => setForm((f) => ({ ...f, deposito: e.target.value }))}
              err={!!err.deposito}
            />
          </Field>
          <Field label="Saldo restante" hint="Calculado automaticamente se vazio">
            <Input
              type="number"
              min={0}
              step={0.01}
              value={form.saldo}
              onChange={(e) => setForm((f) => ({ ...f, saldo: e.target.value }))}
              placeholder={String(previewSaldo)}
            />
          </Field>
        </div>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--gold-30)", borderRadius: 4, padding: 14 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="tiny muted" style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>Total</span>
            <span className="num-display" style={{ color: "var(--gold)", fontSize: 22, fontWeight: 500 }}>
              {formatEUR(Number(form.valor) || 0)}
            </span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
            <span className="tiny muted">Saldo após depósito</span>
            <span className="mono" style={{ color: previewSaldo > 0 ? "#d4a017" : "#8fbf6a" }}>
              {formatEUR(previewSaldo)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export { AssignTechModal, ScheduleModal, CreateTaskModal, TaskOrcamentoModal };
