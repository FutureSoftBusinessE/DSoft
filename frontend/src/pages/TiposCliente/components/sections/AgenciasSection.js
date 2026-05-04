import { useEffect, useMemo, useState } from "react"
import {
  Grid,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  IconButton,
  TableContainer,
  Paper,
  Alert,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"

const AgenciasSection = ({ data = {}, change, readOnly, errors = {}, Field, Section, selectOptions = {} }) => {
  const agencias = Array.isArray(data.agencias) ? data.agencias : []
  const contactos = Array.isArray(data.contactos) ? data.contactos : []

  const nextAgenciaCodigo = useMemo(() => {
    const maxCodigo = agencias.reduce((max, agencia) => {
      const codigoActual = Number.parseInt(String(agencia?.codigo ?? agencia?.agencodigo ?? "").trim(), 10)
      if (Number.isNaN(codigoActual)) return max
      return Math.max(max, codigoActual)
    }, 0)
    return String(maxCodigo + 1)
  }, [agencias])

  const firstAgenciaCodigo = useMemo(() => {
    const first = agencias[0]
    return String(first?.codigo ?? first?.agencodigo ?? "1")
  }, [agencias])

  const [newAgencia, setNewAgencia] = useState({
    codigo: "",
    descripcion: "",
    direccion: "",
    telPref1: "",
    telefono1: "",
    ext1: "",
    telPref2: "",
    telefono2: "",
    ext2: "",
    email: "",
    ciudad: "",
    region: "",
  })
  const [newContacto, setNewContacto] = useState({
    agencodigo: "",
    contacto: "",
    cargo: "",
    telPref1: "",
    telefono1: "",
    ext1: "",
    celular: "",
    email: "",
    area: "",
    comentario: "",
    telefono2: "", // NEW: NOT NULL en DB
    valViaje: "0.00", // NEW: decimal(12,2) NOT NULL, default 0
    externo: "",
  })

  const prefijoOptions = selectOptions?.prefijoTelefono || [
    { value: "", label: " ---- " },
    { value: "593", label: "+593" },
    { value: "591", label: "+591" },
    { value: "56", label: "+56" },
    { value: "51", label: "+51" },
    { value: "57", label: "+57" },
  ]

  const [validationErrorAgencia, setValidationErrorAgencia] = useState("")
  const [agenciaFieldErrors, setAgenciaFieldErrors] = useState({})
  const [validationErrorContacto, setValidationErrorContacto] = useState("")
  const [contactoFieldErrors, setContactoFieldErrors] = useState({})

  useEffect(() => {
    setNewAgencia((prev) => ({ ...prev, codigo: nextAgenciaCodigo }))
  }, [nextAgenciaCodigo])

  // Keep newAgencia.region in sync with the parent form's selected region
  useEffect(() => {
    // Prefer explicit form data.regcodigo, otherwise use first available option
    const fallbackRegion = (selectOptions?.region && selectOptions.region[0] && selectOptions.region[0].value) || ""
    setNewAgencia((prev) => ({ ...prev, region: prev.region || data.regcodigo || fallbackRegion }))
  }, [data.regcodigo, selectOptions])

  useEffect(() => {
    setNewContacto((prev) => ({ ...prev, agencodigo: prev.agencodigo || firstAgenciaCodigo }))
  }, [firstAgenciaCodigo])

  const setNewAgenciaField = (name, value) => {
    setNewAgencia((p) => ({ ...p, [name]: value }))
    // Clear field error when user starts typing
    if (agenciaFieldErrors[name]) {
      setAgenciaFieldErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }
  const setNewContactoField = (name, value) => {
    setNewContacto((p) => ({ ...p, [name]: value }))
    // Clear field error when user starts typing
    if (contactoFieldErrors[name]) {
      setContactoFieldErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleAddAgencia = () => {
    // ============ VALIDACIÓN PRE-AGREGAR ============
    const errors = {}
    const detailedErrors = []

    // Validar descripción requerida
    if (!newAgencia.descripcion?.trim()) {
      errors.descripcion = "La Descripción de Agencia es requerida"
      detailedErrors.push("Descripción: es requerida")
    }

    // Validar dirección requerida
    if (!newAgencia.direccion?.trim()) {
      errors.direccion = "La Dirección de Agencia es requerida"
      detailedErrors.push("Dirección: es requerida")
    }

    // Validar teléfono 1 requerido + formato
    if (!newAgencia.telefono1?.trim()) {
      errors.telefono1 = "El Teléfono 1 es requerido"
      detailedErrors.push("Teléfono 1: es requerido")
    } else if (!/^[\d\s+\-()#*.,.]+$/.test(newAgencia.telefono1)) {
      errors.telefono1 = "Teléfono 1: solo números y caracteres válidos (+, -, (), #, *, .)"
      detailedErrors.push("Teléfono 1: contiene caracteres inválidos")
    }

    // Validar teléfono 2 requerido + formato
    if (!newAgencia.telefono2?.trim()) {
      errors.telefono2 = "El Teléfono 2 es requerido"
      detailedErrors.push("Teléfono 2: es requerido")
    } else if (!/^[\d\s+\-()#*.,.]+$/.test(newAgencia.telefono2)) {
      errors.telefono2 = "Teléfono 2: solo números y caracteres válidos (+, -, (), #, *, .)"
      detailedErrors.push("Teléfono 2: contiene caracteres inválidos")
    }

    // Validar email requerido + formato
    if (!newAgencia.email?.trim()) {
      errors.email = "El Email de Agencia es requerido"
      detailedErrors.push("Email: es requerido")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAgencia.email)) {
      errors.email = "Email: formato inválido (ej: correo@ejemplo.com)"
      detailedErrors.push("Email: formato inválido")
    }

    // Si hay errores, mostrar y RETORNAR (NO AGREGAR)
    if (Object.keys(errors).length > 0) {
      setAgenciaFieldErrors(errors)
      const detailedMsg = detailedErrors.join(" | ")
      setValidationErrorAgencia(`❌ ${detailedMsg}`)
      return
    }

    // ============ AGREGAR EXITOSAMENTE ============
    const nextCodigo = nextAgenciaCodigo
    const uid = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)

    change("agencias", [
      ...agencias,
      {
        ...newAgencia,
        codigo: nextCodigo,
        region:
          newAgencia.region ||
          data.regcodigo ||
          (selectOptions?.region && selectOptions.region[0] && selectOptions.region[0].value) ||
          "",
        zona: data.zoncodigo || "",
        provincia: data.procodigo || "",
        ciudad: newAgencia.ciudad || data.ciucodigo || "", // Usar email de agencia o fallback a cliente
        ciacodigo: data.ciacodigo || "",
        clicodigo: data.clicodigo || "",
        _uid: uid,
      },
    ])

    // ============ LIMPIAR COMPLETAMENTE (POST-AGREGAR) ============
    // Sin validaciones, sin errores, formulario vacío
    setValidationErrorAgencia("") // Limpiar alert de validación
    setAgenciaFieldErrors({}) // Limpiar errores de campos
    setNewAgencia({
      // Resetear formulario
      codigo: nextAgenciaCodigo,
      descripcion: "",
      direccion: "",
      telPref1: "",
      telefono1: "",
      ext1: "",
      telPref2: "",
      telefono2: "",
      ext2: "",
      email: "",
      ciudad: "",
      region:
        data.regcodigo || (selectOptions?.region && selectOptions.region[0] && selectOptions.region[0].value) || "",
    })
  }

  const handleRemoveAgencia = (idx) =>
    change(
      "agencias",
      agencias.filter((_, i) => i !== idx),
    )

  const handleAddContacto = () => {
    // ============ VALIDACIÓN PRE-AGREGAR ============
    const errors = {}
    const detailedErrors = []

    // Validar nombre contacto requerido
    if (!newContacto.contacto?.trim()) {
      errors.contacto = "El Nombre del Contacto es requerido"
      detailedErrors.push("Contacto: es requerido")
    }

    // Validar teléfono 1 requerido + formato
    if (!newContacto.telefono1?.trim()) {
      errors.telefono1 = "El Teléfono 1 es requerido"
      detailedErrors.push("Teléfono 1: es requerido")
    } else if (!/^[\d\s+\-()#*.,.]+$/.test(newContacto.telefono1)) {
      errors.telefono1 = "Teléfono 1: solo números y caracteres válidos (+, -, (), #, *, .)"
      detailedErrors.push("Teléfono 1: contiene caracteres inválidos")
    }

    // Validar teléfono 2 requerido + formato
    if (!newContacto.telefono2?.trim()) {
      errors.telefono2 = "El Teléfono 2 es requerido"
      detailedErrors.push("Teléfono 2: es requerido")
    } else if (!/^[\d\s+\-()#*.,.]+$/.test(newContacto.telefono2)) {
      errors.telefono2 = "Teléfono 2: solo números y caracteres válidos (+, -, (), #, *, .)"
      detailedErrors.push("Teléfono 2: contiene caracteres inválidos")
    }

    // Validar celular requerido
    if (!newContacto.celular?.trim()) {
      errors.celular = "El Celular es requerido"
      detailedErrors.push("Celular: es requerido")
    }

    // Validar email requerido + formato
    if (!newContacto.email?.trim()) {
      errors.email = "El Email es requerido"
      detailedErrors.push("Email: es requerido")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContacto.email)) {
      errors.email = "Email: formato inválido (ej: correo@ejemplo.com)"
      detailedErrors.push("Email: formato inválido")
    }

    // Validar comentario requerido
    if (!newContacto.comentario?.trim()) {
      errors.comentario = "El Comentario es requerido"
      detailedErrors.push("Comentario: es requerido")
    }

    // Validar valViaje es número válido (decimal)
    const valViajeNum = parseFloat(newContacto.valViaje || "0")
    if (isNaN(valViajeNum)) {
      errors.valViaje = "Valor de Viaje debe ser un número válido"
      detailedErrors.push("ValViaje: debe ser número válido")
    }

    // Si hay errores, mostrar y RETORNAR (NO AGREGAR)
    if (Object.keys(errors).length > 0) {
      setContactoFieldErrors(errors)
      const detailedMsg = detailedErrors.join(" | ")
      setValidationErrorContacto(`❌ ${detailedMsg}`)
      return
    }

    // ============ AGREGAR EXITOSAMENTE ============
    const uid = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    change("contactos", [
      ...contactos,
      {
        ...newContacto,
        agencodigo: (newContacto.agencodigo || firstAgenciaCodigo || "1").trim(),
        valViaje: parseFloat(newContacto.valViaje || "0"), // Normalizar a número
        ciacodigo: data.ciacodigo || "",
        clicodigo: data.clicodigo || "",
        _uid: uid,
      },
    ])

    // ============ LIMPIAR COMPLETAMENTE (POST-AGREGAR) ============
    // Sin validaciones, sin errores, formulario vacío
    setValidationErrorContacto("") // Limpiar alert de validación
    setContactoFieldErrors({}) // Limpiar errores de campos
    setNewContacto({
      // Resetear formulario
      agencodigo: firstAgenciaCodigo,
      contacto: "",
      cargo: "",
      telPref1: "",
      telefono1: "",
      ext1: "",
      celular: "",
      email: "",
      area: "",
      comentario: "",
      telefono2: "",
      valViaje: "0.00",
      externo: "",
    })
  }

  const handleRemoveContacto = (idx) =>
    change(
      "contactos",
      contactos.filter((_, i) => i !== idx),
    )

  return (
    <Section title="Agencias">
      {errors.agencias && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => {}}>
            {errors.agencias}
          </Alert>
        </Box>
      )}
      {validationErrorAgencia && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setValidationErrorAgencia("")}>
            {validationErrorAgencia}
          </Alert>
        </Box>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={2}>
          <Field
            label="Código"
            name="ag_codigo"
            value={newAgencia.codigo}
            onChange={(n, v) => setNewAgenciaField("codigo", v)}
            readOnly={true}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Nombre / Descripción"
            name="ag_descripcion"
            value={newAgencia.descripcion}
            onChange={(n, v) => setNewAgenciaField("descripcion", v)}
            readOnly={readOnly}
            error={!!agenciaFieldErrors.descripcion}
            helperText={agenciaFieldErrors.descripcion}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field
            label="Dirección"
            name="ag_direccion"
            value={newAgencia.direccion}
            onChange={(n, v) => setNewAgenciaField("direccion", v)}
            readOnly={readOnly}
            error={!!agenciaFieldErrors.direccion}
            helperText={agenciaFieldErrors.direccion}
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <Field
            label="Tel Pref1"
            name="ag_telPref1"
            value={newAgencia.telPref1}
            onChange={(n, v) => setNewAgenciaField("telPref1", v)}
            readOnly={readOnly}
            select
            options={prefijoOptions}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Teléfono1"
            name="ag_telefono1"
            value={newAgencia.telefono1}
            onChange={(n, v) => setNewAgenciaField("telefono1", v)}
            readOnly={readOnly}
            error={!!agenciaFieldErrors.telefono1}
            helperText={agenciaFieldErrors.telefono1}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Ext1"
            name="ag_ext1"
            value={newAgencia.ext1}
            onChange={(n, v) => setNewAgenciaField("ext1", v)}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Tel Pref2"
            name="ag_telPref2"
            value={newAgencia.telPref2}
            onChange={(n, v) => setNewAgenciaField("telPref2", v)}
            readOnly={readOnly}
            select
            options={prefijoOptions}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Teléfono2"
            name="ag_telefono2"
            value={newAgencia.telefono2}
            onChange={(n, v) => setNewAgenciaField("telefono2", v)}
            readOnly={readOnly}
            error={!!agenciaFieldErrors.telefono2}
            helperText={agenciaFieldErrors.telefono2}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Ext2"
            name="ag_ext2"
            value={newAgencia.ext2}
            onChange={(n, v) => setNewAgenciaField("ext2", v)}
            readOnly={readOnly}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Field
            label="Email"
            name="ag_email"
            value={newAgencia.email}
            onChange={(n, v) => setNewAgenciaField("email", v)}
            readOnly={readOnly}
            error={!!agenciaFieldErrors.email}
            helperText={agenciaFieldErrors.email}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Ciudad"
            name="ag_ciudad"
            value={newAgencia.ciudad}
            onChange={(n, v) => setNewAgenciaField("ciudad", v)}
            readOnly={readOnly}
            select
            options={selectOptions?.ciudad || []}
          />
        </Grid>

        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddAgencia}
            disabled={readOnly}
          >
            Agregar Agencia
          </Button>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Tel Pref1</TableCell>
                  <TableCell>Teléfono1</TableCell>
                  <TableCell>Ext1</TableCell>
                  <TableCell>Tel Pref2</TableCell>
                  <TableCell>Teléfono2</TableCell>
                  <TableCell>Ext2</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Ciudad</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agencias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
                      No hay agencias
                    </TableCell>
                  </TableRow>
                ) : (
                  agencias.map((a, idx) => (
                    <TableRow key={a._uid || idx} sx={{ backgroundColor: idx % 2 ? "action.hover" : "inherit" }}>
                      <TableCell
                        sx={{ color: !a.codigo ? "error.main" : "inherit", fontWeight: !a.codigo ? 600 : 400 }}
                      >
                        {a.codigo ? a.codigo : "Sin código"}
                      </TableCell>
                      <TableCell>{a.descripcion || ""}</TableCell>
                      <TableCell>{a.direccion || ""}</TableCell>
                      <TableCell>{a.telPref1 || ""}</TableCell>
                      <TableCell>{a.telefono1 || ""}</TableCell>
                      <TableCell>{a.ext1 || ""}</TableCell>
                      <TableCell>{a.telPref2 || ""}</TableCell>
                      <TableCell>{a.telefono2 || ""}</TableCell>
                      <TableCell>{a.ext2 || ""}</TableCell>
                      <TableCell>{a.email || ""}</TableCell>
                      <TableCell>{a.ciudad || ""}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveAgencia(idx)}
                          disabled={readOnly}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12}>
          {/* Contactos block */}
          {validationErrorContacto && (
            <Alert severity="error" onClose={() => setValidationErrorContacto("")} sx={{ mb: 2 }}>
              {validationErrorContacto}
            </Alert>
          )}
          <Box mt={2} mb={1} />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Field
            label="Contacto"
            name="newContacto_contacto"
            value={newContacto.contacto}
            onChange={(n, v) => setNewContactoField("contacto", v)}
            readOnly={readOnly}
            error={!!contactoFieldErrors.contacto}
            helperText={contactoFieldErrors.contacto}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Cargo"
            name="newContacto_cargo"
            value={newContacto.cargo}
            onChange={(n, v) => setNewContactoField("cargo", v)}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Email"
            name="newContacto_email"
            value={newContacto.email}
            onChange={(n, v) => setNewContactoField("email", v)}
            readOnly={readOnly}
            error={!!contactoFieldErrors.email}
            helperText={contactoFieldErrors.email}
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <Field
            label="Tel Pref1"
            name="newContacto_telPref1"
            value={newContacto.telPref1}
            onChange={(n, v) => setNewContactoField("telPref1", v)}
            readOnly={readOnly}
            select
            options={prefijoOptions}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Teléfono1"
            name="newContacto_telefono1"
            value={newContacto.telefono1}
            onChange={(n, v) => setNewContactoField("telefono1", v)}
            readOnly={readOnly}
            error={!!contactoFieldErrors.telefono1}
            helperText={contactoFieldErrors.telefono1}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Ext1"
            name="newContacto_ext1"
            value={newContacto.ext1}
            onChange={(n, v) => setNewContactoField("ext1", v)}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Cel"
            name="newContacto_celular"
            value={newContacto.celular}
            onChange={(n, v) => setNewContactoField("celular", v)}
            readOnly={readOnly}
            error={!!contactoFieldErrors.celular}
            helperText={contactoFieldErrors.celular}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Teléfono2"
            name="newContacto_telefono2"
            value={newContacto.telefono2}
            onChange={(n, v) => setNewContactoField("telefono2", v)}
            readOnly={readOnly}
            error={!!contactoFieldErrors.telefono2}
            helperText={contactoFieldErrors.telefono2}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Area"
            name="newContacto_area"
            value={newContacto.area}
            onChange={(n, v) => setNewContactoField("area", v)}
            readOnly={readOnly}
            select
            options={selectOptions?.areasdescri || selectOptions?.areas || []}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="ValViaje"
            name="newContacto_valViaje"
            value={newContacto.valViaje}
            onChange={(n, v) => setNewContactoField("valViaje", v)}
            readOnly={readOnly}
            error={!!contactoFieldErrors.valViaje}
            helperText={contactoFieldErrors.valViaje}
            type="number"
            inputProps={{ step: "0.01" }}
          />
        </Grid>

        <Grid item xs={12}>
          <Field
            label="Comentario"
            name="newContacto_comentario"
            value={newContacto.comentario}
            onChange={(n, v) => setNewContactoField("comentario", v)}
            readOnly={readOnly}
            error={!!contactoFieldErrors.comentario}
            helperText={contactoFieldErrors.comentario}
          />
        </Grid>

        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddContacto}
            disabled={readOnly}
          >
            Agregar Contacto
          </Button>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Agencia</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Cargo</TableCell>
                  <TableCell>Tel Pref1</TableCell>
                  <TableCell>Teléfono1</TableCell>
                  <TableCell>Ext1</TableCell>
                  <TableCell>Cel</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>ValViaje</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contactos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      No hay contactos
                    </TableCell>
                  </TableRow>
                ) : (
                  contactos.map((c, idx) => (
                    <TableRow key={c._uid || idx} sx={{ backgroundColor: idx % 2 ? "action.hover" : "inherit" }}>
                      <TableCell>{c.agencodigo || ""}</TableCell>
                      <TableCell>{c.contacto || ""}</TableCell>
                      <TableCell>{c.cargo || ""}</TableCell>
                      <TableCell>{c.telPref1 || ""}</TableCell>
                      <TableCell>{c.telefono1 || ""}</TableCell>
                      <TableCell>{c.ext1 || ""}</TableCell>
                      <TableCell>{c.celular || ""}</TableCell>
                      <TableCell>{c.email || ""}</TableCell>
                      <TableCell>{c.area || ""}</TableCell>
                      <TableCell>{c.valViaje || ""}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveContacto(idx)}
                          disabled={readOnly}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Region / Zone / Province / Canton fields on the right as in screenshot */}
        <Grid item xs={12} sm={3}>
          <Field
            label="Región"
            name="regcodigo"
            value={data.regcodigo}
            onChange={change}
            readOnly={readOnly}
            select
            options={selectOptions?.region || []}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Zona"
            name="zoncodigo"
            value={data.zoncodigo}
            onChange={change}
            readOnly={readOnly}
            select
            options={selectOptions?.zona || []}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Provincia"
            name="procodigo"
            value={data.procodigo}
            onChange={change}
            readOnly={readOnly}
            select
            options={selectOptions?.provincia || []}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Cantón"
            name="ciucodigo"
            value={data.ciucodigo}
            onChange={change}
            readOnly={readOnly}
            select
            options={selectOptions?.ciudad || []}
          />
        </Grid>
      </Grid>
    </Section>
  )
}

export default AgenciasSection
