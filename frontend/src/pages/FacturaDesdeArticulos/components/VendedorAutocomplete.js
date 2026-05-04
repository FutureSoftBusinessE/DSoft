import { useState, useEffect } from "react"
import TextField from "@mui/material/TextField"
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete"
import fetchwrapper from "../../../services/interceptors/fetchwrapper"
import { CircularProgress } from "@mui/material"

function VendedorAutocomplete({ cabeceraProforma, setCabeceraProforma }) {
  const [options, setOptions] = useState([])
  const [value, setValue] = useState(null)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const filterOptions = createFilterOptions({
    limit: 10,
    matchFrom: "any",
  })

  // Cargar vendedor guardado cuando cambia cabeceraProforma
  useEffect(() => {
    if (cabeceraProforma.vendedor?.vencodigo) {
      // Si hay un vendedor guardado, buscarlo en las opciones
      const vendedorGuardado = options.find((opt) => opt.vencodigo === cabeceraProforma.vendedor.vencodigo)
      if (vendedorGuardado) {
        setValue(vendedorGuardado)
        setInputValue(vendedorGuardado.vennombre)
      }
    }
  }, [cabeceraProforma.vendedor, options])

  // Cargar vendedor desde el input inicial
  useEffect(() => {
    if (cabeceraProforma.vendedor?.vennombre) {
      setInputValue(cabeceraProforma.vendedor.vennombre)
    }
  }, [cabeceraProforma.vendedor?.vennombre])

  // Cargar lista de vendedores
  useEffect(() => {
    const getVendedores = async () => {
      try {
        setIsLoading(true)
        const response = await fetchwrapper(`/proformas/getVendedor`)
        const data = await response.json()
        setOptions(data)
      } catch (err) {
        console.error("error", err)
      } finally {
        setIsLoading(false)
      }
    }
    getVendedores()
  }, [])

  const handleChange = (event, newValue) => {
    if (newValue) {
      setValue(newValue)
      // Actualizar cabeceraProforma con el objeto vendedor completo
      setCabeceraProforma((prev) => ({
        ...prev,
        vendedor: {
          vencodigo: newValue.vencodigo,
          vennombre: newValue.vennombre,
          pedidossiac: newValue.pedidossiac,
          pedidosweb: newValue.pedidosweb,
        },
      }))
    } else {
      setValue(null)
      setCabeceraProforma((prev) => ({
        ...prev,
        vendedor: {
          vencodigo: "",
          vennombre: "",
          pedidossiac: "",
          pedidosweb: "",
        },
      }))
    }
  }

  return (
    <Autocomplete
      fullWidth
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      getOptionLabel={(option) => option.vennombre || ""}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue)
      }}
      options={options}
      loading={isLoading}
      filterOptions={filterOptions}
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
    />
  )
}

export default VendedorAutocomplete
