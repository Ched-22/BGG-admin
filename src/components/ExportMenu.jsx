import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Icon, useToast } from './ui';
import { exportTable } from '../lib/exportTable';

function ExportMenu({
  filenameBase,
  sheetName,
  columns,
  rows = [],
  prepareRows,
  disabled = false,
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleExport = useCallback(async (format) => {
    setOpen(false);
    if (!prepareRows && !rows.length) {
      toast({ kind: 'warn', title: 'Nada para exportar', desc: 'Ajuste os filtros ou aguarde o carregamento dos dados.' });
      return;
    }
    setPreparing(true);
    try {
      const exportRows = prepareRows ? await prepareRows() : rows;
      if (!exportRows.length) {
        toast({ kind: 'warn', title: 'Nada para exportar', desc: 'Ajuste os filtros ou aguarde o carregamento dos dados.' });
        return;
      }
      const filename = await exportTable({
        format,
        sheetName,
        filenameBase,
        columns,
        rows: exportRows,
      });
      const label = format === 'csv' ? 'CSV' : 'Excel';
      toast({ kind: 'success', title: 'Exportado', desc: `${label} salvo como ${filename}` });
    } catch {
      toast({ kind: 'error', title: 'Falha na exportação', desc: 'Não foi possível gerar o arquivo. Tente novamente.' });
    } finally {
      setPreparing(false);
    }
  }, [columns, filenameBase, prepareRows, rows, sheetName, toast]);

  const isDisabled = disabled || preparing || rows.length === 0;

  return (
    <div className="export-menu-wrap" ref={wrapRef}>
      <Button
        variant="secondary"
        icon={Icon.Download}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || preparing}
        loading={preparing}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Exportar
      </Button>
      {open ? (
        <div className="export-menu" role="menu">
          <button
            type="button"
            className="export-menu-item"
            role="menuitem"
            disabled={isDisabled}
            onClick={() => handleExport('csv')}
          >
            <Icon.FileText size={14}/>
            Exportar CSV
          </button>
          <button
            type="button"
            className="export-menu-item"
            role="menuitem"
            disabled={isDisabled}
            onClick={() => handleExport('xlsx')}
          >
            <Icon.FileText size={14}/>
            Exportar Excel
          </button>
        </div>
      ) : null}
    </div>
  );
}

export { ExportMenu };
