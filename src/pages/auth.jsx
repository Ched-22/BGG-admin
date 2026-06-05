import React, { useState, useMemo } from "react";
import { Button, Field, Input, Checkbox, Brand, Icon } from "../components/ui";
import api from "../lib/api";
<<<<<<< HEAD
import { useAuth } from "../context/AuthContext";
=======
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43

function AuthArt({ caption }) {
  return (
    <div className="auth-art">
      <div className="brand">
        <span className="wm">BGG</span>
        <span className="sub">Black Gold Garage · Admin</span>
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

// ----- Login -----
function LoginScreen({ onAuthed, onGo }) {
<<<<<<< HEAD
  const { login } = useAuth();
=======
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState({});
  const [generic, setGeneric] = useState("");
  const [loading, setLoading] = useState(false);

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
<<<<<<< HEAD
      if (data.user?.role !== 'ADMIN') {
        setGeneric('Acesso restrito a administradores. Use admin@bgggarage.com ou outra conta ADMIN.');
        return;
      }
      login(data.access_token, data.user);
=======
      localStorage.setItem('bgg-token', data.access_token);
      localStorage.setItem('bgg-user', JSON.stringify(data.user));
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43
      onAuthed && onAuthed(data.user);
    } catch (err) {
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
        <form className="auth-form" onSubmit={submit}>
          <div className="heading">
            <span className="eye">Entrar</span>
            <h2>Bem-vindo de volta.</h2>
            <p>Acesse o console administrativo para gerenciar tarefas, orçamentos e a operação do estúdio.</p>
          </div>

          {generic ? (
            <div style={{
              background: "rgba(212,24,61,0.08)",
              border: "1px solid rgba(212,24,61,0.4)",
              padding: "10px 12px",
              borderRadius: 4,
              fontSize: 12,
              color: "var(--destructive)",
              display: "flex", gap: 8, alignItems: "center"
            }}>
              <Icon.AlertTriangle size={14}/> {generic}
            </div>
          ) : null}

          <Field label="Endereço de E-mail" error={err.email}>
            <Input
              type="email"
              placeholder="seu@email.com.br"
              value={email}
              leading={<Icon.Mail size={14}/>}
              onChange={(e) => setEmail(e.target.value)}
              err={!!err.email}
              autoFocus
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

// ----- Register (via invite) -----
function RegisterScreen({ onAuthed, onGo }) {
  const [first, setFirst] = useState("Ana");
  const [last, setLast] = useState("Coordenadora");
  const [email, setEmail] = useState("ana@blackgoldgarage.com.br");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);
  const [err, setErr] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!pw) next.pw = "Senha é obrigatória";
    else if (pw.length < 8) next.pw = "A senha deve ter pelo menos 8 caracteres";
    else if (!(/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)))
      next.pw = "A senha deve incluir letra maiúscula, minúscula, número e caractere especial";
    if (!pw2) next.pw2 = "Por favor, confirme sua senha.";
    else if (pw && pw2 && pw !== pw2) next.pw2 = "As senhas não coincidem";
    setErr(next);
    if (Object.keys(next).length) return;
    onAuthed && onAuthed({ email });
  };

  // simple password strength
  const strength = useMemo(() => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }, [pw]);

  return (
    <div className="auth-wrap">
      <AuthArt caption={{
        title: <>Sua bancada<br/><i>aguarda.</i></>,
        body: "Você foi convidado a se juntar ao console administrativo da Black Gold Garage. Defina sua senha para começar."
      }}/>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div className="heading">
            <span className="eye">Convite para Registro</span>
            <h2>Crie seu acesso.</h2>
            <p>Os campos de identificação foram pré-preenchidos pelo administrador que enviou seu convite.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Primeiro Nome">
              <Input value={first} onChange={(e) => setFirst(e.target.value)} disabled style={{ opacity: 0.75 }}/>
            </Field>
            <Field label="Sobrenome">
              <Input value={last} onChange={(e) => setLast(e.target.value)} disabled style={{ opacity: 0.75 }}/>
            </Field>
          </div>

          <Field label="Endereço de E-mail">
            <Input
              value={email}
              leading={<Icon.Mail size={14}/>}
              disabled style={{ opacity: 0.75 }}
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

          <Button type="submit" size="lg">Criar conta <Icon.ArrowRight size={14}/></Button>

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
  const submit = (e) => {
    e.preventDefault();
    if (!email) { setErr("Endereço de e-mail é obrigatório"); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr("Digite um endereço de e-mail válido"); return; }
    setErr("");
    setSent(true);
  };

  return (
    <div className="auth-wrap">
      <AuthArt caption={{
        title: <><i>Vamos restaurar</i><br/>o seu acesso.</>,
        body: "Insira seu e-mail administrativo e enviaremos um link seguro para redefinir sua senha em poucos minutos."
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
              <Field label="Endereço de E-mail" error={err}>
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
              <Button type="submit" size="lg">Enviar instruções <Icon.ArrowRight size={14}/></Button>
            </>
          ) : (
            <>
              <div style={{
                border: "1px solid var(--gold-30)",
                padding: 18,
                borderRadius: 4,
                background: "rgba(194,164,109,0.06)",
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
                    Se uma conta administrativa estiver associada a <strong style={{ color: "var(--fg)" }}>{email}</strong>,
                    enviamos um link de redefinição. Verifique também sua caixa de spam.
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setSent(false)}>Reenviar e-mail <Icon.RefreshCw size={14}/></Button>
              <button type="button" className="btn ghost sm" onClick={() => onGo("reset")} style={{ alignSelf: "center" }}>
                Simular link de redefinição
              </button>
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
function ResetScreen({ onAuthed, onGo }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState({});
  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!pw) next.pw = "Senha é obrigatória.";
    else if (pw.length < 8) next.pw = "A senha deve ter pelo menos 8 caracteres";
    else if (!(/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)))
      next.pw = "A senha deve incluir letra maiúscula, minúscula, número e caractere especial";
    if (!pw2) next.pw2 = "Por favor, confirme sua senha.";
    else if (pw && pw2 && pw !== pw2) next.pw2 = "As senhas não coincidem";
    setErr(next);
    if (Object.keys(next).length) return;
    onGo("login");
  };

  return (
    <div className="auth-wrap">
      <AuthArt caption={{
        title: <>Defina sua<br/><i>nova senha.</i></>,
        body: "Quanto mais forte a senha, mais tranquila a operação. Use letras maiúsculas, minúsculas, números e símbolos."
      }}/>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div className="heading">
            <span className="eye">Redefinir Senha</span>
            <h2>Crie uma nova senha.</h2>
            <p>Você precisará usar essa nova senha no seu próximo login.</p>
          </div>
          <Field label="Nova Senha" error={err.pw}>
            <Input type="password" placeholder="••••••••" value={pw}
              leading={<Icon.Lock size={14}/>} onChange={(e) => setPw(e.target.value)} err={!!err.pw}/>
          </Field>
          <Field label="Confirmar Senha" error={err.pw2}>
            <Input type="password" placeholder="••••••••" value={pw2}
              leading={<Icon.Lock size={14}/>} onChange={(e) => setPw2(e.target.value)} err={!!err.pw2}/>
          </Field>
          <Button type="submit" size="lg">Redefinir senha <Icon.ArrowRight size={14}/></Button>
          <div className="links" style={{ justifyContent: "center" }}>
            <button type="button" className="link-underline" onClick={() => onGo("login")}>Voltar para o login</button>
          </div>
        </form>
      </div>
    </div>
  );
}


export { AuthArt, LoginScreen, RegisterScreen, ForgotScreen, ResetScreen };
