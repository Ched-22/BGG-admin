import React, { useMemo } from "react";
import { Select } from "./ui";
import { buildTimeDropdownOptions, normalizeTime24, withTimeOption } from "../lib/scheduling";

function TimeInput24({
  value = "",
  onChange,
  err,
  options,
  placeholder = "Selecione o horário",
  ...rest
}) {
  const slots = useMemo(() => {
    const base = options || buildTimeDropdownOptions();
    return withTimeOption(base, value);
  }, [options, value]);

  return (
    <Select
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      err={err}
      {...rest}
    >
      <option value="">{placeholder}</option>
      {slots.map((slot) => (
        <option key={slot} value={slot}>{slot}</option>
      ))}
    </Select>
  );
}

export { TimeInput24 };
