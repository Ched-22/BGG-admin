import React, { Fragment } from "react";
import { Icon, Brand, Button } from "../ui";
<<<<<<< HEAD
import { useAuth } from "../../context/AuthContext";

function userInitial(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const letter = parts[parts.length - 1]?.[0] || name[0];
  return letter?.toUpperCase() ?? "?";
}

function roleLabel(role) {
  if (role === "ADMIN") return "Admin";
  if (role === "TECHNICIAN") return "Técnico";
  return role || "Usuário";
}
=======
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43

const NAV_SECTIONS = [
  {
    label: "Operação",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "Dashboard" },
      { id: "tasks", label: "Tarefas Abertas", icon: "Tasks", badge: "9" },
      { id: "calendar", label: "Calendário", icon: "Calendar" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { id: "customers", label: "Clientes", icon: "Users" },
      { id: "technicians", label: "Técnicos", icon: "Briefcase" },
      { id: "quotes", label: "Orçamentos", icon: "FileText" },
      { id: "stock", label: "Estoque", icon: "Package" },
    ],
  },
];

function Sidebar({ route, onNav, collapsed, onToggleCollapsed, onLogout }) {
<<<<<<< HEAD
  const { user } = useAuth();
  const displayName = user?.name || "Usuário";
  const initial = userInitial(displayName);

=======
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43
  return (
    <aside className="sidebar" data-collapsed={collapsed}>
      <div className="sidebar-logo">
        <Brand size={collapsed ? 18 : 22} compact={collapsed}/>
      </div>
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((sec) => (
          <Fragment key={sec.label}>
            <div className="sidebar-section">{collapsed ? "·" : sec.label}</div>
            {sec.items.map((it) => {
              const IconEl = Icon[it.icon] || Icon.Dashboard;
              const active = route.page === it.id;
              return (
                <button
                  key={it.id}
                  className={`nav-item${active ? " active" : ""}`}
                  onClick={() => !it.soon && onNav({ page: it.id })}
                  disabled={it.soon}
                  title={it.soon ? "Em breve" : it.label}
                  style={it.soon ? { opacity: 0.5, cursor: "not-allowed" } : null}
                >
                  <IconEl size={17} className="icon"/>
                  <span className="label">{it.label}</span>
                  {it.badge ? <span className="badge-count">{it.badge}</span> : null}
                  {it.soon ? <span className="tiny muted label" style={{ marginLeft: "auto", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}>Soon</span> : null}
                </button>
              );
            })}
          </Fragment>
        ))}
      </nav>
      <div className="sidebar-foot">
<<<<<<< HEAD
        <div className="avatar" title={displayName}>{initial}</div>
        {!collapsed ? (
          <>
            <div className="me">
              <span className="me-name">{displayName}</span>
              <span className="me-role">{roleLabel(user?.role)}</span>
=======
        <div className="avatar" title="Ana Coordenadora">A</div>
        {!collapsed ? (
          <>
            <div className="me">
              <span className="me-name">Ana Coordenadora</span>
              <span className="me-role">Admin</span>
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43
            </div>
            <button type="button" className="collapse-btn" onClick={onLogout} title="Sair">
              <Icon.LogOut size={14}/>
            </button>
          </>
        ) : (
          <button type="button" className="collapse-btn" onClick={onLogout} title="Sair">
            <Icon.LogOut size={14}/>
          </button>
        )}
        <button type="button" className="collapse-btn" onClick={onToggleCollapsed} title={collapsed ? "Expandir" : "Recolher"}>
          {collapsed ? <Icon.Chevron size={14}/> : <Icon.PanelLeft size={14}/>}
        </button>
      </div>
    </aside>
  );
}

function TopBar({ route, onNav }) {
<<<<<<< HEAD
  const { user } = useAuth();
  const displayName = user?.name || "Usuário";
  const initial = userInitial(displayName);

=======
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43
  const titles = {
    dashboard: { eye: "Console Operacional", title: "Dashboard" },
    tasks: { eye: "Operações", title: "Tarefas Abertas" },
    "task-detail": { eye: "Detalhes da Tarefa", title: route.taskId || "Tarefa" },
    calendar: { eye: "Operações · Agenda", title: "Calendário" },
    customers: { eye: "Gestão", title: "Clientes" },
    technicians: { eye: "Gestão", title: "Técnicos" },
    quotes: { eye: "Gestão", title: "Orçamentos" },
    stock: { eye: "Gestão · Almoxarifado", title: "Estoque" },
  };
  const t = titles[route.page] || { eye: "BGG Admin", title: "" };

  const breadcrumbs = [];
  if (route.page === "task-detail") {
    breadcrumbs.push({ label: "Tarefas Abertas", go: () => onNav({ page: "tasks" }) });
    breadcrumbs.push({ label: route.taskId, current: true });
  }

  return (
    <header className="topbar">
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {breadcrumbs.length ? (
          <div className="crumbs" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {breadcrumbs.map((b, i) => (
              <Fragment key={i}>
                {b.current
                  ? <span style={{ color: "var(--gold)" }}>{b.label}</span>
                  : <button className="link-underline" onClick={b.go} style={{ fontSize: 11 }}>{b.label}</button>}
                {i < breadcrumbs.length - 1 ? <Icon.Chevron size={10}/> : null}
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="crumbs">{t.eye}</div>
        )}
        <h1>{t.title}</h1>
      </div>
      <div className="spacer"/>
      {route.page === "task-detail" ? (
        <Button variant="secondary" icon={Icon.ArrowLeft} onClick={() => onNav({ page: "tasks" })}>
          Voltar
        </Button>
      ) : (
        <div className="searchbar">
          <Icon.Search size={14}/>
          <input placeholder="Buscar tarefas, clientes, orçamentos…"/>
          <span style={{ color: "var(--fg-6)", fontSize: 10, letterSpacing: "0.08em", border: "1px solid var(--border)", padding: "2px 4px", borderRadius: 2 }}>⌘ K</span>
        </div>
      )}
      <button className="icon-btn" title="Notificações">
        <Icon.Bell size={18}/>
        <span className="dot"></span>
      </button>
      <div style={{ width: 1, alignSelf: "stretch", margin: "12px 4px", background: "var(--border)" }}/>
<<<<<<< HEAD
      <div className="avatar" title={displayName}>{initial}</div>
=======
      <div className="avatar" title="Ana Coordenadora">A</div>
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43
    </header>
  );
}


export { Sidebar, TopBar };
