import { memo, useCallback, useContext, createContext, useMemo, useRef, useState } from "react"
import { Box, Checkbox, Divider, FormControlLabel, Grid, MenuItem, TextField } from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { format } from "date-fns"
import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"
import GeneralesSection from "./sections/GeneralesSection"
import CreditoSection from "./sections/CreditoSection"
import VendedorUbicaSection from "./sections/VendedorUbicaSection"
import AgenciasSection from "./sections/AgenciasSection"
import DescuentosSection from "./sections/DescuentosSection"
import OtrosSection from "./sections/OtrosSection"
import ImagenesSection from "./sections/ImagenesSection"
import HistorialSection from "./sections/HistorialSection"

export const TIPOS_CLIENTE_DEFAULT_VALUES = {
  cliaccion: "INSERT",
  ciacodigo: "",
  clicodigo: "",
  clinombre: "",
  cliaparta: "",
  cliruc: "",
  clidirec: "",
  clirepres: "",
  clitelef1: "",
  clitelef2: "",
  clifax: "",
  clidiascrs: 0,
  climontocrs: 0,
  clisalaplis: 0,
  clidiascrd: 0,
  climontocrd: 0,
  cliprefac: 1,
  clistatus: "A",
  zoncodigo: "",
  regcodigo: "",
  cliapliiva: 0,
  procodigo: "",
  cliestciv: "",
  tipcodigo: "",
  clibloqueo: 0,
  cliobserva: "",
  clifecnac: "",
  cliemail: "",
  calificacion: "0",
  website: "",
  clidirec2: "",
  ciucodigo: "",
  usrcodigo: "",
  clirucmatriz: "",
  clinommatriz: "",
  cliintersec: "",
  clinumestable: "",
  tarenviosta: "D",
  clirucrepres: "",
  cliidentifica: "C",
  cliidenrep: "O",
  clicuotaven: 0,
  activicodigo: "",
  sectorcodigo: "",
  clidiapago: 0,
  clidiasrecibefac1: 0,
  clidiaentregafac: 0,
  cliconespecial: 0,
  clitelpref1: "",
  clitelext1: "",
  clitelext2: "",
  clitelpref2: "",
  clisexo: "",
  clipersona: "N",
  cliorigening: "I",
  clidemanda: 0,
  clicastigada: 0,
  parrocodigo: "",
  cliparterel: 0,
  cliactivos: 0,
  clipasivos: 0,
  cliingresos: 0,
  cliegresos: 0,
  clipatrimonioneto: 0,
  clifonorepres: "",
  clidirecrepres: "",
  cliemailrepres: "",
  apocodigo: "",
  clinombrecon: "",
  clidireccon: "",
  cliprofesioncon: "",
  clifonocon: "",
  cliemailcon: "",
  activicodigocon: "",
  cliinstitfuncionario: "",
  clienpolitica: 0,
  clipartidopolitico: "",
  clifondosorigen: "",
  clifondosdestino: "",
  clicontactonombre: "",
  clicontactoemail: "",
  clifonolabora: "",
  clicertvotacion: "",
  cliruccon: "",
  cliidencon: "",
  vendedores: [],
  agencias: [],
  contactos: [],
  refBancarias: [],
  descuentosLineas: [],
  descuentosArticulos: [],
  historial: [],
  historialObservacion: "",
}

const statusOptions = [
  { value: "A", label: "ACTIVO" },
  { value: "I", label: "INACTIVO" },
]

const personaOptions = [
  { value: "N", label: "Natural" },
  { value: "J", label: "Jurídica" },
]

const sexoOptions = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
]

const FieldErrorContext = createContext({})

const REQUIRED_FIELDS = new Set(["ciacodigo", "clicodigo", "clinombre", "clidirec"])

const Field = memo(function Field({
  label,
  name,
  value,
  onChange,
  readOnly = false,
  type = "text",
  select = false,
  options = [],
  error,
  multiline = false,
  rows,
  helperText = "",
}) {
  const errorsMap = useContext(FieldErrorContext)
  const normalizedValue = value ?? ""
  const optionMatch = options.find((option) => String(option.value) === String(normalizedValue))
  const displayValue = optionMatch ? optionMatch.label : normalizedValue
  const effectiveError = error ?? errorsMap?.[name] ?? ""
  const isRequiredField = !readOnly && REQUIRED_FIELDS.has(name)

  const toChecked = (rawValue) => {
    if (typeof rawValue === "boolean") return rawValue
    if (typeof rawValue === "number") return rawValue !== 0
    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim()
      if (!trimmed) return false
      const upper = trimmed.toUpperCase()
      if (["1", "TRUE", "S", "SI", "YES", "Y"].includes(upper)) return true
      if (["0", "FALSE", "N", "NO"].includes(upper)) return false
      const numericValue = Number.parseFloat(trimmed)
      if (!Number.isNaN(numericValue)) return numericValue !== 0
      return false
    }
    return Boolean(rawValue)
  }

  if (type === "checkbox") {
    const checked = toChecked(normalizedValue)
    return (
      <Box
        sx={{
          border: 1,
          borderColor: effectiveError ? "error.main" : "divider",
          borderRadius: 1,
          px: 1.5,
          py: 0.25,
          minHeight: 40,
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        <FormControlLabel
          sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
          label={label}
          labelPlacement="start"
          control={
            <Checkbox
              size="small"
              checked={checked}
              disabled={readOnly}
              onChange={(event) => onChange(name, event.target.checked ? -1 : 0)}
            />
          }
        />
      </Box>
    )
  }

  if (readOnly) {
    return (
      <TextField
        size="small"
        fullWidth
        label={label}
        name={name}
        value={displayValue}
        error={Boolean(effectiveError)}
        helperText={effectiveError || helperText || " "}
        InputLabelProps={{ shrink: true }}
        inputProps={{ readOnly: true }}
        multiline={multiline}
        rows={rows}
      />
    )
  }

  const toPickerDate = (rawValue) => {
    if (!rawValue) return null
    if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) return rawValue

    const parsed = new Date(String(rawValue).trim())
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  if (type === "date" && !select) {
    return (
      <DatePicker
        label={label}
        value={toPickerDate(normalizedValue)}
        onChange={(newValue) => {
          if (!newValue || Number.isNaN(newValue.getTime())) {
            onChange(name, "")
            return
          }
          onChange(name, format(newValue, "yyyy-MM-dd"))
        }}
        slotProps={{
          textField: {
            size: "small",
            fullWidth: true,
            name,
            required: isRequiredField,
            error: Boolean(effectiveError),
            helperText: effectiveError || helperText || " ",
            InputLabelProps: {
              shrink: true,
              sx: isRequiredField ? { fontWeight: 700 } : undefined,
            },
          },
        }}
      />
    )
  }

  return (
    <TextField
      size="small"
      fullWidth
      label={label}
      name={name}
      value={normalizedValue}
      type={type}
      select={select}
      required={isRequiredField}
      onChange={(event) => onChange(name, event.target.value)}
      error={Boolean(effectiveError)}
      helperText={effectiveError || helperText || " "}
      multiline={multiline}
      rows={rows}
      InputLabelProps={isRequiredField ? { sx: { fontWeight: 700 } } : undefined}
    >
      {select
        ? options.map((option) => (
            <MenuItem key={`${name}-${option.value}`} value={option.value}>
              {option.label}
            </MenuItem>
          ))
        : null}
    </TextField>
  )
})

const Section = ({ title, children, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <CustomFieldsetAccordion title={title} expanded={expanded} onToggle={() => setExpanded((prev) => !prev)}>
      <Grid container spacing={1.2} sx={{ mt: 2 }}>
        {children}
      </Grid>
    </CustomFieldsetAccordion>
  )
}

const ACCIONES_TABS = {
  GENERALES: "TIPOSCLIENTE_TAB_GENERALES",
  CREDITO: "TIPOSCLIENTE_TAB_CREDITO",
  VENDEDOR_UBICA: "TIPOSCLIENTE_TAB_VENDEDOR_UBICA",
  AGENCIAS: "TIPOSCLIENTE_TAB_AGENCIAS",
  DESCUENTOS: "TIPOSCLIENTE_TAB_DESCUENTOS",
  OTROS: "TIPOSCLIENTE_TAB_OTROS",
  IMAGENES: "TIPOSCLIENTE_TAB_IMAGENES",
  HISTORIAL: "TIPOSCLIENTE_TAB_HISTORIAL",
}

const SECTION_CONFIG = [
  { key: "generales", permiso: ACCIONES_TABS.GENERALES, Component: GeneralesSection },
  { key: "credito", permiso: ACCIONES_TABS.CREDITO, Component: CreditoSection },
  { key: "vendedorUbica", permiso: ACCIONES_TABS.VENDEDOR_UBICA, Component: VendedorUbicaSection },
  { key: "agencias", permiso: ACCIONES_TABS.AGENCIAS, Component: AgenciasSection },
  { key: "descuentos", permiso: ACCIONES_TABS.DESCUENTOS, Component: DescuentosSection },
  { key: "otros", permiso: ACCIONES_TABS.OTROS, Component: OtrosSection },
  { key: "imagenes", permiso: ACCIONES_TABS.IMAGENES, Component: ImagenesSection },
  { key: "historial", permiso: ACCIONES_TABS.HISTORIAL, Component: HistorialSection },
]

export default function TiposClienteTabsForm({
  data,
  onChange,
  errors = {},
  readOnly = false,
  actions = [],
  selectOptions = {},
  currentUser = "",
  currentStation = "",
}) {
  const sectionRenderersRef = useRef({})
  const sectionMetaRef = useRef({ readOnly: false, firstSectionKey: null })

  const normalizedActions = useMemo(() => {
    if (Array.isArray(actions)) return actions
    if (actions && typeof actions === "object") return Object.values(actions)
    return []
  }, [actions])

  const hasPermission = (permissionCodeOrCaption) => {
    if (!permissionCodeOrCaption) return false

    return normalizedActions.some((action) => {
      if (typeof action === "string") {
        return action === permissionCodeOrCaption
      }

      return (
        action?.acccaption === permissionCodeOrCaption ||
        action?.acccodigo === permissionCodeOrCaption ||
        action?.caption === permissionCodeOrCaption ||
        action?.codigo === permissionCodeOrCaption
      )
    })
  }

  const visibleSections = useMemo(() => {
    const sections = SECTION_CONFIG.filter((sectionItem) => hasPermission(sectionItem.permiso))
    return sections.length > 0 ? sections : []
  }, [normalizedActions])

  sectionMetaRef.current = {
    readOnly,
    firstSectionKey: visibleSections[0]?.key ?? null,
  }

  const getSectionRenderer = useCallback((sectionKey) => {
    if (!sectionRenderersRef.current[sectionKey]) {
      sectionRenderersRef.current[sectionKey] = function StableSection(sectionProps) {
        const { readOnly: currentReadOnly, firstSectionKey } = sectionMetaRef.current

        return <Section {...sectionProps} defaultExpanded={currentReadOnly || sectionKey === firstSectionKey} />
      }
    }

    return sectionRenderersRef.current[sectionKey]
  }, [])

  const change = useCallback(
    (name, value) => {
      if (!readOnly) {
        onChange(name, value)
      }
    },
    [onChange, readOnly],
  )

  const normalizedData = useMemo(() => ({ ...TIPOS_CLIENTE_DEFAULT_VALUES, ...(data || {}) }), [data])

  const options = {
    statusOptions: selectOptions?.status || statusOptions,
    personaOptions,
    sexoOptions,
  }

  return (
    <FieldErrorContext.Provider value={errors}>
      <Box>
        <Grid container spacing={1.2} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={2}>
            <Field label="Compañía" name="ciacodigo" value={normalizedData.ciacodigo} onChange={change} readOnly />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Field label="Código" name="clicodigo" value={normalizedData.clicodigo} onChange={change} readOnly />
          </Grid>
          <Grid item xs={12} sm={5}>
            <Field
              label="Nombre"
              name="clinombre"
              value={normalizedData.clinombre}
              onChange={change}
              readOnly={readOnly}
              error={errors.clinombre}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Field
              label="Estado"
              name="clistatus"
              value={normalizedData.clistatus}
              onChange={change}
              readOnly={readOnly || normalizedData.cliaccion === "INSERT"}
              select
              options={options.statusOptions}
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 1 }} />
        {visibleSections.map(({ key, Component }) => (
          <Component
            key={key}
            data={normalizedData}
            change={change}
            readOnly={readOnly}
            errors={errors}
            Field={Field}
            Section={getSectionRenderer(key)}
            options={options}
            selectOptions={selectOptions}
            {...(key === "historial" && { currentUser, currentStation })}
          />
        ))}
      </Box>
    </FieldErrorContext.Provider>
  )
}
