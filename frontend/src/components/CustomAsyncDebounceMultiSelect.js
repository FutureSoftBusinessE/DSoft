import * as React from "react"
import TextField from "@mui/material/TextField"
import { Box, InputLabel, CircularProgress } from "@mui/material"
import Autocomplete, { autocompleteClasses } from "@mui/material/Autocomplete"
import Popper from "@mui/material/Popper"
import { styled, useTheme } from "@mui/material/styles"
import Typography from "@mui/material/Typography"
import Chip from "@mui/material/Chip"
import { useQuery } from "@tanstack/react-query"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import { useRef, useCallback, useEffect, useState, useMemo } from "react"

const DEFAULT_DEBOUNCE_TIME = 400 // ms
const MIN_DEBOUNCE_TIME = 300 // tiempo mínimo para evitar muchos requests

function AsyncDebounceMultiSelect({
  label = "",
  endpoint = "",
  endpointJson = {},
  queryKeyModal = "",
  optionKey = (option) => option?.id || option?.value || String(option),
  selectedOptions = [],
  setSelectedOptions = () => {},
  debounceTime = DEFAULT_DEBOUNCE_TIME,
  minChars = 1,
  placeholder = "Buscar...",
  noOptionsText = "No hay opciones",
  loadingText = "Cargando...",
  formatOptionLabel = (option) => option?.label || option?.name || String(option || ""),
  maxHeight = 120,
  freeSolo = false,
  createCustomOption = null,
  ...props
}) {
  const theme = useTheme()
  const [inputText, setInputText] = useState("")
  const [debouncedValue, setDebouncedValue] = useState("")
  const timeoutRef = useRef(null)
  const inputRef = useRef(null)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Debounce simplificado y confiable
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const trimmedInput = inputText?.trim() || ""

    // Solo buscar si tiene suficientes caracteres
    if (trimmedInput.length >= minChars) {
      timeoutRef.current = setTimeout(
        () => {
          if (mountedRef.current) {
            setDebouncedValue(trimmedInput)
          }
        },
        Math.max(debounceTime, MIN_DEBOUNCE_TIME),
      )
    } else {
      // Si tiene menos caracteres, limpiar el debounced value
      if (mountedRef.current) {
        setDebouncedValue("")
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [inputText, debounceTime, minChars])

  // Query optimizada con timeout de seguridad
  const {
    data: fetchedOptions = [],
    isFetching,
    error,
    isError,
  } = useQuery({
    queryKey: [queryKeyModal, debouncedValue],
    queryFn: async () => {
      // Si no hay texto o es muy corto, no hacer fetch
      if (!debouncedValue || debouncedValue.trim().length < minChars) {
        return []
      }

      try {
        // Timeout de seguridad para evitar requests eternos
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout

        const response = await fetchwrapper(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...endpointJson, text: debouncedValue }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        return result?.data || []
      } catch (err) {
        console.error("Error en fetch:", err)
        // Retornar array vacío en caso de error
        return []
      }
    },
    enabled: !!debouncedValue && debouncedValue.trim().length >= minChars,
    retry: 1, // Solo reintentar una vez
    staleTime: 30000, // 30 segundos
    gcTime: 60000, // 1 minuto en cache
  })

  // Opciones combinadas
  const options = useMemo(() => {
    if (!freeSolo) {
      return fetchedOptions
    }

    const currentInput = inputText?.trim() || ""
    const result = [...fetchedOptions]

    // Agregar opción para crear nuevo si aplica
    if (currentInput.length > 0 && freeSolo) {
      const normalizedInput = currentInput.toLowerCase()
      const existsInOptions = fetchedOptions.some(
        (option) => formatOptionLabel(option).toLowerCase() === normalizedInput,
      )
      const existsInSelected = selectedOptions.some(
        (option) => formatOptionLabel(option).toLowerCase() === normalizedInput,
      )

      if (!existsInOptions && !existsInSelected) {
        const newOption = createCustomOption
          ? createCustomOption(currentInput)
          : {
              id: `custom_${Date.now()}`,
              label: currentInput,
              name: currentInput,
              value: currentInput,
              isCustom: true,
            }
        result.unshift(newOption)
      }
    }

    return result
  }, [fetchedOptions, freeSolo, inputText, formatOptionLabel, selectedOptions, createCustomOption])

  // Texto para cuando no hay opciones
  const getNoOptionsText = () => {
    const currentInput = inputText?.trim() || ""

    if (currentInput.length === 0) {
      return "Escriba para buscar..."
    }

    if (currentInput.length < minChars) {
      return `Ingrese al menos ${minChars} caracter${minChars !== 1 ? "es" : ""}`
    }

    if (isFetching) {
      return loadingText
    }

    if (isError) {
      return "Error al cargar opciones"
    }

    if (options.length === 0) {
      return noOptionsText
    }

    return noOptionsText
  }

  // Handlers
  const handleInputChange = useCallback((event, value) => {
    setInputText(value || "")
  }, [])

  const handleChange = useCallback(
    (event, newValue, reason) => {
      if (reason === "selectOption" || reason === "removeOption" || reason === "clear") {
        setSelectedOptions(newValue)

        // Si se seleccionó una opción custom, limpiar el input
        if (reason === "selectOption" && newValue.length > selectedOptions.length) {
          const lastSelected = newValue[newValue.length - 1]
          if (lastSelected?.isCustom && inputRef.current) {
            setInputText("")
            // Forzar limpieza del campo
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.value = ""
              }
            }, 0)
          }
        }
      }
    },
    [setSelectedOptions, selectedOptions.length],
  )

  const handleKeyDown = useCallback(
    (event) => {
      // Solo manejamos Enter para freeSolo
      if (freeSolo && event.key === "Enter") {
        const currentInput = inputText?.trim() || ""

        if (currentInput.length > 0) {
          // Verificar si ya existe
          const exists = selectedOptions.some(
            (option) => formatOptionLabel(option).toLowerCase() === currentInput.toLowerCase(),
          )

          if (!exists) {
            event.preventDefault()
            const newOption = createCustomOption
              ? createCustomOption(currentInput)
              : {
                  id: `custom_${Date.now()}`,
                  label: currentInput,
                  name: currentInput,
                  value: currentInput,
                  isCustom: true,
                }

            setSelectedOptions([...selectedOptions, newOption])
            setInputText("")

            if (inputRef.current) {
              inputRef.current.value = ""
            }
          }
        }
      }
    },
    [freeSolo, inputText, selectedOptions, formatOptionLabel, setSelectedOptions, createCustomOption],
  )

  // Componente para renderizar tags
  const renderTags = useCallback(
    (tagValue, getTagProps) => {
      return (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            maxHeight,
            overflowY: "auto",
            py: 0.5,
            px: 0.5,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: theme.palette.mode === "dark" ? "#424242" : "#f1f1f1",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: theme.palette.mode === "dark" ? "#686868" : "#c1c1c1",
              borderRadius: "3px",
            },
          }}
        >
          {tagValue.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={optionKey(option)}
              label={formatOptionLabel(option)}
              size="small"
              color={option?.isCustom ? "primary" : "default"}
              variant="outlined"
            />
          ))}
        </Box>
      )
    },
    [formatOptionLabel, optionKey, maxHeight, theme],
  )

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {label && (
        <InputLabel
          sx={{
            mb: 0.5,
            color: "text.primary",
            fontWeight: 500,
            fontSize: "0.875rem",
          }}
        >
          {label}
        </InputLabel>
      )}

      <Autocomplete
        multiple
        freeSolo={freeSolo}
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        getOptionLabel={formatOptionLabel}
        isOptionEqualToValue={(option, value) => optionKey(option) === optionKey(value)}
        filterOptions={(options) => options} // Desactivamos filtrado interno
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            placeholder={placeholder}
            error={isError}
            helperText={isError ? "Error al cargar opciones" : null}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isFetching ? <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderTags={renderTags}
        renderOption={(props, option) => (
          <li {...props}>
            {option?.isCustom ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  component="span"
                  sx={{
                    fontStyle: "italic",
                    color: "primary.main",
                    fontSize: "0.875rem",
                  }}
                >
                  Agregar:
                </Typography>
                <Typography component="span" sx={{ fontWeight: 500 }}>
                  "{formatOptionLabel(option)}"
                </Typography>
              </Box>
            ) : (
              formatOptionLabel(option)
            )}
          </li>
        )}
        loading={isFetching}
        loadingText={loadingText}
        noOptionsText={getNoOptionsText()}
        disableCloseOnSelect
        clearOnBlur={false}
        sx={{
          "& .MuiAutocomplete-tag": {
            maxWidth: "100%",
          },
          "& .MuiChip-label": {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        }}
        {...props}
      />
    </Box>
  )
}

export default AsyncDebounceMultiSelect
