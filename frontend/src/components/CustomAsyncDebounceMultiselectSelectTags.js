// ***********************************************
// ESTE COMPONENTE NUNCA SE USO NI SE TERMINO
// ES UNA PRUEBA DE CONCEPTO
// ***********************************************

import * as React from "react"
import TextField from "@mui/material/TextField"
import { Box, InputLabel, CircularProgress, Checkbox } from "@mui/material"
import Autocomplete, { autocompleteClasses } from "@mui/material/Autocomplete"
import Popper from "@mui/material/Popper"
import { styled, createTheme, useTheme, ThemeProvider } from "@mui/material/styles"
import { FixedSizeList } from "react-window"
import Typography from "@mui/material/Typography"
import Chip from "@mui/material/Chip"
import { useQuery } from "@tanstack/react-query"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import { useRef, useCallback, useEffect, useState, useMemo } from "react"
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank"
import CheckBoxIcon from "@mui/icons-material/CheckBox"

const LISTBOX_PADDING = 8 // px
const DEFAULT_DEBOUNCE_TIME = 400 // ms
const ITEM_SIZE = 36 // Altura fija de cada elemento

const OuterElementContext = React.createContext({})

const OuterElementType = React.forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext)
  return <div ref={ref} {...props} {...outerProps} />
})

const RenderRow = React.memo(({ data, index, style }) => {
  const dataSet = data[index]
  return (
    <Typography
      component="li"
      noWrap
      style={{
        ...style,
        top: style.top + LISTBOX_PADDING,
      }}
    >
      {dataSet.label}
    </Typography>
  )
})

const ListboxComponent = React.forwardRef(({ children, ...other }, ref) => {
  const itemData = React.Children.toArray(children)
  const itemCount = itemData.length

  const height = useMemo(() => {
    const calculatedHeight = itemCount > 8 ? 8 * ITEM_SIZE : itemCount * ITEM_SIZE
    return calculatedHeight + 2 * LISTBOX_PADDING
  }, [itemCount])

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <FixedSizeList
          height={height}
          width="100%"
          itemSize={ITEM_SIZE}
          itemCount={itemCount}
          itemData={itemData}
          outerElementType={OuterElementType}
          innerElementType="ul"
          overscanCount={5}
        >
          {RenderRow}
        </FixedSizeList>
      </OuterElementContext.Provider>
    </div>
  )
})

const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: "border-box",
    "& ul": {
      padding: 0,
      margin: 0,
    },
  },
})

// Estilo personalizado para el contenedor de tags
const StyledTagsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  maxHeight: "120px",
  overflowY: "auto",
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
  "&::-webkit-scrollbar-thumb:hover": {
    background: theme.palette.mode === "dark" ? "#7a7a7a" : "#a8a8a8",
  },
  gap: "4px",
  padding: "4px",
}))

function CustomAsyncDebounceMultiselectSelectTags({
  label = "", // Etiqueta del campo
  endpoint = "", // URL para fetching de datos
  endpointJson = {}, // Parámetros adicionales para la petición
  queryKeyModal = "", // Clave única para cache de react-query
  optionKey = () => {}, // Función para obtener identificador único de opción del autocomplete
  selectedOptions = [], // Opciones seleccionadas
  setSelectedOptions = () => {}, // Handler para usado cuando algo es seleccionado
  debounceTime = DEFAULT_DEBOUNCE_TIME, // Tiempo de debounce
  minChars = 1, // Mínimo de caracteres para activar búsqueda
  placeholder = "Buscar...", // Texto placeholder
  noOptionsText = "No hay opciones", // Texto sin resultados
  loadingText = "Cargando...", // Texto durante carga
  formatOptionLabel = () => {}, // Formato personalizado para opciones del autocomplete
  maxHeight = 120, // Altura máxima para el contenedor de tags
  ...props
}) {
  const theme = useTheme()
  const [inputText, setInputText] = useState("")
  const [debouncedValue, setDebouncedValue] = useState("")
  // Estado para controlar si se debe mostrar "loading" durante el debounce inicial
  const [isDebouncePending, setIsDebouncePending] = useState(false)
  const timeoutRef = useRef(null)
  // Referencia al contenedor de tags
  const tagsContainerRef = useRef(null)

  // Optimización: Debounce con cancelación
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (inputText.trim().length >= minChars) {
      setIsDebouncePending(true) // <-- Activamos estado pendiente
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(inputText)
      setIsDebouncePending(false) // <-- Desactivamos al final del debounce
    }, debounceTime)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setIsDebouncePending(false) // Limpieza al desmontar
    }
  }, [inputText, debounceTime, minChars])

  const shouldFetch = debouncedValue.trim().length >= minChars

  const { data: fetchedOptions = [], isFetching } = useQuery({
    queryKey: [queryKeyModal, debouncedValue],
    queryFn: async () => {
      try {
        const response = await fetchwrapper(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...endpointJson, text: debouncedValue }),
        })
        return (await response.json()).data || []
      } catch (error) {
        console.error("Error fetching data:", error)
        return []
      }
    },
    enabled: shouldFetch,
    keepPreviousData: true, // Mantener datos anteriores durante nuevas búsquedas
    staleTime: 5000,
  })

  // Memoize options para evitar recálculos
  const options = useMemo(() => fetchedOptions, [fetchedOptions])

  // Memoize no options text
  const noOptionsMessage = useMemo(() => {
    if (inputText.trim().length < minChars) {
      return `Ingrese al menos ${minChars} caracter${minChars !== 1 ? "es" : ""} para buscar`
    }
    if (isDebouncePending || isFetching) {
      // <-- Verificamos pendiente + fetching
      return loadingText
    }
    if (!options.length) return noOptionsText
    return noOptionsText
  }, [inputText, minChars, isFetching, options, loadingText, noOptionsText, isDebouncePending])

  // Handler optimizado con useCallback
  const handleInputChange = useCallback((_, newInputValue) => {
    setInputText(newInputValue)
  }, [])

  // Componente personalizado para renderizar las tags con scroll
  const TagsComponent = useCallback(
    (tagValue, getTagProps) => {
      return (
        <StyledTagsContainer
          style={{ maxHeight }}
          ref={tagsContainerRef} // Asignar la referencia
        >
          {tagValue.map((option, index) => (
            <Chip {...getTagProps({ index })} key={optionKey(option)} label={formatOptionLabel(option)} size="small" />
          ))}
        </StyledTagsContainer>
      )
    },
    [formatOptionLabel, optionKey, maxHeight],
  )

  // Efecto para auto-scroll (siempre que se agrege un tag el scroll se movera al ultimo agregado)
  useEffect(() => {
    if (tagsContainerRef.current) {
      // Scroll suave al final del contenedor
      tagsContainerRef.current.scrollTo({
        top: tagsContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [selectedOptions]) // Se activa cuando cambian los tags

  return (
    <ThemeProvider theme={createTheme(theme)}>
      <Box display="flex" flexDirection="column">
        {label && <InputLabel sx={{ paddingLeft: "2px" }}>{label}</InputLabel>}
        <Autocomplete
          multiple
          disableListWrap
          disableCloseOnSelect
          options={options}
          value={selectedOptions}
          onChange={(_, newValue) => setSelectedOptions(newValue)}
          onInputChange={handleInputChange}
          getOptionLabel={formatOptionLabel}
          isOptionEqualToValue={(option, value) => optionKey(option) === optionKey(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={selectedOptions.length === 0 ? placeholder : ""}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isFetching && <CircularProgress color="inherit" size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props
            // console.log(key, optionProps, option, "aqui")
            return (
              // <li {...props} key={optionKey(option)}>
              <li {...optionProps} key={key}>
                <Checkbox
                  icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                  checkedIcon={<CheckBoxIcon fontSize="small" />}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {formatOptionLabel(option)}
              </li>
            )
          }}
          renderTags={TagsComponent}
          loading={isFetching}
          loadingText={loadingText}
          noOptionsText={noOptionsMessage}
          filterOptions={(x) => x}
          slots={{
            popper: StyledPopper,
            listbox: ListboxComponent,
          }}
          {...props}
        />
      </Box>
    </ThemeProvider>
  )
}

export default CustomAsyncDebounceMultiselectSelectTags

// import * as React from "react"
// import TextField from "@mui/material/TextField"
// import { Box, InputLabel, CircularProgress, Checkbox } from "@mui/material"
// import Autocomplete, { autocompleteClasses } from "@mui/material/Autocomplete"
// import Popper from "@mui/material/Popper"
// import { styled, createTheme, useTheme, ThemeProvider } from "@mui/material/styles"
// import { FixedSizeList } from "react-window"
// import Typography from "@mui/material/Typography"
// import Chip from "@mui/material/Chip"
// import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank"
// import CheckBoxIcon from "@mui/icons-material/CheckBox"
// import { useQuery } from "@tanstack/react-query"
// import fetchwrapper from "../services/interceptors/fetchwrapper"
// import { useRef, useCallback, useEffect, useState, useMemo } from "react"

// const LISTBOX_PADDING = 8
// const DEFAULT_DEBOUNCE_TIME = 400
// const ITEM_SIZE = 48 // Aumentado para mejor UX con checkboxes

// // Contexto para virtualization
// const OuterElementContext = React.createContext({})

// const OuterElementType = React.forwardRef((props, ref) => {
//   const outerProps = React.useContext(OuterElementContext)
//   return <div ref={ref} {...props} {...outerProps} />
// })

// // Componente de fila optimizado con React.memo
// const RenderRow = React.memo(({ data, index, style }) => {
//   const { options, getOptionProps, formatOptionLabel, selectedSet } = data
//   const option = options[index]
//   const props = getOptionProps({ option, index })
//   const isSelected = selectedSet.has(option)

//   return (
//     <li
//       {...props}
//       style={{
//         ...style,
//         top: style.top + LISTBOX_PADDING,
//         display: "flex",
//         alignItems: "center",
//         padding: "8px 16px",
//         cursor: "pointer",
//       }}
//     >
//       <Checkbox
//         icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
//         checkedIcon={<CheckBoxIcon fontSize="small" />}
//         style={{ marginRight: 8 }}
//         checked={isSelected}
//         tabIndex={-1}
//         disableRipple
//       />
//       <Typography variant="body2" noWrap>
//         {formatOptionLabel(option)}
//       </Typography>
//     </li>
//   )
// })

// // Listbox virtualizado optimizado
// const ListboxComponent = React.forwardRef((props, ref) => {
//   const { children, options, getOptionProps, formatOptionLabel, selectedSet } = props
//   const itemCount = options.length

//   const height = useMemo(() => {
//     const maxItems = 8
//     const calculatedHeight = itemCount > maxItems ? maxItems * ITEM_SIZE : itemCount * ITEM_SIZE
//     return Math.max(calculatedHeight + 2 * LISTBOX_PADDING, ITEM_SIZE)
//   }, [itemCount])

//   const itemData = useMemo(
//     () => ({
//       options,
//       getOptionProps,
//       formatOptionLabel,
//       selectedSet,
//     }),
//     [options, getOptionProps, formatOptionLabel, selectedSet],
//   )

//   if (itemCount === 0) {
//     return <div ref={ref}>{children}</div>
//   }

//   return (
//     <div ref={ref}>
//       <OuterElementContext.Provider value={props}>
//         <FixedSizeList
//           height={height}
//           width="100%"
//           itemSize={ITEM_SIZE}
//           itemCount={itemCount}
//           itemData={itemData}
//           outerElementType={OuterElementType}
//           innerElementType="ul"
//           overscanCount={3}
//         >
//           {RenderRow}
//         </FixedSizeList>
//       </OuterElementContext.Provider>
//     </div>
//   )
// })

// const StyledPopper = styled(Popper)({
//   [`& .${autocompleteClasses.listbox}`]: {
//     boxSizing: "border-box",
//     "& ul": {
//       padding: 0,
//       margin: 0,
//     },
//   },
// })

// // Contenedor de tags optimizado
// const StyledTagsContainer = styled("div")(({ theme }) => ({
//   display: "flex",
//   flexWrap: "wrap",
//   maxHeight: "120px",
//   overflowY: "auto",
//   gap: "4px",
//   padding: "4px",
//   "&::-webkit-scrollbar": {
//     width: "6px",
//   },
//   "&::-webkit-scrollbar-track": {
//     background: theme.palette.mode === "dark" ? "#424242" : "#f1f1f1",
//     borderRadius: "3px",
//   },
//   "&::-webkit-scrollbar-thumb": {
//     background: theme.palette.mode === "dark" ? "#686868" : "#c1c1c1",
//     borderRadius: "3px",
//   },
//   "&::-webkit-scrollbar-thumb:hover": {
//     background: theme.palette.mode === "dark" ? "#7a7a7a" : "#a8a8a8",
//   },
// }))

// // Chip optimizado para evitar re-renders innecesarios
// const OptimizedChip = React.memo(({ option, onDelete, formatOptionLabel, optionKey }) => (
//   <Chip key={optionKey(option)} label={formatOptionLabel(option)} onDelete={onDelete} size="small" variant="filled" />
// ))

// function AsyncDebounceSingleSelectTags({
//   label = "",
//   endpoint = "",
//   endpointJson = {},
//   queryKeyModal = "",
//   optionKey = () => {},
//   selectedOptions = [],
//   setSelectedOptions = () => {},
//   debounceTime = DEFAULT_DEBOUNCE_TIME,
//   minChars = 1,
//   placeholder = "Buscar...",
//   noOptionsText = "No hay opciones",
//   loadingText = "Cargando...",
//   formatOptionLabel = () => {},
//   maxHeight = 120,
//   ...props
// }) {
//   const theme = useTheme()
//   const [inputText, setInputText] = useState("")
//   const [debouncedValue, setDebouncedValue] = useState("")
//   const [isDebouncePending, setIsDebouncePending] = useState(false)
//   const timeoutRef = useRef(null)
//   const tagsContainerRef = useRef(null)

//   // Set para búsquedas O(1) en lugar de O(n)
//   const selectedSet = useMemo(() => {
//     return new Set(selectedOptions.map((option) => optionKey(option)))
//   }, [selectedOptions, optionKey])

//   // Debounce optimizado
//   useEffect(() => {
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current)
//     }

//     if (inputText.trim().length >= minChars) {
//       setIsDebouncePending(true)
//     } else {
//       setIsDebouncePending(false)
//       setDebouncedValue("")
//       return
//     }

//     timeoutRef.current = setTimeout(() => {
//       setDebouncedValue(inputText)
//       setIsDebouncePending(false)
//     }, debounceTime)

//     return () => {
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current)
//       }
//     }
//   }, [inputText, debounceTime, minChars])

//   const shouldFetch = debouncedValue.trim().length >= minChars

//   // Query optimizada
//   const { data: fetchedOptions = [], isFetching } = useQuery({
//     queryKey: [queryKeyModal, debouncedValue],
//     queryFn: async () => {
//       try {
//         const response = await fetchwrapper(endpoint, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ ...endpointJson, text: debouncedValue }),
//         })
//         const result = await response.json()
//         return result.data || []
//       } catch (error) {
//         console.error("Error fetching data:", error)
//         return []
//       }
//     },
//     enabled: shouldFetch,
//     keepPreviousData: true,
//     staleTime: 10000, // Aumentado para mejor cache
//     cacheTime: 300000, // 5 minutos de cache
//   })

//   // Filtrar opciones ya seleccionadas del dropdown
//   const availableOptions = useMemo(() => {
//     return fetchedOptions.filter((option) => !selectedSet.has(optionKey(option)))
//   }, [fetchedOptions, selectedSet, optionKey])

//   // Handler de input optimizado
//   const handleInputChange = useCallback((_, newInputValue, reason) => {
//     // Solo actualizar si es input del usuario
//     if (reason === "input") {
//       setInputText(newInputValue)
//     }
//   }, [])

//   // Handler de cambio optimizado
//   const handleChange = useCallback(
//     (_, newValue, reason, details) => {
//       if (reason === "selectOption") {
//         // Agregar opción seleccionada
//         setSelectedOptions((prev) => [...prev, details.option])
//       } else if (reason === "removeOption") {
//         // Remover opción específica
//         setSelectedOptions((prev) => prev.filter((option) => optionKey(option) !== optionKey(details.option)))
//       } else {
//         // Otros casos (clear, etc.)
//         setSelectedOptions(newValue)
//       }

//       // Limpiar input después de selección
//       if (reason === "selectOption") {
//         setInputText("")
//       }
//     },
//     [setSelectedOptions, optionKey],
//   )

//   // Función para eliminar tag específico
//   const handleDeleteTag = useCallback(
//     (optionToDelete) => {
//       setSelectedOptions((prev) => prev.filter((option) => optionKey(option) !== optionKey(optionToDelete)))
//     },
//     [setSelectedOptions, optionKey],
//   )

//   // Mensaje de no opciones optimizado
//   const noOptionsMessage = useMemo(() => {
//     if (inputText.trim().length < minChars) {
//       return `Ingrese al menos ${minChars} caracter${minChars !== 1 ? "es" : ""} para buscar`
//     }
//     if (isDebouncePending || isFetching) {
//       return loadingText
//     }
//     if (!availableOptions.length && fetchedOptions.length > 0) {
//       return "Todas las opciones ya están seleccionadas"
//     }
//     if (!availableOptions.length) {
//       return noOptionsText
//     }
//     return noOptionsText
//   }, [inputText, minChars, isFetching, availableOptions, fetchedOptions, loadingText, noOptionsText, isDebouncePending])

//   // Componente de tags optimizado
//   const renderTags = useCallback(
//     (tagValue, getTagProps) => {
//       return (
//         <StyledTagsContainer style={{ maxHeight }} ref={tagsContainerRef}>
//           {tagValue.map((option, index) => (
//             <OptimizedChip
//               key={optionKey(option)}
//               option={option}
//               onDelete={() => handleDeleteTag(option)}
//               formatOptionLabel={formatOptionLabel}
//               optionKey={optionKey}
//             />
//           ))}
//         </StyledTagsContainer>
//       )
//     },
//     [maxHeight, optionKey, formatOptionLabel, handleDeleteTag],
//   )

//   // Auto-scroll optimizado
//   useEffect(() => {
//     if (tagsContainerRef.current && selectedOptions.length > 0) {
//       const container = tagsContainerRef.current
//       const isAtBottom = container.scrollTop >= container.scrollHeight - container.clientHeight - 10

//       if (isAtBottom || selectedOptions.length === 1) {
//         requestAnimationFrame(() => {
//           container.scrollTo({
//             top: container.scrollHeight,
//             behavior: "smooth",
//           })
//         })
//       }
//     }
//   }, [selectedOptions.length])

//   return (
//     <Box display="flex" flexDirection="column">
//       {label && <InputLabel sx={{ paddingLeft: "2px" }}>{label}</InputLabel>}
//       <Autocomplete
//         multiple
//         disableListWrap
//         disableClearable
//         openOnFocus
//         options={availableOptions}
//         value={selectedOptions}
//         inputValue={inputText}
//         onChange={handleChange}
//         onInputChange={handleInputChange}
//         getOptionLabel={formatOptionLabel}
//         isOptionEqualToValue={(option, value) => optionKey(option) === optionKey(value)}
//         renderInput={(params) => (
//           <TextField
//             {...params}
//             placeholder={selectedOptions.length === 0 ? placeholder : ""}
//             InputProps={{
//               ...params.InputProps,
//               endAdornment: (
//                 <>
//                   {(isFetching || isDebouncePending) && <CircularProgress color="inherit" size={20} />}
//                   {params.InputProps.endAdornment}
//                 </>
//               ),
//             }}
//           />
//         )}
//         renderTags={renderTags}
//         loading={isFetching || isDebouncePending}
//         loadingText={loadingText}
//         noOptionsText={noOptionsMessage}
//         filterOptions={(options) => options} // Sin filtrado adicional
//         slots={{
//           popper: StyledPopper,
//           listbox: (props) => (
//             <ListboxComponent
//               {...props}
//               options={availableOptions}
//               formatOptionLabel={formatOptionLabel}
//               selectedSet={selectedSet}
//             />
//           ),
//         }}
//         slotProps={{
//           listbox: {
//             options: availableOptions,
//             formatOptionLabel,
//             selectedSet,
//           },
//         }}
//         {...props}
//       />
//     </Box>
//   )
// }

// export default AsyncDebounceSingleSelectTags
