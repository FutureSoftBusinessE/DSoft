/* eslint-disable camelcase */
// ***********************************************
// ESTE COMPONENTE HASTA EL MOMENTO SOLO USA
// PARA TRAER TODAS LAS LINEAS DE UN COMPANIA
// ***********************************************
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { Autocomplete, TextField, Checkbox, Box, InputLabel } from "@mui/material/"
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank"
import CheckBoxIcon from "@mui/icons-material/CheckBox"
import fetchwrapper from "../services/interceptors/fetchwrapper"
import { createTheme, useTheme, ThemeProvider } from "@mui/material/styles"

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />
const checkedIcon = <CheckBoxIcon fontSize="small" />

// Constantes para optimización
const SELECT_ALL_CODE = "seleccionar-todos"
const DEBOUNCE_DELAY = 300

// Componente de checkbox optimizado con expandir/contraer
const OptimizedCheckbox = React.memo(
  ({ option, selected, selectAll, fetchResponse, hasChildren, isExpanded, onToggleExpand }) => {
    const isSelectAllOption = option[fetchResponse.code] === SELECT_ALL_CODE
    const marginLeft = 10 * (option.linnivel || 1)

    return (
      <div
        style={{
          marginLeft,
          display: "flex",
          alignItems: "center",
          padding: "4px 8px",
          minHeight: "40px",
        }}
      >
        {/* Botón de expansión solo para padres */}
        {hasChildren && !isSelectAllOption && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(option[fetchResponse.code])
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginRight: 4,
              padding: 2,
              display: "flex",
              alignItems: "center",
              fontSize: "12px",
              color: "#666",
            }}
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        )}

        {/* Espaciado para elementos sin hijos */}
        {!hasChildren && !isSelectAllOption && <div style={{ width: 20, marginRight: 4 }} />}

        <Checkbox
          icon={icon}
          checkedIcon={checkedIcon}
          checked={selected || (isSelectAllOption && selectAll)}
          size="small"
          disableRipple
          tabIndex={-1}
        />
        <span
          style={{
            fontSize: "0.875rem",
            marginLeft: 8,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: hasChildren && !isSelectAllOption ? "bold" : "normal",
          }}
        >
          {option[fetchResponse.description]}
        </span>
      </div>
    )
  },
)

const CustomInputNestedChildren = ({
  label,
  placeholder,
  value = [], // Prop controlada - array de objetos
  onChange, // Función callback que recibe array de objetos
  endpoint,
  fetchResponse,
  noOptionsText,
}) => {
  // Estados principales
  const theme = useTheme()
  const [allOptions, setAllOptions] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState(new Set()) // Para controlar expansión

  // Referencias para optimización
  const debounceRef = useRef(null)
  const hierarchyMapRef = useRef(new Map())

  // Memoizar opciones seleccionadas basadas en los objetos del prop value
  const selectedValues = useMemo(() => {
    if (!value || value.length === 0) return []
    return value
  }, [value])

  // Verificar si todos están seleccionados
  const selectAll = useMemo(() => {
    if (allOptions.length === 0) return false
    const availableOptions = allOptions.filter((opt) => opt[fetchResponse.code] !== SELECT_ALL_CODE)
    const selectedCodes = new Set(value.map((item) => item[fetchResponse.code]))
    return (
      availableOptions.length > 0 && availableOptions.every((option) => selectedCodes.has(option[fetchResponse.code]))
    )
  }, [value, allOptions, fetchResponse])

  // API call optimizada
  const callAPI = useCallback(async (url, request) => {
    try {
      const options = {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
      const response = await fetchwrapper(url, options)
      return await response.json()
    } catch (error) {
      console.error("API Error:", error)
      return []
    }
  }, [])

  // Construir mapa de jerarquía para búsquedas O(1)
  const buildHierarchyMap = useCallback((options) => {
    const hierarchyMap = new Map()
    const parentMap = new Map()
    const childrenMap = new Map()
    const expandedSet = new Set()

    // Crear mapas de relaciones padre-hijo
    options.forEach((option) => {
      const code = option.lincodigo
      const parentCode = option.linlindes

      hierarchyMap.set(code, option)

      if (parentCode) {
        parentMap.set(code, parentCode)

        if (!childrenMap.has(parentCode)) {
          childrenMap.set(parentCode, [])
        }
        childrenMap.get(parentCode).push(code)
      } else {
        // Nodos raíz expandidos por defecto
        expandedSet.add(code)
      }
    })

    // Expandir todos los nodos por defecto
    hierarchyMap.forEach((option, code) => {
      expandedSet.add(code)
    })

    setExpandedNodes(expandedSet)
    hierarchyMapRef.current = { hierarchyMap, parentMap, childrenMap }
  }, [])

  // Obtener todos los descendientes de un nodo
  const getAllDescendants = useCallback((nodeCode) => {
    const { hierarchyMap, childrenMap } = hierarchyMapRef.current
    const result = []

    const traverse = (code) => {
      const children = childrenMap.get(code) || []
      children.forEach((childCode) => {
        const childNode = hierarchyMap.get(childCode)
        if (childNode) {
          result.push(childNode)
          traverse(childCode)
        }
      })
    }

    traverse(nodeCode)
    return result
  }, [])

  // Obtener padre de un nodo
  const getParent = useCallback((option) => {
    const { hierarchyMap, parentMap } = hierarchyMapRef.current
    const parentCode = parentMap.get(option.lincodigo)
    return parentCode ? hierarchyMap.get(parentCode) : null
  }, [])

  // Verificar si un nodo tiene hijos
  const hasChildren = useCallback((nodeCode) => {
    const { childrenMap } = hierarchyMapRef.current
    return childrenMap.has(nodeCode) && childrenMap.get(nodeCode).length > 0
  }, [])

  // Función para toggle expand/collapse
  const toggleExpand = useCallback((nodeCode) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeCode)) {
        newSet.delete(nodeCode)
      } else {
        newSet.add(nodeCode)
      }
      return newSet
    })
  }, [])

  // Filtrar opciones considerando jerarquía y expansión
  const getVisibleOptions = useCallback(
    (options, searchTerm = "") => {
      if (!hierarchyMapRef.current.childrenMap) return options

      const { childrenMap } = hierarchyMapRef.current
      const visible = []

      // Si hay búsqueda, mostrar todos los resultados planos
      if (searchTerm.trim()) {
        return options.filter((option) => {
          const code = option[fetchResponse.code]?.toLowerCase() || ""
          const description = option[fetchResponse.description]?.toLowerCase() || ""
          return code.includes(searchTerm.toLowerCase()) || description.includes(searchTerm.toLowerCase())
        })
      }

      // Sin búsqueda, mostrar jerarquía respetando expansión
      const addVisibleNodes = (nodeCode, level = 0) => {
        const { hierarchyMap } = hierarchyMapRef.current
        const node = hierarchyMap.get(nodeCode)

        if (node) {
          // Agregar el nodo actual
          visible.push({ ...node, linnivel: level })

          // Si está expandido, agregar sus hijos
          if (expandedNodes.has(nodeCode)) {
            const children = childrenMap.get(nodeCode) || []
            children.forEach((childCode) => {
              addVisibleNodes(childCode, level + 1)
            })
          }
        }
      }

      // Comenzar con nodos raíz
      options.forEach((option) => {
        if (!option.linlindes) {
          // Nodos raíz
          addVisibleNodes(option.lincodigo, 1)
        }
      })

      return visible
    },
    [expandedNodes, fetchResponse],
  )

  // Filtrar opciones con jerarquía
  const filteredOptions = useMemo(() => {
    return getVisibleOptions(allOptions, inputValue)
  }, [allOptions, inputValue, expandedNodes, getVisibleOptions])

  // Opciones con "Seleccionar todos"
  const optionsWithSelectAll = useMemo(() => {
    if (filteredOptions.length === 0) return []

    const selectAllOption = {
      [fetchResponse.code]: SELECT_ALL_CODE,
      [fetchResponse.description]: "Seleccionar todos",
      linnivel: 0,
    }

    return [selectAllOption, ...filteredOptions]
  }, [filteredOptions, fetchResponse])

  // Cargar opciones iniciales
  const loadOptions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await callAPI(endpoint, {})

      if (Array.isArray(response)) {
        setAllOptions(response)
        buildHierarchyMap(response)
      }
    } catch (error) {
      console.error("Error loading options:", error)
    } finally {
      setIsLoading(false)
    }
  }, [callAPI, buildHierarchyMap])

  // Manejar selección de opciones
  const handleSelectOption = useCallback(
    (event, newValue) => {
      if (!onChange) return // Si no hay callback, no hacer nada

      if (!newValue || newValue.length === 0) {
        onChange([])
        return
      }

      // Verificar si se seleccionó "Seleccionar todos"
      const hasSelectAll = newValue.some((option) => option[fetchResponse.code] === SELECT_ALL_CODE)

      if (hasSelectAll) {
        if (selectAll) {
          // Deseleccionar todos
          onChange([])
        } else {
          // Seleccionar todos los filtrados
          const filtered = filteredOptions.filter((opt) => opt[fetchResponse.code] !== SELECT_ALL_CODE)
          onChange(filtered)
        }
        return
      }

      // Lógica de selección jerárquica
      const currentSelectedCodes = new Set(value.map((item) => item[fetchResponse.code]))
      const newlyAdded = newValue.filter((option) => !currentSelectedCodes.has(option[fetchResponse.code]))
      const removed = selectedValues.filter((option) => !newValue.includes(option))

      let finalSelection = [...newValue]

      // Agregar descendientes de nuevos elementos
      newlyAdded.forEach((option) => {
        const descendants = getAllDescendants(option.lincodigo)
        descendants.forEach((descendant) => {
          if (!finalSelection.some((selected) => selected[fetchResponse.code] === descendant[fetchResponse.code])) {
            finalSelection.push(descendant)
          }
        })
      })

      // Remover padres de elementos eliminados
      removed.forEach((option) => {
        const parent = getParent(option)
        if (parent) {
          finalSelection = finalSelection.filter(
            (selected) => selected[fetchResponse.code] !== parent[fetchResponse.code],
          )
        }
      })

      // Enviar los objetos completos al callback
      onChange(finalSelection)
    },
    [selectedValues, selectAll, filteredOptions, fetchResponse, onChange, value, getAllDescendants, getParent],
  )

  // Manejar cambio de input con debounce
  const handleInputChange = useCallback((event, newInputValue) => {
    setInputValue(newInputValue)

    // Cancelar debounce anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Aplicar debounce para filtrado
    debounceRef.current = setTimeout(() => {
      // Aquí podrías agregar lógica adicional si es necesario
    }, DEBOUNCE_DELAY)
  }, [])

  // Obtener label de opción
  const getOptionLabel = useCallback(
    (option) => {
      if (option[fetchResponse.code] === SELECT_ALL_CODE) {
        return option[fetchResponse.description]
      }
      return `${option[fetchResponse.code]} - ${option[fetchResponse.description]}`
    },
    [fetchResponse],
  )

  // Renderizar opción
  const renderOption = useCallback(
    (props, option, { selected }) => {
      const { key, ...restProps } = props
      const nodeCode = option[fetchResponse.code]
      const nodeHasChildren = hasChildren(option.lincodigo)
      const isExpanded = expandedNodes.has(option.lincodigo)

      return (
        <li {...restProps} key={nodeCode}>
          <OptimizedCheckbox
            option={option}
            selected={selected}
            selectAll={selectAll}
            fetchResponse={fetchResponse}
            hasChildren={nodeHasChildren}
            isExpanded={isExpanded}
            onToggleExpand={toggleExpand}
          />
        </li>
      )
    },
    [selectAll, fetchResponse, hasChildren, expandedNodes, toggleExpand],
  )

  // Verificar igualdad de opciones
  const isOptionEqualToValue = useCallback(
    (option, value) => {
      return option[fetchResponse.code] === value[fetchResponse.code]
    },
    [fetchResponse],
  )

  // Cargar datos al montar
  useEffect(() => {
    loadOptions()

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [loadOptions])

  return (
    <ThemeProvider theme={createTheme(theme)}>
      <Box display="flex" flexDirection="column">
        {label && <InputLabel sx={{ paddingLeft: "2px" }}>{label}</InputLabel>}

        <Autocomplete
          multiple
          id="nested-autocomplete"
          disableCloseOnSelect
          loading={isLoading}
          options={optionsWithSelectAll}
          value={selectedValues}
          inputValue={inputValue}
          getOptionLabel={getOptionLabel}
          onInputChange={handleInputChange}
          onChange={handleSelectOption}
          isOptionEqualToValue={isOptionEqualToValue}
          renderOption={renderOption}
          filterOptions={(options) => options} // Sin filtrado adicional
          noOptionsText={noOptionsText}
          sx={{
            maxWidth: "75vw",
            "& .MuiAutocomplete-listbox": {
              maxHeight: "400px",
              "& li": {
                paddingTop: "2px",
                paddingBottom: "2px",
              },
            },
            "& .MuiAutocomplete-option": {
              minHeight: "40px",
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              placeholder={placeholder}
              InputProps={{
                ...params.InputProps,
                sx: {
                  "& .MuiAutocomplete-tag": {
                    maxWidth: "200px",
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  },
                },
              }}
            />
          )}
          componentsProps={{
            popper: {
              modifiers: [
                {
                  name: "preventOverflow",
                  options: {
                    boundary: "viewport",
                  },
                },
              ],
            },
          }}
        />
      </Box>
    </ThemeProvider>
  )
}

export default CustomInputNestedChildren
