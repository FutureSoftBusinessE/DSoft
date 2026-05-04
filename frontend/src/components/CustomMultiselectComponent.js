import { MultiSelect } from "primereact/multiselect"
import "primereact/resources/themes/lara-light-indigo/theme.css"
// import 'primeflex/primeflex.css';
import "primereact/resources/primereact.css"

import {
  locale,
  addLocale,
  updateLocaleOption,
  updateLocaleOptions,
  localeOption,
  localeOptions,
  PrimeReactProvider,
} from "primereact/api"

const CustomMultiselectComponent = ({
  options,
  value,
  setValue,
  selectAll,
  setSelectAll,
  virtualScrollerOptions = { itemSize: 43 },
  placeholder = "Selecciona los items",
}) => {
  return (
    <MultiSelect
      locale="es"
      filter
      value={value}
      options={options}
      onChange={(e) => {
        setValue(e.value)
        setSelectAll(e.value.length === options.length)
      }}
      selectAll={selectAll}
      onSelectAll={(e) => {
        setValue(e.checked ? [] : options.map((item) => item.value))
        setSelectAll(!e.checked)
      }}
      virtualScrollerOptions={{ ...virtualScrollerOptions }}
      maxSelectedLabels={1}
      placeholder={placeholder}
      //   className="w-full md:w-20rem"
    />
  )
}

export default CustomMultiselectComponent
