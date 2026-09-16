export const DEFAULT_CLIENT_LANGUAGE = 'es';

export const CLIENT_LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Espanhol' },
  { value: 'ca', label: 'Catalão' },
  { value: 'en', label: 'Inglês' },
  { value: 'ptBr', label: 'Português (Brasil)' },
  { value: 'ptPt', label: 'Português (Portugal)' },
];

const LOCALES = {
  es: 'es-ES',
  ca: 'ca-ES',
  en: 'en-GB',
  ptBr: 'pt-BR',
  ptPt: 'pt-PT',
};

const QUOTE_PDF_SLUGS = {
  es: 'presupuesto',
  ca: 'pressupost',
  en: 'quote',
  ptBr: 'orcamento',
  ptPt: 'orcamento',
};

const INSPECTION_PDF_SLUGS = {
  es: 'informe-inspeccion',
  ca: 'informe-inspeccio',
  en: 'inspection-report',
  ptBr: 'relatorio-inspecao',
  ptPt: 'relatorio-inspecao',
};

const QUOTE_PDF_STRINGS = {
  es: {
    docTitle: 'Presupuesto',
    services: 'Servicios',
    amounts: 'Importes',
    subtotal: 'Subtotal (servicios)',
    discount: 'Descuento',
    noDiscount: 'Sin descuento aplicado',
    total: 'Importe total',
    validity: 'Validez',
    client: 'Cliente',
    name: 'Nombre',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    createdAt: 'Creado el',
    vehicle: 'Vehículo',
    plate: 'Matrícula',
    brandModel: 'Marca / Modelo',
    yearColor: 'Año / Color',
    km: 'Kilometraje',
    size: 'Tamaño',
    notes: 'Descripción adicional',
    footerStatus: 'Estado',
    footerGenerated: 'Generado el',
    project: 'Proyecto',
    status: 'Estado',
    summary: 'Resumen',
    unitPrice: 'Precio unit.',
  },
  ca: {
    docTitle: 'Pressupost',
    services: 'Serveis',
    amounts: 'Imports',
    subtotal: 'Subtotal (serveis)',
    discount: 'Descompte',
    noDiscount: 'Sense descompte aplicat',
    total: 'Import total',
    validity: 'Validesa',
    client: 'Client',
    name: 'Nom',
    phone: 'Telèfon',
    email: 'Correu electrònic',
    createdAt: 'Creat el',
    vehicle: 'Vehicle',
    plate: 'Matrícula',
    brandModel: 'Marca / Model',
    yearColor: 'Any / Color',
    km: 'Quilometratge',
    size: 'Mida',
    notes: 'Descripció addicional',
    footerStatus: 'Estat',
    footerGenerated: 'Generat el',
    project: 'Projecte',
    status: 'Estat',
    summary: 'Resum',
    unitPrice: 'Preu unit.',
  },
  en: {
    docTitle: 'Quote',
    services: 'Services',
    amounts: 'Amounts',
    subtotal: 'Subtotal (services)',
    discount: 'Discount',
    noDiscount: 'No discount applied',
    total: 'Total amount',
    validity: 'Validity',
    client: 'Client',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    createdAt: 'Created on',
    vehicle: 'Vehicle',
    plate: 'Registration',
    brandModel: 'Make / Model',
    yearColor: 'Year / Colour',
    km: 'Mileage',
    size: 'Size',
    notes: 'Additional description',
    footerStatus: 'Status',
    footerGenerated: 'Generated on',
    project: 'Project',
    status: 'Status',
    summary: 'Summary',
    unitPrice: 'Unit price',
  },
  ptBr: {
    docTitle: 'Orçamento',
    services: 'Serviços',
    amounts: 'Valores',
    subtotal: 'Subtotal (serviços)',
    discount: 'Desconto',
    noDiscount: 'Sem desconto aplicado',
    total: 'Valor total',
    validity: 'Validade',
    client: 'Cliente',
    name: 'Nome',
    phone: 'Telefone',
    email: 'E-mail',
    createdAt: 'Criado em',
    vehicle: 'Veículo',
    plate: 'Placa',
    brandModel: 'Marca / Modelo',
    yearColor: 'Ano / Cor',
    km: 'Quilometragem',
    size: 'Porte',
    notes: 'Descrição adicional',
    footerStatus: 'Status',
    footerGenerated: 'Gerado em',
    project: 'Projeto',
    status: 'Status',
    summary: 'Resumo',
    unitPrice: 'Preço unit.',
  },
  ptPt: {
    docTitle: 'Orçamento',
    services: 'Serviços',
    amounts: 'Valores',
    subtotal: 'Subtotal (serviços)',
    discount: 'Desconto',
    noDiscount: 'Sem desconto aplicado',
    total: 'Valor total',
    validity: 'Validade',
    client: 'Cliente',
    name: 'Nome',
    phone: 'Telefone',
    email: 'E-mail',
    createdAt: 'Criado em',
    vehicle: 'Veículo',
    plate: 'Matrícula',
    brandModel: 'Marca / Modelo',
    yearColor: 'Ano / Cor',
    km: 'Quilometragem',
    size: 'Dimensão',
    notes: 'Descrição adicional',
    footerStatus: 'Estado',
    footerGenerated: 'Gerado em',
    project: 'Projeto',
    status: 'Estado',
    summary: 'Resumo',
    unitPrice: 'Preço unit.',
  },
};

const QUOTE_STATUS_LABELS = {
  es: { DRAFT: 'Borrador', PENDING: 'Pendiente', APPROVED: 'Aprobado' },
  ca: { DRAFT: 'Esborrany', PENDING: 'Pendent', APPROVED: 'Aprovat' },
  en: { DRAFT: 'Draft', PENDING: 'Pending', APPROVED: 'Approved' },
  ptBr: { DRAFT: 'Rascunho', PENDING: 'Pendente', APPROVED: 'Aprovado' },
  ptPt: { DRAFT: 'Rascunho', PENDING: 'Pendente', APPROVED: 'Aprovado' },
};

const LEGACY_QUOTE_STATUS_TO_API = {
  Pendente: 'PENDING',
  Aprovado: 'APPROVED',
};

export function getQuoteStatusLabel(quote, language = DEFAULT_CLIENT_LANGUAGE) {
  const lang = normalizeClientLanguage(language);
  const labels = QUOTE_STATUS_LABELS[lang] || QUOTE_STATUS_LABELS.es;
  const apiStatus = quote?.statusApi
    || LEGACY_QUOTE_STATUS_TO_API[quote?.status]
    || (typeof quote?.status === 'string' && quote.status === quote.status.toUpperCase()
      ? quote.status
      : null);
  if (apiStatus && labels[apiStatus]) return labels[apiStatus];
  return quote?.status || '—';
}

export function normalizeClientLanguage(value) {
  const lang = String(value || '').trim();
  return CLIENT_LANGUAGE_OPTIONS.some((o) => o.value === lang) ? lang : DEFAULT_CLIENT_LANGUAGE;
}

export function resolveClientPreferredLanguage({ client, quote, task } = {}) {
  if (client?.preferredLanguage) return normalizeClientLanguage(client.preferredLanguage);
  if (quote?.clientPreferredLanguage) return normalizeClientLanguage(quote.clientPreferredLanguage);
  if (task?.clientePreferredLanguage) return normalizeClientLanguage(task.clientePreferredLanguage);
  return DEFAULT_CLIENT_LANGUAGE;
}

export function getLocaleForLanguage(language) {
  return LOCALES[normalizeClientLanguage(language)] || LOCALES.es;
}

export function getQuotePdfSlug(language) {
  return QUOTE_PDF_SLUGS[normalizeClientLanguage(language)] || QUOTE_PDF_SLUGS.es;
}

export function getInspectionPdfSlug(language) {
  return INSPECTION_PDF_SLUGS[normalizeClientLanguage(language)] || INSPECTION_PDF_SLUGS.es;
}

export function getQuotePdfStrings(language) {
  return QUOTE_PDF_STRINGS[normalizeClientLanguage(language)] || QUOTE_PDF_STRINGS.es;
}

const PDF_PAGE_LABELS = {
  es: (page, total) => `Página ${page} de ${total}`,
  ca: (page, total) => `Pàgina ${page} de ${total}`,
  en: (page, total) => `Page ${page} of ${total}`,
  ptBr: (page, total) => `Página ${page} de ${total}`,
  ptPt: (page, total) => `Página ${page} de ${total}`,
};

export function formatPdfPageLabel(language, page, total) {
  const lang = normalizeClientLanguage(language);
  const formatter = PDF_PAGE_LABELS[lang] || PDF_PAGE_LABELS.es;
  return formatter(page, total);
}

const INSPECTION_PDF_STRINGS = {
  es: {
    docTitle: 'Informe de inspección',
    docSubtitle: 'Informe de inspección del vehículo',
    task: 'Tarea',
    project: 'Proyecto',
    reportStatus: 'Estado del informe',
    submittedForReview: 'Enviado a revisión',
    client: 'Cliente',
    vehicle: 'Vehículo',
    summary: 'Resumen',
    detectedDiffs: 'Diferencias detectadas',
    entryChecklist: 'Checklist de entrada',
    exitChecklist: 'Checklist de salida',
    technicianNotes: 'Notas del técnico',
    name: 'Nombre',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    plate: 'Matrícula',
    brandModel: 'Marca / Modelo',
    service: 'Servicio',
    technician: 'Técnico',
    itemsEntry: 'Ítems en entrada',
    totalPhotos: 'Fotos totales',
    diffCount: 'Diferencias entrada/salida',
    entryFinalized: 'Finalización entrada',
    exitFinalized: 'Finalización salida',
    generalNotes: 'Observaciones generales',
    generalPhotos: 'Fotos generales',
    noItems: 'Sin ítems registrados.',
    photos: 'Fotos',
    diffChanged: 'cambió de OK a Atención',
    footerStatus: 'Estado',
    footerGenerated: 'Generado el',
    reportDraft: 'Borrador',
    reportPendingReview: 'Pendiente de revisión',
    reportSentToClient: 'Enviado al cliente',
    statusOk: 'OK',
    statusWarn: 'Atención',
    statusNa: 'N/A',
    checklistItem: 'Ítem',
    checklistStatus: 'Estado',
  },
  ca: {
    docTitle: 'Informe d\'inspecció',
    docSubtitle: 'Informe d\'inspecció del vehicle',
    task: 'Tasca',
    project: 'Projecte',
    reportStatus: 'Estat de l\'informe',
    submittedForReview: 'Enviat a revisió',
    client: 'Client',
    vehicle: 'Vehicle',
    summary: 'Resum',
    detectedDiffs: 'Diferències detectades',
    entryChecklist: 'Checklist d\'entrada',
    exitChecklist: 'Checklist de sortida',
    technicianNotes: 'Notes del tècnic',
    name: 'Nom',
    phone: 'Telèfon',
    email: 'Correu electrònic',
    plate: 'Matrícula',
    brandModel: 'Marca / Model',
    service: 'Servei',
    technician: 'Tècnic',
    itemsEntry: 'Ítems a l\'entrada',
    totalPhotos: 'Fotos totals',
    diffCount: 'Diferències entrada/sortida',
    entryFinalized: 'Finalització entrada',
    exitFinalized: 'Finalització sortida',
    generalNotes: 'Observacions generals',
    generalPhotos: 'Fotos generals',
    noItems: 'Sense ítems registrats.',
    photos: 'Fotos',
    diffChanged: 'ha canviat d\'OK a Atenció',
    footerStatus: 'Estat',
    footerGenerated: 'Generat el',
    reportDraft: 'Esborrany',
    reportPendingReview: 'Pendent de revisió',
    reportSentToClient: 'Enviat al client',
    statusOk: 'OK',
    statusWarn: 'Atenció',
    statusNa: 'N/A',
    checklistItem: 'Ítem',
    checklistStatus: 'Estat',
  },
  en: {
    docTitle: 'Inspection report',
    docSubtitle: 'Vehicle inspection report',
    task: 'Job',
    project: 'Project',
    reportStatus: 'Report status',
    submittedForReview: 'Submitted for review',
    client: 'Client',
    vehicle: 'Vehicle',
    summary: 'Summary',
    detectedDiffs: 'Detected differences',
    entryChecklist: 'Check-in checklist',
    exitChecklist: 'Check-out checklist',
    technicianNotes: 'Technician notes',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    plate: 'Registration',
    brandModel: 'Make / Model',
    service: 'Service',
    technician: 'Technician',
    itemsEntry: 'Items at check-in',
    totalPhotos: 'Total photos',
    diffCount: 'Check-in/check-out differences',
    entryFinalized: 'Check-in completed',
    exitFinalized: 'Check-out completed',
    generalNotes: 'General notes',
    generalPhotos: 'General photos',
    noItems: 'No items recorded.',
    photos: 'Photos',
    diffChanged: 'changed from OK to Attention',
    footerStatus: 'Status',
    footerGenerated: 'Generated on',
    reportDraft: 'Draft',
    reportPendingReview: 'Pending review',
    reportSentToClient: 'Sent to client',
    statusOk: 'OK',
    statusWarn: 'Attention',
    statusNa: 'N/A',
    checklistItem: 'Item',
    checklistStatus: 'Status',
  },
  ptBr: {
    docTitle: 'Relatório de inspeção',
    docSubtitle: 'Relatório de inspeção do veículo',
    task: 'Tarefa',
    project: 'Projeto',
    reportStatus: 'Status do relatório',
    submittedForReview: 'Enviado para revisão',
    client: 'Cliente',
    vehicle: 'Veículo',
    summary: 'Resumo',
    detectedDiffs: 'Diferenças detectadas',
    entryChecklist: 'Checklist de entrada',
    exitChecklist: 'Checklist de saída',
    technicianNotes: 'Notas do técnico',
    name: 'Nome',
    phone: 'Telefone',
    email: 'E-mail',
    plate: 'Placa',
    brandModel: 'Marca / Modelo',
    service: 'Serviço',
    technician: 'Técnico',
    itemsEntry: 'Itens na entrada',
    totalPhotos: 'Fotos totais',
    diffCount: 'Diferenças entrada/saída',
    entryFinalized: 'Finalização entrada',
    exitFinalized: 'Finalização saída',
    generalNotes: 'Observações gerais',
    generalPhotos: 'Fotos gerais',
    noItems: 'Nenhum item registrado.',
    photos: 'Fotos',
    diffChanged: 'mudou de OK para Atenção',
    footerStatus: 'Status',
    footerGenerated: 'Gerado em',
    reportDraft: 'Rascunho',
    reportPendingReview: 'Pendente de revisão',
    reportSentToClient: 'Enviado ao cliente',
    statusOk: 'OK',
    statusWarn: 'Atenção',
    statusNa: 'N/A',
    checklistItem: 'Item',
    checklistStatus: 'Status',
  },
  ptPt: {
    docTitle: 'Relatório de inspeção',
    docSubtitle: 'Relatório de inspeção do veículo',
    task: 'Tarefa',
    project: 'Projeto',
    reportStatus: 'Estado do relatório',
    submittedForReview: 'Enviado para revisão',
    client: 'Cliente',
    vehicle: 'Veículo',
    summary: 'Resumo',
    detectedDiffs: 'Diferenças detetadas',
    entryChecklist: 'Checklist de entrada',
    exitChecklist: 'Checklist de saída',
    technicianNotes: 'Notas do técnico',
    name: 'Nome',
    phone: 'Telefone',
    email: 'E-mail',
    plate: 'Matrícula',
    brandModel: 'Marca / Modelo',
    service: 'Serviço',
    technician: 'Técnico',
    itemsEntry: 'Itens na entrada',
    totalPhotos: 'Fotos totais',
    diffCount: 'Diferenças entrada/saída',
    entryFinalized: 'Finalização entrada',
    exitFinalized: 'Finalização saída',
    generalNotes: 'Observações gerais',
    generalPhotos: 'Fotos gerais',
    noItems: 'Nenhum item registado.',
    photos: 'Fotos',
    diffChanged: 'mudou de OK para Atenção',
    footerStatus: 'Estado',
    footerGenerated: 'Gerado em',
    reportDraft: 'Rascunho',
    reportPendingReview: 'Pendente de revisão',
    reportSentToClient: 'Enviado ao cliente',
    statusOk: 'OK',
    statusWarn: 'Atenção',
    statusNa: 'N/A',
    checklistItem: 'Item',
    checklistStatus: 'Estado',
  },
};

export function getInspectionPdfStrings(language) {
  return INSPECTION_PDF_STRINGS[normalizeClientLanguage(language)] || INSPECTION_PDF_STRINGS.es;
}

export function formatDateForLanguage(iso, language) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatGeneratedAtForLanguage(date = new Date(), language) {
  return date.toLocaleString(getLocaleForLanguage(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function clientLanguageLabel(value) {
  return CLIENT_LANGUAGE_OPTIONS.find((o) => o.value === normalizeClientLanguage(value))?.label
    || 'Espanhol';
}
