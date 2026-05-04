import React, { useState } from "react"
import { Chips } from "primereact/chips"

export default function CustomChips({ value, setValue, ...params }) {
  return (
    <div className="card p-fluid">
      <Chips value={value} onChange={(e) => setValue(e.value)} {...params} />
    </div>
  )
}
