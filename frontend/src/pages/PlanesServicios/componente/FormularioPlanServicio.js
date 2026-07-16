import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Box, Paper, MenuItem, Select, FormControl, FormLabel, TextField, CircularProgress } from "@mui/material"
import { showWarning, api } from "../../../api"
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

const FormularioPlanServicio = forwardRef(
  (
    {
      initialData = {
        invcodigo: "01",
        artcodigo: "",
        artdescri: "",
        artprecventa1: "",
        artapliiva: "",
        artstatus: "A",
      },
      isLoading = false,
      onSubmit,
      modo = "crear",
    },
    ref,
  ) => {
    const [invcodigo, setInvcodigo] = useState("01")
    const [artcodigo, setArtcodigo] = useState("")
    const [artdescri, setArtdescri] = useState("")
    const [artprecventa1, setArtprecventa1] = useState("")
    const [artapliiva, setArtapliiva] = useState("")
    const [artstatus, setArtstatus] = useState("A")

    // Estado para las tarifas IVA
    const [tarifasIVA, setTarifasIVA] = useState([])
    const [loadingTarifas, setLoadingTarifas] = useState(true) // Iniciar como true

    // Cargar tarifas IVA disponibles
    useEffect(() => {
      const cargarTarifas = async () => {
        setLoadingTarifas(true)
        try {
          const response = await api.get("/PlanesServicios/getTarifasIVA")
          const tarifas = response.data?.data?.data || []
          setTarifasIVA(tarifas)

          //  Solo en modo crear, recomendar IVA 15%
          if (modo === "crear") {
            const ivaRecomendado = tarifas.find((t) => t.porcentaje === 15)
            if (ivaRecomendado) {
              setArtapliiva(ivaRecomendado.codigo) // Si existe, usarlo
            }
          }
        } catch (error) {
          console.error("Error cargando tarifas IVA:", error)
          showWarning("No se pudieron cargar las tarifas de IVA")
        } finally {
          setLoadingTarifas(false)
        }
      }
      cargarTarifas()
    }, [])

    // Cargar datos iniciales SOLO cuando las tarifas ya estén cargadas
    useEffect(() => {
      if (modo === "editar" && initialData && !loadingTarifas && tarifasIVA.length > 0) {
        setInvcodigo(initialData.invcodigo || "01")
        setArtcodigo(initialData.artcodigo || "")
        setArtdescri(initialData.artdescri || "")
        setArtprecventa1(String(initialData.artprecventa1 || ""))

        // Convertir el número de la BD al formato de código de tarifa
        const codigoNumerico = initialData.artapliiva
        let codigoIVA = ""

        // Intentar con formato de 2 dígitos: 5 -> "05"
        const codigoConPad = String(Math.abs(codigoNumerico)).padStart(2, "0")
        // Intentar con formato sin padding: 5 -> "5"
        const codigoSinPad = String(Math.abs(codigoNumerico))

        // Verificar cuál existe en las tarifas cargadas
        if (tarifasIVA.some((t) => t.codigo === codigoConPad)) {
          codigoIVA = codigoConPad
        } else if (tarifasIVA.some((t) => t.codigo === codigoSinPad)) {
          codigoIVA = codigoSinPad
        }
        // Si no existe ninguno, dejar vacío

        setArtapliiva(codigoIVA)
        setArtstatus(initialData.artstatus || "A")
      }
    }, [modo, initialData, loadingTarifas, tarifasIVA])

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
      if (!artapliiva) {
        showWarning("Debe seleccionar una tarifa de IVA")
        return
      }

      const payload =
        modo === "crear"
          ? {
              invcodigo,
              artcodigo,
              artdescri,
              artprecventa1: parseFloat(artprecventa1),
              artapliiva,
              artstatus: "A",
            }
          : {
              invcodigoOld: initialData.invcodigo,
              artcodigoOld: initialData.artcodigo,
              artdescriNew: artdescri,
              artprecventa1New: parseFloat(artprecventa1),
              artaplivaNew: artapliiva,
              artstatus,
            }

      try {
        await onSubmit(payload)
      } catch (error) {
        console.error("Error:", error)
      }
    }

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
                onChange={(e) => setArtcodigo(e.target.value.toUpperCase())}
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
                onChange={(e) => setArtdescri(e.target.value.toUpperCase())}
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

          {/* Select de Tarifa IVA */}
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small">
              <FormLabel>Aplica IVA *</FormLabel>
              <Select
                value={artapliiva}
                onChange={(e) => setArtapliiva(e.target.value)}
                disabled={loadingTarifas || isLoading}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <em style={{ color: "#888" }}>-- Seleccione una tarifa --</em>
                  }
                  // Buscar la tarifa por código exacto para mostrar la descripción
                  const tarifaSeleccionada = tarifasIVA.find((t) => t.codigo === selected)
                  if (tarifaSeleccionada) {
                    return `${tarifaSeleccionada.descripcion} (${tarifaSeleccionada.porcentaje}%)`
                  }
                  // Si no se encuentra, mostrar el código
                  return `Código: ${selected}`
                }}
              >
                <MenuItem value="" disabled>
                  <em>-- Seleccione una tarifa --</em>
                </MenuItem>

                {loadingTarifas ? (
                  <MenuItem value="" disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Cargando tarifas...
                  </MenuItem>
                ) : (
                  tarifasIVA.map((tarifa) => (
                    <MenuItem key={tarifa.codigo} value={tarifa.codigo}>
                      {tarifa.descripcion} ({tarifa.porcentaje}%)
                    </MenuItem>
                  ))
                )}
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
