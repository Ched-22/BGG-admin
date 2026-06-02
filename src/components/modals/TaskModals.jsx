import React, { useState, useEffect, useMemo } from "react";
import { BGG_DATA } from "../../data/bggData";
import { Button, Icon, Field, Input, Select, Textarea, Checkbox, Modal, useToast } from "../ui";
import {
  BAIAS,
  DURATION_HOUR_OPTIONS,
  DURATION_OTHER,
  findBayConflict,
  formatDurationHours,
  getBlockedTimeSlots,
  endsAfterClosing,
  isPresetDurationHours,
  minutesToTime,
  parseTimeToMinutes,
  resolveDurationHours,
} from "../../lib/scheduling";

// ----- Assign Technician -----
function AssignTechModal({ open, task, onClose, onSave }) {
  const [techName, setTechName] = useState("");
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState(true);
  const [err, setErr] = useState({});
  const toast = useToast();
  const techs = BGG_DATA.techs;
  const selected = techs.find(t => t.name === techName);

  useEffect(() => {
    if (open) {
      setTechName(task && task.tecnico ? task.tecnico : "");
      setNotes("");
      setErr({});
    }
  }, [open, task]);

  const submit = () => {
    const next = {};
    if (!techName) next.tech = "Técnico é obrigatório.";
    if (notes.length > 500) next.notes = "As anotações de designação não devem exceder 500 caracteres.";
    if (selected && !selected.disponivel) next.tech = "O técnico selecionado não está disponível para esta tarefa.";
    if (selected && selected.conflito) next.tech = "O técnico selecionado tem um conflito de agenda. Por favor, selecione outro técnico.";
    setErr(next);
    if (Object.keys(next).length) return;
    onSave(task.id, techName);
    toast({
      kind: "success",
      title: notify ? "Técnico designado e notificado" : "Técnico designado",
      desc: `${techName} foi designado para ${task.id}.`,
    });
    onClose();
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
              return (
                <button
                  key={t.name}
                  onClick={() => setTechName(t.name)}
                  style={{
                    border: `1px solid ${sel ? "var(--gold)" : "var(--border)"}`,
                    background: sel ? "rgba(194,164,109,0.10)" : "var(--bg-elevated)",
                    borderRadius: 4,
                    padding: 12,
                    textAlign: "left",
                    opacity: dim ? 0.5 : 1,
                    cursor: dim ? "not-allowed" : "pointer",
                    display: "flex", gap: 10, alignItems: "flex-start",
                    transition: "all 200ms var(--ease-out)",
                  }}
                  disabled={dim}
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
                    <div className="tiny muted" style={{ marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.skills.join(" · ")}</div>
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
                {selected.skills.map(s => <span key={s} className="tag">{s}</span>)}
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
function ScheduleModal({ open, task, tasks = [], events = [], defaultDate = "", onClose, onSave }) {
  const [pickedTaskId, setPickedTaskId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tech, setTech] = useState("");
  const [baia, setBaia] = useState(1);
  const [durationMode, setDurationMode] = useState("preset");
  const [duracaoHoras, setDuracaoHoras] = useState(2);
  const [customDuracaoHoras, setCustomDuracaoHoras] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyCli, setNotifyCli] = useState(true);
  const [notifyTec, setNotifyTec] = useState(true);
  const [err, setErr] = useState({});
  const toast = useToast();

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
    if (!open) return;
    const source = task || tasks.find((t) => t.id === pickedTaskId);
    if (source) {
      setDate(source.dataAgendada || defaultDate || "2026-05-22");
      setTime(source.horario || "");
      setTech(source.tecnico || "");
      setBaia(source.baia || 1);
      applyDuration(source.duracaoHoras);
    } else {
      setPickedTaskId("");
      setDate(defaultDate || "2026-05-22");
      setTime("");
      setTech("");
      setBaia(1);
      applyDuration(2);
    }
    setNotes("");
    setErr({});
  }, [open, task, pickedTaskId, defaultDate, tasks]);

  const times = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"];
  const activeTaskId = activeTask?.id;
  const effectiveDuracaoHoras = resolveDurationHours({ durationMode, duracaoHoras, customDuracaoHoras });
  const blockedTimes = useMemo(
    () => (activeTaskId && date && effectiveDuracaoHoras > 0
      ? getBlockedTimeSlots(events, { data: date, duracaoHoras: effectiveDuracaoHoras, baia, excludeId: activeTaskId }, times)
      : []),
    [events, date, effectiveDuracaoHoras, baia, activeTaskId]
  );
  const conflictAtSelection = activeTaskId && date && time && baia && effectiveDuracaoHoras > 0
    ? findBayConflict(events, { data: date, horario: time, duracaoHoras: effectiveDuracaoHoras, baia }, activeTaskId)
    : null;

  if (!open) return null;

  // Build a simple calendar grid (May 2026)
  const month = [
    [27, 28, 29, 30, 1, 2, 3],
    [4, 5, 6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16, 17],
    [18, 19, 20, 21, 22, 23, 24],
    [25, 26, 27, 28, 29, 30, 31],
  ];
  const todayDay = 21;
  const selDay = parseInt(date.split("-")[2], 10);
  const submit = () => {
    const next = {};
    if (!activeTask) next.task = "Selecione a tarefa a agendar.";
    if (!date) next.date = "A data de agendamento é obrigatória.";
    if (!time) next.time = "Horário de agendamento é obrigatório.";
    if (!tech) next.tech = "Técnico é obrigatório.";
    if (!baia) next.baia = "Selecione a baia.";
    if (durationMode === DURATION_OTHER) {
      if (!customDuracaoHoras) next.duracaoHoras = "Informe a quantidade de horas.";
      else if (!effectiveDuracaoHoras || effectiveDuracaoHoras <= 8) {
        next.duracaoHoras = "Em Outro, informe mais de 8 horas.";
      }
    } else if (!effectiveDuracaoHoras || effectiveDuracaoHoras <= 0) {
      next.duracaoHoras = "Informe a duração do serviço.";
    }
    if (effectiveDuracaoHoras > 0 && endsAfterClosing(time, effectiveDuracaoHoras)) {
      next.time = `O serviço termina após o fechamento (${minutesToTime(parseTimeToMinutes(time) + effectiveDuracaoHoras * 60)}).`;
    }
    if (activeTask && effectiveDuracaoHoras > 0) {
      const conflict = findBayConflict(events, { data: date, horario: time, duracaoHoras: effectiveDuracaoHoras, baia }, activeTask.id);
      if (conflict) {
        next.time = `Baia ${baia} ocupada neste horário — conflito com ${conflict.title || conflict.id}.`;
      }
    }
    if (notes.length > 500) next.notes = "As anotações da agenda não devem exceder 500 caracteres.";
    setErr(next);
    if (Object.keys(next).length) return;
    onSave(activeTask.id, { dataAgendada: date, horario: time, tecnico: tech, baia, duracaoHoras: effectiveDuracaoHoras });
    toast({
      kind: "success",
      title: "Tarefa agendada",
      desc: `${activeTask.id} · ${date} ${time} · Baia ${baia} · ${formatDurationHours(effectiveDuracaoHoras)}`,
    });
    if (notifyCli) toast({ kind: "success", title: "Cliente notificado", desc: activeTask.cliente });
    if (notifyTec) toast({ kind: "success", title: "Técnico notificado", desc: tech });
    onClose();
  };

  const modalTitle = task ? "Agendar Tarefa" : "Novo agendamento";
  const modalSub = activeTask
    ? `${activeTask.id} · ${activeTask.projeto} · ${activeTask.cliente}`
    : "Selecione a tarefa e defina baia, duração e horário";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      sub={modalSub}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button icon={Icon.Calendar} onClick={submit}>Salvar agendamento</Button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="col" style={{ gap: 16 }}>
          <Field label="Data Agendada" error={err.date}>
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: 12, borderRadius: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <button className="icon-btn" style={{ width: 24, height: 24 }}><Icon.ChevronLeft size={14}/></button>
                <div className="serif" style={{ color: "var(--gold)", fontSize: 16, letterSpacing: "0.04em" }}>Maio · 2026</div>
                <button className="icon-btn" style={{ width: 24, height: 24 }}><Icon.Chevron size={14}/></button>
              </div>
              <div className="cal">
                {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => <div key={d} className="h">{d}</div>)}
                {month.flat().map((d, i) => {
                  const wkIdx = Math.floor(i / 7);
                  const isCur = (wkIdx === 0 && d > 7) || (wkIdx >= 4 && d < 10) ? false : true;
                  const dStr = `2026-05-${String(d).padStart(2, "0")}`;
                  const sel = isCur && d === selDay;
                  const today = isCur && d === todayDay;
                  const busy = isCur && (d === 23 || d === 26);
                  return (
                    <button
                      key={i}
                      className={`d ${!isCur ? "muted" : ""} ${sel ? "sel" : ""} ${today && !sel ? "today" : ""} ${busy ? "busy" : ""}`}
                      onClick={() => isCur && setDate(dStr)}
                      disabled={!isCur}
                    >{d}</button>
                  );
                })}
              </div>
              <div className="row" style={{ marginTop: 10, gap: 14, fontSize: 10, color: "var(--fg-6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <span className="row" style={{ gap: 4 }}><span style={{ width: 6, height: 6, background: "var(--gold)", borderRadius: "50%" }}></span>Hoje</span>
                <span className="row" style={{ gap: 4 }}><span style={{ width: 6, height: 6, background: "var(--destructive)", borderRadius: "50%" }}></span>Indisponível</span>
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
                      background: sel ? "rgba(194,164,109,0.10)" : "var(--bg-elevated)",
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
            label="Horário"
            error={err.time}
            hint={conflictAtSelection
              ? `Baia ${baia} indisponível — conflito com ${conflictAtSelection.title || conflictAtSelection.id}`
              : "Horários em cinza: baia ocupada ou ultrapassam 18:00"}
          >
            <div className="time-grid">
              {times.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`time-chip ${time === t ? "sel" : ""}`}
                  disabled={blockedTimes.includes(t)}
                  onClick={() => setTime(t)}
                  title={blockedTimes.includes(t) ? "Indisponível nesta baia" : undefined}
                >{t}</button>
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
            </Field>
          ) : null}

          <Field label="Técnico Designado" error={err.tech}>
            <Select value={tech} onChange={(e) => setTech(e.target.value)} err={!!err.tech}>
              <option value="">Selecione um técnico</option>
              {BGG_DATA.techs.filter(t => t.disponivel).map(t => (
                <option key={t.name} value={t.name}>{t.name} — {t.skills.slice(0,2).join(", ")}</option>
              ))}
            </Select>
          </Field>

          <Field label="Resumo do agendamento">
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--gold-30)", borderRadius: 4, padding: 14 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span className="tiny" style={{ color: "var(--fg-6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Quando</span>
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
            <Checkbox checked={notifyCli} onChange={setNotifyCli} label="Notificar cliente"/>
            <Checkbox checked={notifyTec} onChange={setNotifyTec} label="Notificar técnico"/>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ----- Create Task -----
function CreateTaskModal({ open, onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    projeto: "", servico: "", descricao: "", anotInternas: "",
    clienteExistente: false, cliente: "", clienteEmail: "", clienteTel: "",
    unidade: "", cidade: "", estado: "", cep: "", anotPropriedade: "",
    data: "", horario: "",
  });
  const [err, setErr] = useState({});
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setStep(1);
      setData({
        projeto: "", servico: "", descricao: "", anotInternas: "",
        clienteExistente: false, cliente: "", clienteEmail: "", clienteTel: "",
        unidade: "", cidade: "", estado: "", cep: "", anotPropriedade: "",
        data: "", horario: "",
      });
      setErr({});
    }
  }, [open]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const validate = () => {
    const e = {};
    if (!data.projeto) e.projeto = "Título é obrigatório.";
    if (data.projeto.length > 100) e.projeto = "O título do projeto não deve exceder 100 caracteres.";
    if (!data.servico) e.servico = "O tipo de serviço é obrigatório.";
    if (!data.descricao) e.descricao = "A descrição da tarefa é obrigatória.";
    if (data.descricao.length > 1000) e.descricao = "A descrição da tarefa não deve exceder 1.000 caracteres.";
    if (!data.cliente) e.cliente = "O nome do cliente é obrigatório.";
    if (data.cliente.length > 100) e.cliente = "O nome do cliente não deve exceder 100 caracteres.";
    if (data.clienteEmail && !/^\S+@\S+\.\S+$/.test(data.clienteEmail)) e.clienteEmail = "Digite um endereço de e-mail válido.";
    if (!data.unidade) e.unidade = "Unidade, apartamento ou sala é obrigatório.";
    if (!data.cidade) e.cidade = "Cidade é obrigatória.";
    if (!data.estado) e.estado = "Estado é obrigatório.";
    if (!data.cep) e.cep = "Código postal é obrigatório.";
    if (!data.data) e.data = "A data de agendamento é obrigatória.";
    if (!data.horario) e.horario = "O horário é obrigatório.";
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) {
      toast({ kind: "error", title: "Não foi possível criar a tarefa", desc: "Revise os campos obrigatórios e tente novamente." });
      return;
    }
    onCreate(data);
    toast({ kind: "success", title: "Tarefa criada com sucesso", desc: `${data.projeto}` });
    onClose();
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
          {step < 4 ? <Button onClick={() => setStep(s => Math.min(4, s + 1))}>Continuar <Icon.ArrowRight size={14}/></Button> : null}
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
            onChange={(v) => set("clienteExistente", v)}
            label="Cliente existente (buscar no cadastro)"
          />
          <Field label={data.clienteExistente ? "Buscar Cliente" : "Nome do Cliente"} error={err.cliente}>
            <Input
              value={data.cliente}
              onChange={(e) => set("cliente", e.target.value)}
              leading={data.clienteExistente ? <Icon.Search size={14}/> : null}
              placeholder={data.clienteExistente ? "Digite para buscar…" : "Nome completo"}
              err={!!err.cliente}
              maxLength={100}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
            <Field label="Telefone" optional>
              <Input
                value={data.clienteTel}
                onChange={(e) => set("clienteTel", e.target.value)}
                leading={<Icon.Phone size={14}/>}
                placeholder="+55 11 9 ..."
              />
            </Field>
          </div>
          {data.clienteExistente ? (
            <div style={{ border: "1px solid var(--gold-30)", padding: 12, borderRadius: 4, background: "rgba(194,164,109,0.06)", fontSize: 12.5, color: "var(--fg-3)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon.Info size={14} style={{ color: "var(--gold)", marginTop: 1 }}/>
              <div>Detalhes do cliente foram carregados com sucesso. Os campos da propriedade serão pré-preenchidos automaticamente.</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="col" style={{ gap: 14 }}>
          <Field label="Unidade / Apartamento / Sala" error={err.unidade}>
            <Input value={data.unidade} onChange={(e) => set("unidade", e.target.value)} placeholder="Ex: Apto 1402, Torre B" err={!!err.unidade}/>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <Field label="Cidade" error={err.cidade}>
              <Input value={data.cidade} onChange={(e) => set("cidade", e.target.value)} err={!!err.cidade}/>
            </Field>
            <Field label="Estado" error={err.estado}>
              <Select value={data.estado} onChange={(e) => set("estado", e.target.value)} err={!!err.estado}>
                <option value="">UF</option>
                {BGG_DATA.estados.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="CEP" error={err.cep}>
              <Input value={data.cep} onChange={(e) => set("cep", e.target.value)} placeholder="00000-000" err={!!err.cep}/>
            </Field>
          </div>
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
          <div style={{ border: "1px solid var(--gold-30)", background: "rgba(194,164,109,0.05)", padding: 14, borderRadius: 4 }}>
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


export { AssignTechModal, ScheduleModal, CreateTaskModal };
