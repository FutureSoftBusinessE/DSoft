import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Box, Paper, MenuItem, Select, FormControl, FormLabel, TextField } from "@mui/material"
import { api, showWarning } from "../../../api"
import ImagenTab from "../componente/ImagenTab"

const StyledRoot = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#f5f7fa",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}

const normalizeCheckboxValue = (value) => {
  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return 0
  return numericValue === 0 ? 0 : -1
}

const FormularioPlanServicio = forwardRef(
  (
    {
      initialData = {
        invcodigo: "",
        artcodigo: "",
        artdescri: "",
        artprecventa1: "",
        artapliiva: 0,
        artstatus: "A",
      },
      isLoading = false,
      onSubmit,
      modo = "crear",
    },
    ref,
  ) => {
    const [invcodigo, setInvcodigo] = useState("")
    const [artcodigo, setArtcodigo] = useState("")
    const [artdescri, setArtdescri] = useState("")
    const [artprecventa1, setArtprecventa1] = useState("")
    const [artapliiva, setArtapliiva] = useState(0)
    const [artstatus, setArtstatus] = useState("A")
    const [inventarios, setInventarios] = useState([])

    useEffect(() => {
      api
        .post("/PlanesServicios/getInventariosSelect")
        .then((response) => {
          const data = response.data?.data?.data
          setInventarios(Array.isArray(data) ? data : [])
        })
        .catch(() => setInventarios([]))
    }, [])

    useEffect(() => {
      // Solo en editar, pre-llenar datos
      if (modo === "editar" && initialData && initialData.invcodigo) {
        setInvcodigo(initialData.invcodigo)
        setArtcodigo(initialData.artcodigo || "")
        setArtdescri(initialData.artdescri || "")
        setArtprecventa1(String(initialData.artprecventa1 || ""))
        setArtapliiva(normalizeCheckboxValue(initialData.artapliiva))
        setArtstatus(initialData.artstatus || "A")
      }
    }, [modo, initialData])

    const handleInventarioChange = (e) => {
      setInvcodigo(e.target.value)
      // Limpiar otros campos al cambiar inventario
      if (!e.target.value) {
        setArtcodigo("")
        setArtdescri("")
        setArtprecventa1("")
        setArtapliiva(0)
      }
    }

    const handleSubmit = async (e) => {
      if (e) e.preventDefault()

      // Validaciones simples
      if (!invcodigo) {
        showWarning("Selecciona un inventario")
        return
      }
      if (!artcodigo || artcodigo.length > 15) {
        showWarning("Código artículo: máximo 15 caracteres")
        return
      }
      if (!artdescri || artdescri.length > 250) {
        showWarning("Descripción: máximo 250 caracteres")
        return
      }
      if (!artprecventa1 || isNaN(artprecventa1) || parseFloat(artprecventa1) <= 0) {
        showWarning("Precio debe ser un número mayor a 0")
        return
      }

      const payload =
        modo === "crear"
          ? {
              invcodigo,
              artcodigo,
              artdescri,
              artprecventa1: parseFloat(artprecventa1),
              artapliiva: normalizeCheckboxValue(artapliiva),
              artstatus: "A",
            }
          : {
              invcodigoOld: initialData.invcodigo,
              artcodigoOld: initialData.artcodigo,
              artdescriNew: artdescri,
              artprecventa1New: parseFloat(artprecventa1),
              artaplivaNew: normalizeCheckboxValue(artapliiva),
              artstatus,
            }

      try {
        await onSubmit(payload)
      } catch (error) {
        console.error("Error:", error)
      }
    }

    // Exponer el método submit al componente padre mediante ref
    useImperativeHandle(ref, () => ({
      handleSubmit,
    }))

    return (
      <Box sx={StyledRoot}>
        <Paper
          elevation={3}
          sx={{ p: 3, mb: 3, borderRadius: 3, background: "white" }}
          component="form"
          onSubmit={handleSubmit}
        >
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small" disabled={modo === "editar"}>
              <FormLabel>Inventario *</FormLabel>
              <Select value={invcodigo} onChange={handleInventarioChange} disabled={modo === "editar"}>
                {inventarios && inventarios.length > 0 ? (
                  inventarios.map((inv) => (
                    <MenuItem key={inv.value} value={inv.value}>
                      {inv.label}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">-- Selecciona un inventario --</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth size="small">
              <FormLabel>Código de Artículo *</FormLabel>
              <TextField
                value={artcodigo}
                onChange={(e) => setArtcodigo(e.target.value)}
                variant="outlined"
                size="small"
                disabled={modo === "editar"}
              />
            </FormControl>
          </Box>

          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth size="small">
              <FormLabel>Descripción *</FormLabel>
              <TextField
                value={artdescri}
                onChange={(e) => setArtdescri(e.target.value)}
                variant="outlined"
                multiline
                rows={2}
                size="small"
              />
            </FormControl>
          </Box>

          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth size="small">
              <FormLabel>Precio de Venta *</FormLabel>
              <TextField
                type="number"
                step="0.01"
                min="0"
                value={artprecventa1}
                onChange={(e) => setArtprecventa1(e.target.value)}
                variant="outlined"
                size="small"
              />
            </FormControl>
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small">
              <FormLabel>Aplica IVA</FormLabel>
              <Select value={artapliiva} onChange={(e) => setArtapliiva(normalizeCheckboxValue(e.target.value))}>
                <MenuItem value={0}>No</MenuItem>
                <MenuItem value={-1}>Sí</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small">
              <FormLabel>Estado</FormLabel>
              <Select value={artstatus} onChange={(e) => setArtstatus(e.target.value)} disabled={modo === "crear"}>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {invcodigo && artcodigo && modo === "editar" && <ImagenTab artcodigo={artcodigo} invcodigo={invcodigo} />}
      </Box>
    )
  },
)

FormularioPlanServicio.displayName = "FormularioPlanServicio"

export default FormularioPlanServicio
