import { useEffect, useState, useCallback, useContext, createContext, createElement } from "react";

// ---------- Icons ----------
const I = (path, opts = {}) => (props) => {
  const { size = 16, ...rest } = props || {};
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={opts.sw || 2}
      strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {path}
    </svg>
  );
};

const Icon = {
  Dashboard: I(<g><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></g>),
  Tasks: I(<g><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></g>),
  Chat: I(<g><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></g>),
  Calendar: I(<g><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></g>),
  Users: I(<g><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></g>),
  Settings: I(<g><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></g>),
  Search: I(<g><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></g>),
  Bell: I(<g><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></g>),
  Plus: I(<g><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></g>),
  Close: I(<g><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></g>),
  Chevron: I(<polyline points="9 18 15 12 9 6"/>),
  ChevronDown: I(<polyline points="6 9 12 15 18 9"/>),
  ChevronLeft: I(<polyline points="15 18 9 12 15 6"/>),
  ChevronUp: I(<polyline points="18 15 12 9 6 15"/>),
  Eye: I(<g><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></g>),
  EyeOff: I(<g><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></g>),
  Edit: I(<g><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></g>),
  Trash: I(<g><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></g>),
  Send: I(<g><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></g>),
  Paperclip: I(<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>),
  Check: I(<polyline points="20 6 9 17 4 12"/>),
  CheckCircle: I(<g><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></g>),
  Phone: I(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>),
  Mail: I(<g><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></g>),
  MapPin: I(<g><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></g>),
  Clock: I(<g><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></g>),
  AlertTriangle: I(<g><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></g>),
  Info: I(<g><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></g>),
  CreditCard: I(<g><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></g>),
  FileText: I(<g><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></g>),
  Image: I(<g><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></g>),
  Download: I(<g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></g>),
  Filter: I(<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>),
  RefreshCw: I(<g><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></g>),
  XCircle: I(<g><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></g>),
  Briefcase: I(<g><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></g>),
  Package: I(<g><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></g>),
  PanelLeft: I(<g><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></g>),
  MoreHorizontal: I(<g><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></g>),
  ArrowRight: I(<g><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></g>),
  ArrowLeft: I(<g><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></g>),
  UserPlus: I(<g><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></g>),
  UserMinus: I(<g><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></g>),
  LogOut: I(<g><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></g>),
  Lock: I(<g><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></g>),
  Star: I(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>),
  DollarSign: I(<g><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></g>),
  Sparkles: I(<g><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></g>),
  Sun: I(<g><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></g>),
  Moon: I(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>),
};

// ---------- Button ----------
function Button({ children, variant = "primary", size, icon, iconRight, type = "button", ...rest }) {
  const cls = `btn ${variant}${size ? " " + size : ""}`;
  return (
    <button type={type} className={cls} {...rest}>
      {icon ? createElement(icon, { size: 14 }) : null}
      {children}
      {iconRight ? createElement(iconRight, { size: 14 }) : null}
    </button>
  );
}

// ---------- Field ----------
function Field({ label, hint, error, children, optional }) {
  return (
    <div className="field">
      {label ? (
        <label>
          {label}
          {optional ? <span style={{ color: "var(--fg-6)", marginLeft: 6, fontSize: 10, letterSpacing: "0.06em" }}>(opcional)</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <div className="err"><Icon.AlertTriangle size={12}/> {error}</div> : (hint ? <div className="hint">{hint}</div> : null)}
    </div>
  );
}

function Input({ leading, trailing, err, ...rest }) {
  if (leading || trailing) {
    return (
      <div className="input-group">
        {leading ? <span className="leading">{leading}</span> : null}
        <input className={`input ${err ? "err" : ""}`} {...rest}/>
        {trailing ? <span className="trailing">{trailing}</span> : null}
      </div>
    );
  }
  return <input className={`input ${err ? "err" : ""}`} {...rest}/>;
}
function Textarea({ err, ...rest }) { return <textarea className={`textarea ${err ? "err" : ""}`} {...rest}/>; }
function Select({ children, err, ...rest }) {
  return (
    <div className="select-wrap">
      <select className={`select ${err ? "err" : ""}`} {...rest}>{children}</select>
    </div>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange && onChange(e.target.checked)}/>
      <span className="box"></span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}

// ---------- Status badge ----------
const STATUS_TONE = {
  "Pendente": "warn", "Aguardando orçamento": "warn",
  "Aprovado": "success", "Agendado": "gold", "Em andamento": "info",
  "Concluído": "info", "Cancelado": "danger", "Nova solicitação": "warn",
  "Não agendado": "warn", "Sem técnico": "warn", "Pronto para QA": "info",
  "A caminho": "gold", "Confirmado": "success",
};
function StatusBadge({ children, tone }) {
  const t = tone || STATUS_TONE[children] || "neutral";
  return <span className={`badge ${t}`}><span className="dot"></span>{children}</span>;
}

// ---------- Modal ----------
function Modal({ open, onClose, title, sub, children, footer, size, dismissable = true }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape" && dismissable) onClose && onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, dismissable, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={() => dismissable && onClose && onClose()}>
      <div className={`modal ${size || ""}`} onClick={(e) => e.stopPropagation()}>
        {title ? (
          <div className="modal-head">
            <div>
              <h2>{title}</h2>
              {sub ? <div className="sub">{sub}</div> : null}
            </div>
            {dismissable ? (
              <button className="icon-btn" onClick={onClose} aria-label="Fechar">
                <Icon.Close size={18}/>
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

// ---------- Toast system ----------
const ToastCtx = createContext({ push: () => {} });
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((cur) => [...cur, { id, ...t }]);
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), t.timeout || 4200);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => {
          const Ico = t.kind === "success" ? Icon.CheckCircle : t.kind === "error" ? Icon.XCircle : Icon.Info;
          return (
            <div key={t.id} className={`toast ${t.kind || ""}`}>
              <span className="ico"><Ico size={18}/></span>
              <div className="body">
                {t.title ? <div className="title">{t.title}</div> : null}
                {t.desc ? <div className="desc">{t.desc}</div> : null}
              </div>
              <button className="close" onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))}>
                <Icon.Close size={14}/>
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx).push;

// ---------- Confirm dialog ----------
function useConfirm() {
  const [state, setState] = useState(null);
  const ConfirmEl = (
    <Modal
      open={!!state}
      onClose={() => state && state.resolve(false) || setState(null)}
      title={state ? state.title : ""}
      footer={state ? (
        <>
          <Button variant="ghost" onClick={() => { state.resolve(false); setState(null); }}>{state.cancel || "Cancelar"}</Button>
          <Button variant={state.danger ? "danger" : "primary"} onClick={() => { state.resolve(true); setState(null); }}>{state.ok || "Confirmar"}</Button>
        </>
      ) : null}
    >
      <div className="confirm-prompt">{state ? state.body : ""}</div>
    </Modal>
  );
  const confirm = (opts) => new Promise((resolve) => setState({ ...opts, resolve }));
  return [confirm, ConfirmEl];
}

// ---------- Utilities ----------
const fmtBRL = (n) => "R$ " + (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------- Logo wordmark ----------
function Brand({ size = 22, stacked = true }) {
  return (
    <>
      <span className="mark" style={{ fontSize: size }}>BGG</span>
      {stacked ? (
        <div className="stack" style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, color: "var(--fg)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500 }}>
            Black Gold Garage
          </span>
          <span style={{ fontSize: 8, color: "var(--fg-6)", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 2 }}>
            Admin Console
          </span>
        </div>
      ) : null}
    </>
  );
}

// ---------- Export to global ----------

export {
  Icon, Button, Field, Input, Textarea, Select, Checkbox, StatusBadge,
  Modal, ToastProvider, useToast, useConfirm, fmtBRL, Brand, STATUS_TONE,
};
