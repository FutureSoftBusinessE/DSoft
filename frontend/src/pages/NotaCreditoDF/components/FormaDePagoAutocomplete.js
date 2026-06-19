import { useState, useEffect } from "react"
import TextField from "@mui/material/TextField"
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import { CircularProgress } from "@mui/material"

function FormaDePagoAutocomplete({ cabeceraProforma, setCabeceraProforma }) {
  const [clienteSelected, setClienteSelected] = useState("")
  const [options, setOptions] = useState([])
  const [value, setValue] = useState("") // Establecer el valor inicial
  const [inputValue, setInputValue] = useState(
    (cabeceraProforma.factippag ?? "") + "-" + (cabeceraProforma.fordescri ?? "") || "",
  )
  const [isLoading, setIsLoading] = useState(true) // Nuevo estado para controlar la carga

  const filterOptions = createFilterOptions({
    limit: 10,
    matchFrom: "any",
  })
  useEffect(() => {
    setInputValue((cabeceraProforma.factippag ?? "") + "-" + (cabeceraProforma.fordescri ?? "") || "") // Establecer el valor inicial
  }, []) // Añadir cabeceraProforma.vennombre a las dependencias

  useEffect(() => {
    setValue()
    const getFormaDePago = async () => {
      try {
        setIsLoading(true)
        const response = await fetchwrapper(`/FacturaDesdeArticulos/getFormaPago`)
        const data = await response.json()

        setOptions(data)
      } catch (err) {
        console.error("error", err)
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    getFormaDePago()
  }, [])

  const calculateFechaVencimiento = (fechaEmision, dias) => {
    const date = new Date(fechaEmision)
    console.log(date.toUTCString())
    console.log("fecha1")
    date.setDate(date.getDate() + parseInt(dias)) // Sumar los días de vencimiento
    console.log(date.toUTCString())
    console.log("fecha2")
    return date.toUTCString() // Convertir a formato "Sun, 03 Mar 2024 00:00:00 GMT"
  }

  return (
    <div>
      <Autocomplete
        fullWidth
        value={value}
        onChange={(event, newValue) => {
          if (newValue) {
            setValue(newValue)
            console.log(newValue)
            console.log(newValue.factippag)

            console.log("cabeceradesdeformapago")

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
            setValue("")
          }
        }}
        inputValue={inputValue}
        getOptionLabel={(option) => option.factippag + "-" + option.fordescri || ""}
        onInputChange={(event, newInputValue) => {
          if (event) {
            console.log(event.target)
            setInputValue(newInputValue)
          }
        }}
        id="controllable-states-demo"
        options={options}
        loading={isLoading} // Utilizar el estado de carga para bloquear el componente
        renderInput={(params) => (
          <TextField
            required
            {...params}
            key={options.factippag}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading && <CircularProgress color="inherit" size={20} />} {/* Mostrar animación de carga */}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        filterOptions={filterOptions}
      />
    </div>
  )
}

export default FormaDePagoAutocomplete
