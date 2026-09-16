import api from './api';
import { formatPhoneDisplay } from './phoneUtils';
import {
  blobToDataUrl,
  buildPdfFilename,
  createPdfDocument,
  downloadPdfDocument,
  imageFormatFromDataUrl,
  loadImageAsDataUrl,
  PdfLayout,
} from './downloadPdf';
import { CONTENT_WIDTH } from './pdfTheme.js';
import {
  formatGeneratedAtForLanguage,
  formatPdfPageLabel,
  getInspectionPdfSlug,
  getInspectionPdfStrings,
  getLocaleForLanguage,
  resolveClientPreferredLanguage,
} from './clientLanguage';
import { localizeServiceNamesString, resolveLocalizedServices } from './customerServiceLabels';

const LOGO_URL = `${import.meta.env.BASE_URL}assets/bgg-logo.png`;
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

const INSPECTION_ITEM_LABELS_ES = {
  lataria: 'Carrocería (abolladuras, arañazos)',
  vidros: 'Cristales (grietas, funcionamiento)',
  farois: 'Faros y pilotos',
  pneus: 'Neumáticos (presión, banda de rodadura)',
  estepe: 'Rueda de repuesto y herramientas',
  oleo: 'Nivel de aceite',
  arref: 'Nivel de líquido refrigerante',
  freio_fl: 'Nivel de líquido de frenos',
  freios: 'Funcionamiento de los frenos',
  setas: 'Intermitentes / luces de emergencia',
  palhetas: 'Escobillas del limpiaparabrisas',
  cinto: 'Cinturón de seguridad',
  bancos: 'Asientos (roturas, suciedad)',
  bateria: 'Batería (bornes, fecha)',
  ac: 'Aire acondicionado',
  doc: 'Documentación a bordo',
};

function itemLabel(itemKey) {
  return INSPECTION_ITEM_LABELS_ES[itemKey] || itemKey;
}

function statusUnicodePrefix(status) {
  if (status === 'ok') return '✓';
  if (status === 'warn') return '⚠';
  if (status === 'na') return '—';
  return '—';
}

function statusLabel(status, strings) {
  if (status === 'ok') return strings.statusOk;
  if (status === 'warn') return strings.statusWarn;
  if (status === 'na') return strings.statusNa;
  return '—';
}

function statusLabelWithIcon(status, strings) {
  return `${statusUnicodePrefix(status)} ${statusLabel(status, strings)}`;
}

function reportStatusLabel(status, strings) {
  if (status === 'DRAFT') return strings.reportDraft;
  if (status === 'PENDING_REVIEW') return strings.reportPendingReview;
  if (status === 'SENT_TO_CLIENT') return strings.reportSentToClient;
  return status || '—';
}

function formatInspectionDate(iso, language) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(getLocaleForLanguage(language), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function clientPhone(detail) {
  const contact = detail?.clientContact;
  if (!contact?.phoneCountryCode || !contact?.phoneNationalNumber) return '—';
  return formatPhoneDisplay(contact.phoneCountryCode, contact.phoneNationalNumber);
}

function mediaApiPath(url) {
  const marker = '/api/media/files/';
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + 4);
}

async function loadPhotoDataUrl(url) {
  if (!url) return null;
  try {
    const apiPath = mediaApiPath(url);
    let dataUrl;
    if (apiPath) {
      const { data } = await api.get(apiPath, { responseType: 'blob' });
      dataUrl = await blobToDataUrl(data);
    } else if (url.startsWith(API_BASE)) {
      const { data } = await api.get(url.replace(API_BASE, ''), { responseType: 'blob' });
      dataUrl = await blobToDataUrl(data);
    } else {
      dataUrl = await loadImageAsDataUrl(url);
    }
    return {
      dataUrl,
      format: imageFormatFromDataUrl(dataUrl),
    };
  } catch {
    return null;
  }
}

async function loadPhotoDataUrls(urls = []) {
  const unique = [...new Set(urls.filter(Boolean))];
  const loaded = await Promise.all(unique.map((url) => loadPhotoDataUrl(url)));
  return loaded.filter(Boolean);
}

async function renderPhase(layout, title, phase, strings) {
  layout.addSectionTitle(title);

  if (phase?.notes) {
    layout.addCard({
      rows: [{ label: strings.generalNotes, value: phase.notes }],
    });
  }

  const generalUrls = phase?.generalPhotoUrls || [];
  if (generalUrls.length > 0) {
    const photos = await loadPhotoDataUrls(generalUrls);
    if (photos.length > 0) {
      await layout.addFullSizePhotos(photos, { caption: strings.generalPhotos });
    }
  }

  const items = phase?.items || [];
  if (!items.length && !generalUrls.length) {
    layout.addParagraph(strings.noItems);
    return;
  }

  if (items.length) {
    layout.addTable({
      headers: [strings.checklistItem, strings.checklistStatus],
      rows: items.map((item) => {
        const label = itemLabel(item.itemKey);
        const parts = [statusLabelWithIcon(item.status, strings)];
        if (item.note) parts.push(item.note);
        return [label, parts.join(' · ')];
      }),
      columnWidths: [CONTENT_WIDTH * 0.62, CONTENT_WIDTH * 0.38],
    });
  }

  for (const item of items) {
    const photoUrls = item.photoUrls || [];
    if (photoUrls.length > 0) {
      const photos = await loadPhotoDataUrls(photoUrls);
      if (photos.length > 0) {
        await layout.addFullSizePhotos(photos, {
          caption: `${strings.photos} — ${itemLabel(item.itemKey)}`,
        });
      }
    }
  }
}

export async function buildInspectionReportPdf(detail, task = {}, options = {}) {
  if (!detail?.id) throw new Error('Informe no válido');

  const preferredLanguage = options.preferredLanguage ?? resolveClientPreferredLanguage({
    client: detail.clientContact,
    task,
  });
  const strings = getInspectionPdfStrings(preferredLanguage);

  let logoDataUrl = null;
  try {
    logoDataUrl = await loadImageAsDataUrl(LOGO_URL);
  } catch {
    logoDataUrl = null;
  }

  const vehicle = detail.vehicle || {};
  const reportStatus = reportStatusLabel(detail.reportStatus, strings);
  const taskId = task.id || detail.taskDisplayId || '—';

  const doc = createPdfDocument({
    title: `${strings.docTitle} ${taskId}`,
    subject: vehicle.plate || task.projeto || '',
  });
  const layout = new PdfLayout(doc);

  layout.addBrandHeader({
    logoDataUrl,
    docTitle: strings.docSubtitle,
    brandName: 'Black Green Garage',
    metaLines: [
      taskId !== '—' ? `${strings.task}: ${taskId}` : null,
      `${strings.reportStatus}: ${reportStatus}`,
      detail.submittedForReviewAt
        ? `${strings.submittedForReview}: ${formatInspectionDate(detail.submittedForReviewAt, preferredLanguage)}`
        : null,
    ].filter(Boolean),
  });

  layout.addSectionTitle(strings.summary);
  layout.addCard({
    rows: [
      { label: strings.task, value: taskId },
      { label: strings.project, value: task.projeto || '—' },
      {
        label: strings.service,
        value: resolveLocalizedServices(task, preferredLanguage)
          || localizeServiceNamesString(task.servico, preferredLanguage)
          || '—',
      },
      { label: strings.technician, value: task.tecnico || '—' },
      { label: strings.plate, value: vehicle.plate || '—' },
      {
        label: strings.brandModel,
        value: `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || '—',
      },
      { label: strings.itemsEntry, value: String(detail.entryItemCount ?? 0) },
      { label: strings.totalPhotos, value: String(detail.totalPhotoCount ?? 0) },
      { label: strings.diffCount, value: String(detail.diffCount ?? 0) },
    ],
  });

  layout.addTwoColumnSection({
    leftTitle: strings.client,
    leftRows: [
      { label: strings.name, value: detail.clientContact?.name || task.cliente || '—' },
      { label: strings.phone, value: clientPhone(detail) },
      { label: strings.email, value: task.clienteEmail || '—' },
    ],
    rightTitle: strings.vehicle,
    rightRows: [
      { label: strings.plate, value: vehicle.plate || '—' },
      {
        label: strings.brandModel,
        value: `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || '—',
      },
      {
        label: strings.entryFinalized,
        value: formatInspectionDate(detail.entryFinalizedAt, preferredLanguage),
      },
      {
        label: strings.exitFinalized,
        value: formatInspectionDate(detail.exitFinalizedAt, preferredLanguage),
      },
    ],
  });

  const diffKeys = detail.diffItemKeys || [];
  if (diffKeys.length > 0) {
    layout.addSectionTitle(strings.detectedDiffs);
    layout.addBulletList(
      diffKeys.map((key) => `⚠ ${itemLabel(key)} — ${strings.diffChanged}`),
    );
  }

  await renderPhase(layout, strings.entryChecklist, detail.entry, strings);
  await renderPhase(layout, strings.exitChecklist, detail.exit, strings);

  if (task.tecnicoNotas) {
    layout.addSectionTitle(strings.technicianNotes);
    layout.addCard({
      rows: [{ label: strings.technicianNotes, value: task.tecnicoNotas }],
    });
  }

  layout.addFooter({
    left: `${strings.footerStatus}: ${reportStatus}`,
    right: `${strings.footerGenerated} ${formatGeneratedAtForLanguage(new Date(), preferredLanguage)}`,
    pageLabelFor: (page, total) => formatPdfPageLabel(preferredLanguage, page, total),
  });

  return doc;
}

export async function exportInspectionReportPdf(detail, task = {}, options = {}) {
  const preferredLanguage = options.preferredLanguage ?? resolveClientPreferredLanguage({
    client: detail.clientContact,
    task,
  });
  const doc = await buildInspectionReportPdf(detail, task, { preferredLanguage });
  const id = task.id || detail.taskDisplayId || detail.id;
  const filename = buildPdfFilename({
    slug: getInspectionPdfSlug(preferredLanguage),
    id,
  });
  await downloadPdfDocument(doc, filename);
  return filename;
}
