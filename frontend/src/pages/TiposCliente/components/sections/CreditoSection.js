import { useState } from "react"
import {
  Grid,
  Box,
  Divider,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TableContainer,
  Paper,
  Alert,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import CustomHelperDetail from "../../../../components/CustomHelperDetail"

const tipoCuentaOptions = [
  { value: "CORRIENTE", label: "CORRIENTE" },
  { value: "AHORROS", label: "AHORROS" },
  { value: "TARJETA", label: "TARJETA" },
]

const CreditoSection = ({ data = {}, change, readOnly, Field, Section, selectOptions = {} }) => {
  const refsBancarias = Array.isArray(data.refBancarias) ? data.refBancarias : []
  const [newRef, setNewRef] = useState({
    tipoCuenta: "CORRIENTE",
    banco: "",
    codigo: "",
    descripcion: "",
    numero: "",
    calificacion: "",
    fechaApertura: "",
  })

  const [validationError, setValidationError] = useState("")

  const setNewRefField = (name, value) => setNewRef((prev) => ({ ...prev, [name]: value }))

  const handleAddRef = () => {
    if (!newRef.codigo?.trim()) {
      setValidationError("El Código de Banco/Tarjeta es requerido")
      return
    }
    if (!newRef.numero?.trim()) {
      setValidationError("El Número de Cuenta/Tarjeta es requerido")
      return
    }
    setValidationError("")
    const uid = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    change("refBancarias", [
      ...refsBancarias,
      {
        ...newRef,
        ciacodigo: data.ciacodigo || "",
        clicodigo: data.clicodigo || "",
        _uid: uid,
      },
    ])
  }

  const handleRemoveRef = (idx) =>
    change(
      "refBancarias",
      refsBancarias.filter((_, i) => i !== idx),
    )

  return (
    <Section title="Crédito">
      {validationError && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setValidationError("")}>
            {validationError}
          </Alert>
        </Box>
      )}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Field
            label="Plazo Máximo en Días"
            name="clidiascrs"
            value={data.clidiascrs}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Cupo (Límite de Crédito)"
            name="climontocrs"
            value={data.climontocrs}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box display="flex" gap={2}>
            <Field
              label="Bloqueo de Crédito"
              name="clibloqueo"
              value={data.clibloqueo}
              onChange={change}
              readOnly={readOnly}
              type="checkbox"
            />
            <Field
              label="Aplica I.V.A.?"
              name="cliapliiva"
              value={data.cliapliiva}
              onChange={change}
              readOnly={readOnly}
              type="checkbox"
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Field
            label="Lista de Precios al facturar"
            name="cliprefac"
            value={data.cliprefac}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Oficial de Crédito"
            name="usrcodigo"
            value={data.usrcodigo}
            onChange={change}
            readOnly={readOnly}
            select
            options={selectOptions?.usuario || []}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Fecha de Primera Factura"
            name="fecenvioxml"
            value={data.fecenvioxml}
            onChange={change}
            readOnly={readOnly}
            type="date"
          />
        </Grid>

        <Grid item xs={12}>
          <Divider />
          <Typography variant="subtitle2" color="primary">
            Referencias familiares o personales
          </Typography>
        </Grid>

        <Grid item xs={12} sm={8}>
          <Field
            label="1.)"
            name="clireferencia1"
            value={data.clireferencia1}
            onChange={change}
            readOnly={readOnly}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Parentesco"
            name="cliparentesco1"
            value={data.cliparentesco1}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Teléfono"
            name="clireftelefono1"
            value={data.clireftelefono1}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>

        <Grid item xs={12} sm={8}>
          <Field
            label="2.)"
            name="clireferencia2"
            value={data.clireferencia2}
            onChange={change}
            readOnly={readOnly}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Parentesco"
            name="cliparentesco2"
            value={data.cliparentesco2}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Teléfono"
            name="clireftelefono2"
            value={data.clireftelefono2}
            onChange={change}
            readOnly={readOnly}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider />
          <Typography variant="subtitle2" color="primary">
            Referencias Bancarias
          </Typography>
        </Grid>

        <Grid item xs={12} sm={2}>
          <Field
            label="Tipo de Cuenta"
            name="newRef_tipoCuenta"
            value={newRef.tipoCuenta}
            onChange={(n, v) => setNewRefField("tipoCuenta", v)}
            readOnly={readOnly}
            select
            options={tipoCuentaOptions}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          {newRef.tipoCuenta === "TARJETA" ? (
            <CustomHelperDetail
              label="Banco/Tarjeta"
              valueSearched={newRef.banco}
              endpoint="/TiposCliente/getTarjetas"
              valueInputMain="tarjcodigo"
              valueInputSecondary="tarjdescri"
              idSearchField="tarjcodigo"
              errorMsgIdSearch="Error obteniendo tarjeta"
              errorMsgFilterSearch="Error al cargar tarjetas"
              queryKeyModal="TarjetasTiposCliente"
              placeholderInputMain="Código"
              placeholderInputSecondary="Descripción"
              columnsTable={[
                { accessorKey: "tarjcodigo", header: "Código", size: 100 },
                { accessorKey: "tarjdescri", header: "Descripción", size: 300 },
              ]}
              sxInputMain={{ width: 100 }}
              sxInputSecondary={{ width: { xs: "100%", md: 200 } }}
              onHandleSelectedData={(obj) => {
                if (obj && Object.keys(obj).length > 0) {
                  setNewRefField("banco", obj.tarjcodigo || "")
                  setNewRefField("codigo", obj.tarjcodigo || "")
                  setNewRefField("descripcion", obj.tarjdescri || "")
                }
              }}
            />
          ) : (
            <CustomHelperDetail
              label="Banco/Tarjeta"
              valueSearched={newRef.banco}
              endpoint="/TiposCliente/getBancos"
              valueInputMain="bcocodigo"
              valueInputSecondary="bcodescri"
              idSearchField="bcocodigo"
              errorMsgIdSearch="Error obteniendo banco"
              errorMsgFilterSearch="Error al cargar bancos"
              queryKeyModal="BancosTiposCliente"
              placeholderInputMain="Código"
              placeholderInputSecondary="Descripción"
              columnsTable={[
                { accessorKey: "bcocodigo", header: "Código", size: 100 },
                { accessorKey: "bcodescri", header: "Descripción", size: 300 },
              ]}
              sxInputMain={{ width: 100 }}
              sxInputSecondary={{ width: { xs: "100%", md: 200 } }}
              onHandleSelectedData={(obj) => {
                if (obj && Object.keys(obj).length > 0) {
                  setNewRefField("banco", obj.bcocodigo || "")
                  setNewRefField("codigo", obj.bcocodigo || "")
                  setNewRefField("descripcion", obj.bcodescri || "")
                }
              }}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Código"
            name="newRef_codigo"
            value={newRef.codigo}
            onChange={(n, v) => setNewRefField("codigo", v)}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Número de Cuenta/Tarjeta"
            name="newRef_numero"
            value={newRef.numero}
            onChange={(n, v) => setNewRefField("numero", v)}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={1}>
          <Field
            label="Calificación"
            name="newRef_calificacion"
            value={newRef.calificacion}
            onChange={(n, v) => setNewRefField("calificacion", v)}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={1}>
          <Field
            label="Fec.Apertura"
            name="newRef_fechaApertura"
            value={newRef.fechaApertura}
            onChange={(n, v) => setNewRefField("fechaApertura", v)}
            readOnly={readOnly}
            type="date"
          />
        </Grid>

        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddRef} disabled={readOnly}>
            Agregar
          </Button>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220 }}>
            <Table size="small" stickyHeader sx={{ "& td, & th": { py: 0.6, fontSize: "0.95rem" } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Banco/Tarjeta</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Nº Cuenta/Tarjeta</TableCell>
                  <TableCell>Calificación</TableCell>
                  <TableCell>Fecha Apertura</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {refsBancarias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay referencias bancarias
                    </TableCell>
                  </TableRow>
                ) : (
                  refsBancarias.map((r, idx) => (
                    <TableRow key={r._uid || idx} sx={{ backgroundColor: idx % 2 ? "action.hover" : "inherit" }}>
                      <TableCell>{r.tipoCuenta || ""}</TableCell>
                      <TableCell>{r.descripcion || r.banco || r.codigo || ""}</TableCell>
                      <TableCell>{r.codigo || ""}</TableCell>
                      <TableCell>{r.numero || ""}</TableCell>
                      <TableCell>{r.calificacion || ""}</TableCell>
                      <TableCell>{r.fechaApertura || ""}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => handleRemoveRef(idx)} disabled={readOnly}>
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
      </Grid>
    </Section>
  )
}

export default CreditoSection
