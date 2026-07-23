import PDFDocument from './pdfkitClient.js';
import {
  COLORS,
  CONTENT_WIDTH,
  FONT,
  HEADER_BAND_HEIGHT,
  LABEL_WIDTH,
  MINI_HEADER_HEIGHT,
  PAGE_HEIGHT,
  PAGE_MARGIN,
  PAGE_WIDTH,
  FOOTER_Y,
  FOOTER_HEIGHT,
  SPACING,
  mm,
} from './pdfTheme.js';

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function buildPdfFilename({ slug, id }) {
  const now = new Date();
  const date = [
    now.getFullYear(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate()),
  ].join('-');
  const safeId = String(id || 'doc').replace(/[^\w-]+/g, '-');
  return `bgg-${slug}-${safeId}-${date}.pdf`;
}

export function createPdfDocument({ title, subject }) {
  return new PDFDocument({
    size: 'A4',
    margin: 0,
    bufferPages: true,
    info: {
      Title: title || 'BGG Document',
      Subject: subject || '',
      Author: 'Black Green Garage',
      Creator: 'BGG Admin',
    },
  });
}

export function downloadPdfDocument(doc, filename) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => {
      chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
    });
    doc.on('end', () => {
      const blob = new Blob(chunks, { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      resolve();
    });
    doc.on('error', reject);
    doc.end();
  });
}

export function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl).match(/^data:[^;]+;base64,(.+)$/);
  if (!match) throw new Error('Invalid data URL');
  const binary = atob(match[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export class PdfLayout {
  constructor(doc) {
    this.doc = doc;
    this.y = PAGE_MARGIN;
    this.pageNumber = 1;
    this.docTitle = '';
    this.hasBrandHeader = false;
  }

  ensureSpace(height) {
    if (this.y + height <= FOOTER_Y - mm(4)) return;
    this.doc.addPage();
    this.pageNumber += 1;
    this.y = PAGE_MARGIN;
    if (this.hasBrandHeader) {
      this.drawMiniHeader();
    }
  }

  drawMiniHeader() {
    this.doc
      .rect(0, 0, PAGE_WIDTH, MINI_HEADER_HEIGHT)
      .fill(COLORS.goldDark);
    this.doc
      .font('Helvetica-Bold')
      .fontSize(FONT.bodySmall)
      .fillColor(COLORS.white)
      .text(this.docTitle || 'Black Green Garage', PAGE_MARGIN, mm(1.5), {
        width: CONTENT_WIDTH,
        lineBreak: false,
      });
    this.y = MINI_HEADER_HEIGHT + mm(4);
  }

  addBrandHeader({ logoDataUrl, docTitle, brandName = 'Black Green Garage', metaLines = [] }) {
    this.docTitle = docTitle || brandName;
    this.hasBrandHeader = true;

    this.doc.rect(0, 0, PAGE_WIDTH, HEADER_BAND_HEIGHT).fill(COLORS.goldDark);

    const logoWidthPt = mm(28);
    const logoHeightPt = mm(8);
    const logoY = (HEADER_BAND_HEIGHT - logoHeightPt) / 2;
    let brandX = PAGE_MARGIN;

    if (logoDataUrl) {
      try {
        this.doc.image(logoDataUrl, PAGE_MARGIN, logoY, {
          width: logoWidthPt,
          height: logoHeightPt,
        });
        brandX = PAGE_MARGIN + logoWidthPt + mm(3);
      } catch {
        // skip unreadable logo
      }
    }

    const brandY = (HEADER_BAND_HEIGHT - FONT.body) / 2;
    this.doc
      .font('Helvetica')
      .fontSize(FONT.body)
      .fillColor(COLORS.white)
      .text(brandName, brandX, brandY, { lineBreak: false });

    const titleY = (HEADER_BAND_HEIGHT - FONT.docTitle) / 2;
    this.doc
      .font('Helvetica-Bold')
      .fontSize(FONT.docTitle)
      .fillColor(COLORS.white)
      .text(docTitle || brandName, PAGE_MARGIN, titleY, {
        width: CONTENT_WIDTH,
        align: 'right',
        lineBreak: false,
      });

    this.y = HEADER_BAND_HEIGHT + mm(5);

    if (metaLines.length) {
      this.doc.font('Helvetica').fontSize(FONT.body).fillColor(COLORS.muted);
      metaLines.forEach((line) => {
        this.doc.text(String(line), PAGE_MARGIN, this.y, { lineBreak: false });
        this.y += mm(4.5);
      });
    }

    this.y += mm(2);
    this.addDivider();
  }

  /** @deprecated use addBrandHeader */
  addHeaderWithLogo(opts) {
    this.addBrandHeader({
      logoDataUrl: opts.logoDataUrl,
      docTitle: opts.subtitle || opts.title,
      brandName: opts.title || 'Black Green Garage',
      metaLines: opts.metaLines || [],
    });
  }

  addDivider() {
    this.doc
      .moveTo(PAGE_MARGIN, this.y)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH, this.y)
      .strokeColor(COLORS.border)
      .lineWidth(0.75)
      .stroke();
    this.y += mm(5);
  }

  addSectionTitle(label) {
    this.ensureSpace(mm(14));
    const barHeight = mm(5);
    this.doc.rect(PAGE_MARGIN, this.y, mm(2), barHeight).fill(COLORS.gold);
    this.doc
      .font('Helvetica-Bold')
      .fontSize(FONT.section)
      .fillColor(COLORS.goldDark)
      .text(String(label).toUpperCase(), PAGE_MARGIN + mm(4), this.y + mm(0.5), {
        lineBreak: false,
      });
    this.y += barHeight + mm(4);
  }

  drawCardBackground(x, y, width, height) {
    this.doc
      .rect(x, y, width, height)
      .fillColor(COLORS.surface)
      .strokeColor(COLORS.border)
      .lineWidth(0.75)
      .fillAndStroke();
  }

  measureKeyValueBlockHeight(rows, width) {
    this.doc.font('Helvetica').fontSize(FONT.body);
    let height = SPACING.cardPadding * 2;
    rows.forEach(({ label, value }) => {
      const valueText = String(value ?? '—');
      const valueHeight = this.doc.heightOfString(valueText, {
        width: width - LABEL_WIDTH - SPACING.cardPadding,
      });
      height += Math.max(mm(5), valueHeight + mm(1));
    });
    return height;
  }

  addCard({ title, rows = [] }) {
    const cardWidth = CONTENT_WIDTH;
    const innerWidth = cardWidth - SPACING.cardPadding * 2;
    const titleHeight = title ? mm(6) : 0;
    const bodyHeight = this.measureKeyValueBlockHeight(rows, innerWidth);
    const cardHeight = SPACING.cardPadding * 2 + titleHeight + bodyHeight;

    this.ensureSpace(cardHeight + SPACING.cardGap);
    const cardY = this.y;
    this.drawCardBackground(PAGE_MARGIN, cardY, cardWidth, cardHeight);

    let innerY = cardY + SPACING.cardPadding;
    if (title) {
      this.doc
        .font('Helvetica-Bold')
        .fontSize(FONT.body)
        .fillColor(COLORS.goldDark)
        .text(String(title), PAGE_MARGIN + SPACING.cardPadding, innerY, {
          width: innerWidth,
          lineBreak: false,
        });
      innerY += titleHeight;
    }

    rows.forEach(({ label, value }, index) => {
      const valueText = String(value ?? '—');
      const rowY = innerY;
      const labelX = PAGE_MARGIN + SPACING.cardPadding;
      const valueX = labelX + LABEL_WIDTH - mm(8);

      this.doc.font('Helvetica').fontSize(FONT.body).fillColor(COLORS.muted);
      this.doc.text(String(label), labelX, rowY, {
        width: LABEL_WIDTH - mm(10),
        lineBreak: false,
      });

      this.doc.fillColor(COLORS.text);
      this.doc.text(valueText, valueX, rowY, {
        width: innerWidth - LABEL_WIDTH + mm(8),
      });
      innerY = Math.max(rowY + mm(5), this.doc.y + mm(0.5));
      if (index < rows.length - 1) {
        this.doc
          .moveTo(labelX, innerY)
          .lineTo(PAGE_MARGIN + cardWidth - SPACING.cardPadding, innerY)
          .strokeColor(COLORS.border)
          .lineWidth(0.25)
          .stroke();
        innerY += mm(2);
      }
    });

    this.y = cardY + cardHeight + SPACING.cardGap;
  }

  addTable({ headers, rows, columnWidths, alignRight = [] }) {
    if (!rows?.length) return;

    const tableWidth = CONTENT_WIDTH;
    const widths = columnWidths || headers.map(() => tableWidth / headers.length);
    const rowHeight = mm(7);
    const headerHeight = mm(8);
    const totalHeight = headerHeight + rows.length * rowHeight + mm(2);

    this.ensureSpace(totalHeight);

    let x = PAGE_MARGIN;
    const tableY = this.y;

    this.doc.rect(PAGE_MARGIN, tableY, tableWidth, headerHeight).fill(COLORS.goldDark);
    headers.forEach((header, index) => {
      this.doc
        .font('Helvetica-Bold')
        .fontSize(FONT.body)
        .fillColor(COLORS.white)
        .text(String(header), x + mm(2), tableY + mm(2), {
          width: widths[index] - mm(4),
          align: alignRight.includes(index) ? 'right' : 'left',
          lineBreak: false,
        });
      x += widths[index];
    });

    let rowY = tableY + headerHeight;
    rows.forEach((row, rowIndex) => {
      const fill = rowIndex % 2 === 0 ? COLORS.white : COLORS.surface;
      this.doc.rect(PAGE_MARGIN, rowY, tableWidth, rowHeight).fill(fill);

      x = PAGE_MARGIN;
      row.forEach((cell, colIndex) => {
        this.doc
          .font('Helvetica')
          .fontSize(FONT.body)
          .fillColor(COLORS.text)
          .text(String(cell ?? '—'), x + mm(2), rowY + mm(2), {
            width: widths[colIndex] - mm(4),
            align: alignRight.includes(colIndex) ? 'right' : 'left',
            lineBreak: false,
          });
        x += widths[colIndex];
      });
      rowY += rowHeight;
    });

    this.doc
      .rect(PAGE_MARGIN, tableY, tableWidth, headerHeight + rows.length * rowHeight)
      .strokeColor(COLORS.border)
      .lineWidth(0.75)
      .stroke();

    this.y = rowY + SPACING.cardGap;
  }

  addTotalsBox({ rows, highlightLabel }) {
    const boxWidth = mm(72);
    const boxX = PAGE_MARGIN + CONTENT_WIDTH - boxWidth;
    const rowHeight = mm(6);
    const highlightExtra = mm(3);
    const totalRows = rows.length;
    const boxHeight = rowHeight * (totalRows - 1) + rowHeight + highlightExtra + SPACING.cardPadding * 2;

    this.ensureSpace(boxHeight + mm(4));

    const boxY = this.y;
    this.drawCardBackground(boxX, boxY, boxWidth, boxHeight);

    let innerY = boxY + SPACING.cardPadding;
    rows.forEach(({ label, value }) => {
      const isHighlight = label === highlightLabel;
      const labelFont = isHighlight ? 'Helvetica-Bold' : 'Helvetica';
      const valueFont = isHighlight ? 'Helvetica-Bold' : 'Helvetica';
      const color = isHighlight ? COLORS.goldDark : COLORS.text;
      const size = isHighlight ? FONT.total : FONT.body;

      if (isHighlight) {
        this.doc
          .moveTo(boxX + mm(2), innerY - mm(1))
          .lineTo(boxX + boxWidth - mm(2), innerY - mm(1))
          .strokeColor(COLORS.gold)
          .lineWidth(0.75)
          .stroke();
      }

      this.doc.font(labelFont).fontSize(size).fillColor(COLORS.muted);
      this.doc.text(String(label), boxX + mm(3), innerY, {
        width: boxWidth * 0.55,
        lineBreak: false,
      });

      this.doc.font(valueFont).fontSize(size).fillColor(color);
      const valueText = String(value ?? '—');
      const valueWidth = this.doc.widthOfString(valueText);
      this.doc.text(valueText, boxX + boxWidth - mm(3) - valueWidth, innerY, {
        lineBreak: false,
      });

      innerY += isHighlight ? rowHeight + highlightExtra : rowHeight;
    });

    this.y = boxY + boxHeight + SPACING.sectionGap;
  }

  addTwoColumnSection({ leftTitle, leftRows, rightTitle, rightRows }) {
    const gap = mm(4);
    const colWidth = (CONTENT_WIDTH - gap) / 2;
    const leftHeight = this.measureKeyValueBlockHeight(leftRows, colWidth);
    const rightHeight = this.measureKeyValueBlockHeight(rightRows, colWidth);
    const titleHeight = mm(6);
    const blockHeight = Math.max(
      SPACING.cardPadding * 2 + titleHeight + leftHeight,
      SPACING.cardPadding * 2 + titleHeight + rightHeight,
    );

    this.ensureSpace(blockHeight + SPACING.cardGap);

    const startY = this.y;
    this.renderColumnCard(PAGE_MARGIN, startY, colWidth, blockHeight, leftTitle, leftRows);
    this.renderColumnCard(PAGE_MARGIN + colWidth + gap, startY, colWidth, blockHeight, rightTitle, rightRows);
    this.y = startY + blockHeight + SPACING.cardGap;
  }

  renderColumnCard(x, y, width, height, title, rows) {
    this.drawCardBackground(x, y, width, height);
    let innerY = y + SPACING.cardPadding;

    if (title) {
      this.doc
        .font('Helvetica-Bold')
        .fontSize(FONT.body)
        .fillColor(COLORS.goldDark)
        .text(String(title), x + SPACING.cardPadding, innerY, {
          width: width - SPACING.cardPadding * 2,
          lineBreak: false,
        });
      innerY += mm(6);
    }

    const labelCol = mm(22);
    rows.forEach(({ label, value }) => {
      const rowY = innerY;
      this.doc.font('Helvetica').fontSize(FONT.bodySmall).fillColor(COLORS.muted);
      this.doc.text(String(label), x + SPACING.cardPadding, rowY, {
        width: labelCol,
        lineBreak: false,
      });
      this.doc.fillColor(COLORS.text);
      this.doc.text(String(value ?? '—'), x + SPACING.cardPadding + labelCol, rowY, {
        width: width - SPACING.cardPadding * 2 - labelCol,
      });
      innerY = Math.max(rowY + mm(4.5), this.doc.y + mm(0.5));
    });
  }

  addKeyValueRows(rows, { zebra = true } = {}) {
    rows.forEach(({ label, value }, index) => {
      const valueText = String(value ?? '—');
      const valueHeight = this.doc.heightOfString(valueText, {
        width: CONTENT_WIDTH - LABEL_WIDTH,
      });
      this.ensureSpace(Math.max(mm(7), valueHeight + mm(2)));

      if (zebra && index % 2 === 0) {
        this.doc
          .rect(PAGE_MARGIN, this.y - mm(1), CONTENT_WIDTH, Math.max(mm(6), valueHeight + mm(2)))
          .fill(COLORS.surface);
      }

      const rowY = this.y;
      this.doc.font('Helvetica-Bold').fontSize(FONT.body).fillColor(COLORS.muted);
      this.doc.text(String(label), PAGE_MARGIN, rowY, {
        width: LABEL_WIDTH - mm(8),
        lineBreak: false,
      });

      this.doc.font('Helvetica').fillColor(COLORS.text);
      this.doc.text(valueText, PAGE_MARGIN + LABEL_WIDTH, rowY, {
        width: CONTENT_WIDTH - LABEL_WIDTH,
      });
      this.y = Math.max(rowY + mm(5), this.doc.y + mm(1));
    });
    this.y += mm(2);
  }

  addParagraph(text) {
    if (!text) return;
    this.ensureSpace(mm(10));
    this.doc.font('Helvetica').fontSize(FONT.body).fillColor(COLORS.text);
    this.doc.text(String(text), PAGE_MARGIN, this.y, { width: CONTENT_WIDTH });
    this.y = this.doc.y + mm(2);
  }

  addBulletList(items) {
    items.forEach((item) => {
      const bulletText = `• ${item}`;
      const blockHeight = this.doc.heightOfString(bulletText, { width: CONTENT_WIDTH });
      this.ensureSpace(blockHeight + mm(2));
      this.doc.font('Helvetica').fontSize(FONT.body).fillColor(COLORS.text);
      this.doc.text(bulletText, PAGE_MARGIN, this.y, { width: CONTENT_WIDTH });
      this.y = this.doc.y + mm(1);
    });
    this.y += mm(2);
  }

  addSubheading(label) {
    this.ensureSpace(mm(8));
    this.doc.font('Helvetica-Bold').fontSize(FONT.body).fillColor(COLORS.text);
    this.doc.text(String(label), PAGE_MARGIN, this.y, { lineBreak: false });
    this.y += mm(5);
  }

  async addFullSizePhotos(photos, { gap = 6, caption } = {}) {
    if (!photos?.length) return;

    const maxWidth = CONTENT_WIDTH;
    const maxPageHeight = FOOTER_Y - PAGE_MARGIN - mm(4);
    const gapPt = mm(gap);

    if (caption) {
      this.addSubheading(caption);
    }

    for (const photo of photos) {
      if (!photo?.dataUrl) continue;

      const dims = await measureImage(photo.dataUrl);
      const widthAtFullContent = maxWidth;
      const heightAtFullContent = widthAtFullContent / dims.aspect;
      const heightAtFullPage = maxPageHeight;
      const widthAtFullPage = heightAtFullPage * dims.aspect;

      let width;
      let height;
      if (widthAtFullPage <= maxWidth) {
        width = widthAtFullPage;
        height = heightAtFullPage;
      } else {
        width = widthAtFullContent;
        height = heightAtFullContent;
      }

      const borderPad = mm(1);
      const available = FOOTER_Y - mm(4) - this.y;
      if (height + gapPt + borderPad * 2 > available) {
        this.doc.addPage();
        this.pageNumber += 1;
        this.y = PAGE_MARGIN;
        if (this.hasBrandHeader) this.drawMiniHeader();
      }

      const x = PAGE_MARGIN + (CONTENT_WIDTH - width) / 2;
      const frameY = this.y;
      try {
        this.doc
          .rect(x - borderPad, frameY - borderPad, width + borderPad * 2, height + borderPad * 2)
          .strokeColor(COLORS.border)
          .lineWidth(0.75)
          .stroke();
        this.doc.image(photo.dataUrl, x, frameY, { width, height });
        this.y = frameY + height + gapPt + borderPad;
      } catch {
        // skip unreadable image
      }
    }

    this.y += mm(2);
  }

  addFooter({ left, right, pageLabelFor }) {
    const leftText = left || '';
    const rightText = right || '';
    const range = this.doc.bufferedPageRange();
    const totalPages = range.count;

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
      const pageNumber = pageIndex + 1;
      this.doc.switchToPage(range.start + pageIndex);

      const footerBarY = FOOTER_Y - mm(2);
      this.doc
        .rect(PAGE_MARGIN, footerBarY, CONTENT_WIDTH, FOOTER_HEIGHT - mm(2))
        .fill(COLORS.surface);

      this.doc
        .moveTo(PAGE_MARGIN, footerBarY)
        .lineTo(PAGE_MARGIN + CONTENT_WIDTH, footerBarY)
        .strokeColor(COLORS.border)
        .lineWidth(0.75)
        .stroke();

      this.doc.font('Helvetica').fontSize(FONT.bodySmall).fillColor(COLORS.muted);

      if (leftText) {
        this.doc.text(leftText, PAGE_MARGIN + mm(2), FOOTER_Y + mm(1), { lineBreak: false });
      }

      const centerLabel = pageLabelFor
        ? pageLabelFor(pageNumber, totalPages)
        : `${pageNumber} / ${totalPages}`;
      const centerWidth = this.doc.widthOfString(centerLabel);
      this.doc.text(
        centerLabel,
        PAGE_MARGIN + (CONTENT_WIDTH - centerWidth) / 2,
        FOOTER_Y + mm(1),
        { lineBreak: false },
      );

      if (rightText) {
        const rightWidth = this.doc.widthOfString(rightText);
        this.doc.text(
          rightText,
          PAGE_MARGIN + CONTENT_WIDTH - rightWidth - mm(2),
          FOOTER_Y + mm(1),
          { lineBreak: false },
        );
      }
    }
  }
}

export async function loadImageAsDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load image: ${url}`);
  const blob = await response.blob();
  return blobToDataUrl(blob);
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function imageFormatFromDataUrl(dataUrl) {
  if (String(dataUrl).startsWith('data:image/png')) return 'PNG';
  return 'JPEG';
}

function measureImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 1;
      const height = img.naturalHeight || 1;
      resolve({ aspect: width / height });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
