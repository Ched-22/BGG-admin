import React, { useCallback, useEffect, useState } from "react";
import { Button, Icon, PageRefreshButton, Field, Input, Select, Textarea, Modal, formatEUR, StatusBadge, useConfirm, useToast } from "../components/ui";
import { ExportMenu } from "../components/ExportMenu";
import { CUSTOMERS_EXPORT_COLUMNS } from "../lib/exportColumns";
import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  mapClientFromApi,
  mapClientToTaskPrefill,
  mapClientToApi,
  updateClient,
} from "../lib/clientApi";
import {
  createVehicle,
  deleteVehicle,
  listVehiclesByClient,
  mapVehicleToApi,
  updateVehicle,
} from "../lib/vehicleApi";
import { formatPlateInput, isValidPlate } from "../lib/plateUtils";
import { carBrandOptions } from "../data/orcamentoCatalog";
import {
  buildWhatsAppMessage,
  notifyWhatsAppResult,
  openWhatsAppClient,
} from "../lib/whatsapp";
import { PhoneInput } from "../components/PhoneInput";
import { ClientLanguageSelect } from "../components/ClientLanguageSelect";
import { AddressLocationFields } from "../components/AddressLocationFields";
import { DEFAULT_PHONE_COUNTRY_CODE } from "../lib/phoneCountries";
import { validatePhone } from "../lib/phoneUtils";
import { resolveClientPreferredLanguage } from "../lib/clientLanguage";

const CUSTOMER_STATUSES = ["Ativo", "VIP", "Inativo"];

const EMPTY_VEHICLE_ROW = {
  plate: "",
  brand: "",
  model: "",
  year: String(new Date().getFullYear()),
  color: "",
};

function vehiclesToForm(vehicles = []) {
  return vehicles.map((v) => ({
    id: v.id,
    plate: v.plateDisplay || v.plate || "",
    brand: v.brand || "",
    model: v.model || "",
    year: String(v.year ?? new Date().getFullYear()),
    color: v.color || "",
  }));
}

function VehicleFleetEditor({ vehicles, setVehicles, readOnly = false }) {
  const addRow = () => setVehicles((rows) => [...rows, { ...EMPTY_VEHICLE_ROW }]);
  const updateRow = (index, patch) =>
    setVehicles((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const removeRow = (index) =>
    setVehicles((rows) => rows.filter((_, i) => i !== index));

  return (
    <div className="col" style={{ gap: 12 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
        Veículos
      </div>
      {vehicles.length === 0 ? (
        <div className="muted small">Nenhum veículo cadastrado.</div>
      ) : null}
      {vehicles.map((row, index) => (
        <div
          key={row.id || `new-${index}`}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 90px 1fr auto", gap: 8, alignItems: "end" }}
        >
          <Field label={index === 0 ? "Placa" : undefined}>
            <Input
              placeholder="1234 BCD"
              value={row.plate}
              disabled={readOnly}
              onChange={(e) => updateRow(index, { plate: formatPlateInput(e.target.value) })}
            />
          </Field>
          <Field label={index === 0 ? "Marca" : undefined}>
            <Input value={row.brand} disabled={readOnly} onChange={(e) => updateRow(index, { brand: e.target.value })} />
          </Field>
          <Field label={index === 0 ? "Modelo" : undefined}>
            <Input value={row.model} disabled={readOnly} onChange={(e) => updateRow(index, { model: e.target.value })} />
          </Field>
          <Field label={index === 0 ? "Ano" : undefined}>
            <Input type="number" value={row.year} disabled={readOnly} onChange={(e) => updateRow(index, { year: e.target.value })} />
          </Field>
          <Field label={index === 0 ? "Cor" : undefined} optional>
            <Input value={row.color} disabled={readOnly} onChange={(e) => updateRow(index, { color: e.target.value })} />
          </Field>
          {!readOnly ? (
            <button
              type="button"
              className="row-action danger"
              title="Remover"
              style={{ marginBottom: 4 }}
              onClick={() => removeRow(index)}
            >
              <Icon.Trash size={14} />
            </button>
          ) : null}
        </div>
      ))}
      {!readOnly ? (
        <Button variant="secondary" size="sm" icon={Icon.Plus} onClick={addRow}>
          Adicionar veículo
        </Button>
      ) : null}
    </div>
  );
}

async function persistClientVehicles(clientId, vehicles, originalVehicleIds = []) {
  const keptIds = new Set();
  for (const row of vehicles) {
    if (!row.plate?.trim()) continue;
    if (!isValidPlate(row.plate)) {
      throw new Error(`Placa inválida: ${row.plate}`);
    }
    const body = mapVehicleToApi({ ...row, clientId });
    if (row.id) {
      await updateVehicle(row.id, body);
      keptIds.add(row.id);
    } else {
      const created = await createVehicle(body);
      keptIds.add(created.id);
    }
  }
  for (const id of originalVehicleIds) {
    if (!keptIds.has(id)) await deleteVehicle(id);
  }
}

const EMPTY_CUSTOMER_FORM = {
  name: "",
  email: "",
  phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
  phoneNationalNumber: "",
  unidade: "",
  logradouro: "",
  cidade: "",
  estado: "",
  cep: "",
  status: "Ativo",
  notes: "",
  preferredLanguage: "es",
};

function cleanAddressPart(value) {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "—" ? trimmed : "";
}

function customerToForm(customer) {
  return {
    name: customer.name || "",
    email: customer.email || "",
    phoneCountryCode: customer.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    phoneNationalNumber: customer.phoneNationalNumber || "",
    unidade: customer.endereco?.unidade || "",
    logradouro: customer.endereco?.logradouro || "",
    cidade: customer.endereco?.cidade || "",
    estado: customer.endereco?.estado || "",
    cep: customer.endereco?.cep || "",
    status: customer.status || "Ativo",
    notes: customer.notes || "",
    preferredLanguage: customer.preferredLanguage || "es",
  };
}

function CustomerFormFields({ form, setForm }) {
  return (
    <div className="col" style={{ gap: 14 }}>
      <Field label="Nome completo">
        <Input
          placeholder="João Silva"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </Field>
      <Field label="Telefone">
        <PhoneInput
          countryCode={form.phoneCountryCode}
          nationalNumber={form.phoneNationalNumber}
          onChange={({ countryCode, nationalNumber }) =>
            setForm((f) => ({ ...f, phoneCountryCode: countryCode, phoneNationalNumber: nationalNumber }))
          }
        />
      </Field>
      <Field label="E-mail">
        <Input
          type="email"
          leading={<Icon.Mail size={14}/>}
          placeholder="cliente@exemplo.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </Field>
      <ClientLanguageSelect
        value={form.preferredLanguage}
        onChange={(lang) => setForm((f) => ({ ...f, preferredLanguage: lang }))}
      />
      <Field label="Status">
        <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
          {CUSTOMER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Field>
      <Field label="Unidade / tipo de endereço" optional>
        <Input
          placeholder="Casa, Escritório, Condomínio…"
          value={form.unidade}
          onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))}
        />
      </Field>
      <Field label="Endereço">
        <Input
          placeholder="Rua, número, complemento"
          value={form.logradouro}
          onChange={(e) => setForm((f) => ({ ...f, logradouro: e.target.value }))}
        />
      </Field>
      <AddressLocationFields
        phoneCountryCode={form.phoneCountryCode}
        cidade={form.cidade}
        estado={form.estado}
        cep={form.cep}
        onCidadeChange={(value) => setForm((f) => ({ ...f, cidade: value }))}
        onEstadoChange={(value) => setForm((f) => ({ ...f, estado: value }))}
        onCepChange={(value) => setForm((f) => ({ ...f, cep: value }))}
      />
      <Field label="Anotações" optional>
        <Textarea
          placeholder="Preferências, veículos cadastrados, observações…"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </Field>
    </div>
  );
}

function CustomersPage({ readOnly = false, tasks = [], onOpenTask, onCreateTask, initialCustomerId, onNav }) {
  const toast = useToast();
  const [confirm, ConfirmEl] = useConfirm();
  const PAGE_SIZE = 15;

  const [all, setAll] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [view, setView] = useState("table"); // table | cards
  const [detail, setDetail] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ ...EMPTY_CUSTOMER_FORM });
  const [newVehicles, setNewVehicles] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ ...EMPTY_CUSTOMER_FORM });
  const [editVehicles, setEditVehicles] = useState([]);
  const [originalVehicleIds, setOriginalVehicleIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ ...EMPTY_VEHICLE_ROW });
  const [vehicleEditingId, setVehicleEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listClients({
        page,
        limit: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status !== "Todos" ? { status } : {}),
      });
      setAll((res.data || []).map((row) => mapClientFromApi(row)));
      setTotal(res.total ?? res.data?.length ?? 0);
      setTotalPages(res.totalPages ?? 1);
      setStatusCounts(res.statusCounts || {});
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Erro ao carregar",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível carregar os clientes.",
      });
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, [toast, page, search, status]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(() => loadClients(), 300);
    return () => clearTimeout(t);
  }, [loadClients]);

  useEffect(() => {
    if (!initialCustomerId) return;
    getClient(initialCustomerId)
      .then((client) => setDetail(client))
      .catch(() => {});
  }, [initialCustomerId]);

  const refreshDetailVehicles = useCallback(async (clientId) => {
    const vehicles = await listVehiclesByClient(clientId);
    setDetail((prev) => (prev?.id === clientId ? { ...prev, vehicles } : prev));
    setAll((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, vehicles } : c)),
    );
  }, []);

  const filtered = all;

  const totals = {
    ativos: statusCounts.Ativo ?? all.filter(c => c.status === "Ativo").length,
    vip: statusCounts.VIP ?? all.filter(c => c.status === "VIP").length,
    inativos: statusCounts.Inativo ?? all.filter(c => c.status === "Inativo").length,
    receita: all.reduce((s, c) => s + c.totalGasto, 0),
  };

  const handleRefresh = async () => {
    setDetail(null);
    await loadClients();
    toast({ kind: "success", title: "Atualizado", desc: "Lista de clientes atualizada." });
  };

  const openCustomerWhatsApp = (customer) => {
    const preferredLanguage = resolveClientPreferredLanguage({ client: customer });
    const message = buildWhatsAppMessage("customer_greeting", { clientName: customer.name }, preferredLanguage);
    const result = openWhatsAppClient({
      phone: { countryCode: customer.phoneCountryCode, nationalNumber: customer.phoneNationalNumber },
      message,
    });
    notifyWhatsAppResult(result, toast);
  };

  const customerPhoneReady = (customer) =>
    !validatePhone(customer.phoneCountryCode, customer.phoneNationalNumber);

  const validateForm = (form) => {
    if (!form.name?.trim()) return "Informe o nome do cliente.";
    if (validatePhone(form.phoneCountryCode, form.phoneNationalNumber)) {
      return "Informe um telefone válido.";
    }
    return null;
  };

  const openVehicleEdit = (vehicle) => {
    if (!vehicle?.id || readOnly) return;
    setVehicleEditingId(vehicle.id);
    setVehicleForm({
      plate: vehicle.plateDisplay || vehicle.plate || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: String(vehicle.year ?? new Date().getFullYear()),
      color: vehicle.color || "",
    });
    setShowVehicleForm(true);
  };

  const validateVehicleForm = () => {
    if (!vehicleForm.plate?.trim()) return "Informe a placa.";
    if (!isValidPlate(vehicleForm.plate)) return "Placa inválida. Use o formato 1234 BCD.";
    if (!vehicleForm.brand?.trim()) return "Informe a marca.";
    if (!vehicleForm.model?.trim()) return "Informe o modelo.";
    return null;
  };

  const handleVehicleSave = async () => {
    if (!vehicleEditingId || !detail?.id) return;
    const err = validateVehicleForm();
    if (err) {
      toast({ kind: "error", title: "Campo obrigatório", desc: err });
      return;
    }

    setSaving(true);
    try {
      await updateVehicle(vehicleEditingId, mapVehicleToApi({ ...vehicleForm, clientId: detail.id }));
      await refreshDetailVehicles(detail.id);
      toast({ kind: "success", title: "Veículo atualizado" });
      setShowVehicleForm(false);
      setVehicleEditingId(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast({
        kind: "error",
        title: "Erro ao atualizar",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível atualizar o veículo.",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (customer) => {
    const target = customer || detail;
    if (!target?.id) return;
    setEditingId(target.id);
    setEditForm(customerToForm(target));
    try {
      const vehicles = await listVehiclesByClient(target.id);
      setEditVehicles(vehiclesToForm(vehicles));
      setOriginalVehicleIds(vehicles.map((v) => v.id));
    } catch {
      setEditVehicles(vehiclesToForm(target.vehicles));
      setOriginalVehicleIds((target.vehicles || []).map((v) => v.id).filter(Boolean));
    }
    setShowEdit(true);
  };

  const handleCreate = async () => {
    const err = validateForm(newForm);
    if (err) {
      toast({ kind: "error", title: "Campo obrigatório", desc: err });
      return;
    }

    setSaving(true);
    try {
      const created = await createClient(mapClientToApi(newForm));
      await persistClientVehicles(created.id, newVehicles);
      const uiClient = mapClientFromApi(await getClient(created.id));
      setAll((prev) => [uiClient, ...prev]);
      setShowNew(false);
      setNewForm({ ...EMPTY_CUSTOMER_FORM });
      setNewVehicles([]);
      toast({ kind: "success", title: "Cliente cadastrado", desc: uiClient.name });
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast({
        kind: "error",
        title: "Erro ao cadastrar",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível criar o cliente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    const target = customer || detail;
    if (!target?.id) return;

    const ok = await confirm({
      title: "Excluir cliente?",
      body: `Remover "${target.name}" permanentemente? Esta ação não pode ser desfeita.`,
      ok: "Excluir",
      danger: true,
      cancel: "Cancelar",
    });
    if (!ok) return;

    setSaving(true);
    try {
      await deleteClient(target.id);
      setAll((prev) => prev.filter((c) => c.id !== target.id));
      if (detail?.id === target.id) setDetail(null);
      if (editingId === target.id) {
        setShowEdit(false);
        setEditingId(null);
      }
      toast({ kind: "success", title: "Cliente excluído", desc: target.name });
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Erro ao excluir",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível excluir o cliente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const err = validateForm(editForm);
    if (err) {
      toast({ kind: "error", title: "Campo obrigatório", desc: err });
      return;
    }

    setSaving(true);
    try {
      const previous = all.find((c) => c.id === editingId);
      const updated = await updateClient(editingId, mapClientToApi(editForm));
      await persistClientVehicles(editingId, editVehicles, originalVehicleIds);
      const fresh = await getClient(editingId);
      const uiClient = mapClientFromApi(updated, {
        tarefas: previous?.tarefas ?? 0,
        ativas: previous?.ativas ?? 0,
        totalGasto: previous?.totalGasto ?? 0,
        ultima: previous?.ultima ?? "—",
      });
      uiClient.vehicles = fresh.vehicles;

      setAll((prev) => prev.map((c) => (c.id === editingId ? uiClient : c)));
      if (detail?.id === editingId) setDetail(uiClient);

      toast({ kind: "success", title: "Cliente atualizado", desc: uiClient.name });
      setShowEdit(false);
      setEditingId(null);
      setEditVehicles([]);
      setOriginalVehicleIds([]);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast({
        kind: "error",
        title: "Erro ao atualizar",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível atualizar o cliente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page">
        <div className="page-head">
          <div className="titles">
            <span className="eyebrow-sm">Gestão</span>
            <h2 className="page-title">Clientes</h2>
            <div className="page-sub">{all.length} clientes cadastrados · {totals.vip} VIPs · LTV total {formatEUR(totals.receita)}</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <PageRefreshButton onClick={handleRefresh} loading={loading}/>
            <ExportMenu
              filenameBase="clientes"
              sheetName="Clientes"
              columns={CUSTOMERS_EXPORT_COLUMNS}
              rows={filtered}
              disabled={loading}
            />
            {!readOnly ? (
              <Button icon={Icon.Plus} onClick={() => { setNewForm({ ...EMPTY_CUSTOMER_FORM }); setNewVehicles([]); setShowNew(true); }}>Novo cliente</Button>
            ) : null}
          </div>
        </div>

        {/* KPI row */}
        <div className="dash-grid" style={{ marginBottom: 22 }}>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Clientes ativos</span>
              <div className="stat">
                <div className="num">{totals.ativos}</div>
                <div className="delta up">+3 este mês</div>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Clientes VIP</span>
              <div className="stat">
                <div className="num">{totals.vip}</div>
                <div className="delta">Receita acima de 3.600 €</div>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Receita total (LTV)</span>
              <div className="stat">
                <div className="num" style={{ fontSize: 30 }}>{formatEUR(totals.receita)}</div>
                <div className="delta">Histórico completo</div>
              </div>
            </div>
          </div>
          <div className="col-3">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>Ticket médio</span>
              <div className="stat">
                <div className="num">{formatEUR(totals.receita / Math.max(1, all.reduce((s, c) => s + c.tarefas, 0)))}</div>
                <div className="delta">Por tarefa</div>
              </div>
            </div>
          </div>
        </div>

        <div className="entity-toolbar">
          <div className="searchbar" style={{ width: 280, background: "var(--bg)", border: "1px solid var(--border)" }}>
            <Icon.Search size={14}/>
            <input
              placeholder="Buscar cliente por nome ou e-mail…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-tabs">
            {["Todos", "Ativo", "VIP", "Inativo"].map(s => (
              <button key={s} className={status === s ? "active" : ""} onClick={() => setStatus(s)}>
                {s}
                <span style={{ marginLeft: 6, color: "var(--fg-6)", fontSize: 10 }}>
                  {statusCounts[s] ?? (s === "Todos" ? total : 0)}
                </span>
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }}/>
          <div className="view-toggle">
            <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title="Tabela">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="4"/><rect x="3" y="10" width="18" height="4"/><rect x="3" y="16" width="18" height="4"/></svg>
            </button>
            <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")} title="Cards">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="muted small" style={{ padding: 40, textAlign: "center" }}>A carregar clientes…</div>
        ) : view === "table" ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contato</th>
                  <th>Localização</th>
                  <th style={{ width: 90, textAlign: "right" }}>Tarefas</th>
                  <th style={{ width: 90, textAlign: "right" }}>Ativas</th>
                  <th style={{ width: 140, textAlign: "right" }}>LTV</th>
                  <th style={{ width: 120 }}>Última tarefa</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th style={{ width: 110 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id || c.name} onClick={async () => {
                    setDetail(c);
                    if (c.id) {
                      try {
                        const fresh = await getClient(c.id);
                        setDetail(fresh);
                      } catch { /* keep list row */ }
                    }
                  }}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <div className="avatar" style={{
                          background: c.status === "VIP" ? "var(--gold)" : c.status === "Inativo" ? "var(--bg-elevated)" : "rgba(181, 235, 12,0.18)",
                          color: c.status === "VIP" ? "var(--gold-on)" : c.status === "Inativo" ? "var(--fg-5)" : "var(--gold)",
                          border: c.status === "VIP" ? "none" : "1px solid var(--gold-30)"
                        }}>{c.name.split(" ").pop().slice(0, 2)}</div>
                        <div>
                          <div style={{ color: "var(--fg)", fontWeight: 500 }}>{c.name}</div>
                          <div className="muted small">Cliente desde {c.since}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>{c.email}</div>
                      <div className="muted small mono">{c.tel}</div>
                    </td>
                    <td className="muted small">{c.endereco.cidade}/{c.endereco.estado}</td>
                    <td className="mono" style={{ textAlign: "right", color: "var(--fg)" }}>{c.tarefas}</td>
                    <td className="mono" style={{ textAlign: "right", color: c.ativas > 0 ? "var(--gold)" : "var(--fg-6)" }}>{c.ativas}</td>
                    <td className="amount" style={{ textAlign: "right", color: "var(--gold)" }}>{formatEUR(c.totalGasto)}</td>
                    <td className="muted small mono">{c.ultima}</td>
                    <td>
                      <span className={`badge ${c.status === "VIP" ? "gold" : c.status === "Ativo" ? "success" : "muted"}`}>
                        <span className="dot"></span>{c.status}
                      </span>
                    </td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button className="row-action" title="Detalhes" onClick={() => setDetail(c)}><Icon.Eye size={14}/></button>
                      <button
                        className="row-action"
                        title="WhatsApp"
                        disabled={!customerPhoneReady(c)}
                        onClick={() => openCustomerWhatsApp(c)}
                      >
                        <Icon.WhatsApp size={14}/>
                      </button>
                      {!readOnly ? (
                        <>
                          <button
                            className="row-action"
                            title="Editar"
                            onClick={() => openEdit(c)}
                          >
                            <Icon.Edit size={14}/>
                          </button>
                          <button
                            className="row-action danger"
                            title="Excluir"
                            disabled={saving}
                            onClick={() => handleDelete(c)}
                          >
                            <Icon.Trash size={14}/>
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: "center", padding: 48, color: "var(--fg-5)" }}>Nenhum cliente encontrado.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="entity-grid">
            {filtered.map(c => (
              <div key={c.id || c.name} className="entity-card" onClick={() => setDetail(c)}>
                <div className="head">
                  <div className="avatar" style={{
                    background: c.status === "VIP" ? "var(--gold)" : "rgba(181, 235, 12,0.18)",
                    color: c.status === "VIP" ? "var(--gold-on)" : "var(--gold)",
                    border: c.status === "VIP" ? "none" : "1px solid var(--gold-30)"
                  }}>{c.name.split(" ").pop().slice(0, 2)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="name">{c.name}</div>
                    <div className="role">{c.status} · Cliente desde {c.since}</div>
                  </div>
                  <span className={`badge ${c.status === "VIP" ? "gold" : c.status === "Ativo" ? "success" : "muted"}`} style={{ fontSize: 9, padding: "2px 6px" }}>
                    <span className="dot"></span>{c.status}
                  </span>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 28, height: 28, flexShrink: 0 }}
                    title="WhatsApp"
                    disabled={!customerPhoneReady(c)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openCustomerWhatsApp(c);
                    }}
                  >
                    <Icon.WhatsApp size={14}/>
                  </button>
                </div>
                <div className="stats">
                  <div>
                    <div className="k">Tarefas</div>
                    <div className="v">{c.tarefas}</div>
                  </div>
                  <div>
                    <div className="k">LTV</div>
                    <div className="v" style={{ fontSize: 16 }}>{formatEUR(c.totalGasto)}</div>
                  </div>
                </div>
                <div className="meta">
                  <div className="row"><span className="ico"><Icon.Mail size={12}/></span> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</span></div>
                  <div className="row"><span className="ico"><Icon.Phone size={12}/></span> <span className="mono">{c.tel}</span></div>
                  <div className="row"><span className="ico"><Icon.MapPin size={12}/></span> <span>{c.endereco.cidade}/{c.endereco.estado}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 16 }}>
            <Button variant="ghost" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="muted small">Página {page} de {totalPages}</span>
            <Button variant="ghost" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              Seguinte
            </Button>
          </div>
        ) : null}
      </div>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.name : ""}
        sub={detail ? `Cliente desde ${detail.since} · ${detail.status}` : ""}
        size="lg"
        footer={
          readOnly ? null : (
          <>
            <Button variant="danger" icon={Icon.Trash} disabled={saving} onClick={() => handleDelete()}>Excluir</Button>
            <div style={{ flex: 1 }}/>
            <Button variant="secondary" icon={Icon.Edit} onClick={() => openEdit()}>Editar</Button>
            <Button
              icon={Icon.Plus}
              onClick={() => {
                if (!detail || !onCreateTask) return;
                onCreateTask(mapClientToTaskPrefill(detail));
                setDetail(null);
              }}
            >
              Criar tarefa
            </Button>
          </>
          )
        }
      >
        {detail ? (
          <div className="col" style={{ gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div className="kpi" style={{ padding: 14 }}>
                <span className="label" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-5)" }}>Tarefas totais</span>
                <div className="num-display" style={{ color: "var(--gold)", fontSize: 28, fontWeight: 500 }}>{detail.tarefas}</div>
              </div>
              <div className="kpi" style={{ padding: 14 }}>
                <span className="label" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-5)" }}>Ativas</span>
                <div className="num-display" style={{ color: detail.ativas > 0 ? "var(--gold)" : "var(--fg-5)", fontSize: 28, fontWeight: 500 }}>{detail.ativas}</div>
              </div>
              <div className="kpi" style={{ padding: 14 }}>
                <span className="label" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--fg-5)" }}>LTV</span>
                <div className="num-display" style={{ color: "var(--gold)", fontSize: 22, fontWeight: 500 }}>{formatEUR(detail.totalGasto)}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Contato</div>
              <div className="kv-row">
                <span className="k">E-mail</span>
                <span className="v"><Icon.Mail size={12} style={{ color: "var(--gold)", marginRight: 6, verticalAlign: "middle" }}/>{detail.email}</span>
              </div>
              <div className="kv-row">
                <span className="k">Telefone</span>
                <span className="v">
                  <span className="row" style={{ gap: 10, alignItems: "center" }}>
                    <span className="mono"><Icon.Phone size={12} style={{ color: "var(--gold)", marginRight: 6, verticalAlign: "middle" }}/>{detail.tel}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Icon.WhatsApp}
                      onClick={() => openCustomerWhatsApp(detail)}
                      disabled={!customerPhoneReady(detail)}
                      title="Abrir WhatsApp"
                    >
                      WhatsApp
                    </Button>
                  </span>
                </span>
              </div>
              <div className="kv-row">
                <span className="k">Endereço</span>
                <span className="v">
                  {detail.endereco.unidade} · {detail.endereco.logradouro}<br/>
                  <span className="muted">{detail.endereco.cidade} — {detail.endereco.estado} · CEP {detail.endereco.cep}</span>
                </span>
              </div>
              {detail.notes ? (
                <div className="kv-row">
                  <span className="k">Anotações</span>
                  <span className="v muted small">{detail.notes}</span>
                </div>
              ) : null}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
                  Veículos
                </div>
                {onNav ? (
                  <Button variant="ghost" size="sm" onClick={() => onNav({ page: "vehicles" })}>
                    Ver todos
                  </Button>
                ) : null}
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Veículo</th>
                      {!readOnly ? <th style={{ width: 90 }}></th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.vehicles || []).map((v) => (
                      <tr
                        key={v.id}
                        onClick={() => openVehicleEdit(v)}
                        style={!readOnly ? { cursor: "pointer" } : undefined}
                      >
                        <td className="mono">{v.plateDisplay || v.plate}</td>
                        <td>{v.brand} {v.model} · {v.year}{v.color ? ` · ${v.color}` : ""}</td>
                        {!readOnly ? (
                          <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                            <button className="row-action" title="Editar" onClick={() => openVehicleEdit(v)}>
                              <Icon.Edit size={14} />
                            </button>
                            <button
                              className="row-action danger"
                              title="Excluir"
                              disabled={saving}
                              onClick={async () => {
                                const ok = await confirm({
                                  title: "Excluir veículo?",
                                  body: `Remover ${v.plateDisplay || v.plate}?`,
                                  ok: "Excluir",
                                  danger: true,
                                  cancel: "Cancelar",
                                });
                                if (!ok) return;
                                setSaving(true);
                                try {
                                  await deleteVehicle(v.id);
                                  await refreshDetailVehicles(detail.id);
                                  toast({ kind: "success", title: "Veículo excluído" });
                                } catch (err) {
                                  const msg = err.response?.data?.message;
                                  toast({
                                    kind: "error",
                                    title: "Erro ao excluir",
                                    desc: Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível excluir.",
                                  });
                                } finally {
                                  setSaving(false);
                                }
                              }}
                            >
                              <Icon.Trash size={14} />
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                    {(detail.vehicles || []).length === 0 ? (
                      <tr>
                        <td colSpan={readOnly ? 2 : 3} className="muted small" style={{ textAlign: "center", padding: 24 }}>
                          Nenhum veículo cadastrado.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Tarefas recentes</div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Projeto</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.filter(t => t.cliente === detail.name).slice(0, 5).map(t => (
                      <tr key={t.id} onClick={() => { setDetail(null); onOpenTask(t.id); }}>
                        <td className="id">{t.id}</td>
                        <td>{t.projeto}</td>
                        <td><StatusBadge>{t.status}</StatusBadge></td>
                        <td className="amount" style={{ textAlign: "right" }}>{formatEUR(t.orcamento?.valor)}</td>
                      </tr>
                    ))}
                    {tasks.filter(t => t.cliente === detail.name).length === 0 ? (
                      <tr><td colSpan="4" className="muted small" style={{ textAlign: "center", padding: 24 }}>Nenhuma tarefa registrada para este cliente.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Novo cliente"
        sub="Cadastro manual"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button icon={Icon.Plus} disabled={saving} onClick={handleCreate}>
              {saving ? "A guardar…" : "Criar cliente"}
            </Button>
          </>
        }
      >
        <CustomerFormFields form={newForm} setForm={setNewForm}/>
        <VehicleFleetEditor vehicles={newVehicles} setVehicles={setNewVehicles} />
      </Modal>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Editar cliente"
        sub={all.find((c) => c.id === editingId)?.name || ""}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button icon={Icon.Check} disabled={saving} onClick={handleUpdate}>
              {saving ? "A guardar…" : "Guardar alterações"}
            </Button>
          </>
        }
      >
        <CustomerFormFields form={editForm} setForm={setEditForm}/>
        <VehicleFleetEditor vehicles={editVehicles} setVehicles={setEditVehicles} />
      </Modal>

      <Modal
        open={showVehicleForm}
        onClose={() => setShowVehicleForm(false)}
        title="Editar veículo"
        sub={detail?.name || ""}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowVehicleForm(false)}>Cancelar</Button>
            <Button icon={Icon.Check} disabled={saving} onClick={handleVehicleSave}>
              {saving ? "A guardar…" : "Guardar"}
            </Button>
          </>
        }
      >
        <div className="col" style={{ gap: 14 }}>
          <Field label="Placa">
            <Input
              placeholder="1234 BCD"
              value={vehicleForm.plate}
              onChange={(e) => setVehicleForm((f) => ({ ...f, plate: formatPlateInput(e.target.value) }))}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Marca">
              <Select
                value={vehicleForm.brand}
                onChange={(e) => setVehicleForm((f) => ({ ...f, brand: e.target.value }))}
              >
                <option value="">Selecione a marca</option>
                {carBrandOptions(vehicleForm.brand).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Modelo">
              <Input value={vehicleForm.model} onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Ano">
              <Input
                type="number"
                value={vehicleForm.year}
                onChange={(e) => setVehicleForm((f) => ({ ...f, year: e.target.value }))}
              />
            </Field>
            <Field label="Cor" optional>
              <Input value={vehicleForm.color} onChange={(e) => setVehicleForm((f) => ({ ...f, color: e.target.value }))} />
            </Field>
          </div>
        </div>
      </Modal>

      {ConfirmEl}
    </>
  );
}


export { CustomersPage };
