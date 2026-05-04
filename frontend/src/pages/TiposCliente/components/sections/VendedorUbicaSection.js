import { useState } from "react"
import {
  Grid,
  Box,
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

const VendedorUbicaSection = ({ data = {}, change, readOnly, Field, Section, selectOptions = {} }) => {
  const vendedores = Array.isArray(data.vendedores) ? data.vendedores : []

  const [newVendor, setNewVendor] = useState({
    codigo: "",
    nombre: "",
    codLocalidad: "",
    descLocalidad: "",
    local: data.clinumestable || "",
  })

  const [validationError, setValidationError] = useState("")

  const handleAddVendor = () => {
    if (!newVendor.codigo?.trim()) {
      setValidationError("El Código de Vendedor es requerido")
      return
    }
    if (!newVendor.codLocalidad?.trim()) {
      setValidationError("El Código de Localidad es requerido")
      return
    }

    const localityToAdd = String(newVendor.codLocalidad || newVendor.loccodigo || newVendor.local || "").trim()
    const duplicatedLocality = vendedores.some(
      (vendor) => String(vendor?.codLocalidad || vendor?.loccodigo || vendor?.local || "").trim() === localityToAdd,
    )
    if (duplicatedLocality) {
      setValidationError("No se puede repetir la Localidad en Vendedor/Ubicación")
      return
    }

    setValidationError("")
    const uid = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    change("vendedores", [
      ...vendedores,
      { ...newVendor, ciacodigo: data.ciacodigo || "", clicodigo: data.clicodigo || "", _uid: uid },
    ])
  }

  const handleRemoveVendor = (index) => {
    const next = vendedores.filter((_, i) => i !== index)
    change("vendedores", next)
  }

  return (
    <Section title="Vendedor / Ubicación">
      {validationError && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setValidationError("")}>
            {validationError}
          </Alert>
        </Box>
      )}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <CustomHelperDetail
            label="Vendedor"
            valueSearched={newVendor.codigo}
            endpoint="/TiposCliente/getVendedores"
            valueInputMain="vencodigo"
            valueInputSecondary="vennombre"
            idSearchField="vencodigo"
            errorMsgIdSearch="Error obteniendo vendedor"
            errorMsgFilterSearch="Error al cargar vendedores"
            queryKeyModal="VendedoresTiposCliente"
            placeholderInputMain="Código"
            placeholderInputSecondary="Nombre"
            columnsTable={[
              { accessorKey: "vencodigo", header: "Código", size: 100 },
              { accessorKey: "vennombre", header: "Nombre", size: 300 },
            ]}
            sxInputMain={{ width: 100 }}
            sxInputSecondary={{ width: { xs: "100%", md: 200 } }}
            onHandleSelectedData={(obj) => {
              if (obj && Object.keys(obj).length > 0) {
                setNewVendor((p) => ({
                  ...p,
                  codigo: obj.vencodigo || "",
                  nombre: obj.vennombre || "",
                }))
              }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <CustomHelperDetail
            label="Local"
            valueSearched={newVendor.local}
            endpoint="/TiposCliente/getLocalidades"
            valueInputMain="loccodigo"
            valueInputSecondary="locdescri"
            idSearchField="loccodigo"
            errorMsgIdSearch="Error obteniendo localidad"
            errorMsgFilterSearch="Error al cargar localidades"
            queryKeyModal="LocalidadesTiposCliente"
            placeholderInputMain="Código"
            placeholderInputSecondary="Localidad"
            columnsTable={[
              { accessorKey: "loccodigo", header: "Código", size: 100 },
              { accessorKey: "locdescri", header: "Localidad", size: 300 },
            ]}
            sxInputMain={{ width: 100 }}
            sxInputSecondary={{ width: { xs: "100%", md: 200 } }}
            onHandleSelectedData={(obj) => {
              if (obj && Object.keys(obj).length > 0) {
                setNewVendor((p) => ({
                  ...p,
                  codLocalidad: obj.loccodigo || "",
                  descLocalidad: obj.locdescri || "",
                  local: obj.loccodigo || "",
                }))
              }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={4} display="flex" justifyContent="flex-end">
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddVendor} disabled={readOnly}>
            Agregar
          </Button>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220 }}>
            <Table size="small" stickyHeader sx={{ "& td, & th": { py: 0.5, fontSize: "0.9rem" } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Código Vendedor</TableCell>
                  <TableCell>Nombre del Vendedor</TableCell>
                  <TableCell>Código Localidad</TableCell>
                  <TableCell>Descripción de la Localidad</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No hay vendedores
                    </TableCell>
                  </TableRow>
                ) : (
                  vendedores.map((v, idx) => (
                    <TableRow key={v._uid || idx} sx={{ backgroundColor: idx % 2 ? "action.hover" : "inherit" }}>
                      <TableCell>{v.codigo || v.vencodigo || ""}</TableCell>
                      <TableCell>{v.nombre || v.vennombre || ""}</TableCell>
                      <TableCell>{v.codLocalidad || v.loccodigo || v.local || ""}</TableCell>
                      <TableCell>{v.descLocalidad || v.locdescri || ""}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveVendor(idx)}
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
            label="Parroquia"
            name="parrocodigo"
            value={data.parrocodigo}
            onChange={change}
            readOnly={readOnly}
            select
            options={selectOptions?.parroquia || []}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Actividad Económica"
            name="activicodigo"
            value={data.activicodigo}
            onChange={change}
            readOnly={readOnly}
            select
            options={selectOptions?.actividad || []}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Sector"
            name="sectorcodigo"
            value={data.sectorcodigo}
            onChange={change}
            readOnly={readOnly}
            select
            options={selectOptions?.sector || []}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Field
            label="Cantón Domicilio"
            name="clinumestable"
            value={data.clinumestable}
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

export default VendedorUbicaSection
