import React, { useState } from "react"
import {
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Radio,
  Typography,
  Box,
} from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"
import CustomDatePicker from "../../../../components/CustomDatePicker"
import { api } from "../../../../api"
import Swal from "sweetalert2"

const TabImportarDocumento = ({ tiposDoc, selectedDocUuid, setSelectedDocUuid }) => {
  const [resultados, setResultados] = useState([])

  // Filtros de búsqueda solicitados
  const [extension, setExtension] = useState("")
  const [qgenero, setQgenero] = useState("")
  const [nombre, setNombre] = useState("")
  const [fecemi, setFecemi] = useState(null)
  const [fecven, setFecven] = useState(null)
  const [observacion, setObservacion] = useState("")
  const [idx2, setIdx2] = useState("")
  const [idx3, setIdx3] = useState("")
  const [idx4, setIdx4] = useState("")
  const [idx5, setIdx5] = useState("")
  const [idx6, setIdx6] = useState("")

  const handleBuscar = async () => {
    try {
      const payload = {
        docextension: extension,
        docqgenero: qgenero,
        docnombre: nombre,
        docfecemi: fecemi ? fecemi.format("YYYY-MM-DD") : null,
        docfecven: fecven ? fecven.format("YYYY-MM-DD") : null,
        docindex1: observacion,
        docindex2: idx2,
        docindex3: idx3,
        docindex4: idx4,
        docindex5: idx5,
        docindex6: idx6,
      }

      const res = await api.post("/DocumentosAsociadosComponent/buscarDocumentosParaImportar", payload)
      setResultados(res.data.data || [])
      if (res.data.data.length === 0) {
        Swal.fire("Info", "No se encontraron documentos con esos criterios", "info")
      }
    } catch (error) {
      Swal.fire("Error", "Fallo al consultar catálogo histórico", "error")
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary">
          Filtros de Búsqueda Histórica
        </Typography>
      </Grid>

      <Grid item xs={3}>
        <TextField
          fullWidth
          label="Extensión"
          value={extension}
          onChange={(e) => setExtension(e.target.value)}
          size="small"
          placeholder="pdf, txt, p12"
        />
      </Grid>
      <Grid item xs={3}>
        <TextField
          fullWidth
          label="Código Entidad"
          value={qgenero}
          onChange={(e) => setQgenero(e.target.value)}
          size="small"
          placeholder="Cliente, Prov..."
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Nombre Archivo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          size="small"
        />
      </Grid>

      <Grid item xs={6}>
        <CustomDatePicker label="Fecha Emisión" value={fecemi} setValue={setFecemi} isOptional />
      </Grid>
      <Grid item xs={6}>
        <CustomDatePicker label="Fecha Vencimiento" value={fecven} setValue={setFecven} isOptional />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Observación (DocIndex1)"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          size="small"
        />
      </Grid>

      {[2, 3, 4, 5, 6].map((num) => (
        <Grid item xs={12} sm={2.4} key={num}>
          <TextField
            select
            fullWidth
            label={`Etiqueta ${num}`}
            value={num === 2 ? idx2 : num === 3 ? idx3 : num === 4 ? idx4 : num === 5 ? idx5 : idx6}
            onChange={(e) => {
              const v = e.target.value
              num === 2
                ? setIdx2(v)
                : num === 3
                  ? setIdx3(v)
                  : num === 4
                    ? setIdx4(v)
                    : num === 5
                      ? setIdx5(v)
                      : setIdx6(v)
            }}
            size="small"
          >
            <MenuItem value="">
              <em>Ninguno</em>
            </MenuItem>
            {tiposDoc?.data?.map((t) => (
              <MenuItem key={t.tipdoccodigo} value={t.tipdoccodigo}>
                {t.tipdocdescri}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      ))}

      <Grid item xs={12} display="flex" justifyContent="flex-end">
        <Button variant="contained" color="primary" startIcon={<SearchIcon />} onClick={handleBuscar}>
          Buscar Historial
        </Button>
      </Grid>

      {/* REJILLA DE SELECCIÓN */}
      {resultados.length > 0 && (
        <Grid item xs={12}>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell align="center" width={50}>
                    <b>Sel.</b>
                  </TableCell>
                  <TableCell>
                    <b>Nombre del Documento</b>
                  </TableCell>
                  <TableCell>
                    <b>Ext.</b>
                  </TableCell>
                  <TableCell>
                    <b>Dueño Original</b>
                  </TableCell>
                  <TableCell>
                    <b>Observación</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resultados.map((row) => (
                  <TableRow
                    key={row.documentouuid}
                    hover
                    onClick={() => setSelectedDocUuid(row.documentouuid)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell align="center">
                      <Radio
                        checked={selectedDocUuid === row.documentouuid}
                        onChange={() => setSelectedDocUuid(row.documentouuid)}
                        value={row.documentouuid}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{row.docnombre}</TableCell>
                    <TableCell style={{ textTransform: "uppercase" }}>
                      <b>{row.docextension}</b>
                    </TableCell>
                    <TableCell>
                      {row.docqgenero} ({row.docprocqgenero})
                    </TableCell>
                    <TableCell>{row.docindex1 || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      )}
    </Grid>
  )
}

export default TabImportarDocumento
