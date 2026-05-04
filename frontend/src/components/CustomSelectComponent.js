import React, { useState } from "react"
import { Dropdown } from "primereact/dropdown"

export default function CustomSelectComponent({
  id,
  floatLabel,
  optionLabel,
  values,
  selectedValue,
  setSelectedValue,
  ...params
}) {
  return (
    <div className="card flex justify-content-center">
      <span className="p-float-label">
        <Dropdown
          style={{ minWidth: "100%" }}
          locale="es"
          inputId={id}
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.value)}
          options={values}
          optionLabel={optionLabel}
          {...params}
        />
        <label htmlFor={id}>{floatLabel}</label>
      </span>
    </div>
  )
}
