import React, { useState, useMemo, useCallback } from "react";
import { Button, Field, Input, Checkbox, Brand, Icon } from "../components/ui";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import {
  canAccessAdmin,
  loginWithGoogle,
  registerAccount,
  requestPasswordReset,
  resetPassword,
} from "../lib/authApi";

const LOGO_SVG_URL = `${import.meta.env.BASE_URL}bgg-logo.svg`;

function AuthArt({ caption }) {
  return (
    <div className="auth-art">
      <div className="brand brand--image brand--auth">
        <img src={LOGO_SVG_URL} alt="Black Green Garage" className="brand-logo" />
        <span className="sub">Admin Console</span>
      </div>
      <div className="poetic">
        <div className="rule-gold"></div>
        <h1>{caption.title}</h1>
        <p>{caption.body}</p>
      </div>
      <div className="meta">
        <span>Operações Internas</span>
        <span>v 1.0 · 2026</span>
      </div>
    </div>
  );
}

function AuthDivider() {
  return (
    <div className="auth-divider">
      <span>ou</span>
    </div>
  );
}

function AuthNotice({ children, tone = "error" }) {
  const isSuccess = tone === "success";
  return (
    <div
      style={{
        background: isSuccess ? "rgba(181, 235, 12,0.08)" : "rgba(212,24,61,0.08)",
        border: isSuccess ? "1px solid var(--gold-30)" : "1px solid rgba(212,24,61,0.4)",
        padding: "10px 12px",
        borderRadius: 4,
        fontSize: 12,
        color: isSuccess ? "var(--gold)" : "var(--destructive)",
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      {isSuccess ? <Icon.CheckCircle size={14}/> : <Icon.AlertTriangle size={14}/>}
      {children}
    </div>
  );
}

function validatePassword(pw) {
  if (!pw) return "Senha é obrigatória";
  if (pw.length < 8) return "A senha deve ter pelo menos 8 caracteres";
  if (!(/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw))) {
    return "A senha deve incluir letra maiúscula, minúscula, número e caractere especial";
  }
  return null;
}

// ----- Login -----
function LoginScreen({ onAuthed, onGo }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState({});
  const [generic, setGeneric] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = useCallback(async (idToken) => {
    setGeneric("");
    setLoading(true);
    try {
      const data = await loginWithGoogle(idToken);
      if (canAccessAdmin(data.user)) {
        login(data.access_token, data.user, { remember });
        onAuthed && onAuthed(data.user);
        return;
      }
      setGeneric("Conta sem permissão para acessar o console.");
    } catch {
      setGeneric("Não foi possível entrar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [login, onAuthed, remember]);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!email) next.email = "Endereço de e-mail é obrigatório";
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Digite um endereço de e-mail válido";
    if (!senha) next.senha = "Senha é obrigatória";
    setErr(next);
    if (Object.keys(next).length) {
      setGeneric("Digite seu endereço de e-mail e senha para continuar");
      return;
    }
    setGeneric("");
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password: senha });
      if (!canAccessAdmin(data.user)) {
        setGeneric("Conta sem permissão para acessar o console.");
        return;
      }
      login(data.access_token, data.user, { remember });
      onAuthed && onAuthed(data.user);
    } catch {
      setGeneric("E-mail ou senha incorretos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <AuthArt caption={{
        title: <>Operações com<br/><i>precisão cirúrgica</i>.</>,
        body: "Gerencie orçamentos, técnicos e o QA das tarefas com a mesma atenção minuciosa que dedicamos a cada veículo."
      }}/>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit} autoComplete="off">
          <div className="heading">
            <span className="eye">Entrar</span>
            <h2>Bem-vindo de volta.</h2>
            <p>Acesse o console administrativo para gerenciar tarefas, orçamentos e a operação do estúdio.</p>
          </div>

          {generic ? <AuthNotice>{generic}</AuthNotice> : null}

          <GoogleSignInButton onCredential={handleGoogle} disabled={loading} />

          <AuthDivider/>

          <Field label="Endereço de E-mail" error={err.email}>
            <Input
              type="email"
              placeholder="seu@email.com.br"
              value={email}
              leading={<Icon.Mail size={14}/>}
              onChange={(e) => setEmail(e.target.value)}
              err={!!err.email}
              autoFocus
              autoComplete="off"
              name="bgg-admin-email"
            />
          </Field>

          <Field label="Senha" error={err.senha}>
            <Input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={senha}
              leading={<Icon.Lock size={14}/>}
              trailing={
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ color: "var(--fg-5)" }}>
                  {showPass ? <Icon.EyeOff size={14}/> : <Icon.Eye size={14}/>}
                </button>
              }
              onChange={(e) => setSenha(e.target.value)}
              err={!!err.senha}
              autoComplete="new-password"
              name="bgg-admin-password"
            />
          </Field>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Checkbox checked={remember} onChange={setRemember} label="Lembrar-me"/>
            <button type="button" className="link-underline" onClick={() => onGo("forgot")} style={{ fontSize: 11 }}>
              Esqueci minha senha
            </button>
          </div>

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
            {!loading ? <Icon.ArrowRight size={14}/> : null}
          </Button>

          <div className="links" style={{ justifyContent: "center", gap: 8 }}>
            <span style={{ color: "var(--fg-6)" }}>Sem acesso?</span>
            <button type="button" className="link-underline" onClick={() => onGo("register")}>Cadastrar-se</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----- Register -----
function RegisterScreen({ onGo, onAuthed }) {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);
  const [err, setErr] = useState({});
  const [generic, setGeneric] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }, [pw]);

  const handleGoogle = useCallback(async (idToken) => {
    setGeneric("");
    setLoading(true);
    try {
      const data = await loginWithGoogle(idToken);
      if (canAccessAdmin(data.user)) {
        login(data.access_token, data.user);
        onAuthed && onAuthed(data.user);
        return;
      }
      setGeneric("Conta sem permissão para acessar o console.");
    } catch (err) {
      const msg = err.response?.data?.message;
      setGeneric(Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível cadastrar com Google.");
    } finally {
      setLoading(false);
    }
  }, [login, onAuthed]);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = "Nome é obrigatório";
    if (!email) next.email = "Endereço de e-mail é obrigatório";
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Digite um endereço de e-mail válido";
    const pwErr = validatePassword(pw);
    if (pwErr) next.pw = pwErr;
    if (!pw2) next.pw2 = "Por favor, confirme sua senha.";
    else if (pw && pw2 && pw !== pw2) next.pw2 = "As senhas não coincidem";
    setErr(next);
    if (Object.keys(next).length) return;

    setGeneric("");
    setLoading(true);
    try {
      const data = await registerAccount({
        name: name.trim(),
        email: email.trim(),
        password: pw,
        phone: phone.trim() || undefined,
      });
      login(data.access_token, data.user);
      onAuthed && onAuthed(data.user);
    } catch (err) {
      const msg = err.response?.data?.message;
      setGeneric(Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <AuthArt caption={{
        title: <>Junte-se à<br/><i>equipe BGG.</i></>,
        body: "Cadastre-se como técnico para acessar tarefas e operação pelo app mobile da Black Green Garage."
      }}/>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div className="heading">
            <span className="eye">Cadastro</span>
            <h2>Crie sua conta.</h2>
            <p>Cadastre-se como técnico para acessar o console em modo visualização (orçamentos editáveis).</p>
          </div>

          {generic ? <AuthNotice>{generic}</AuthNotice> : null}

          <GoogleSignInButton onCredential={handleGoogle} disabled={loading} />

          <AuthDivider/>

          <Field label="Nome completo" error={err.name}>
            <Input
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              err={!!err.name}
              autoFocus
            />
          </Field>

          <Field label="Endereço de E-mail" error={err.email}>
            <Input
              type="email"
              placeholder="seu@email.com.br"
              value={email}
              leading={<Icon.Mail size={14}/>}
              onChange={(e) => setEmail(e.target.value)}
              err={!!err.email}
            />
          </Field>

          <Field label="Telefone (opcional)">
            <Input
              type="tel"
              placeholder="+55 11 9 9999-9999"
              value={phone}
              leading={<Icon.Phone size={14}/>}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <Field label="Senha" error={err.pw} hint={!err.pw ? "Mínimo 8 caracteres, maiúscula, minúscula, número e caractere especial." : null}>
            <Input
              type={showA ? "text" : "password"}
              placeholder="Defina sua senha"
              value={pw}
              leading={<Icon.Lock size={14}/>}
              trailing={
                <button type="button" onClick={() => setShowA(s => !s)} style={{ color: "var(--fg-5)" }}>
                  {showA ? <Icon.EyeOff size={14}/> : <Icon.Eye size={14}/>}
                </button>
              }
              onChange={(e) => setPw(e.target.value)}
              err={!!err.pw}
            />
            {pw ? (
              <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: i < strength ? "var(--gold)" : "var(--bg-elevated)"
                  }}/>
                ))}
              </div>
            ) : null}
          </Field>

          <Field label="Confirmar Senha" error={err.pw2}>
            <Input
              type={showB ? "text" : "password"}
              placeholder="Confirme a senha"
              value={pw2}
              leading={<Icon.Lock size={14}/>}
              trailing={
                <button type="button" onClick={() => setShowB(s => !s)} style={{ color: "var(--fg-5)" }}>
                  {showB ? <Icon.EyeOff size={14}/> : <Icon.Eye size={14}/>}
                </button>
              }
              onChange={(e) => setPw2(e.target.value)}
              err={!!err.pw2}
            />
          </Field>

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Criando…" : "Criar conta"}
            {!loading ? <Icon.ArrowRight size={14}/> : null}
          </Button>

          <div className="links" style={{ justifyContent: "center", gap: 8 }}>
            <span style={{ color: "var(--fg-6)" }}>Já tem conta?</span>
            <button type="button" className="link-underline" onClick={() => onGo("login")}>Entrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----- Forgot password (request) -----
function ForgotScreen({ onGo }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!email) { setErr("Endereço de e-mail é obrigatório"); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr("Digite um endereço de e-mail válido"); return; }
    setErr("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      const msg = err.response?.data?.message;
      setErr(Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível enviar as instruções.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    send();
  };

  return (
    <div className="auth-wrap">
      <AuthArt caption={{
        title: <><i>Recupere</i><br/>seu acesso.</>,
        body: "Digite seu e-mail administrativo e enviaremos um link seguro para redefinir sua senha em poucos minutos."
      }}/>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div className="heading">
            <span className="eye">Esqueci minha senha</span>
            <h2>Recuperar acesso.</h2>
            <p>Digite o e-mail vinculado à sua conta administrativa para receber as instruções.</p>
          </div>

          {!sent ? (
            <>
              <Field label="Endereço de e-mail" error={err}>
                <Input
                  type="email"
                  placeholder="seu@email.com.br"
                  value={email}
                  leading={<Icon.Mail size={14}/>}
                  onChange={(e) => setEmail(e.target.value)}
                  err={!!err}
                  autoFocus
                />
              </Field>
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? "Enviando…" : "Enviar instruções"} {!loading ? <Icon.ArrowRight size={14}/> : null}
              </Button>
            </>
          ) : (
            <>
              <div style={{
                border: "1px solid var(--gold-30)",
                padding: 18,
                borderRadius: 4,
                background: "rgba(181, 235, 12,0.06)",
                display: "flex",
                gap: 12,
                alignItems: "flex-start"
              }}>
                <span style={{ color: "var(--gold)", marginTop: 2 }}><Icon.CheckCircle size={20}/></span>
                <div>
                  <div style={{ color: "var(--gold)", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                    Instruções enviadas
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.6 }}>
                    Se existir uma conta administrativa associada a <strong style={{ color: "var(--fg)" }}>{email}</strong>,
                    enviamos um link de redefinição. Verifique também a pasta de spam.
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => { setSent(false); send(); }} disabled={loading}>
                {loading ? "Reenviando…" : "Reenviar e-mail"} {!loading ? <Icon.RefreshCw size={14}/> : null}
              </Button>
            </>
          )}

          <div className="links">
            <button type="button" className="link-underline" onClick={() => onGo("login")}>Entrar</button>
            <button type="button" className="link-underline" onClick={() => onGo("register")}>Cadastrar-se</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----- Reset Password (after link) -----
function ResetScreen({ onGo, resetToken, onResetSuccess }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState({});
  const [generic, setGeneric] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    const pwErr = validatePassword(pw);
    if (pwErr) next.pw = pwErr;
    if (!pw2) next.pw2 = "Confirme sua senha.";
    else if (pw && pw2 && pw !== pw2) next.pw2 = "As senhas não coincidem";
    if (!resetToken) next.pw = "Link inválido. Solicite uma nova redefinição.";
    setErr(next);
    if (Object.keys(next).length) return;

    setGeneric("");
    setLoading(true);
    try {
      await resetPassword(resetToken, pw);
      setDone(true);
      onResetSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.message;
      setGeneric(Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="auth-wrap">
        <AuthArt caption={{
          title: <>Link<br/><i>inválido.</i></>,
          body: "Este link de redefinição não é válido. Solicite um novo e-mail de recuperação."
        }}/>
        <div className="auth-form-wrap">
          <div className="auth-form">
            <AuthNotice tone="error">Link inválido ou ausente.</AuthNotice>
            <Button size="lg" onClick={() => onGo("forgot")}>Solicitar novo link <Icon.ArrowRight size={14}/></Button>
            <div className="links" style={{ justifyContent: "center" }}>
              <button type="button" className="link-underline" onClick={() => onGo("login")}>Voltar ao login</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-wrap">
        <AuthArt caption={{
          title: <>Senha<br/><i>atualizada.</i></>,
          body: "Sua nova senha já está ativa. Use-a no próximo login."
        }}/>
        <div className="auth-form-wrap">
          <div className="auth-form">
            <AuthNotice tone="success">Senha redefinida com sucesso.</AuthNotice>
            <Button size="lg" onClick={() => onGo("login")}>Ir para o login <Icon.ArrowRight size={14}/></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <AuthArt caption={{
        title: <>Defina sua<br/><i>nova senha.</i></>,
        body: "Quanto mais forte a senha, mais tranquila fica a operação. Use maiúsculas, minúsculas, números e símbolos."
      }}/>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div className="heading">
            <span className="eye">Redefinir senha</span>
            <h2>Crie uma nova senha.</h2>
            <p>Você deverá usar esta nova senha no próximo login.</p>
          </div>
          {generic ? <AuthNotice>{generic}</AuthNotice> : null}
          <Field label="Nova senha" error={err.pw}>
            <Input type="password" placeholder="••••••••" value={pw}
              leading={<Icon.Lock size={14}/>} onChange={(e) => setPw(e.target.value)} err={!!err.pw}/>
          </Field>
          <Field label="Confirmar senha" error={err.pw2}>
            <Input type="password" placeholder="••••••••" value={pw2}
              leading={<Icon.Lock size={14}/>} onChange={(e) => setPw2(e.target.value)} err={!!err.pw2}/>
          </Field>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Salvando…" : "Redefinir senha"} {!loading ? <Icon.ArrowRight size={14}/> : null}
          </Button>
          <div className="links" style={{ justifyContent: "center" }}>
            <button type="button" className="link-underline" onClick={() => onGo("login")}>Voltar ao login</button>
          </div>
        </form>
      </div>
    </div>
  );
}


export { AuthArt, LoginScreen, RegisterScreen, ForgotScreen, ResetScreen };
