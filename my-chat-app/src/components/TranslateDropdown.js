// TranslateDropdown.jsx
import React from "react";
import languages from "../utils/languages"; // fix this path as needed

function TranslateDropdown({ selected, onChange, compact }) {
  return (
    <select value={selected} onChange={(e) => onChange(e.target.value)}>
    {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
        {lang.name}
        </option>
    ))}
    </select>

  );
}

export default TranslateDropdown;
