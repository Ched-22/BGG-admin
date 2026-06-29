import React, { useEffect, useState } from "react";
import { Input } from "./ui";
import { normalizeTime24 } from "../lib/scheduling";

function TimeInput24({ value = "", onChange, err, placeholder = "HH:MM", ...rest }) {
  const [draft, setDraft] = useState(value || "");

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const commit = (raw) => {
    const trimmed = String(raw || "").trim();
    if (!trimmed) {
      onChange?.("");
      setDraft("");
      return;
    }
    const normalized = normalizeTime24(trimmed);
    if (normalized) {
      onChange?.(normalized);
      setDraft(normalized);
      return;
    }
    setDraft(value || "");
  };

  const handleChange = (e) => {
    let next = e.target.value.replace(/[^\d:]/g, "");
    if (next.length === 2 && !next.includes(":") && draft.length < 2) {
      next = `${next}:`;
    }
    if (next.length > 5) next = next.slice(0, 5);
    setDraft(next);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={draft}
      onChange={handleChange}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit(draft);
      }}
      err={err}
      {...rest}
    />
  );
}

export { TimeInput24 };
