import React, { useCallback, useMemo, useState } from "react";
import {
  Button,
  Field,
  Icon,
  Input,
  Modal,
  PageRefreshButton,
  Select,
  StatusBadge,
  Textarea,
  useConfirm,
  useToast,
  formatEUR,
} from "../components/ui";
import {
  createCatalogService,
  deactivateCatalogService,
  getCatalogService,
  listCatalogServices,
  publishCatalogServicePrices,
  updateCatalogService,
} from "../lib/catalogApi";
import { ExportMenu } from "../components/ExportMenu";
import { SERVICES_EXPORT_COLUMNS } from "../lib/exportColumns";
import { serviceCategoryBadgeClass, serviceCategoryLabel } from "../lib/technicianCoverage";

function emptyCreateForm() {
  return {
    code: "",
    name: "",
    description: "",
    durationMinutes: "",
    serviceCategory: "EXTERIOR",
    priceSmall: "",
    priceMedium: "",
    priceLarge: "",
  };
}

function emptyPriceForm(service) {
  return {
    priceSmall: String(service?.priceSmall ?? ""),
    priceMedium: String(service?.priceMedium ?? ""),
    priceLarge: String(service?.priceLarge ?? ""),
  };
}

function formatDuration(minutes) {
  const m = Number(minutes) || 0;
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}min` : `${h}h`;
}

function formatVigencia(from, to) {
  const start = from ? new Date(from).toLocaleDateString("pt-BR") : "—";
  const end = to ? new Date(to).toLocaleDateString("pt-BR") : "Atual";
  return `${start} – ${end}`;
}

function ServicePriceGrid({ service, compact = false }) {
  const tiers = [
    { key: "P", label: "Pequeno", value: service.priceSmall },
    { key: "M", label: "Médio", value: service.priceMedium },
    { key: "G", label: "Grande", value: service.priceLarge },
  ];
  return (
    <div className={`service-price-grid${compact ? " compact" : ""}`}>
      {tiers.map((tier) => (
        <div key={tier.key} className="service-price-cell">
          <span className="service-price-tier">{tier.key}</span>
          <span className="service-price-label">{tier.label}</span>
          <span className="service-price-value">{formatEUR(tier.value)}</span>
        </div>
      ))}
    </div>
  );
}

function ServicePriceHistory({ history, loading }) {
  if (loading) {
    return <div className="service-history-panel loading">Carregando histórico…</div>;
  }
  if (!history?.length) {
    return <div className="service-history-panel empty">Sem versões anteriores.</div>;
  }
  return (
    <div className="service-history-panel">
      <div className="service-history-head">
        <Icon.Clock size={14} />
        <span>Histórico de preços</span>
      </div>
      <div className="service-history-list">
        {history.map((row) => {
          const current = !row.effectiveTo;
          return (
            <div
              key={row.priceVersionId}
              className={`service-history-row${current ? " current" : ""}`}
            >
              <div className="service-history-vigencia">
                {current ? <span className="service-history-badge">Vigente</span> : null}
                <span className="mono small">{formatVigencia(row.effectiveFrom, row.effectiveTo)}</span>
              </div>
              <div className="service-history-prices">
                <span><em>P</em> {formatEUR(row.priceSmall)}</span>
                <span><em>M</em> {formatEUR(row.priceMedium)}</span>
                <span><em>G</em> {formatEUR(row.priceLarge)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServiceCardActions({ service, readOnly, expanded, onToggleHistory, onEdit, onPrices, onDeactivate }) {
  return (
    <div className="service-card-actions" onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="sm" onClick={() => onToggleHistory(service)}>
        <Icon.ChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
        {expanded ? "Ocultar" : "Histórico"}
      </Button>
      {!readOnly ? (
        <>
          <Button variant="ghost" size="sm" icon={Icon.Edit} onClick={() => onEdit(service)} title="Editar" />
          <Button variant="ghost" size="sm" icon={Icon.DollarSign} onClick={() => onPrices(service)} title="Atualizar preços" />
          {service.active ? (
            <Button variant="ghost" size="sm" icon={Icon.XCircle} onClick={() => onDeactivate(service)} title="Desativar" />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function ServicesPage({ readOnly = false }) {
  const toast = useToast();
  const [confirm, ConfirmEl] = useConfirm();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState({});
  const [priceForm, setPriceForm] = useState(emptyPriceForm());
  const [saving, setSaving] = useState(false);

  const fetchServices = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    try {
      const { data } = await listCatalogServices({ includeInactive: true });
      setServices(data);
    } catch {
      toast({ kind: "error", title: "Erro", desc: "Não foi possível carregar os serviços." });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const stats = useMemo(() => {
    const active = services.filter((s) => s.active).length;
    const inactive = services.length - active;
    const avgDuration = services.length
      ? Math.round(services.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / services.length)
      : 0;
    return { total: services.length, active, inactive, avgDuration };
  }, [services]);

  const filtered = useMemo(() => {
    let list = services;
    if (statusFilter === "Ativos") list = list.filter((s) => s.active);
    if (statusFilter === "Inativos") list = list.filter((s) => !s.active);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [services, search, statusFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServices({ silent: true });
    setRefreshing(false);
    toast({ kind: "success", title: "Atualizado", desc: "Catálogo de serviços atualizado." });
  };

  const openEdit = (service) => {
    setEditForm({
      id: service.id,
      name: service.name,
      description: service.description || "",
      durationMinutes: String(service.durationMinutes),
      serviceCategory: service.serviceCategory || "EXTERIOR",
      active: service.active,
    });
    setShowEdit(true);
  };

  const openPrices = (service) => {
    setEditForm({ id: service.id, name: service.name });
    setPriceForm(emptyPriceForm(service));
    setShowPrices(true);
  };

  const toggleExpanded = async (service) => {
    if (expandedId === service.id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(service.id);
    setHistoryLoading(true);
    try {
      const full = await getCatalogService(service.id);
      setDetail(full);
    } catch {
      toast({ kind: "error", title: "Erro", desc: "Não foi possível carregar o histórico." });
      setExpandedId(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const submitCreate = async () => {
    setSaving(true);
    try {
      await createCatalogService(createForm);
      setShowCreate(false);
      setCreateForm(emptyCreateForm());
      await fetchServices({ silent: true });
      toast({ kind: "success", title: "Serviço criado", desc: "O serviço foi adicionado ao catálogo." });
    } catch {
      toast({ kind: "error", title: "Erro", desc: "Não foi possível criar o serviço." });
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    setSaving(true);
    try {
      await updateCatalogService(editForm.id, editForm);
      setShowEdit(false);
      await fetchServices({ silent: true });
      toast({ kind: "success", title: "Serviço atualizado", desc: editForm.name });
    } catch {
      toast({ kind: "error", title: "Erro", desc: "Não foi possível atualizar o serviço." });
    } finally {
      setSaving(false);
    }
  };

  const submitPrices = async () => {
    const ok = await confirm({
      title: "Atualizar preços?",
      body: "Esta alteração não afeta orçamentos já criados. Apenas novos orçamentos usarão estes preços.",
      ok: "Atualizar",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await publishCatalogServicePrices(editForm.id, priceForm);
      setShowPrices(false);
      if (expandedId === editForm.id) {
        setHistoryLoading(true);
        try {
          const full = await getCatalogService(editForm.id);
          setDetail(full);
        } finally {
          setHistoryLoading(false);
        }
      }
      await fetchServices({ silent: true });
      toast({ kind: "success", title: "Preços atualizados", desc: editForm.name });
    } catch {
      toast({ kind: "error", title: "Erro", desc: "Não foi possível atualizar os preços." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (service) => {
    const ok = await confirm({
      title: "Desativar serviço?",
      body: `O serviço "${service.name}" deixará de aparecer em novos orçamentos.`,
      ok: "Desativar",
    });
    if (!ok) return;
    try {
      await deactivateCatalogService(service.id);
      if (expandedId === service.id) {
        setExpandedId(null);
        setDetail(null);
      }
      await fetchServices({ silent: true });
      toast({ kind: "success", title: "Serviço desativado", desc: service.name });
    } catch {
      toast({ kind: "error", title: "Erro", desc: "Não foi possível desativar o serviço." });
    }
  };

  const prepareExportRows = useCallback(async () => {
    return Promise.all(filtered.map((service) => getCatalogService(service.id)));
  }, [filtered]);

  return (
    <>
      <div className="page services-page">
        <div className="page-head">
          <div className="titles">
            <span className="eyebrow-sm">Gestão · Catálogo</span>
            <h2 className="page-title">Serviços</h2>
            <div className="page-sub">
              {stats.active} ativos · {stats.inactive} inativos · preços por porte de veículo
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <PageRefreshButton onClick={handleRefresh} loading={refreshing || loading} />
            <ExportMenu
              filenameBase="servicos"
              sheetName="Serviços"
              columns={SERVICES_EXPORT_COLUMNS}
              rows={filtered}
              prepareRows={prepareExportRows}
              disabled={loading}
            />
            {!readOnly ? (
              <Button icon={Icon.Plus} onClick={() => setShowCreate(true)}>Novo serviço</Button>
            ) : null}
          </div>
        </div>

        <div className="dash-grid" style={{ marginBottom: 22 }}>
          <div className="col-4">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>
                Serviços ativos
              </span>
              <div className="stat">
                <div className="num" style={{ color: "var(--gold)" }}>{stats.active}</div>
                <div className="delta">Disponíveis em novos orçamentos</div>
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>
                Inativos
              </span>
              <div className="stat">
                <div className="num" style={{ color: stats.inactive ? "var(--fg-4)" : "var(--gold)" }}>{stats.inactive}</div>
                <div className="delta">Ocultos do catálogo público</div>
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="kpi tall">
              <span className="label" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-5)" }}>
                Duração média
              </span>
              <div className="stat">
                <div className="num" style={{ fontSize: 28 }}>{formatDuration(stats.avgDuration)}</div>
                <div className="delta">{stats.total} serviços no catálogo</div>
              </div>
            </div>
          </div>
        </div>

        <div className="entity-toolbar">
          <div className="searchbar" style={{ width: 280, background: "var(--bg)", border: "1px solid var(--border)" }}>
            <Icon.Search size={14} />
            <input
              placeholder="Buscar por nome ou código…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-tabs">
            {[
              { key: "Todos", count: services.length },
              { key: "Ativos", count: stats.active },
              { key: "Inativos", count: stats.inactive },
            ].map(({ key, count }) => (
              <button
                key={key}
                type="button"
                className={statusFilter === key ? "active" : ""}
                onClick={() => setStatusFilter(key)}
              >
                {key} ({count})
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
        </div>

        {loading ? (
          <div className="services-empty-state">
            <Icon.RefreshCw size={24} className="services-empty-icon spin" />
            <p>Carregando catálogo…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="services-empty-state">
            <Icon.Sparkles size={28} className="services-empty-icon" />
            <p>{search || statusFilter !== "Todos" ? "Nenhum serviço encontrado." : "Nenhum serviço no catálogo."}</p>
            {!readOnly && !search && statusFilter === "Todos" ? (
              <Button icon={Icon.Plus} onClick={() => setShowCreate(true)}>Criar primeiro serviço</Button>
            ) : null}
          </div>
        ) : (
          <div className="services-grid">
            {filtered.map((service) => {
              const expanded = expandedId === service.id;
              return (
                <article
                  key={service.id}
                  className={`service-card${service.active ? "" : " inactive"}${expanded ? " expanded" : ""}`}
                >
                  <div className="service-card-head">
                    <div className="service-card-icon">
                      <Icon.Sparkles size={18} />
                    </div>
                    <div className="service-card-titles">
                      <div className="service-card-name">{service.name}</div>
                      <div className="service-card-meta">
                        <span className="service-code-tag mono">{service.code}</span>
                        {service.serviceCategory ? (
                          <span className={`service-cat-badge ${serviceCategoryBadgeClass(service.serviceCategory)}`}>
                            {serviceCategoryLabel(service.serviceCategory)}
                          </span>
                        ) : null}
                        <span className="service-duration">
                          <Icon.Clock size={11} />
                          {formatDuration(service.durationMinutes)}
                        </span>
                      </div>
                    </div>
                    {service.active ? (
                      <StatusBadge tone="success">Ativo</StatusBadge>
                    ) : (
                      <StatusBadge tone="muted">Inativo</StatusBadge>
                    )}
                  </div>

                  {service.description ? (
                    <p className="service-card-desc">{service.description}</p>
                  ) : null}

                  <ServicePriceGrid service={service} />

                  {expanded ? (
                    <ServicePriceHistory
                      history={detail?.id === service.id ? detail.priceHistory : []}
                      loading={historyLoading && expandedId === service.id}
                    />
                  ) : null}

                  <ServiceCardActions
                    service={service}
                    readOnly={readOnly}
                    expanded={expanded}
                    onToggleHistory={toggleExpanded}
                    onEdit={openEdit}
                    onPrices={openPrices}
                    onDeactivate={handleDeactivate}
                  />
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Novo serviço"
        sub="Defina metadados e a primeira versão de preços."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button icon={Icon.Check} loading={saving} onClick={submitCreate}>Criar</Button>
          </>
        }
      >
        <div className="col" style={{ gap: 16 }}>
          <div className="modal-section">
            <div className="modal-section-title">Identificação</div>
            <div className="col" style={{ gap: 12 }}>
              <Field label="Código (slug)">
                <Input value={createForm.code} onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))} placeholder="vitri" />
              </Field>
              <Field label="Nome">
                <Input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} />
              </Field>
              <Field label="Descrição">
                <Textarea value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} />
              </Field>
              <Field label="Duração (minutos)">
                <Input type="number" value={createForm.durationMinutes} onChange={(e) => setCreateForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
              </Field>
              <Field label="Tipo de serviço" hint="Categoria usada para cores na lista de técnicos">
                <Select value={createForm.serviceCategory} onChange={(e) => setCreateForm((f) => ({ ...f, serviceCategory: e.target.value }))}>
                  <option value="EXTERIOR">Externo</option>
                  <option value="INTERIOR">Interno</option>
                  <option value="COMPLETE">Completo</option>
                  <option value="MOTO">Moto</option>
                </Select>
              </Field>
            </div>
          </div>
          <div className="modal-section">
            <div className="modal-section-title">Preços iniciais (EUR)</div>
            <div className="grid-3">
              <Field label="Pequeno"><Input type="number" value={createForm.priceSmall} onChange={(e) => setCreateForm((f) => ({ ...f, priceSmall: e.target.value }))} /></Field>
              <Field label="Médio"><Input type="number" value={createForm.priceMedium} onChange={(e) => setCreateForm((f) => ({ ...f, priceMedium: e.target.value }))} /></Field>
              <Field label="Grande"><Input type="number" value={createForm.priceLarge} onChange={(e) => setCreateForm((f) => ({ ...f, priceLarge: e.target.value }))} /></Field>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Editar serviço"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button icon={Icon.Check} loading={saving} onClick={submitEdit}>Salvar</Button>
          </>
        }
      >
        <div className="col" style={{ gap: 12 }}>
          <Field label="Nome"><Input value={editForm.name || ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Descrição"><Textarea value={editForm.description || ""} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Duração (min)"><Input type="number" value={editForm.durationMinutes || ""} onChange={(e) => setEditForm((f) => ({ ...f, durationMinutes: e.target.value }))} /></Field>
            <Field label="Estado">
              <Select value={editForm.active ? "active" : "inactive"} onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.value === "active" }))}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </Select>
            </Field>
          </div>
          <Field label="Tipo de serviço">
            <Select value={editForm.serviceCategory || "EXTERIOR"} onChange={(e) => setEditForm((f) => ({ ...f, serviceCategory: e.target.value }))}>
              <option value="EXTERIOR">Externo</option>
              <option value="INTERIOR">Interno</option>
              <option value="COMPLETE">Completo</option>
              <option value="MOTO">Moto</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={showPrices}
        onClose={() => setShowPrices(false)}
        title={`Atualizar preços — ${editForm.name || ""}`}
        sub="Não afeta orçamentos já criados."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowPrices(false)}>Cancelar</Button>
            <Button icon={Icon.Check} loading={saving} onClick={submitPrices}>Publicar preços</Button>
          </>
        }
      >
        <div className="service-price-modal-preview">
          <ServicePriceGrid service={{
            priceSmall: Number(priceForm.priceSmall) || 0,
            priceMedium: Number(priceForm.priceMedium) || 0,
            priceLarge: Number(priceForm.priceLarge) || 0,
          }} />
        </div>
        <div className="grid-3" style={{ marginTop: 16 }}>
          <Field label="Pequeno"><Input type="number" value={priceForm.priceSmall} onChange={(e) => setPriceForm((f) => ({ ...f, priceSmall: e.target.value }))} /></Field>
          <Field label="Médio"><Input type="number" value={priceForm.priceMedium} onChange={(e) => setPriceForm((f) => ({ ...f, priceMedium: e.target.value }))} /></Field>
          <Field label="Grande"><Input type="number" value={priceForm.priceLarge} onChange={(e) => setPriceForm((f) => ({ ...f, priceLarge: e.target.value }))} /></Field>
        </div>
      </Modal>

      {ConfirmEl}
    </>
  );
}
