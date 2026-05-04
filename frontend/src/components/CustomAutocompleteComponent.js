import React, { useEffect, useState } from "react"
import { AutoComplete } from "primereact/autocomplete"

export default function CustomAutocompleteComponent({
  id,
  floatLabel,
  field,
  values,
  selectedValue,
  setSelectedValue,
  ...args
}) {
  const [filteredValues, setFilteredValues] = useState(null)
  const search = (event) => {
    let _filteredValues

    if (!event.query.trim().length) {
      _filteredValues = [...values]
    } else {
      _filteredValues = values.filter((value) => {
        return value[field].toLowerCase().startsWith(event.query.toLowerCase())
      })
    }

    setFilteredValues(_filteredValues)
  }

  return (
    <div className="card flex justify-content-center">
      <span className="p-float-label">
        <AutoComplete
          style={{ minWidth: "100%" }}
          locale="es"
          inputId={id}
          field={field} // key of object to display
          value={selectedValue}
          suggestions={filteredValues}
          completeMethod={search}
          onChange={(e) => setSelectedValue(e.value)}
          {...args}
        />
        <label htmlFor={id}>{floatLabel}</label>
      </span>
    </div>
  )
}

// EXAMPLE

// <CustomSelectComponent
//               id="bodegas"
//               floatLabel="Bodegas"
//               field="label"
//               values={fetchedBodegas}
//               selectedValue={selectedBodega}
//               setSelectedValue={setSelectedBodega}
//               placeholder="Bodegas"
//               virtualScrollerOptions={{ itemSize: 40 }}
//               forceSelection
//               dropdown
//             />
