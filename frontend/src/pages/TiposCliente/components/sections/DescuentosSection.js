import { useState } from "react"
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
  Select,
  MenuItem,
  TableContainer,
  Paper,
  Alert,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import CustomHelperDetail from "../../../../components/CustomHelperDetail"

const DescuentosSection = ({ data = {}, change, readOnly, Field, Section, selectOptions = {} }) => {
  const lineas = Array.isArray(data.descuentosLineas) ? data.descuentosLineas : []
  const articulos = Array.isArray(data.descuentosArticulos) ? data.descuentosArticulos : []

  const [newLinea, setNewLinea] = useState({
    linea: "",
    marca: "",
    porcentaje: "",
    listaPrecios: "",
    descripcionLinea: "",
    tipo: "",
    descripcionMarca: "",
  })
  const [newArticulo, setNewArticulo] = useState({
    articulo: "",
    descripcion: "",
    invcodigo: "",
    porcentaje: "",
    listaPrecios: "",
  })

  const [validationErrorLinea, setValidationErrorLinea] = useState("")
  const [validationErrorArticulo, setValidationErrorArticulo] = useState("")

  const setNewLineaField = (name, value) => setNewLinea((p) => ({ ...p, [name]: value }))
  const setNewArticuloField = (name, value) => setNewArticulo((p) => ({ ...p, [name]: value }))

  const handleAddLinea = () => {
    if (!newLinea.linea?.trim()) {
      setValidationErrorLinea("La Línea es requerida")
      return
    }
    if (!newLinea.porcentaje || parseFloat(newLinea.porcentaje) <= 0) {
      setValidationErrorLinea("El Porcentaje debe ser mayor a 0")
      return
    }
    if (!newLinea.listaPrecios || newLinea.listaPrecios === "") {
      setValidationErrorLinea("La Lista/Precios es requerida")
      return
    }
    setValidationErrorLinea("")
    const uid = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    change("descuentosLineas", [
      ...lineas,
      {
        ...newLinea,
        listaPrecios: parseInt(newLinea.listaPrecios),
        ciacodigo: data.ciacodigo || "",
        clicodigo: data.clicodigo || "",
        _uid: uid,
      },
    ])
    setNewLinea({
      linea: newLinea.linea || "",
      marca: newLinea.marca || "",
      porcentaje: "",
      listaPrecios: "",
      descripcionLinea: "",
      tipo: "",
      descripcionMarca: "",
    })
  }

  const handleRemoveLinea = (idx) =>
    change(
      "descuentosLineas",
      lineas.filter((_, i) => i !== idx),
    )

  const handleAddArticulo = () => {
    if (!newArticulo.articulo?.trim()) {
      setValidationErrorArticulo("El Artículo es requerido")
      return
    }
    if (!newArticulo.porcentaje || parseFloat(newArticulo.porcentaje) <= 0) {
      setValidationErrorArticulo("El Porcentaje debe ser mayor a 0")
      return
    }
    if (!newArticulo.listaPrecios || newArticulo.listaPrecios === "") {
      setValidationErrorArticulo("La Lista/Precios es requerida")
      return
    }
    setValidationErrorArticulo("")
    const uid = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    change("descuentosArticulos", [
      ...articulos,
      {
        ...newArticulo,
        listaPrecios: parseInt(newArticulo.listaPrecios),
        ciacodigo: data.ciacodigo || "",
        clicodigo: data.clicodigo || "",
        _uid: uid,
      },
    ])
    setNewArticulo({
      articulo: newArticulo.articulo || "",
      descripcion: newArticulo.descripcion || "",
      invcodigo: newArticulo.invcodigo || "",
      porcentaje: "",
      listaPrecios: "",
    })
  }

  const handleRemoveArticulo = (idx) =>
    change(
      "descuentosArticulos",
      articulos.filter((_, i) => i !== idx),
    )

  return (
    <Section title="Descuentos">
      {validationErrorLinea && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setValidationErrorLinea("")}>
            {validationErrorLinea}
          </Alert>
        </Box>
      )}
      {/* Línea block */}
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={12} sm={4}>
          <CustomHelperDetail
            label="Línea"
            valueSearched={newLinea.linea}
            endpoint="/TiposCliente/getLineas"
            valueInputMain="lincodigo"
            valueInputSecondary="lindescri"
            idSearchField="lincodigo"
            errorMsgIdSearch="Error obteniendo línea"
            errorMsgFilterSearch="Error al cargar líneas"
            queryKeyModal="LineasTiposCliente"
            placeholderInputMain="Código"
            placeholderInputSecondary="Descripción"
            columnsTable={[
              { accessorKey: "lincodigo", header: "Código", size: 100 },
              { accessorKey: "lindescri", header: "Descripción", size: 300 },
              { accessorKey: "lintipo", header: "Tipo", size: 80 },
            ]}
            sxInputMain={{ width: 100 }}
            sxInputSecondary={{ width: { xs: "100%", md: 200 } }}
            onHandleSelectedData={(obj) => {
              if (obj && Object.keys(obj).length > 0) {
                setNewLineaField("linea", obj.lincodigo || "")
                setNewLineaField("descripcionLinea", obj.lindescri || "")
                setNewLineaField("tipo", obj.lintipo || "")
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <CustomHelperDetail
            label="Marca"
            valueSearched={newLinea.marca}
            endpoint="/TiposCliente/getMarcas"
            valueInputMain="marcodigo"
            valueInputSecondary="mardescri"
            idSearchField="marcodigo"
            errorMsgIdSearch="Error obteniendo marca"
            errorMsgFilterSearch="Error al cargar marcas"
            queryKeyModal="MarcasTiposCliente"
            placeholderInputMain="Código"
            placeholderInputSecondary="Descripción"
            columnsTable={[
              { accessorKey: "marcodigo", header: "Código", size: 100 },
              { accessorKey: "mardescri", header: "Descripción", size: 300 },
            ]}
            sxInputMain={{ width: 100 }}
            sxInputSecondary={{ width: { xs: "100%", md: 200 } }}
            onHandleSelectedData={(obj) => {
              if (obj && Object.keys(obj).length > 0) {
                setNewLineaField("marca", obj.marcodigo || "")
                setNewLineaField("descripcionMarca", obj.mardescri || "")
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Field
            label="Porcentaje"
            name="filter_porcentaje_linea"
            value={newLinea.porcentaje}
            onChange={(n, v) => setNewLineaField("porcentaje", v)}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box component="label" sx={{ fontSize: "0.75rem", fontWeight: 500, mb: 0.5, color: "rgba(0, 0, 0, 0.6)" }}>
              Lista/Precios
            </Box>
            <Select
              fullWidth
              value={newLinea.listaPrecios || ""}
              onChange={(e) => setNewLineaField("listaPrecios", e.target.value)}
              displayEmpty
              size="small"
              disabled={readOnly}
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <MenuItem key={num} value={String(num)}>
                  {num}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Grid>
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddLinea} disabled={readOnly}>
            Agregar
          </Button>
        </Grid>

        <Grid item xs={12} sx={{ mb: 4 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Línea</TableCell>
                  <TableCell>Descripción de Línea</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Marca</TableCell>
                  <TableCell>Descripción de Marca</TableCell>
                  <TableCell>Porcentaje Descuento</TableCell>
                  <TableCell>Lista de Precios</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No hay líneas
                    </TableCell>
                  </TableRow>
                ) : (
                  lineas.map((l, idx) => (
                    <TableRow key={l._uid || idx} sx={{ backgroundColor: idx % 2 ? "action.hover" : "inherit" }}>
                      <TableCell>{l.linea || ""}</TableCell>
                      <TableCell>{l.descripcionLinea || ""}</TableCell>
                      <TableCell>{l.tipo || ""}</TableCell>
                      <TableCell>{l.marca || ""}</TableCell>
                      <TableCell>{l.descripcionMarca || ""}</TableCell>
                      <TableCell>{l.porcentaje || ""}</TableCell>
                      <TableCell>{l.listaPrecios || ""}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveLinea(idx)}
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
      </Grid>

      {/* Artículo block */}
      {validationErrorArticulo && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" onClose={() => setValidationErrorArticulo("")}>
            {validationErrorArticulo}
          </Alert>
        </Box>
      )}
      <Box mt={4} />
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={12} sm={6}>
          <CustomHelperDetail
            label="Artículo"
            valueSearched={newArticulo.articulo}
            endpoint="/TiposCliente/getArticulos"
            valueInputMain="artcodigo"
            valueInputSecondary="artdescri"
            idSearchField="artcodigo"
            errorMsgIdSearch="Error obteniendo artículo"
            errorMsgFilterSearch="Error al cargar artículos"
            queryKeyModal="ArticulosTiposCliente"
            placeholderInputMain="Código"
            placeholderInputSecondary="Descripción"
            columnsTable={[
              { accessorKey: "artcodigo", header: "Código", size: 100 },
              { accessorKey: "artdescri", header: "Descripción", size: 300 },
              { accessorKey: "invcodigo", header: "Inventario", size: 100 },
            ]}
            sxInputMain={{ width: 100 }}
            sxInputSecondary={{ width: { xs: "100%", md: 250 } }}
            onHandleSelectedData={(obj) => {
              if (obj && Object.keys(obj).length > 0) {
                setNewArticuloField("articulo", obj.artcodigo || "")
                setNewArticuloField("descripcion", obj.artdescri || "")
                setNewArticuloField("invcodigo", obj.invcodigo || "")
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Field
            label="Porcentaje"
            name="filter_porcentaje_articulo"
            value={newArticulo.porcentaje}
            onChange={(n, v) => setNewArticuloField("porcentaje", v)}
            readOnly={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box component="label" sx={{ fontSize: "0.75rem", fontWeight: 500, mb: 0.5, color: "rgba(0, 0, 0, 0.6)" }}>
              Lista/Precios
            </Box>
            <Select
              fullWidth
              value={newArticulo.listaPrecios || ""}
              onChange={(e) => setNewArticuloField("listaPrecios", e.target.value)}
              displayEmpty
              size="small"
              disabled={readOnly}
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <MenuItem key={num} value={String(num)}>
                  {num}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Grid>
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddArticulo}
            disabled={readOnly}
          >
            Agregar
          </Button>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Artículo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Porcentaje Descuento</TableCell>
                  <TableCell>Lista de Precios</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {articulos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No hay artículos
                    </TableCell>
                  </TableRow>
                ) : (
                  articulos.map((a, idx) => (
                    <TableRow key={a._uid || idx} sx={{ backgroundColor: idx % 2 ? "action.hover" : "inherit" }}>
                      <TableCell>{a.articulo || ""}</TableCell>
                      <TableCell>{a.descripcion || a.descripcionArticulo || ""}</TableCell>
                      <TableCell>{a.porcentaje || ""}</TableCell>
                      <TableCell>{a.listaPrecios || ""}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveArticulo(idx)}
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
      </Grid>
    </Section>
  )
}

export default DescuentosSection
