import { memo, useState, useMemo, createContext, useContext, useRef, useCallback } from "react"
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Divider,
  Checkbox,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { format } from "date-fns"
import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"
import GeneralesSection from "./sections/GeneralesSection"
import AdministrativoSection from "./sections/AdministrativoSection"
import ContablesSection from "./sections/ContablesSection"
import OtrosSection from "./sections/OtrosSection"
import Otros2Section from "./sections/Otros2Section"
import CXPComprasSection from "./sections/CXPComprasSection"
import AdicionalesSection from "./sections/AdicionalesSection"

export const COMPANIA_DEFAULT_VALUES = {
  ciacodigo: "",
  ciaanioejer: "",
  ciaauxcredito: "",
  ciacontador: "",
  ciadescri: "",
  ciaalias: "",
  ciaruc: "",
  ciadirec: "",
  ciafax: "",
  ciafecminacc: "",
  ciaforcencos: "",
  ciaforlin: "",
  ciagerente: "",
  cianivelescc: "",
  cianiveleslin: "",
  ciapresidente: "",
  ciarecsalmen: "",
  ciaregcont: "",
  ciastatus: "A",
  ciatelefono1: "",
  ciatelefono2: "",
  ciavigilancia: "",
  ciaciudad: "",
  ciapais: "",
  ciaescontesp: "",
  ciaemail: "",
  ciaweb: "",
  ciaanioinicon: "",
  ciaforpre: "",
  cianivelespre: "",
  ciadiasnc: "",
  ciacedgerente: "",
  ciahelpart: "",
  ciacantfor: "",
  ciacostfor: "",
  ciavehele: "",
  ciapresupuesto: 0,
  ciafecinipre: "",
  ciaforcta: "",
  cianivelescta: 0,
  ciasrirazon: "",
  ciasrifono: "",
  ciasrifax: "",
  ciasriemail: "",
  ciasriruccontador: "",
  ciatipoidengerente: "",
  ciasridirmatriz: "",
  ciasridocautventas: "",
  ciasrinotdebventas: "",
  ciasrinotcreventas: "",
  ciasriretfueventas: "",
  ciacodlocmatriz: "",
  generacodian: "",
  coscodigo: "",
  aplitransing: 0,
  apliserie: 0,
  codclisec: 0,
  codprosec: 0,
  ciasecuencliente: 0,
  ciasecuenproveedor: 0,
  ciasecuentarjeta: "",
  codartsec: 0,
  ciasecuenartventa: 0,
  ciasecuenarticulo: 0,
  ciaactualizaprecios: 0,
  cianumresolucion: "",
  ciafecresolucion: "",
  CiaNivelOrg: "",
  ciafororg: "",
  cianumvend: "",
  ciasolautfactcxp: 0,
  ciaaproautfactcxp: 0,
  ciasolautanticxp: 0,
  ciaaproautanticxp: 0,
  ciasolautpagocxp: 0,
  ciaaproautpagocxp: 0,
  ciaaaocimport: 0,
  ciaaaocserv: 0,
  ciaaaocgasta: 0,
  ciaaaoclocal: 0,
  ciaaaocgastasoc: 0,
  ciafacitemrep: 0,
  ciasecuenemple: 0,
  ciasecuencargo: 0,
  ciavalprecost: 0,
  ciaporretiva: 0,
  ciaporretfuente: 0,
  ciactapagolote: "",
  ciatipoocfaclote: "",
  ciaivaservicio: "",
  ciafacelectronica: "",
  versionfac: "",
  ciapdfelectronica: "",
  versionpdf: "",
  ciaambienteelectronica: 0,
  srimicroempresa: "N",
  sricartera: "N",
  sriguia: "N",
  sriagenteretencion: "N",
  sriagenteretencionnumres: "",
  sricorreoffice: "N",
  sricopiacorreo: "N",
  srimensajefactura: "N",
  srissltls: "N",
  srioffini: "",
  sriofffin: "",
  ciaaaocliqcomloc: 0,
  ciaaaocliqcomimp: 0,
  ciaaaocliqcomser: 0,
  ciaaaocppe: 0,
  ciacobrapuntos: 0,
  ciacobracupos: 0,
  ciacobrafundacion: 0,
  ciancbeneficiario: 0,
  ciainmobiliaria: 0,
  ciancdevcxccia: 0,
  ciadiasretencion: 0,
  ciadiasemitirretencion: 30,
  ciapropina: 0,
  ciacontabilidad: 1,
  ciaetiquetaadiret: "",
  ciavaloradiret: "",
  ciasolautclcxp: 0,
  ciaaproautclcxp: 0,
  cialogo: null,
  ciaselloagua: null,
  ciaivaporproducto: 0,
  ciafacDeVariosLoc: 0,
  cialistprecdefweb: 1,
  ciavalidaemp: 0,
  ciabasepuntos: 0,
}

const statusOptions = [
  { value: "A", label: "ACTIVA" },
  { value: "I", label: "INACTIVA" },
]

const ynOptions = [
  { value: "S", label: "Sí" },
  { value: "N", label: "No" },
]

const ynNumericOptions = [
  { value: 1, label: "Sí" },
  { value: 0, label: "No" },
]

const ynRadioOptions = [
  { value: 1, label: "Sí" },
  { value: 0, label: "No" },
]

const ambienteFeOptions = [
  { value: 0, label: "Pruebas" },
  { value: 1, label: "Producción" },
]

const FieldErrorContext = createContext({})

const idTypeOptions = [
  { value: "", label: "" },
  { value: "C", label: "Cédula" },
  { value: "R", label: "RUC" },
  { value: "P", label: "Pasaporte" },
]

const ocStateOptions = [
  { value: 0, label: "ESPERA" },
  { value: 1, label: "PENDIENTE" },
  { value: 2, label: "APROBADA" },
]

const REQUIRED_FIELDS = new Set(["ciacodigo", "ciadescri", "ciadirec", "ciasrirazon"])

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
  checkedValue = 1,
  uncheckedValue = 0,
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
      const trimmed = rawValue.trim().toUpperCase()
      if (!trimmed) return false
      if (["1", "TRUE", "S", "SI", "SÍ", "YES", "Y", "A"].includes(trimmed)) return true
      if (["0", "FALSE", "N", "NO", "I"].includes(trimmed)) return false
      const numericValue = Number.parseFloat(trimmed)
      if (!Number.isNaN(numericValue)) return numericValue !== 0
    }
    return Boolean(rawValue)
  }

  if (type === "checkbox") {
    const checked = toChecked(normalizedValue)

    if (readOnly) {
      return (
        <TextField
          size="small"
          fullWidth
          label={label}
          name={name}
          value={checked ? "Sí" : "No"}
          type="text"
          error={Boolean(effectiveError)}
          helperText={effectiveError || " "}
          InputLabelProps={{ shrink: true }}
          inputProps={{ readOnly: true }}
        />
      )
    }

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
              onChange={(event) => onChange(name, event.target.checked ? checkedValue : uncheckedValue)}
            />
          }
        />
      </Box>
    )
  }

  if (type === "radio") {
    if (readOnly) {
      return (
        <TextField
          size="small"
          fullWidth
          label={label}
          name={name}
          value={displayValue}
          type="text"
          error={Boolean(effectiveError)}
          helperText={effectiveError || " "}
          InputLabelProps={{ shrink: true }}
          inputProps={{ readOnly: true }}
        />
      )
    }

    return (
      <FormControl
        component="fieldset"
        error={Boolean(effectiveError)}
        sx={{
          border: 1,
          borderColor: effectiveError ? "error.main" : "divider",
          borderRadius: 1,
          px: 1.5,
          py: 0.75,
          width: "100%",
          minHeight: 72,
        }}
      >
        <FormLabel component="legend" sx={{ fontSize: 13, fontWeight: 600, mb: 0.4 }}>
          {label}
        </FormLabel>
        <RadioGroup
          row
          name={name}
          value={normalizedValue}
          onChange={(event) => onChange(name, Number(event.target.value))}
        >
          {options.map((option) => (
            <FormControlLabel
              key={`${name}-${option.value}`}
              value={option.value}
              control={<Radio size="small" />}
              label={option.label}
            />
          ))}
        </RadioGroup>
      </FormControl>
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
        type="text"
        error={Boolean(effectiveError)}
        helperText={effectiveError || " "}
        InputLabelProps={{ shrink: true }}
        inputProps={{ readOnly: true }}
      />
    )
  }

  const toPickerDate = (rawValue) => {
    if (!rawValue) return null
    if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) return rawValue

    if (typeof rawValue === "number" && Number.isFinite(rawValue) && rawValue >= 1000 && rawValue <= 9999) {
      return new Date(rawValue, 0, 1)
    }

    const valueStr = String(rawValue).trim()
    if (!valueStr) return null

    if (/^\d{4}$/.test(valueStr)) {
      return new Date(Number(valueStr), 0, 1)
    }

    const parsed = new Date(valueStr)
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
            helperText: effectiveError || " ",
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
      helperText={effectiveError || " "}
      InputLabelProps={
        type === "date"
          ? {
              shrink: true,
              sx: isRequiredField ? { fontWeight: 700 } : undefined,
            }
          : isRequiredField
            ? { sx: { fontWeight: 700 } }
            : undefined
      }
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
      <Grid container spacing={1.2}>
        {children}
      </Grid>
    </CustomFieldsetAccordion>
  )
}

const ACCIONES_TABS = {
  GENERALES: "COMPANIA_TAB_GENERALES",
  ADMINISTRATIVO: "COMPANIA_TAB_ADMINISTRATIVO",
  CONTABLES: "COMPANIA_TAB_CONTABLES",
  OTROS: "COMPANIA_TAB_OTROS",
  OTROS2: "COMPANIA_TAB_OTROS2",
  CXP_COMPRAS: "COMPANIA_TAB_CXP_COMPRAS",
  ADICIONALES: "COMPANIA_TAB_ADICIONALES",
}

const SECTION_CONFIG = [
  { key: "generales", permiso: ACCIONES_TABS.GENERALES, Component: GeneralesSection },
  // A continuacion estos sections fueron escondidos:
  // { key: "administrativo", permiso: ACCIONES_TABS.ADMINISTRATIVO, Component: AdministrativoSection },
  // { key: "contables", permiso: ACCIONES_TABS.CONTABLES, Component: ContablesSection },
  // { key: "otros", permiso: ACCIONES_TABS.OTROS, Component: OtrosSection },
  // { key: "otros2", permiso: ACCIONES_TABS.OTROS2, Component: Otros2Section },
  // { key: "cxpcompras", permiso: ACCIONES_TABS.CXP_COMPRAS, Component: CXPComprasSection },
  // { key: "adicionales", permiso: ACCIONES_TABS.ADICIONALES, Component: AdicionalesSection },
]

export default function CompaniaTabsForm({
  data,
  onChange,
  errors = {},
  readOnly = false,
  actions = [],
  isCreating = false,
}) {
  const sectionRenderersRef = useRef({})
  const sectionMetaRef = useRef({ readOnly: false, firstSectionKey: null })

  const hasPermission = (permissionCodeOrCaption) => {
    if (!permissionCodeOrCaption) return false
    return actions.some(
      (action) => action?.acccaption === permissionCodeOrCaption || action?.acccodigo === permissionCodeOrCaption,
    )
  }

  const visibleSections = useMemo(() => {
    const sections = SECTION_CONFIG.filter((sectionItem) => hasPermission(sectionItem.permiso))
    // Durante creación: mostrar todas las secciones para que pueda ver/editar todos los campos
    // Si hay restricciones de permisos, ya están filtradas arriba
    return sections.length > 0 ? sections : []
  }, [actions, isCreating])

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

  const options = {
    ynOptions,
    ynNumericOptions,
    ynRadioOptions,
    ambienteFeOptions,
    idTypeOptions,
    ocStateOptions,
  }

  return (
    <FieldErrorContext.Provider value={errors}>
      <Box>
        <Grid container spacing={1.2} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={2}>
            <Field label="Código" name="ciacodigo" value={data.ciacodigo} onChange={change} readOnly />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Field
              label="Razón Social"
              name="ciadescri"
              value={data.ciadescri}
              onChange={change}
              readOnly={readOnly}
              error={errors.ciadescri}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Field
              label="Teléfono 1"
              name="ciatelefono1"
              value={data.ciatelefono1}
              onChange={change}
              readOnly={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Field
              label="Estado"
              name="ciastatus"
              value={data.ciastatus}
              onChange={change}
              readOnly={readOnly || isCreating}
              select
              options={statusOptions}
            />
          </Grid>
        </Grid>

        <Grid container spacing={1.2} sx={{ mb: 1.2 }}>
          <Grid item xs={12} sm={3}>
            <Field label="R.U.C." name="ciaruc" value={data.ciaruc} onChange={change} readOnly={readOnly} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Field
              label="Teléfono 2"
              name="ciatelefono2"
              value={data.ciatelefono2}
              onChange={change}
              readOnly={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Field label="Fax" name="ciafax" value={data.ciafax} onChange={change} readOnly={readOnly} />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 1 }} />
        {visibleSections.map(({ key, Component }) => (
          <Component
            key={key}
            data={data}
            change={change}
            readOnly={readOnly}
            errors={errors}
            Field={Field}
            Section={getSectionRenderer(key)}
            options={options}
          />
        ))}
      </Box>
    </FieldErrorContext.Provider>
  )
}
