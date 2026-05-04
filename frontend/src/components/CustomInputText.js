import React from "react"
import { InputText } from "primereact/inputtext"

export default function CustomInputText({ value, setValue, ...params }) {
  return (
    <div className="card flex justify-content-center">
      <InputText value={value} onChange={(e) => setValue(e.target.value)} {...params} />
    </div>
  )
}
