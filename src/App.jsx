import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BGG_DATA } from "./data/bggData";
import { buildCalendarEvents } from "./lib/scheduling";
import api from "./lib/api";
import { useToast, useConfirm } from "./components/ui";
import { LoginScreen, RegisterScreen, ForgotScreen, ResetScreen } from "./pages/auth";
import { Sidebar, TopBar } from "./components/layout/Chrome";
import { DashboardPage } from "./pages/Dashboard";
import { TasksPage, TaskDetail } from "./pages/Tasks";
import { AssignTechModal, ScheduleModal, CreateTaskModal } from "./components/modals/TaskModals";
import { CalendarPage } from "./pages/Calendar";
import { CustomersPage } from "./pages/Customers";
import { TechniciansPage } from "./pages/Technicians";
import { QuotesPage } from "./pages/Quotes";
import { StockPage } from "./pages/Stock";

function App() {
  const [authed, setAuthed] = useState(true); // start logged in by default
  const [authRoute, setAuthRoute] = useState("login"); // login | register | forgot | reset
  const [route, setRoute] = useState({ page: "dashboard" });
  const [tasks, setTasks] = useState(BGG_DATA.tasks);
  const [quotes, setQuotes] = useState([]);
  const [inventory, setInventory] = useState(() => BGG_DATA.inventoryProducts.map((p) => ({ ...p })));
  const [pendingFilter, setPendingFilter] = useState(null);

  // Modals
  const [assignFor, setAssignFor] = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirm, ConfirmEl] = useConfirm();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const calendarEvents = useMemo(
    () => buildCalendarEvents(tasks, BGG_DATA.seedCalendarExtras),
    [tasks]
  );

  const toast = useToast();

  const loadQuotes = useCallback(() => {
    api.get("/quotes").then(({ data }) => setQuotes(data)).catch(() => setQuotes([]));
  }, []);

  useEffect(() => {
    if (authed) loadQuotes();
  }, [authed, loadQuotes]);

  // ----- nav helpers -----
  const nav = (r) => {
    if (r.openCreate) setShowCreate(true);
    if (r.filter) setPendingFilter(r.filter);
    setRoute({ page: r.page });
  };
  const openTask = (id) => setRoute({ page: "task-detail", taskId: id });

  const onInventoryUpdate = (id, newQty) => {
    setInventory((cur) => cur.map((p) => (p.id === id ? { ...p, quantidadeAtual: newQty } : p)));
    toast({ kind: "success", title: "Estoque atualizado", desc: `${id} — nova quantidade: ${newQty}.` });
  };

  const onInventoryAdd = (product) => {
    const id = `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    setInventory((cur) => [{ ...product, id }, ...cur]);
    toast({ kind: "success", title: "Produto cadastrado", desc: product.nome });
  };

  // ----- task ops -----
  const updateTask = (id, patch) => setTasks((cur) => cur.map(t => t.id === id ? { ...t, ...patch } : t));
  const onAssignTech = (id) => setAssignFor(id);
  const onSchedule = (id) => setScheduleFor(id);
  const onCreateTask = () => setShowCreate(true);

  const saveAssign = (id, techName) => {
    updateTask(id, { tecnico: techName, tecnicoStatus: "Confirmado", status: tasks.find(t => t.id === id).status === "Sem técnico" ? "Agendado" : tasks.find(t => t.id === id).status });
  };
  const saveSchedule = (id, payload) => {
    const cur = tasks.find(t => t.id === id);
    const duracaoHoras = Number(payload.duracaoHoras);
    updateTask(id, {
      dataAgendada: payload.dataAgendada,
      horario: payload.horario,
      tecnico: payload.tecnico,
      baia: Number(payload.baia),
      duracaoHoras,
      duracao: Math.round(duracaoHoras * 60),
      tecnicoStatus: "Confirmado",
      status: cur.status === "Não agendado" || cur.status === "Sem técnico" || cur.status === "Aguardando orçamento" ? "Agendado" : cur.status,
    });
  };

  const onCancelTask = async (id) => {
    const ok = await confirm({
      title: "Cancelar tarefa?",
      body: "Tem certeza de que deseja cancelar esta tarefa? Isso pode notificar o cliente e o técnico designado.",
      ok: "Cancelar tarefa", danger: true, cancel: "Voltar"
    });
    if (!ok) return;
    updateTask(id, { status: "Cancelado", tecnicoStatus: "—" });
    toast({ kind: "error", title: "Tarefa cancelada", desc: `${id} — Cliente e técnico foram notificados.` });
  };

  const onRejectTask = async (id) => {
    const ok = await confirm({
      title: "Rejeitar solicitação?",
      body: "Tem certeza de que deseja rejeitar esta solicitação? O cliente será notificado.",
      ok: "Rejeitar", danger: true,
    });
    if (!ok) return;
    updateTask(id, { status: "Cancelado" });
    toast({ kind: "error", title: "Solicitação rejeitada", desc: id });
  };

  const onEditQuote = (id) => {
    toast({ kind: "default", title: "Editar Orçamento", desc: `Abrindo página de edição para ${id}.` });
  };
  const onApproveQuote = async (id) => {
    const ok = await confirm({
      title: "Aprovar orçamento?",
      body: "Tem certeza de que deseja aprovar este orçamento?",
      ok: "Aprovar",
    });
    if (!ok) return;
    try {
      await api.patch(`/quotes/${id}/approve`);
      const { data } = await api.get("/quotes");
      setQuotes(data);
      toast({ kind: "success", title: "Orçamento aprovado", desc: `Pronto para envio ao cliente — ${id}.` });
    } catch {
      toast({ kind: "error", title: "Erro ao aprovar", desc: "Não foi possível aprovar o orçamento." });
    }
  };
  const onApproveTaskQuote = async (taskId) => {
    const ok = await confirm({
      title: "Aprovar orçamento?",
      body: "Tem certeza de que deseja aprovar este orçamento?",
      ok: "Aprovar",
    });
    if (!ok) return;
    const cur = tasks.find((t) => t.id === taskId);
    updateTask(taskId, {
      orcamento: { ...cur.orcamento, status: "Aprovado" },
      status: cur.status === "Aguardando orçamento" ? "Não agendado" : cur.status,
    });
    toast({ kind: "success", title: "Orçamento aprovado", desc: `Pronto para envio ao cliente — ${taskId}.` });
  };
  const onSendQuote = async (id) => {
    const ok = await confirm({
      title: "Enviar orçamento ao cliente?",
      body: "Tem certeza de que deseja enviar este orçamento ao cliente?",
      ok: "Enviar",
    });
    if (!ok) return;
    toast({ kind: "success", title: "Orçamento enviado", desc: `Cliente notificado — ${id}.` });
  };
  const onResendQuote = async (id) => {
    const ok = await confirm({
      title: "Reenviar orçamento?",
      body: "Tem certeza de que deseja reenviar este orçamento ao cliente?",
      ok: "Reenviar",
    });
    if (!ok) return;
    toast({ kind: "success", title: "Orçamento reenviado", desc: `Cliente notificado novamente — ${id}.` });
  };

  const onSaveQA = (id, notes) => {
    updateTask(id, {
      status: "Concluído",
      qa: { ...(tasks.find(t => t.id === id).qa), notas: notes, status: "Aprovado" },
    });
  };

  const onCreate = (data) => {
    const newId = "TR-" + (2842 + Math.floor(Math.random() * 50));
    setTasks((cur) => [{
      id: newId,
      projeto: data.projeto,
      cliente: data.cliente,
      clienteEmail: data.clienteEmail || "—",
      clienteTel: data.clienteTel || "—",
      servico: data.servico,
      status: "Não agendado",
      descricao: data.descricao,
      endereco: { unidade: data.unidade, logradouro: "—", cidade: data.cidade, estado: data.estado, cep: data.cep },
      dataAgendada: data.data, horario: data.horario,
      dataCriacao: "2026-05-21 12:30",
      ultimaAtualizacao: "2026-05-21 12:30",
      tecnico: "", tecnicoStatus: "—", tecnicoNotas: "",
      orcamento: { valor: 0, status: "Pendente", fatura: "—", metodo: "—", deposito: 0, saldo: 0 },
      anexos: [],
      qa: { status: "—", notas: "", fotos: [], concluidoEm: "" },
      agendaPreferencial: "—",
      log: [{ t: "Tarefa criada manualmente", w: "Admin · Você", when: "Agora" }],
    }, ...cur]);
  };

  // ----- auth handlers -----
  if (!authed) {
    const goAuth = (r) => setAuthRoute(r);
    const onAuthed = () => { setAuthed(true); setRoute({ page: "dashboard" }); toast({ kind: "success", title: "Bem-vindo", desc: "Sessão iniciada." }); };
    const authScreen = authRoute === "login" ? <LoginScreen onAuthed={onAuthed} onGo={goAuth}/>
      : authRoute === "register" ? <RegisterScreen onAuthed={onAuthed} onGo={goAuth}/>
      : authRoute === "forgot" ? <ForgotScreen onGo={goAuth}/>
      : <ResetScreen onAuthed={onAuthed} onGo={goAuth}/>;
    return (
      <div className="auth-shell">
        {authScreen}
      </div>
    );
  }

  const task = route.page === "task-detail" ? tasks.find(t => t.id === route.taskId) : null;

  return (
    <div className="app-root" data-collapsed={sidebarCollapsed}>
      <Sidebar
        route={route}
        onNav={nav}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        onLogout={() => { setAuthed(false); setAuthRoute("login"); }}
      />
      <div className="main-col">
        <TopBar route={route} onNav={nav}/>

        {route.page === "dashboard" ? (
          <DashboardPage
            onNav={nav}
            onOpenTask={openTask}
            onEditQuote={onEditQuote}
            onApproveQuote={onApproveQuote}
            onSendQuote={onSendQuote}
            onAssignTech={onAssignTech}
            onSchedule={onSchedule}
            onRejectTask={onRejectTask}
            inventory={inventory}
            quotes={quotes}
          />
        ) : null}

        {route.page === "tasks" ? (
          <TasksPage
            tasks={tasks}
            onOpenTask={openTask}
            onSchedule={onSchedule}
            onAssignTech={onAssignTech}
            onCreateTask={onCreateTask}
            onCancelTask={onCancelTask}
            externalFilter={pendingFilter}
            onConsumeFilter={() => setPendingFilter(null)}
          />
        ) : null}

        {route.page === "task-detail" && task ? (
          <TaskDetail
            task={task}
            onAssignTech={onAssignTech}
            onSchedule={onSchedule}
            onApproveQuote={onApproveTaskQuote}
            onSendQuote={onSendQuote}
            onResendQuote={onResendQuote}
            onSaveQA={onSaveQA}
            onEditQuote={onEditQuote}
          />
        ) : null}

        {route.page === "calendar" ? (
          <CalendarPage
            onOpenTask={openTask}
            events={calendarEvents}
            tasks={tasks}
            onSaveSchedule={saveSchedule}
          />
        ) : null}

        {route.page === "customers" ? (
          <CustomersPage onOpenTask={openTask}/>
        ) : null}

        {route.page === "technicians" ? (
          <TechniciansPage onOpenTask={openTask}/>
        ) : null}

        {route.page === "quotes" ? (
          <QuotesPage onOpenTask={openTask}/>
        ) : null}

        {route.page === "stock" ? (
          <StockPage inventory={inventory} onUpdateQty={onInventoryUpdate} onAddProduct={onInventoryAdd}/>
        ) : null}
      </div>

      <AssignTechModal
        open={!!assignFor}
        task={tasks.find(t => t.id === assignFor)}
        onClose={() => setAssignFor(null)}
        onSave={saveAssign}
      />
      <ScheduleModal
        open={!!scheduleFor}
        task={tasks.find(t => t.id === scheduleFor)}
        events={calendarEvents}
        onClose={() => setScheduleFor(null)}
        onSave={saveSchedule}
      />
      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={onCreate}
      />
      {ConfirmEl}
    </div>
  );
}


export default App;
