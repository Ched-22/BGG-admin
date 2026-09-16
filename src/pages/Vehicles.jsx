import React, { useCallback, useEffect, useState } from "react";
import { Button, Icon, PageRefreshButton, Field, Input, Modal, Select, useConfirm, useToast } from "../components/ui";
import { carBrandOptions } from "../data/orcamentoCatalog";
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  mapVehicleToApi,
  updateVehicle,
} from "../lib/vehicleApi";
import { formatPlateInput, getPlateCountryOptions, getPlatePlaceholder, isValidPlate, plateValidationMessage } from "../lib/plateUtils";
import { listClients, mapClientFromApi } from "../lib/clientApi";

const EMPTY_VEHICLE_FORM = {
  plate: "",
  plateCountry: "ES",
  brand: "",
  model: "",
  year: String(new Date().getFullYear()),
  color: "",
  clientId: "",
};

function VehiclesPage({ readOnly = false, onNav }) {
  const toast = useToast();
  const [confirm, ConfirmEl] = useConfirm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plateSearch, setPlateSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_VEHICLE_FORM });
  const [editingId, setEditingId] = useState(null);
  const [clients, setClients] = useState([]);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listVehicles({
        page,
        limit: 20,
        ...(plateSearch.trim() ? { plate: plateSearch.trim() } : {}),
      });
      setRows(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Erro ao carregar",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível carregar os veículos.",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, plateSearch, toast]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    listClients({ limit: 100 })
      .then((res) => setClients(res.data.map(mapClientFromApi)))
      .catch(() => setClients([]));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_VEHICLE_FORM });
    setShowForm(true);
  };

  const openEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setForm({
      plate: vehicle.plateDisplay || vehicle.plate,
      plateCountry: vehicle.plateCountry || "ES",
      brand: vehicle.brand,
      model: vehicle.model,
      year: String(vehicle.year),
      color: vehicle.color || "",
      clientId: vehicle.clientId,
    });
    setShowForm(true);
  };

  const validateForm = () => {
    if (!form.clientId) return "Selecione o cliente.";
    if (!form.plate?.trim()) return "Informe a placa.";
    if (!isValidPlate(form.plate, form.plateCountry)) {
      return plateValidationMessage(form.plateCountry);
    }
    if (!form.brand?.trim()) return "Informe a marca.";
    if (!form.model?.trim()) return "Informe o modelo.";
    return null;
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) {
      toast({ kind: "error", title: "Campo obrigatório", desc: err });
      return;
    }

    setSaving(true);
    try {
      const body = mapVehicleToApi(form);
      if (editingId) {
        await updateVehicle(editingId, body);
        toast({ kind: "success", title: "Veículo atualizado" });
      } else {
        await createVehicle(body);
        toast({ kind: "success", title: "Veículo cadastrado" });
      }
      setShowForm(false);
      await loadVehicles();
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Erro ao guardar",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível guardar o veículo.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicle) => {
    const ok = await confirm({
      title: "Excluir veículo?",
      body: `Remover ${vehicle.plateDisplay || vehicle.plate}?`,
      ok: "Excluir",
      danger: true,
      cancel: "Cancelar",
    });
    if (!ok) return;

    setSaving(true);
    try {
      await deleteVehicle(vehicle.id);
      toast({ kind: "success", title: "Veículo excluído" });
      await loadVehicles();
    } catch (err) {
      const msg = err.response?.data?.message;
      toast({
        kind: "error",
        title: "Erro ao excluir",
        desc: Array.isArray(msg) ? msg.join(", ") : msg || "Não foi possível excluir o veículo.",
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
            <h2 className="page-title">Veículos</h2>
            <div className="page-sub">{total} veículos cadastrados</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <PageRefreshButton onClick={loadVehicles} loading={loading} />
            {!readOnly ? (
              <Button icon={Icon.Plus} onClick={openCreate}>Novo veículo</Button>
            ) : null}
          </div>
        </div>

        <div className="entity-toolbar">
          <div className="searchbar" style={{ width: 280, background: "var(--bg)", border: "1px solid var(--border)" }}>
            <Icon.Search size={14} />
            <input
              placeholder="Buscar por placa (ex.: 1234)…"
              value={plateSearch}
              onChange={(e) => {
                setPlateSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="muted small" style={{ padding: 40, textAlign: "center" }}>A carregar veículos…</div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Veículo</th>
                  <th>Cliente</th>
                  <th style={{ width: 110 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => !readOnly && openEdit(v)}
                    style={!readOnly ? { cursor: "pointer" } : undefined}
                  >
                    <td className="mono">{v.plateDisplay || v.plate}</td>
                    <td>{v.brand} {v.model} · {v.year}{v.color ? ` · ${v.color}` : ""}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => onNav?.({ page: "customers", customerId: v.clientId })}
                      >
                        {v.clientName || "—"}
                      </button>
                    </td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      {!readOnly ? (
                        <>
                          <button className="row-action" title="Editar" onClick={() => openEdit(v)}>
                            <Icon.Edit size={14} />
                          </button>
                          <button
                            className="row-action danger"
                            title="Excluir"
                            disabled={saving}
                            onClick={() => handleDelete(v)}
                          >
                            <Icon.Trash size={14} />
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: 48, color: "var(--fg-5)" }}>
                      Nenhum veículo encontrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 16 }}>
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="muted small">Página {page} de {totalPages}</span>
            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Seguinte
            </Button>
          </div>
        ) : null}
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Editar veículo" : "Novo veículo"}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button icon={Icon.Check} disabled={saving} onClick={handleSave}>
              {saving ? "A guardar…" : "Guardar"}
            </Button>
          </>
        }
      >
        <div className="col" style={{ gap: 14 }}>
          <Field label="Cliente">
            <select
              className="input"
              value={form.clientId}
              onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
              disabled={!!editingId}
            >
              <option value="">Selecione…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="País de origem">
            <select
              className="input"
              value={form.plateCountry || "ES"}
              onChange={(e) => setForm((f) => ({ ...f, plateCountry: e.target.value, plate: "" }))}
            >
              {getPlateCountryOptions().map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Placa">
            <Input
              placeholder={getPlatePlaceholder(form.plateCountry)}
              value={form.plate}
              onChange={(e) => setForm((f) => ({
                ...f,
                plate: formatPlateInput(e.target.value, f.plateCountry),
              }))}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Marca">
              <Select
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              >
                <option value="">Selecione a marca</option>
                {carBrandOptions(form.brand).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Modelo">
              <Input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Ano">
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              />
            </Field>
            <Field label="Cor" optional>
              <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
            </Field>
          </div>
        </div>
      </Modal>

      {ConfirmEl}
    </>
  );
}

export { VehiclesPage };
