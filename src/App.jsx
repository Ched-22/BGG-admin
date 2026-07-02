import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BGG_DATA } from "./data/bggData";
import { buildCalendarEvents } from "./lib/scheduling";
import api from "./lib/api";
import { useToast, useConfirm } from "./components/ui";
import { useAuth } from "./context/AuthContext";
import { LoginScreen, RegisterScreen, ForgotScreen, ResetScreen } from "./pages/auth";
import { Sidebar, TopBar } from "./components/layout/Chrome";
import { NotificationPanel } from "./components/NotificationPanel";
import { DashboardPage } from "./pages/Dashboard";
import { TasksPage, TaskDetail } from "./pages/Tasks";
import { AssignTechModal, ScheduleModal, CreateTaskModal, TaskOrcamentoModal } from "./components/modals/TaskModals";
import { QuoteDetailModal } from "./components/modals/QuoteDetailModal";
import { CalendarPage } from "./pages/Calendar";
import { CustomersPage } from "./pages/Customers";
import { VehiclesPage } from "./pages/Vehicles";
import { TechniciansPage } from "./pages/Technicians";
import { QuotesPage } from "./pages/Quotes";
import { StockPage } from "./pages/Stock";
import { FinancePage } from "./pages/Finance";
import { ServicesPage } from "./pages/Services";
import { ProfilePage } from "./pages/Profile";
import { mapQuotesFromApi, createTaskFromQuote, listQuotes } from "./lib/quoteApi";
import {
  countOpenTasks,
  createTask,
  listTasks,
  mapCreateTaskToApi,
  notifyReadyForPickup,
  patchTask,
  statusAfterAssign,
  statusAfterSchedule,
} from "./lib/taskApi";
import { listTechnicians } from "./lib/technicianApi";
import {
  createInventoryProduct,
  deleteInventoryProduct,
  listInventoryProducts,
  updateInventoryProduct,
} from "./lib/inventoryApi";
import { usePermissions } from "./lib/permissions";
import {
  clearStoredNavigation,
  getStoredPendingFilter,
  getStoredRoute,
  storePendingFilter,
  storeRoute,
} from "./lib/adminRoute";
import {
  openWhatsAppAfterApi,
  openWhatsAppQuoteResend,
  openWhatsAppQuoteSend,
  serviceReadyPickupVarsFromTask,
} from "./lib/whatsapp";
import { resolveClientPreferredLanguage } from "./lib/clientLanguage";
import { getUnreadCount } from "./lib/notificationApi";

function readResetTokenFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get("token") || "";
  } catch {
    return "";
  }
}

function App() {
  const { isAuthenticated, logout, sessionExpired, clearSessionExpired } = useAuth();
  const permissions = usePermissions();
  const initialResetToken = readResetTokenFromUrl();
  const [authRoute, setAuthRoute] = useState(initialResetToken ? "reset" : "login"); // login | register | forgot | reset
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [route, setRoute] = useState(() => getStoredRoute());
  const [tasks, setTasks] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [pendingFilter, setPendingFilter] = useState(() => getStoredPendingFilter());
  const [quoteModal, setQuoteModal] = useState(null);
  const [taskQuoteFor, setTaskQuoteFor] = useState(null);

  // Modals
  const [assignFor, setAssignFor] = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createTaskPrefill, setCreateTaskPrefill] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [confirm, ConfirmEl] = useConfirm();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const calendarEvents = useMemo(
    () => buildCalendarEvents(tasks, BGG_DATA.seedCalendarExtras),
    [tasks]
  );

  const openTasksCount = useMemo(() => countOpenTasks(tasks), [tasks]);

  const toast = useToast();

  useEffect(() => {
    if (!isAuthenticated && resetToken) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      } catch {
        /* ignore */
      }
    }
  }, [isAuthenticated, resetToken]);

  const loadQuotes = useCallback(() => {
    return listQuotes({ limit: 100 })
      .then((res) => setQuotes(mapQuotesFromApi(res)))
      .catch(() => setQuotes([]));
  }, []);

  const loadInventory = useCallback(() => {
    return listInventoryProducts()
      .then((products) => setInventory(products))
      .catch(() => setInventory([]));
  }, []);

  const loadTasks = useCallback(() => {
    return listTasks()
      .then((rows) => setTasks(rows))
      .catch(() => setTasks([]));
  }, []);

  const loadTechnicians = useCallback(() => {
    return listTechnicians({ limit: 100, active: true })
      .then((res) => setTechnicians(Array.isArray(res) ? res : (res?.data || [])))
      .catch(() => setTechnicians([]));
  }, []);

  const refreshTasks = useCallback(async () => {
    await loadTasks();
    toast({ kind: "success", title: "Atualizado", desc: "Tarefas recarregadas." });
  }, [loadTasks, toast]);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([loadQuotes(), loadInventory(), loadTasks(), loadTechnicians()]);
    toast({ kind: "success", title: "Atualizado", desc: "Dashboard atualizado." });
  }, [loadQuotes, loadInventory, loadTasks, loadTechnicians, toast]);

  const refreshInventory = useCallback(async () => {
    await loadInventory();
    toast({ kind: "success", title: "Atualizado", desc: "Estoque atualizado." });
  }, [loadInventory, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadQuotes();
      loadInventory();
      loadTasks();
      loadTechnicians();
    }
  }, [isAuthenticated, loadQuotes, loadInventory, loadTasks, loadTechnicians]);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadNotifCount(0);
      return;
    }
    try {
      const count = await getUnreadCount();
      setUnreadNotifCount(count);
    } catch {
      setUnreadNotifCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    refreshUnreadCount();
    const timer = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(timer);
  }, [isAuthenticated, refreshUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated && sessionExpired) {
      toast({
        kind: "error",
        title: "Sessão expirada",
        desc: "Faça login novamente para continuar.",
      });
      clearSessionExpired();
    }
  }, [isAuthenticated, sessionExpired, clearSessionExpired, toast]);

  useEffect(() => {
    if (isAuthenticated) storeRoute(route);
  }, [route, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) storePendingFilter(pendingFilter);
  }, [pendingFilter, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !permissions.isAdmin && route.page === "finance") {
      setRoute({ page: "dashboard" });
    }
  }, [isAuthenticated, permissions.isAdmin, route.page]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (route.page === "task-detail" && route.taskId) {
      const found = tasks.find((t) => t.id === route.taskId);
      if (!found) setRoute({ page: "tasks" });
    }
  }, [isAuthenticated, route.page, route.taskId, tasks]);

  // ----- nav helpers -----
  const nav = (r) => {
    if (r.openCreate) setShowCreate(true);
    if (r.filter) setPendingFilter(r.filter);
    setRoute({
      page: r.page,
      ...(r.taskId ? { taskId: r.taskId } : {}),
      ...(r.customerId ? { customerId: r.customerId } : {}),
    });
  };
  const openTask = (id) => setRoute({ page: "task-detail", taskId: id });

  const handleNotificationAction = (action) => {
    if (!action) return;
    if (action.target === "quote" && action.id) {
      const quote = quotes.find((q) => q.id === action.id);
      if (quote) setQuoteModal({ quote, editMode: false });
      else nav({ page: "quotes" });
      return;
    }
    if (action.target === "task" && action.id) {
      openTask(action.id);
      return;
    }
    if (action.target === "tasks" || action.route === "tasks") {
      nav({ page: "tasks" });
      return;
    }
    if (action.target === "quotes" || action.route === "quotes") {
      nav({ page: "quotes" });
    }
  };

  const onInventoryUpdate = async (id, newQty) => {
    try {
      const updated = await updateInventoryProduct(id, { quantidadeAtual: newQty });
      setInventory((cur) => cur.map((p) => (p.id === id ? updated : p)));
      toast({ kind: "success", title: "Estoque atualizado", desc: `${updated.sku} — nova quantidade: ${newQty}.` });
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Falha ao atualizar estoque",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Tente novamente.",
      });
      throw err;
    }
  };

  const onInventoryPatch = async (id, patch) => {
    try {
      const updated = await updateInventoryProduct(id, patch);
      setInventory((cur) => cur.map((p) => (p.id === id ? updated : p)));
      toast({ kind: "success", title: "Produto atualizado", desc: updated.nome });
      return updated;
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Falha ao atualizar produto",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Tente novamente.",
      });
      throw err;
    }
  };

  const onInventoryAdd = async (product) => {
    try {
      const created = await createInventoryProduct(product);
      setInventory((cur) => [created, ...cur]);
      toast({ kind: "success", title: "Produto cadastrado", desc: created.nome });
      return created;
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Falha ao cadastrar produto",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Tente novamente.",
      });
      throw err;
    }
  };

  const onInventoryDelete = async (id) => {
    try {
      await deleteInventoryProduct(id);
      setInventory((cur) => cur.filter((p) => p.id !== id));
      toast({ kind: "success", title: "Produto removido", desc: "Item desativado do estoque." });
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Falha ao remover produto",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Tente novamente.",
      });
      throw err;
    }
  };

  // ----- task ops -----
  const replaceTask = useCallback((updated) => {
    setTasks((cur) => cur.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const persistTask = useCallback(async (displayId, patch, { errorTitle = "Falha ao salvar tarefa" } = {}) => {
    try {
      const updated = await patchTask(displayId, patch);
      replaceTask(updated);
      return updated;
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: errorTitle,
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Tente novamente.",
      });
      throw err;
    }
  }, [replaceTask, toast]);

  const onAssignTech = (id) => setAssignFor(id);
  const onSchedule = (id) => setScheduleFor(id);
  const onCreateTask = (prefill) => {
    setCreateTaskPrefill(prefill || null);
    setShowCreate(true);
  };
  const closeCreateTask = () => {
    setShowCreate(false);
    setCreateTaskPrefill(null);
  };

  const saveAssign = async (id, techName) => {
    const cur = tasks.find((t) => t.id === id);
    if (!cur) return;
    await persistTask(id, {
      tecnico: techName,
      tecnicoStatus: "Confirmado",
      status: statusAfterAssign(cur.status),
      logAction: "TECH_ASSIGNED",
      logMeta: { techName },
    }, { errorTitle: "Falha ao designar técnico" });
  };

  const saveSchedule = async (id, payload) => {
    const cur = tasks.find((t) => t.id === id);
    if (!cur) return;
    const duracaoHoras = Number(payload.duracaoHoras);
    await persistTask(id, {
      clientDropoffDate: payload.clientDropoffDate,
      clientDropoffTime: payload.clientDropoffTime,
      dataAgendada: payload.dataAgendada,
      horario: payload.horario,
      tecnico: payload.tecnico,
      baia: Number(payload.baia),
      duracaoHoras,
      tecnicoStatus: "Confirmado",
      status: statusAfterSchedule(cur.status),
      logAction: "TASK_SCHEDULED",
      logMeta: {
        clientDropoffDate: payload.clientDropoffDate,
        clientDropoffTime: payload.clientDropoffTime,
        dataAgendada: payload.dataAgendada,
        horario: payload.horario,
        baia: Number(payload.baia),
      },
    }, { errorTitle: "Falha ao agendar tarefa" });
  };

  const onCancelTask = async (id) => {
    const ok = await confirm({
      title: "Cancelar tarefa?",
      body: "Tem certeza de que deseja cancelar esta tarefa? Isso pode notificar o cliente e o técnico designado.",
      ok: "Cancelar tarefa", danger: true, cancel: "Voltar"
    });
    if (!ok) return;
    try {
      await persistTask(id, {
        status: "Cancelado",
        tecnicoStatus: "—",
        logAction: "TASK_CANCELLED",
      }, { errorTitle: "Falha ao cancelar tarefa" });
      toast({ kind: "error", title: "Tarefa cancelada", desc: `${id} — Cliente e técnico foram notificados.` });
    } catch {
      /* toast already shown */
    }
  };

  const onRejectTask = async (id) => {
    const ok = await confirm({
      title: "Rejeitar solicitação?",
      body: "Tem certeza de que deseja rejeitar esta solicitação? O cliente será notificado.",
      ok: "Rejeitar", danger: true,
    });
    if (!ok) return;
    try {
      await persistTask(id, {
        status: "Cancelado",
        logAction: "REQUEST_REJECTED",
      }, { errorTitle: "Falha ao rejeitar solicitação" });
      toast({ kind: "error", title: "Solicitação rejeitada", desc: id });
    } catch {
      /* toast already shown */
    }
  };

  const onEditQuote = (id) => {
    const quote = quotes.find((q) => q.id === id);
    if (quote) {
      setQuoteModal({ quote, editMode: true });
      return;
    }
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setTaskQuoteFor(id);
      return;
    }
    toast({ kind: "error", title: "Orçamento não encontrado", desc: id });
  };

  const saveTaskOrcamento = async (taskId, orcamentoFields) => {
    const cur = tasks.find((t) => t.id === taskId);
    if (!cur) return;
    await persistTask(taskId, {
      orcamento: { ...cur.orcamento, ...orcamentoFields },
      logAction: "QUOTE_UPDATED",
    }, { errorTitle: "Falha ao salvar orçamento" });
  };
  const onApproveQuote = async (id) => {
    const ok = await confirm({
      title: "Aprovar orçamento?",
      body: "Tem certeza de que deseja aprovar este orçamento?",
      ok: "Aprovar",
    });
    if (!ok) return null;
    try {
      await api.patch(`/quotes/${id}/approve`);
      const res = await listQuotes({ limit: 100 });
      const mapped = mapQuotesFromApi(res);
      setQuotes(mapped);
      await loadTasks();
      toast({ kind: "success", title: "Orçamento aprovado", desc: `Aprovado — ${id}.` });
      return mapped.find((q) => q.id === id) ?? null;
    } catch {
      toast({ kind: "error", title: "Erro ao aprovar", desc: "Não foi possível aprovar o orçamento." });
      return null;
    }
  };

  const onScheduleFromQuote = useCallback(async (quote) => {
    const quoteId = typeof quote === "string" ? quote : quote?.id;
    if (!quoteId) return;
    try {
      const task = await createTaskFromQuote(quoteId);
      setTasks((cur) => {
        const exists = cur.some((t) => t.id === task.id);
        if (exists) return cur.map((t) => (t.id === task.id ? task : t));
        return [task, ...cur];
      });
      setScheduleFor(task.id);
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Falha ao preparar agendamento",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível criar a tarefa.",
      });
    }
  }, [toast]);
  const onApproveTaskQuote = async (taskId) => {
    const ok = await confirm({
      title: "Aprovar orçamento?",
      body: "Tem certeza de que deseja aprovar este orçamento?",
      ok: "Aprovar",
    });
    if (!ok) return;
    const cur = tasks.find((t) => t.id === taskId);
    if (!cur) return;
    try {
      await persistTask(taskId, {
        orcamento: { ...cur.orcamento, status: "Aprovado" },
        status: cur.status === "Aguardando orçamento" ? "Não agendado" : cur.status,
        logAction: "QUOTE_APPROVED",
      }, { errorTitle: "Falha ao aprovar orçamento" });
      toast({ kind: "success", title: "Orçamento aprovado", desc: `Pronto para envio ao cliente — ${taskId}.` });
    } catch {
      /* toast already shown */
    }
  };
  const onSendQuote = async (id) => {
    const ok = await confirm({
      title: "Enviar orçamento ao cliente?",
      body: "Tem certeza de que deseja enviar este orçamento ao cliente?",
      ok: "Enviar",
    });
    if (!ok) return;
    try {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        await persistTask(id, { logAction: "QUOTE_SENT" }, { errorTitle: "Falha ao enviar orçamento" });
      } else {
        await api.patch(`/quotes/${id}/send`);
        await loadQuotes();
        await loadTasks();
      }
      toast({ kind: "success", title: "Orçamento enviado", desc: `Cliente notificado — ${id}.` });
      const currentTask = tasks.find((t) => t.id === id);
      if (currentTask) {
        openWhatsAppQuoteSend({
          phone: {
            countryCode: currentTask.clienteTelCountryCode,
            nationalNumber: currentTask.clienteTelNationalNumber,
          },
          task: currentTask,
          toast,
          preferredLanguage: resolveClientPreferredLanguage({ task: currentTask }),
        });
      } else {
        const quote = quotes.find((q) => q.id === id);
        if (quote) {
          openWhatsAppQuoteSend({
            phone: {
              countryCode: quote.clientPhoneCountryCode,
              nationalNumber: quote.clientPhoneNationalNumber,
            },
            quote,
            toast,
            preferredLanguage: resolveClientPreferredLanguage({ quote }),
          });
        }
      }
    } catch {
      /* toast already shown or generic error */
    }
  };
  const onResendQuote = async (id) => {
    const ok = await confirm({
      title: "Reenviar orçamento?",
      body: "Tem certeza de que deseja reenviar este orçamento ao cliente?",
      ok: "Reenviar",
    });
    if (!ok) return;
    try {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        await persistTask(id, { logAction: "QUOTE_RESENT" }, { errorTitle: "Falha ao reenviar orçamento" });
      } else {
        await api.patch(`/quotes/${id}/resend`);
        await loadQuotes();
        await loadTasks();
      }
      toast({ kind: "success", title: "Orçamento reenviado", desc: `Cliente notificado novamente — ${id}.` });
      const currentTask = tasks.find((t) => t.id === id);
      if (currentTask) {
        openWhatsAppQuoteResend({
          phone: {
            countryCode: currentTask.clienteTelCountryCode,
            nationalNumber: currentTask.clienteTelNationalNumber,
          },
          task: currentTask,
          toast,
          preferredLanguage: resolveClientPreferredLanguage({ task: currentTask }),
        });
      } else {
        const quote = quotes.find((q) => q.id === id);
        if (quote) {
          openWhatsAppQuoteResend({
            phone: {
              countryCode: quote.clientPhoneCountryCode,
              nationalNumber: quote.clientPhoneNationalNumber,
            },
            quote,
            toast,
            preferredLanguage: resolveClientPreferredLanguage({ quote }),
          });
        }
      }
    } catch {
      /* toast already shown or generic error */
    }
  };

  const onSaveQaNotes = async (id, notes) => {
    const cur = tasks.find((t) => t.id === id);
    if (!cur) return;
    try {
      await persistTask(id, {
        qa: { ...cur.qa, notas: notes },
      }, { errorTitle: "Falha ao salvar anotações de QA" });
      toast({ kind: "success", title: "Anotações salvas", desc: "Notas de QA atualizadas." });
    } catch {
      /* toast already shown */
    }
  };

  const onNotifyClientPickup = async (id, notes) => {
    try {
      const updated = await notifyReadyForPickup(id, notes);
      setTasks((cur) => cur.map((t) => (t.id === id ? updated : t)));
      openWhatsAppAfterApi({
        phone: {
          countryCode: updated.clienteTelCountryCode,
          nationalNumber: updated.clienteTelNationalNumber,
        },
        templateId: "service_ready_pickup",
        vars: serviceReadyPickupVarsFromTask(updated),
        toast,
        preferredLanguage: resolveClientPreferredLanguage({ task: updated }),
      });
      toast({
        kind: "success",
        title: "Cliente notificado",
        desc: `${id} concluída — veículo disponível para retirada.`,
      });
    } catch {
      /* toast from api interceptor or notifyReadyForPickup */
    }
  };

  const onCreate = async (data) => {
    const created = await createTask(mapCreateTaskToApi(data));
    setTasks((cur) => [created, ...cur]);
    setRoute({ page: "tasks" });
    toast({ kind: "success", title: "Tarefa criada com sucesso", desc: created.projeto });
  };

  // ----- auth handlers -----
  if (!isAuthenticated) {
    const goAuth = (r) => {
      if (r !== "reset") setResetToken("");
      setAuthRoute(r);
    };
    const onAuthed = (user) => {
      setRoute({ page: "dashboard" });
      const desc = user?.role === "TECHNICIAN"
        ? "Modo técnico — visualização nas páginas; orçamentos editáveis."
        : "Sessão iniciada.";
      toast({ kind: "success", title: "Bem-vindo", desc });
    };
    const onResetSuccess = () => {
      setResetToken("");
      toast({ kind: "success", title: "Senha atualizada", desc: "Faça login com sua nova senha." });
    };
    const authScreen = authRoute === "login" ? <LoginScreen onAuthed={onAuthed} onGo={goAuth}/>
      : authRoute === "register" ? <RegisterScreen onAuthed={onAuthed} onGo={goAuth}/>
      : authRoute === "forgot" ? <ForgotScreen onGo={goAuth}/>
      : <ResetScreen onGo={goAuth} resetToken={resetToken} onResetSuccess={onResetSuccess}/>;
    return (
      <div className="auth-shell">
        {authScreen}
      </div>
    );
  }

  const task = route.page === "task-detail" ? tasks.find(t => t.id === route.taskId) : null;
  const readOnly = permissions.isPageReadOnly(route.page);

  return (
    <div className="app-root" data-collapsed={sidebarCollapsed}>
      <Sidebar
        route={route}
        onNav={nav}
        onProfile={() => setRoute({ page: "profile" })}
        collapsed={sidebarCollapsed}
        openTasksCount={openTasksCount}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        onLogout={() => {
          logout();
          clearStoredNavigation();
          setRoute({ page: "dashboard" });
          setPendingFilter(null);
          setAuthRoute("login");
        }}
      />
      <div className="main-col">
        <TopBar
          route={route}
          onNav={nav}
          readOnly={readOnly}
          unreadCount={unreadNotifCount}
          onOpenNotifications={() => {
            setNotifOpen(true);
            refreshUnreadCount();
          }}
        />

        {route.page === "dashboard" ? (
          <DashboardPage
            readOnly={readOnly}
            canApproveQuotes={permissions.canApproveQuotes}
            onNav={nav}
            onOpenTask={openTask}
            onEditQuote={onEditQuote}
            onScheduleFromQuote={onScheduleFromQuote}
            onQuotesRefresh={loadQuotes}
            onTasksRefresh={loadTasks}
            onRefresh={refreshDashboard}
            onAssignTech={onAssignTech}
            onSchedule={onSchedule}
            inventory={inventory}
            quotes={quotes}
            tasks={tasks}
            technicians={technicians}
          />
        ) : null}

        {route.page === "tasks" ? (
          <TasksPage
            readOnly={readOnly}
            tasks={tasks}
            onOpenTask={openTask}
            onSchedule={onSchedule}
            onAssignTech={onAssignTech}
            onCreateTask={onCreateTask}
            onCancelTask={onCancelTask}
            onRefresh={refreshTasks}
            externalFilter={pendingFilter}
            onConsumeFilter={() => setPendingFilter(null)}
          />
        ) : null}

        {route.page === "task-detail" && task ? (
          <TaskDetail
            readOnly={readOnly}
            task={task}
            onAssignTech={onAssignTech}
            onSchedule={onSchedule}
            onApproveQuote={onApproveTaskQuote}
            onSendQuote={onSendQuote}
            onResendQuote={onResendQuote}
            onSaveQaNotes={onSaveQaNotes}
            onNotifyClientPickup={onNotifyClientPickup}
            onEditQuote={onEditQuote}
            onRefresh={refreshTasks}
          />
        ) : null}

        {route.page === "calendar" ? (
          <CalendarPage
            readOnly={readOnly}
            onOpenTask={openTask}
            events={calendarEvents}
            tasks={tasks}
            technicians={technicians}
            onSaveSchedule={saveSchedule}
            onRefresh={refreshTasks}
          />
        ) : null}

        {route.page === "customers" ? (
          <CustomersPage
            readOnly={readOnly}
            onOpenTask={openTask}
            onCreateTask={onCreateTask}
            initialCustomerId={route.customerId}
            onNav={nav}
          />
        ) : null}

        {route.page === "vehicles" ? (
          <VehiclesPage readOnly={readOnly} onNav={nav} />
        ) : null}

        {route.page === "technicians" ? (
          <TechniciansPage readOnly={readOnly} tasks={tasks} onOpenTask={openTask}/>
        ) : null}

        {route.page === "quotes" ? (
          <QuotesPage
            canApproveQuotes={permissions.canApproveQuotes}
            onOpenTask={openTask}
            onScheduleFromQuote={onScheduleFromQuote}
          />
        ) : null}

        {route.page === "stock" ? (
          <StockPage
            readOnly={readOnly}
            inventory={inventory}
            onUpdateQty={onInventoryUpdate}
            onUpdateProduct={onInventoryPatch}
            onAddProduct={onInventoryAdd}
            onDeleteProduct={onInventoryDelete}
            onRefresh={refreshInventory}
          />
        ) : null}

        {route.page === "finance" && permissions.isAdmin ? (
          <FinancePage />
        ) : null}

        {route.page === "services" ? (
          <ServicesPage readOnly={readOnly} />
        ) : null}

        {route.page === "profile" ? <ProfilePage /> : null}
      </div>

      <AssignTechModal
        open={!!assignFor && !readOnly}
        task={tasks.find(t => t.id === assignFor)}
        technicians={technicians}
        onClose={() => setAssignFor(null)}
        onSave={saveAssign}
      />
      <ScheduleModal
        open={!!scheduleFor && !readOnly}
        task={tasks.find(t => t.id === scheduleFor)}
        tasks={tasks}
        events={calendarEvents}
        technicians={technicians}
        onClose={() => setScheduleFor(null)}
        onSave={saveSchedule}
      />
      <CreateTaskModal
        open={showCreate && !readOnly}
        onClose={closeCreateTask}
        onCreate={onCreate}
        prefill={createTaskPrefill}
      />
      <QuoteDetailModal
        open={!!quoteModal}
        quote={quoteModal?.quote ?? null}
        initialEdit={quoteModal?.editMode ?? false}
        onClose={() => setQuoteModal(null)}
        onSaved={() => loadQuotes()}
        onApprove={permissions.canApproveQuotes ? onApproveQuote : undefined}
        onSend={onSendQuote}
        onScheduleFromQuote={onScheduleFromQuote}
      />
      <TaskOrcamentoModal
        open={!!taskQuoteFor && !readOnly}
        task={tasks.find((t) => t.id === taskQuoteFor) ?? null}
        onClose={() => setTaskQuoteFor(null)}
        onSave={saveTaskOrcamento}
      />
      <NotificationPanel
        open={notifOpen}
        onClose={() => {
          setNotifOpen(false);
          refreshUnreadCount();
        }}
        onAction={handleNotificationAction}
        onUnreadChange={refreshUnreadCount}
      />
      {ConfirmEl}
    </div>
  );
}


export default App;
