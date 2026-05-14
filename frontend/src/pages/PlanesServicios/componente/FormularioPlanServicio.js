import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Box, Paper, MenuItem, Select, FormControl, FormLabel, TextField } from "@mui/material"
import { showWarning } from "../../../api"
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
        invcodigo: "01", // Valor por defecto
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
    // Inicializamos con "01" como valor por defecto para el inventario de servicios
    const [invcodigo, setInvcodigo] = useState("01") 
    const [artcodigo, setArtcodigo] = useState("")
    const [artdescri, setArtdescri] = useState("")
    const [artprecventa1, setArtprecventa1] = useState("")
    const [artapliiva, setArtapliiva] = useState(0)
    const [artstatus, setArtstatus] = useState("A")

    useEffect(() => {
      // Solo en editar, pre-llenar datos
      if (modo === "editar" && initialData) {
        setInvcodigo(initialData.invcodigo || "01")
        setArtcodigo(initialData.artcodigo || "")
        setArtdescri(initialData.artdescri || "")
        setArtprecventa1(String(initialData.artprecventa1 || ""))
        setArtapliiva(normalizeCheckboxValue(initialData.artapliiva))
        setArtstatus(initialData.artstatus || "A")
      }
    }, [modo, initialData])

    const handleSubmit = async (e) => {
      if (e) e.preventDefault()

      // Validaciones simples
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
              invcodigo, // Se enviará "01" automáticamente
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
          {/* SE OMITIÓ EL CAMPO DE INVENTARIO */}

          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth size="small">
              <FormLabel>Código de Artículo *</FormLabel>
              <TextField
                value={artcodigo}
                onChange={(e) => setArtcodigo(e.target.value.toUpperCase())} // Forzamos a mayúsculas como buena práctica
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
                onChange={(e) => setArtdescri(e.target.value.toUpperCase())} // Forzamos a mayúsculas
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

        {/* COMPONENTE DE IMAGEN PARA EDICIÓN */}
        {invcodigo && artcodigo && modo === "editar" && <ImagenTab artcodigo={artcodigo} invcodigo={invcodigo} />}
      </Box>
    )
  },
)

FormularioPlanServicio.displayName = "FormularioPlanServicio"

export default FormularioPlanServicio