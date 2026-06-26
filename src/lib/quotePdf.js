import { formatPlateDisplay } from './plateUtils';
import {
  buildPdfFilename,
  createPdfDocument,
  downloadPdfDocument,
  loadImageAsDataUrl,
  PdfLayout,
} from './downloadPdf';
import { CONTENT_WIDTH } from './pdfTheme.js';
import { formatEUR } from './currency.js';
import {
  formatGeneratedAtForLanguage,
  formatPdfPageLabel,
  getQuotePdfSlug,
  getQuotePdfStrings,
  getQuoteStatusLabel,
  resolveClientPreferredLanguage,
} from './clientLanguage';
import { getVehicleSizeLabel, resolveLocalizedServices } from './customerServiceLabels';
import { quoteSubtotalFromDetail } from './quoteApi';

const LOGO_URL = `${import.meta.env.BASE_URL}assets/bgg-logo.png`;

function serviceLabels(detail, language) {
  const list = resolveLocalizedServices(detail, language);
  if (!list) return [];
  return list.split(', ').filter(Boolean);
}

function quoteDiscount(detail) {
  return Number(detail.discount) || 0;
}

function quoteSubtotal(detail) {
  return quoteSubtotalFromDetail(detail);
}

function serviceSnapshotRows(detail) {
  const snapshots = detail._raw?.serviceSnapshots;
  if (!Array.isArray(snapshots) || !snapshots.length) return null;
  return snapshots.map((row) => ({
    name: row.name || row.code || '—',
    unitPrice: Number(row.unitPrice) || 0,
  }));
}

export async function buildQuotePdf(detail, options = {}) {
  if (!detail?.id) throw new Error('Presupuesto no válido');

  const preferredLanguage = options.preferredLanguage
    ?? resolveClientPreferredLanguage({ quote: detail });
  const strings = getQuotePdfStrings(preferredLanguage);

  let logoDataUrl = null;
  try {
    logoDataUrl = await loadImageAsDataUrl(LOGO_URL);
  } catch {
    logoDataUrl = null;
  }

  const doc = createPdfDocument({
    title: `${strings.docTitle} ${detail.id}`,
    subject: detail.projeto || '',
  });
  const layout = new PdfLayout(doc);
  const discount = quoteDiscount(detail);
  const hasDiscount = discount > 0;
  const subtotal = quoteSubtotal(detail);
  const services = serviceLabels(detail, preferredLanguage);
  const snapshots = serviceSnapshotRows(detail);
  const statusLabel = getQuoteStatusLabel(detail, preferredLanguage);

  layout.addBrandHeader({
    logoDataUrl,
    docTitle: strings.docTitle,
    brandName: 'Black Gold Garage',
    metaLines: [
      `ID: ${detail.id}`,
      `${strings.status}: ${statusLabel}`,
    ],
  });

  layout.addSectionTitle(strings.summary);
  layout.addCard({
    rows: [
      { label: strings.status, value: statusLabel },
      { label: strings.validity, value: detail.validade || '—' },
      { label: strings.project, value: detail.projeto || '—' },
    ],
  });

  layout.addSectionTitle(strings.services);
  if (snapshots?.length) {
    layout.addTable({
      headers: [strings.services, strings.unitPrice],
      rows: snapshots.map((row) => [row.name, formatEUR(row.unitPrice)]),
      columnWidths: [CONTENT_WIDTH * 0.68, CONTENT_WIDTH * 0.32],
      alignRight: [1],
    });
  } else if (services.length) {
    layout.addBulletList(services);
  }

  layout.addSectionTitle(strings.amounts);
  layout.addTotalsBox({
    rows: [
      { label: strings.subtotal, value: formatEUR(subtotal) },
      {
        label: strings.discount,
        value: hasDiscount ? `−${formatEUR(discount)}` : strings.noDiscount,
      },
      { label: strings.total, value: formatEUR(detail.valor) },
    ],
    highlightLabel: strings.total,
  });

  layout.addTwoColumnSection({
    leftTitle: strings.client,
    leftRows: [
      { label: strings.name, value: detail.cliente },
      { label: strings.phone, value: detail.clientPhone || '—' },
      { label: strings.email, value: detail.clientEmail || '—' },
      { label: strings.createdAt, value: detail.dataCriacao || '—' },
    ],
    rightTitle: strings.vehicle,
    rightRows: [
      {
        label: strings.plate,
        value: formatPlateDisplay(detail.plateRaw || detail.plate, detail.plateCountry) || '—',
      },
      {
        label: strings.brandModel,
        value: `${detail.brand || ''} ${detail.model || ''}`.trim() || '—',
      },
      { label: strings.yearColor, value: `${detail.year || '—'} · ${detail.color || '—'}` },
      { label: strings.km, value: detail.km ? `${detail.km} km` : '—' },
      {
        label: strings.size,
        value: getVehicleSizeLabel(detail.vehicleSize, preferredLanguage)
          || detail.vehicleSize
          || '—',
      },
    ],
  });

  if (detail.notes) {
    layout.addSectionTitle(strings.notes);
    layout.addCard({
      rows: [{ label: strings.notes, value: detail.notes }],
    });
  }

  layout.addFooter({
    left: `${strings.footerStatus}: ${statusLabel}`,
    right: `${strings.footerGenerated} ${formatGeneratedAtForLanguage(new Date(), preferredLanguage)}`,
    pageLabelFor: (page, total) => formatPdfPageLabel(preferredLanguage, page, total),
  });

  return doc;
}

export async function exportQuotePdf(detail, options = {}) {
  const preferredLanguage = options.preferredLanguage
    ?? resolveClientPreferredLanguage({ quote: detail });
  const doc = await buildQuotePdf(detail, { preferredLanguage });
  const filename = buildPdfFilename({
    slug: getQuotePdfSlug(preferredLanguage),
    id: detail.id,
  });
  await downloadPdfDocument(doc, filename);
  return filename;
}
