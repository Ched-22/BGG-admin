import React, { useCallback, useEffect, useState } from "react";
import { BGG_DATA } from "../data/bggData";
import { Button, Field, Icon, Input, PageRefreshButton } from "../components/ui";
import { PhoneInput } from "../components/PhoneInput";
import { useToast } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { getMyProfile, updateMyProfile } from "../lib/profileApi";
import { DEFAULT_PHONE_COUNTRY_CODE } from "../lib/phoneCountries";
import { validatePhone, formatPhoneDisplay } from "../lib/phoneUtils";

function validatePassword(pw) {
  if (!pw) return "Senha é obrigatória";
  if (pw.length < 8) return "A senha deve ter pelo menos 8 caracteres";
  if (!(/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw))) {
    return "A senha deve incluir letra maiúscula, minúscula, número e caractere especial";
  }
  return null;
}

function profileToForm(profile) {
  return {
    name: profile?.name || "",
    email: profile?.email || "",
    phoneCountryCode: profile?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    phoneNationalNumber: profile?.phoneNationalNumber || "",
    skills: [...(profile?.skills || [])],
    currentPassword: "",
    password: "",
    password2: "",
  };
}

export function ProfilePage() {
  const toast = useToast();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(profileToForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isTechnician = profile?.role === "TECHNICIAN";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyProfile();
      setProfile(data);
      setForm(profileToForm(data));
    } catch {
      toast({ kind: "error", title: "Erro", desc: "Não foi possível carregar o perfil." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ kind: "error", title: "Nome obrigatório", desc: "Informe seu nome." });
      return;
    }
    if (!form.email.trim()) {
      toast({ kind: "error", title: "E-mail obrigatório", desc: "Informe seu e-mail." });
      return;
    }
    const phoneErr = validatePhone(form.phoneCountryCode, form.phoneNationalNumber);
    if (phoneErr && form.phoneNationalNumber) {
      toast({ kind: "error", title: "Telefone inválido", desc: phoneErr });
      return;
    }
    if (form.password) {
      const pwErr = validatePassword(form.password);
      if (pwErr) {
        toast({ kind: "error", title: "Senha inválida", desc: pwErr });
        return;
      }
      if (form.password !== form.password2) {
        toast({ kind: "error", title: "Senhas diferentes", desc: "Confirme a nova senha." });
        return;
      }
      if (!form.currentPassword) {
        toast({ kind: "error", title: "Senha atual", desc: "Informe a senha atual." });
        return;
      }
    }

    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      phoneCountryCode: form.phoneCountryCode,
      phoneNationalNumber: form.phoneNationalNumber,
    };
    if (isTechnician) body.skills = form.skills;
    if (form.password) {
      body.currentPassword = form.currentPassword;
      body.password = form.password;
    }

    setSaving(true);
    try {
      const updated = await updateMyProfile(body);
      setProfile(updated);
      setForm({
        ...profileToForm(updated),
        currentPassword: "",
        password: "",
        password2: "",
      });
      updateUser({ name: updated.name, email: updated.email });
      toast({ kind: "success", title: "Perfil atualizado", desc: "Suas alterações foram salvas." });
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Não foi possível salvar",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="muted" style={{ padding: 24 }}>Carregando perfil…</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eye">Conta</div>
          <h1 className="page-title">Meu perfil</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {user?.role === "ADMIN" ? "Administrador" : "Técnico"} · {profile?.email}
          </p>
        </div>
        <PageRefreshButton onClick={load} loading={loading} />
      </div>

      <div className="grid-2" style={{ gap: 20, alignItems: "start" }}>
        <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="section-title">Dados da conta</div>
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              leading={<Icon.Mail size={14}/>}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Telefone">
            <PhoneInput
              countryCode={form.phoneCountryCode}
              nationalNumber={form.phoneNationalNumber}
              onChange={({ countryCode, nationalNumber }) =>
                setForm((f) => ({
                  ...f,
                  phoneCountryCode: countryCode,
                  phoneNationalNumber: nationalNumber,
                }))
              }
            />
          </Field>

          {isTechnician ? (
            <Field label="Habilidades & Especialidades">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {BGG_DATA.serviceTypes.map((s) => (
                  <label key={s} className="checkbox">
                    <input
                      type="checkbox"
                      checked={form.skills.includes(s)}
                      onChange={() => toggleSkill(s)}
                    />
                    <span className="box"></span>
                    <span style={{ fontSize: 11 }}>{s}</span>
                  </label>
                ))}
              </div>
            </Field>
          ) : null}

          {profile?.hasPassword ? (
            <>
              <button
                type="button"
                className="link-underline"
                onClick={() => setShowPassword((v) => !v)}
                style={{ alignSelf: "flex-start", fontSize: 12 }}
              >
                {showPassword ? "Ocultar alteração de senha" : "Alterar senha"}
              </button>
              {showPassword ? (
                <>
                  <Field label="Senha atual">
                    <Input
                      type="password"
                      value={form.currentPassword}
                      onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    />
                  </Field>
                  <Field label="Nova senha">
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  </Field>
                  <Field label="Confirmar nova senha">
                    <Input
                      type="password"
                      value={form.password2}
                      onChange={(e) => setForm((f) => ({ ...f, password2: e.target.value }))}
                    />
                  </Field>
                </>
              ) : null}
            </>
          ) : profile?.hasGoogle ? (
            <div className="muted" style={{ fontSize: 12 }}>
              Esta conta usa login com Google. Alteração de senha não disponível aqui.
            </div>
          ) : null}

          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>

        {isTechnician ? (
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="section-title">Informações da equipe</div>
            <p className="muted" style={{ fontSize: 12, margin: 0 }}>
              Campos gerenciados pelo administrador (somente leitura).
            </p>
            <div className="kv-row"><span className="k">Início</span><span className="v">{profile.startedAt ? new Date(profile.startedAt).toLocaleDateString("pt-BR") : "—"}</span></div>
            <div className="kv-row"><span className="k">Agenda</span><span className="v">{profile.scheduleLabel || "—"}</span></div>
            <div className="kv-row"><span className="k">Disponível</span><span className="v">{profile.available ? "Sim" : "Não"}</span></div>
            <div className="kv-row"><span className="k">Carga diária</span><span className="v">{profile.workloadHours ?? 0}h</span></div>
            <div className="kv-row"><span className="k">Telefone (cadastro)</span><span className="v">{formatPhoneDisplay(profile.phoneCountryCode, profile.phoneNationalNumber)}</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 8 }}>
              {[
                { label: "Ativas", value: profile.activeAppointmentsCount },
                { label: "Concluídas (mês)", value: profile.completedCount },
                { label: "Utilização", value: `${profile.utilizationPercent}%` },
              ].map((k) => (
                <div key={k.label} className="card-hairline" style={{ padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 20, color: "var(--gold)" }}>{k.value}</div>
                  <div className="muted" style={{ fontSize: 10 }}>{k.label}</div>
                </div>
              ))}
            </div>
            {profile.hasScheduleConflict ? (
              <div className="badge danger" style={{ alignSelf: "flex-start" }}>Conflito de agenda detectado</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
