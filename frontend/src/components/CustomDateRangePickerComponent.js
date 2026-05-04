import "rsuite/dist/rsuite.min.css"
import { useState } from "react"

import { DateRangePicker, Stack, CustomProvider } from "rsuite"
import { esES } from "rsuite/esm/locales"

const CustomDateRangePickerComponent = ({
  value,
  setValue,
  placeholder = "Seleccione un rango de fechas",
  size = "md",
}) => {
  return (
    <CustomProvider locale={esES}>
      <DateRangePicker value={value} onChange={setValue} locale={esES} block placeholder={placeholder} size={size} />
    </CustomProvider>
  )
}

export default CustomDateRangePickerComponent
