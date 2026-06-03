const STATUS_MAP = {
    DRAFT: 'Pendente',
    PENDING: 'Pronto para envio',
    APPROVED: 'Aprovado',
  }
  
  const STATUS_MAP_REVERSE = {
    'Pendente': 'DRAFT',
    'Pronto para envio': 'PENDING',
    'Aprovado': 'APPROVED',
  }
  
  const SERVICES_LABELS = {
    polim: 'Polimento técnico',
    vitri: 'Vitrificação cerâmica',
    ppf: 'PPF — película de proteção',
    couro: 'Higienização de couro',
    motor: 'Detalhamento de motor',
    ozonio: 'Tratamento de ozônio',
    rodas: 'Restauração de rodas',
    farol: 'Polimento de faróis',
  }
  
  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('pt-BR')
  }
  
  export function mapQuoteFromApi(row) {
    if (!row) return null
  
    // monta label dos serviços
    const services = Array.isArray(row.services) ? row.services : []
    const servico = services
      .map((s) => SERVICES_LABELS[s] || s)
      .join(', ') || '—'
  
    return {
      // campos originais da API (para patch/approve)
      _raw: row,
      id: row.id,
      status: STATUS_MAP[row.status] || row.status,
      statusApi: row.status,
  
      // campos usados pela UI do Admin
      cliente: row.clientName || '—',
      projeto: `${row.brand || ''} ${row.model || ''} · ${row.plate || ''}`.trim() || '—',
      servico,
      valor: Number(row.total) || 0,
      dataCriacao: formatDate(row.createdAt),
      validade: row.submittedAt ? formatDate(new Date(new Date(row.submittedAt).getTime() + 7 * 86400000)) : '—',
      responsavel: '—',
  
      // campos extra para o modal de detalhe
      clientPhone: row.clientPhone || '',
      clientEmail: row.clientEmail || '',
      plate: row.plate || '',
      brand: row.brand || '',
      model: row.model || '',
      year: row.year || '',
      color: row.color || '',
      km: row.km || '',
      vehicleSize: row.vehicleSize || '',
      discount: row.discount || 0,
      notes: row.notes || '',
      internalNote: row.internalNote || '',
      approvedAt: formatDate(row.approvedAt),
      createdAt: formatDate(row.createdAt),
      services,
    }
  }