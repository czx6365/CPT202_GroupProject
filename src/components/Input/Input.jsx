import React from "react";
import "./Input.css";

function Input({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  name,
}) {
  return (
    <div className="input-group">
      {label && (
        <label className="input-group__label" htmlFor={id}>
          {label}
        </label>
      )}

      <input
        id={id}
        name={name}
        type={type}
        className="input-group__field"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}

export default Input;
