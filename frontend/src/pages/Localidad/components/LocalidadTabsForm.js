import { memo, useState, useMemo, createContext, useContext, useRef, useCallback } from "react"
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Checkbox,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { format } from "date-fns"
import CustomFieldsetAccordion from "../../../components/CustomFieldsetAccordion"
import GeneralesSection from "./sections/GeneralesSection"
import CtasxCobrarSection from "./sections/CtasxCobrarSection"
import FacturacionSection from "./sections/FacturacionSection"
import InventariosSection from "./sections/InventariosSection"
import TicketsRolesSection from "./sections/TicketsRolesSection"
import OtrosSection from "./sections/OtrosSection"
import Notas1Section from "./sections/Notas1Section"
import Notas2Section from "./sections/Notas2Section"
import Otros2Section from "./sections/Otros2Section"

export const LOCALIDAD_DEFAULT_VALUES = {
  ciacodigo: "",
  loccodigo: "",
  locdescri: "",
  locstatus: "A",
  ciaruc: "",
  ciadirec: "",
  ciaciudad: "",
  ciaprovincia: "",
  ciapais: "",
  ciatelefono1: "",
  ciatelefono2: "",
  ciafax: "",
  ciaemail: "",
  unicodigo: "",
  locservidor: "N",
  fatrainv: "",
  locpathxml: "",
  locpathxmldocemitidos: "",
  locpathxmldocanulados: "",
  clavep12: "",
  caducidadp12: "",
  forpagnd: "",
  forpagun: "",
  tracodingloc: "",
  ciasecinvnc: "",
  factippag: "",
  ttrcodigo: "",
  sercesion: "",
  sertarpos: "",
  sercodigo: "",
  ciaseccobfac: "",
  seqcodigo: "",
  seqantdocgar: "",
  tarseqnd: "",
  tarsecant: "",
  tarforpag: "",
  tarser00: "",
  tarrecau: "",
  tarser01: "",
  tarser02: "",
  tarser03: "",
  tarser04: "",
  tarseqndint: "",
  tarserint: "",
  tarforpagint: "",
  tarsecncrotdif: "",
  tarserncrotdif: "",
  tartiponccom: "",
  tarsecncpuntos: "",
  tarserncpuntos: "",
  tarvalcomigen: 0,
  tarcanapligen: 0,
  tarvalcomiart: 0,
  tarcanapliart: 0,
  tarseccob: "",
  cjacodigonc: "",
  secndmig: "",
  secncmig: "",
  seqndref: "",
  ndfcodigo: "",
  ncfcodigo: "",
  fafaccob: 0,
  famrecporval: 0,
  famporser: 0,
  fadesglobal: 0,
  fasumadesc: 0,
  famimpser: 0,
  fampor1: 0,
  parfecven: 0,
  pardiasven: 0,
  propormano: 0,
  proporrepuesto: 0,
  invcodpro: "",
  fanumlin: 0,
  diasvenoc: 0,
  pacodegre: "",
  fatraanu: "",
  tipcodigo: "",
  regcodigo: "",
  activicodigo: "",
  sectorcodigo: "",
  zoncodigo: "",
  vencodigo: "",
  parrocodigo: "",
  cencosun: "",
  tipordcom: "",
  tipordcomser: "",
  tipclipro: "",
  clivendedor: "",
  clicodingprod: "",
  procodingprod: "",
  procodigo: "",
  probodcod: "",
  bodcodpro: "",
  invemiped: "",
  emailsmtp: "",
  emailmascara: "",
  emailsalida: "",
  emailsubject: "",
  emailmensaje: "",
  sercodigotransporte: "",
  painvcodgar: "",
  pabodcodgar: "",
  pacodinggar: "",
  pacodegrgar: "",
  pacodingdev: "",
  pacodegrpro: "",

  tracodproing: "",
  tracodproegr: "",
  invtrapresing: "",
  invtrapresegr: "",
  tipoingoc: "",
  tipoegroc: "",
  traingped: "",
  traegrped: "",
  tardiasventrans: 0,
  pacodegprest: "",
  pacodingre: "",
  guianumlin: 0,
  seqcodigondm: "",
  seqcodigonc: "",
  seqcesion: "",
  cablin1: "",
  cablin2: "",
  cablin3: "",
  cablin4: "",
  pielin1: "",
  pielin2: "",
  pielin3: "",
  pielin4: "",
  prescodigo: "",
  prestipcliempl: "",
  presaplicaquin: 0,
  presaplicamens: 0,
  presseccobro: "",
  pressecncmon: "",
  presserncmon: "",
  ciaseccobdoc: "",
  clidiascrs: 0,
  climontocrs: 0,
  locfecinicxc: "",
  locvalcupon: 0,
  locfecinicupon: "",
  locfecfincupon: "",
  flagapruanti: 0,
  locflagcupon: 0,
  valorminimooc: 0,
  seqncmref: "",
  seqcobref: "",
  serndref: "",
  serncintref: "",
  serncref: "",
  tbliqcaja: "",
  tbliqviatico: "",
  bcoliqviatico: "",
  repbodcod: "",
  tarcobrotdif: "",
  notapedido1: "",
  notapedido2: "",
  notaoc: "",
  notacertificado: "",
  paramcod1: "",
  paramcod2: "",
  paramcod3: "",
  paramcod4: "",
  paramcod5: "",
  paramcod6: "",
  paramval1: 0,
  paramval2: 0,
  paramval3: 0,
  paramval4: 0,
  paramval5: 0,
  paramval6: 0,
  paramtipond: "",
  paramtiponc: "",
  paramcoding: "",
  paramstnd: "",
  paramstnc: "",
  paramtcnd: "",
  paramtcnc: "",
  parambodingegr: "",
  ctaivapagadobien: "",
  ctaivapagadoserv: "",
  ciucodigo: "",
}

const statusOptions = [
  { value: "A", label: "ACTIVA" },
  { value: "I", label: "INACTIVA" },
]

const ynNumericOptions = [
  { value: 1, label: "Sí" },
  { value: 0, label: "No" },
]

const yesNoRadioOptions = [
  { value: 1, label: "Si Aplica" },
  { value: 0, label: "No Aplica" },
]

const recargoModeOptions = [
  { value: 0, label: "Por Porcentaje" },
  { value: 1, label: "Por Valor" },
]

const vencimientoDividendoOptions = [
  { value: 0, label: "Mismo día de emisión" },
  { value: 1, label: "Calendario (30 días por mes)" },
]

const giftCardUseOptions = [
  { value: 0, label: "Una sola compra" },
  { value: 1, label: "Varias compras" },
]

const serverOptions = [
  { value: "S", label: "S" },
  { value: "N", label: "N" },
]

const REQUIRED_FIELDS = new Set(["ciacodigo", "loccodigo", "locdescri", "ciadirec", "locstatus", "locservidor"])

const FieldErrorContext = createContext({})

const Field = memo(function Field({
  label,
  name,
  value,
  onChange,
  readOnly = false,
  type = "text",
  select = false,
  options = [],
  multiline = false,
  rows,
  error,
  helperText,
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
      if (["1", "TRUE", "S", "SI", "SÍ", "YES", "Y"].includes(upper)) return true
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
          helperText={effectiveError || helperText || " "}
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
          onChange={(event) => onChange(name, Number.parseInt(event.target.value, 10))}
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
        helperText={effectiveError || helperText || " "}
        multiline={multiline}
        rows={rows}
        InputLabelProps={{ shrink: true }}
        inputProps={{ readOnly: true }}
      />
    )
  }

  const toPickerDate = (rawValue) => {
    if (!rawValue) return null
    if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) return rawValue

    const parsed = new Date(String(rawValue))
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
      multiline={multiline}
      rows={rows}
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
  GENERALES: "LOCALIDAD_TAB_GENERALES",
  CTASXCOBRAR: "LOCALIDAD_TAB_CTASXCOBRAR",
  FACTURACION: "LOCALIDAD_TAB_FACTURACION",
  INVENTARIOS: "LOCALIDAD_TAB_INVENTARIOS",
  TICKETS_ROLES: "LOCALIDAD_TAB_TICKETS_ROLES",
  OTROS: "LOCALIDAD_TAB_OTROS",
  NOTAS1: "LOCALIDAD_TAB_NOTAS1",
  NOTAS2: "LOCALIDAD_TAB_NOTAS2",
  OTROS2: "LOCALIDAD_TAB_OTROS2",
}

const SECTION_CONFIG = [
  { key: "generales", label: "Generales", permiso: ACCIONES_TABS.GENERALES, Component: GeneralesSection },
  { key: "ctasxcobrar", label: "CtasxCobrar", permiso: ACCIONES_TABS.CTASXCOBRAR, Component: CtasxCobrarSection },
  { key: "facturacion", label: "Facturación", permiso: ACCIONES_TABS.FACTURACION, Component: FacturacionSection },
  { key: "inventarios", label: "Inventarios", permiso: ACCIONES_TABS.INVENTARIOS, Component: InventariosSection },
  {
    key: "ticketsroles",
    label: "Tickets/Roles",
    permiso: ACCIONES_TABS.TICKETS_ROLES,
    Component: TicketsRolesSection,
  },
  { key: "otros", label: "Otros", permiso: ACCIONES_TABS.OTROS, Component: OtrosSection },
  { key: "notas1", label: "Notas 1", permiso: ACCIONES_TABS.NOTAS1, Component: Notas1Section },
  { key: "notas2", label: "Notas 2", permiso: ACCIONES_TABS.NOTAS2, Component: Notas2Section },
  { key: "otros2", label: "Otros 2", permiso: ACCIONES_TABS.OTROS2, Component: Otros2Section },
]

export default function LocalidadTabsForm({
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
        const shouldExpandByDefault =
          sectionProps?.defaultExpanded !== undefined
            ? sectionProps.defaultExpanded
            : currentReadOnly || sectionKey === firstSectionKey

        return <Section {...sectionProps} defaultExpanded={shouldExpandByDefault} />
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
    ynNumericOptions,
    yesNoRadioOptions,
    recargoModeOptions,
    vencimientoDividendoOptions,
    giftCardUseOptions,
    serverOptions,
  }

  const normalizedData = useMemo(() => ({ ...LOCALIDAD_DEFAULT_VALUES, ...(data || {}) }), [data])

  return (
    <FieldErrorContext.Provider value={errors}>
      <Box>
        <Grid container spacing={1.2} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={2}>
            <Field
              label="Códigos de Compañía"
              name="ciacodigo"
              value={normalizedData.ciacodigo}
              onChange={change}
              readOnly
              helperText="Código no se puede modificar"
              error={errors.ciacodigo}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Field
              label="Código Localidad"
              name="loccodigo"
              value={normalizedData.loccodigo}
              onChange={change}
              readOnly
              helperText="Código no se puede modificar"
              error={errors.loccodigo}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Field
              label="Razón Social"
              name="locdescri"
              value={normalizedData.locdescri}
              onChange={change}
              readOnly={readOnly}
              error={errors.locdescri}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Field
              label="Estado"
              name="locstatus"
              value={normalizedData.locstatus}
              onChange={change}
              readOnly={readOnly || isCreating}
              select
              options={statusOptions}
              error={errors.locstatus}
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
          />
        ))}
      </Box>
    </FieldErrorContext.Provider>
  )
}
