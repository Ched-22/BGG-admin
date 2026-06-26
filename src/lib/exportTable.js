const CSV_SEPARATOR = ';';

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function buildExportFilename({ pageSlug, format }) {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate()),
    pad2(now.getHours()),
    pad2(now.getMinutes()),
    pad2(now.getSeconds()),
  ].join('-');
  const ext = format === 'xlsx' ? 'xlsx' : 'csv';
  return `bgg-${pageSlug}-${stamp}.${ext}`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function cellValue(row, column) {
  if (column.getValue) return column.getValue(row);
  const raw = row[column.key];
  if (raw == null || raw === '') return '';
  return raw;
}

function escapeCsvCell(value) {
  const text = String(value ?? '');
  if (/[";\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function exportToCsv({ columns, rows, filename }) {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(CSV_SEPARATOR);
  const body = rows.map((row) => (
    columns.map((col) => escapeCsvCell(cellValue(row, col))).join(CSV_SEPARATOR)
  ));
  const content = `\uFEFF${[header, ...body].join('\r\n')}`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export async function exportToXlsx({ sheetName, columns, rows, filename }) {
  const XLSX = await import('xlsx');
  const header = columns.map((c) => c.label);
  const data = rows.map((row) => columns.map((col) => cellValue(row, col)));
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
}

export async function exportTable({ format, sheetName, filenameBase, columns, rows }) {
  const filename = buildExportFilename({ pageSlug: filenameBase, format });
  if (format === 'csv') {
    exportToCsv({ columns, rows, filename });
    return filename;
  }
  await exportToXlsx({ sheetName, columns, rows, filename });
  return filename;
}
