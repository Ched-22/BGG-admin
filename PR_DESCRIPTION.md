## Summary

- Redesign BGG-Admin PDF layout (quote + inspection) with branded header band, cards, service table with unit prices, totals box, two-column client/vehicle sections, and paginated footer
- Centralize visual tokens in `pdfTheme.js`; extend `PdfLayout` with `addBrandHeader`, `addCard`, `addTable`, `addTotalsBox`, `addTwoColumnSection`
- Inspection checklist uses Unicode status prefixes (`✓` / `⚠` / `—`); page labels localized via `formatPdfPageLabel`

## Test plan

- [ ] Open quote detail → **Baixar PDF** → verify gold header, logo, summary card, services table with prices, totals box, client/vehicle columns, page numbers
- [ ] Quote with service snapshots vs. quote without (bullet list fallback)
- [ ] Quote with notes (multi-page break)
- [ ] Generate PDF for ES and EN client language
- [ ] Task with inspection report → **Baixar PDF do relatório** → verify summary card, checklist table with Unicode status, photo borders
- [ ] Confirm `internalNote` not present in quote PDF
- [ ] `npm run build` passes
