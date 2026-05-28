import { useState, useEffect } from "react"
import TextField from "@mui/material/TextField"
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import { CircularProgress } from "@mui/material"

function FormaDePagoAutocomplete({ cabeceraProforma, setCabeceraProforma }) {
  const [options, setOptions] = useState([])
  const [value, setValue] = useState(null)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const filterOptions = createFilterOptions({
    limit: 10,
    matchFrom: "any",
  })

  // Actualizar inputValue cuando cambie factippag o fordescri
  useEffect(() => {
    setInputValue((cabeceraProforma.factippag ?? "") + "-" + (cabeceraProforma.fordescri ?? "") || "")
  }, [cabeceraProforma.factippag, cabeceraProforma.fordescri])

  // Cargar opciones
  useEffect(() => {
    const getFormaDePago = async () => {
      try {
        setIsLoading(true)
        const response = await fetchwrapper(`/FacturaDesdeArticulos/getFormaPago`)
        const data = await response.json()
        setOptions(data)
      } catch (err) {
        console.error("error", err)
      } finally {
        setIsLoading(false)
      }
    }
    getFormaDePago()
  }, [])

  // Establecer valor seleccionado cuando las opciones y factippag esten listos
  useEffect(() => {
    if (options.length > 0 && cabeceraProforma.factippag) {
      const selectedOption = options.find((opt) => opt.factippag === cabeceraProforma.factippag)
      if (selectedOption) {
        setValue(selectedOption)
      }
    }
  }, [options, cabeceraProforma.factippag])

  const calculateFechaVencimiento = (fechaEmision, dias) => {
    const date = new Date(fechaEmision)
    date.setDate(date.getDate() + parseInt(dias))
    return date.toUTCString()
  }

  return (
    <div>
      <Autocomplete
        fullWidth
        value={value}
        onChange={(event, newValue) => {
          if (newValue) {
            setValue(newValue)
            setCabeceraProforma((prevState) => ({
              ...prevState,
              factippag: newValue.factippag,
              fordias: parseInt(newValue.fordias),
              forcuotas: newValue.forcuotas,
              fordescri: newValue.fordescri,
              fortipo: newValue.fortipo,
              fordescuento: newValue.fordescuento,
              pedfecven: calculateFechaVencimiento(cabeceraProforma.pedfecemi, newValue.fordias),
            }))
          } else {
            setValue(null)
            setCabeceraProforma((prevState) => ({
              ...prevState,
              factippag: "",
              fordias: 0,
              forcuotas: 0,
              fordescri: "",
              fortipo: "",
              fordescuento: 0,
            }))
          }
        }}
        inputValue={inputValue}
        getOptionLabel={(option) => option.factippag + "-" + option.fordescri || ""}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue)
        }}
        id="controllable-states-demo"
        options={options}
        loading={isLoading}
        renderInput={(params) => (
          <TextField
            required
            {...params}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading && <CircularProgress color="inherit" size={20} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        filterOptions={filterOptions}
        isOptionEqualToValue={(option, value) => option.factippag === value.factippag}
      />
    </div>
  )
}

export default FormaDePagoAutocomplete
