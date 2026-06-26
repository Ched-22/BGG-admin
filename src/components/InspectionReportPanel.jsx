import React from "react";
import { INSPECTION_ITEM_LABELS, statusLabel } from "../lib/vehicleInspectionApi";

function formatInspectionDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function PhotoGrid({ urls = [] }) {
  if (!urls.length) return <span className="dim" style={{ fontSize: 12 }}>Sem fotos</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {urls.map((url) => (
        <a key={url} href={url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
          <img
            src={url}
            alt=""
            style={{
              width: 72,
              height: 72,
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid var(--border)",
            }}
          />
        </a>
      ))}
    </div>
  );
}

function PhaseBlock({ title, phase }) {
  const items = phase?.items || [];
  return (
    <div className="card-hairline" style={{ padding: 0, overflow: "hidden", minWidth: 0 }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
        <div className="eyebrow-sm">{title}</div>
      </div>
      <div className="stack" style={{ gap: 12, padding: 12 }}>
        {phase?.notes ? (
          <div>
            <div className="eyebrow-sm">Observações gerais</div>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>{phase.notes}</p>
          </div>
        ) : null}
        {(phase?.generalPhotoUrls || []).length > 0 ? (
          <div>
            <div className="eyebrow-sm">Fotos gerais</div>
            <PhotoGrid urls={phase.generalPhotoUrls} />
          </div>
        ) : null}
        {items.map((item) => (
          <div key={item.itemKey} className="card-hairline" style={{ padding: 10 }}>
            <div className="row-between" style={{ marginBottom: 6 }}>
              <strong style={{ fontSize: 13 }}>{INSPECTION_ITEM_LABELS[item.itemKey] || item.itemKey}</strong>
              <span className="status-badge">{statusLabel(item.status)}</span>
            </div>
            {item.note ? <p style={{ fontSize: 12, margin: "0 0 8px" }}>{item.note}</p> : null}
            <PhotoGrid urls={item.photoUrls} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InspectionReportPanel({ detail, loading }) {
  if (loading) {
    return <p className="dim" style={{ fontSize: 13 }}>A carregar relatório do checklist…</p>;
  }
  if (!detail) return null;

  return (
    <div style={{ marginTop: 4 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        <div className="card-hairline" style={{ padding: 10, textAlign: "center" }}>
          <div style={{ fontSize: 20, color: "var(--gold)" }}>{detail.entryItemCount ?? 0}</div>
          <div className="eyebrow-sm">Itens entrada</div>
        </div>
        <div className="card-hairline" style={{ padding: 10, textAlign: "center" }}>
          <div style={{ fontSize: 20, color: "var(--gold)" }}>{detail.totalPhotoCount ?? 0}</div>
          <div className="eyebrow-sm">Fotos</div>
        </div>
        <div className="card-hairline" style={{ padding: 10, textAlign: "center" }}>
          <div
            style={{
              fontSize: 20,
              color: detail.diffCount ? "var(--warn)" : "var(--gold)",
            }}
          >
            {detail.diffCount ?? 0}
          </div>
          <div className="eyebrow-sm">Diferenças</div>
        </div>
      </div>
      {detail.submittedForReviewAt ? (
        <div className="meta" style={{ marginTop: 10 }}>
          Enviado para revisão em {formatInspectionDate(detail.submittedForReviewAt)}
        </div>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          marginTop: 12,
          alignItems: "start",
        }}
      >
        <PhaseBlock title="Checklist de entrada" phase={detail.entry} />
        <PhaseBlock title="Checklist de saída" phase={detail.exit} />
      </div>
    </div>
  );
}
