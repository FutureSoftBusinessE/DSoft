import React, { useState, useCallback } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Divider,
  Pagination,
  TablePagination,
  Chip,
} from "@mui/material"
import { Close, Search, InsertDriveFile, CheckBox, CheckBoxOutlineBlank, Tag } from "@mui/icons-material"
import CustomAutocomplete from "../CustomAutocomplete"
import fetchwrapper from "../../services/interceptors/fetchwrapper"
import CustomBackdrop from "../CustomBackdrop"

const ModalImportarDocumento = ({
  open,
  onClose,
  entidadId,
  tipoEntidad,
  tiposDocumentos = [],
  isLoadingTipos = false,
}) => {
  // Estado para filtros
  const [filtros, setFiltros] = useState({
    nombre: "",
    docindex1: null,
    docindex2: null,
    docindex3: null,
    docindex4: null,
    docindex5: null,
    docindex6: "",
  })

  // Estado para paginación
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    porPagina: 10,
    total: 0,
    totalPaginas: 0,
  })

  // Estado principal
  const [resultados, setResultados] = useState([])
  const [seleccionados, setSeleccionados] = useState(new Set())
  const [estaBuscando, setEstaBuscando] = useState(false)
  const [estaImportando, setEstaImportando] = useState(false)
  const [error, setError] = useState("")
  const [exito, setExito] = useState("")
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  // Resetear al cerrar
  const handleClose = () => {
    setFiltros({
      nombre: "",
      docindex1: null,
      docindex2: null,
      docindex3: null,
      docindex4: null,
      docindex5: null,
      docindex6: "",
    })
    setResultados([])
    setSeleccionados(new Set())
    setError("")
    setExito("")
    setBusquedaRealizada(false)
    setPaginacion({
      pagina: 1,
      porPagina: 10,
      total: 0,
      totalPaginas: 0,
    })
    onClose(false)
  }

  // Handlers para filtros
  const handleFiltroChange = useCallback(
    (campo) => (valor) => {
      setFiltros((prev) => ({ ...prev, [campo]: valor }))
    },
    [],
  )

  const handleTextFieldChange = useCallback(
    (campo) => (event) => {
      setFiltros((prev) => ({ ...prev, [campo]: event.target.value }))
    },
    [],
  )

  // Limpiar todos los filtros
  const handleLimpiarFiltros = useCallback(() => {
    setFiltros({
      nombre: "",
      docindex1: null,
      docindex2: null,
      docindex3: null,
      docindex4: null,
      docindex5: null,
      docindex6: "",
    })
    setResultados([])
    setSeleccionados(new Set())
    setBusquedaRealizada(false)
    setPaginacion((prev) => ({ ...prev, pagina: 1, total: 0, totalPaginas: 0 }))
  }, [])

  // Verificar si hay algún filtro activo
  const hayFiltrosActivos = useCallback(() => {
    return (
      filtros.nombre.trim() !== "" ||
      filtros.docindex1 !== null ||
      filtros.docindex2 !== null ||
      filtros.docindex3 !== null ||
      filtros.docindex4 !== null ||
      filtros.docindex5 !== null ||
      filtros.docindex6.trim() !== ""
    )
  }, [filtros])

  // Función para obtener etiqueta de tipo de documento
  const obtenerEtiquetaTipo = useCallback(
    (tipoCodigo) => {
      if (!tipoCodigo) return null
      const tipo = tiposDocumentos.find((t) => t.tipdoccodigo === tipoCodigo)
      return tipo ? tipo.tipdocdescri : tipoCodigo
    },
    [tiposDocumentos],
  )

  // Función para formatear tags para mostrar con nombres específicos
  const formatearTagsParaMostrar = useCallback(
    (documento) => {
      const tags = []

      // Etiqueta 1 (Área/Depto)
      if (documento.docindex1) {
        const etiqueta1 = obtenerEtiquetaTipo(documento.docindex1) || documento.docindex1
        tags.push({ label: "Área/Depto", value: etiqueta1 })
      }

      // Etiqueta 2 (Categoría)
      if (documento.docindex2) {
        const etiqueta2 = obtenerEtiquetaTipo(documento.docindex2) || documento.docindex2
        tags.push({ label: "Categoría", value: etiqueta2 })
      }

      // Etiqueta 3 (Tipo Documento)
      if (documento.docindex3) {
        const etiqueta3 = obtenerEtiquetaTipo(documento.docindex3) || documento.docindex3
        tags.push({ label: "Tipo Documento", value: etiqueta3 })
      }

      // Etiqueta 4 (Sub-Tipo / Detalle)
      if (documento.docindex4) {
        const etiqueta4 = obtenerEtiquetaTipo(documento.docindex4) || documento.docindex4
        tags.push({ label: "Sub-Tipo / Detalle", value: etiqueta4 })
      }

      // Etiqueta 5 (Específico / Cronología)
      if (documento.docindex5) {
        const etiqueta5 = obtenerEtiquetaTipo(documento.docindex5) || documento.docindex5
        tags.push({ label: "Específico / Cronología", value: etiqueta5 })
      }

      // Etiqueta 6 (Texto libre)
      if (documento.docindex6 && documento.docindex6.trim() !== "") {
        tags.push({ label: "Texto libre", value: documento.docindex6 })
      }

      return tags
    },
    [obtenerEtiquetaTipo],
  )

  // Buscar documentos (con paginación)
  const handleBuscar = useCallback(
    async (pagina = 1) => {
      setEstaBuscando(true)
      setError("")
      setResultados([])

      try {
        const response = await fetchwrapper("/DocumentosAsociadosComponent/buscarDocumentosParaImportar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: filtros.nombre.trim() || null,
            docindex1: filtros.docindex1?.tipdoccodigo || null,
            docindex2: filtros.docindex2?.tipdoccodigo || null,
            docindex3: filtros.docindex3?.tipdoccodigo || null,
            docindex4: filtros.docindex4?.tipdoccodigo || null,
            docindex5: filtros.docindex5?.tipdoccodigo || null,
            docindex6: filtros.docindex6.trim() || null,
            page: pagina,
            perPage: paginacion.porPagina,
          }),
        })

        const data = await response.json()

        if (data.success) {
          // Procesar resultados para incluir tags formateados
          const resultadosConTags = (data.data || []).map((doc) => ({
            ...doc,
            tagsFormateados: formatearTagsParaMostrar(doc),
          }))

          setResultados(resultadosConTags)
          setPaginacion({
            pagina: data.pagination?.page || pagina,
            porPagina: data.pagination?.perPage || paginacion.porPagina,
            total: data.pagination?.total || 0,
            totalPaginas: data.pagination?.totalPages || 0,
          })
          setBusquedaRealizada(true)
        } else {
          setError(data.error?.message || "Error al buscar documentos")
        }
      } catch (error) {
        setError("Error de conexión al buscar documentos")
        console.error("Error:", error)
      } finally {
        setEstaBuscando(false)
      }
    },
    [filtros, paginacion.porPagina, formatearTagsParaMostrar],
  )

  // Cambiar página
  const handleCambiarPagina = useCallback(
    (event, nuevaPagina) => {
      if (!busquedaRealizada) {
        setError("Debe realizar una búsqueda primero")
        return
      }
      setPaginacion((prev) => ({ ...prev, pagina: nuevaPagina }))
      handleBuscar(nuevaPagina)
    },
    [handleBuscar, busquedaRealizada],
  )

  // Cambiar items por página
  const handleCambiarPorPagina = useCallback(
    (event) => {
      const nuevoPorPagina = parseInt(event.target.value, 10)
      setPaginacion((prev) => ({ ...prev, porPagina: nuevoPorPagina, pagina: 1 }))
      if (busquedaRealizada) {
        handleBuscar(1)
      }
    },
    [handleBuscar, busquedaRealizada],
  )

  // Seleccionar/deseleccionar documento
  const handleSeleccionarDocumento = useCallback((documentouuid) => {
    setSeleccionados((prev) => {
      const nuevoSet = new Set(prev)
      if (nuevoSet.has(documentouuid)) {
        nuevoSet.delete(documentouuid)
      } else {
        nuevoSet.add(documentouuid)
      }
      return nuevoSet
    })
  }, [])

  // Seleccionar/deseleccionar todos en página actual
  const handleSeleccionarTodosPagina = useCallback(() => {
    const todosEnPagina = resultados.map((doc) => doc.documentouuid)
    const todosSeleccionados = todosEnPagina.every((id) => seleccionados.has(id))

    setSeleccionados((prev) => {
      const nuevoSet = new Set(prev)

      if (todosSeleccionados) {
        todosEnPagina.forEach((id) => nuevoSet.delete(id))
      } else {
        todosEnPagina.forEach((id) => nuevoSet.add(id))
      }

      return nuevoSet
    })
  }, [resultados, seleccionados])

  // Seleccionar/deseleccionar TODOS (en todas las páginas)
  const handleSeleccionarTodos = useCallback(async () => {
    if (seleccionados.size > 0) {
      setSeleccionados(new Set())
    } else {
      if (!busquedaRealizada || paginacion.total === 0) {
        setError("Debe realizar una búsqueda primero")
        return
      }

      try {
        setError("")
        const response = await fetchwrapper("/DocumentosAsociadosComponent/buscarDocumentosParaImportar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: filtros.nombre.trim() || null,
            docindex1: filtros.docindex1?.tipdoccodigo || null,
            docindex2: filtros.docindex2?.tipdoccodigo || null,
            docindex3: filtros.docindex3?.tipdoccodigo || null,
            docindex4: filtros.docindex4?.tipdoccodigo || null,
            docindex5: filtros.docindex5?.tipdoccodigo || null,
            docindex6: filtros.docindex6.trim() || null,
            page: 1,
            perPage: 1000000,
          }),
        })

        const data = await response.json()

        if (data.success) {
          const todosIds = data.data.map((doc) => doc.documentouuid)
          setSeleccionados(new Set(todosIds))
        }
      } catch (error) {
        setError("Error al seleccionar todos los documentos")
      }
    }
  }, [filtros, seleccionados.size, busquedaRealizada, paginacion.total])

  // Importar documentos seleccionados
  const handleImportar = async () => {
    if (seleccionados.size === 0) {
      setError("Seleccione al menos un documento")
      return
    }

    setEstaImportando(true)
    setError("")

    try {
      const response = await fetchwrapper("/DocumentosAsociadosComponent/importarDocumentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentosAImportar: Array.from(seleccionados),
          entidadDestino: {
            docqgenero: entidadId,
            docprocqgenero: tipoEntidad,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setExito(`${data.message}. Recargando lista...`)
        onClose(true)
      } else {
        setError(data.error?.message || "Error al importar documentos")
      }
    } catch (error) {
      setError("Error de conexión al importar documentos")
      console.error("Error:", error)
    } finally {
      setEstaImportando(false)
    }
  }

  // Verificar si todos en página actual están seleccionados
  const todosEnPaginaSeleccionados =
    resultados.length > 0 && resultados.every((doc) => seleccionados.has(doc.documentouuid))

  return (
    <Dialog open={open} onClose={estaImportando ? undefined : handleClose} maxWidth="lg" fullWidth>
      <CustomBackdrop isLoading={estaImportando} />
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Importar Documento Existente</Typography>
          <IconButton onClick={handleClose} disabled={estaImportando} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {exito && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {exito}
          </Alert>
        )}

        {/* FILTROS */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" gutterBottom>
              Buscar documentos para importar
            </Typography>
            <Button size="small" onClick={handleLimpiarFiltros}>
              Limpiar filtros
            </Button>
          </Box>

          <Grid container spacing={2}>
            {/* Nombre del documento */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Nombre del documento"
                value={filtros.nombre}
                onChange={handleTextFieldChange("nombre")}
                placeholder="Buscar por nombre..."
                disabled={estaBuscando}
              />
            </Grid>

            {/* Etiqueta 6 - Texto libre */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Texto libre (Etiqueta 6)"
                value={filtros.docindex6}
                onChange={handleTextFieldChange("docindex6")}
                placeholder="Buscar en texto libre..."
                disabled={estaBuscando}
              />
            </Grid>

            {/* Etiqueta 1 - Área/Depto */}
            <Grid item xs={12} sm={6} md={4}>
              <CustomAutocomplete
                label="Etiqueta 1 (Área/Depto)"
                disabled={isLoadingTipos || estaBuscando}
                selectedOption={filtros.docindex1}
                setSelectedOption={handleFiltroChange("docindex1")}
                options={tiposDocumentos}
                isOptionEqualToValue={(option, value) => option.tipdoccodigo === value?.tipdoccodigo}
                getOptionLabel={(option) => option.tipdocdescri || ""}
              />
            </Grid>

            {/* Etiqueta 2 - Categoría */}
            <Grid item xs={12} sm={6} md={4}>
              <CustomAutocomplete
                label="Etiqueta 2 (Categoría)"
                disabled={isLoadingTipos || estaBuscando}
                selectedOption={filtros.docindex2}
                setSelectedOption={handleFiltroChange("docindex2")}
                options={tiposDocumentos}
                isOptionEqualToValue={(option, value) => option.tipdoccodigo === value?.tipdoccodigo}
                getOptionLabel={(option) => option.tipdocdescri || ""}
              />
            </Grid>

            {/* Etiqueta 3 - Tipo Documento */}
            <Grid item xs={12} sm={6} md={4}>
              <CustomAutocomplete
                label="Etiqueta 3 (Tipo Documento)"
                disabled={isLoadingTipos || estaBuscando}
                selectedOption={filtros.docindex3}
                setSelectedOption={handleFiltroChange("docindex3")}
                options={tiposDocumentos}
                isOptionEqualToValue={(option, value) => option.tipdoccodigo === value?.tipdoccodigo}
                getOptionLabel={(option) => option.tipdocdescri || ""}
              />
            </Grid>

            {/* Etiqueta 4 - Sub-Tipo / Detalle */}
            <Grid item xs={12} sm={6} md={4}>
              <CustomAutocomplete
                label="Etiqueta 4 (Sub-Tipo / Detalle)"
                disabled={isLoadingTipos || estaBuscando}
                selectedOption={filtros.docindex4}
                setSelectedOption={handleFiltroChange("docindex4")}
                options={tiposDocumentos}
                isOptionEqualToValue={(option, value) => option.tipdoccodigo === value?.tipdoccodigo}
                getOptionLabel={(option) => option.tipdocdescri || ""}
              />
            </Grid>

            {/* Etiqueta 5 - Específico / Cronología */}
            <Grid item xs={12} sm={6} md={4}>
              <CustomAutocomplete
                label="Etiqueta 5 (Específico / Cronología)"
                disabled={isLoadingTipos || estaBuscando}
                selectedOption={filtros.docindex5}
                setSelectedOption={handleFiltroChange("docindex5")}
                options={tiposDocumentos}
                isOptionEqualToValue={(option, value) => option.tipdoccodigo === value?.tipdoccodigo}
                getOptionLabel={(option) => option.tipdocdescri || ""}
              />
            </Grid>

            {/* Botón Buscar */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  startIcon={estaBuscando ? <CircularProgress size={16} /> : <Search />}
                  onClick={() => handleBuscar(1)}
                  disabled={estaBuscando}
                >
                  {estaBuscando ? "Buscando..." : "Buscar"}
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Información sobre filtros */}
          {!hayFiltrosActivos() && busquedaRealizada && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Mostrando <strong>todos los documentos</strong> del sistema (sin filtros aplicados)
              </Typography>
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* RESULTADOS CON PAGINACIÓN */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">
              {busquedaRealizada
                ? `Resultados (${paginacion.total} documentos encontrados)`
                : "Haga clic en 'Buscar' para listar documentos"}
            </Typography>

            {resultados.length > 0 && (
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" color="textSecondary">
                  Seleccionados: {seleccionados.size}
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      icon={<CheckBoxOutlineBlank />}
                      checkedIcon={<CheckBox />}
                      checked={todosEnPaginaSeleccionados}
                      onChange={handleSeleccionarTodosPagina}
                    />
                  }
                  label="Página actual"
                />

                <Button
                  size="small"
                  onClick={handleSeleccionarTodos}
                  disabled={!busquedaRealizada || paginacion.total === 0}
                >
                  {seleccionados.size > 0 ? "Limpiar selección" : "Seleccionar todos"}
                </Button>
              </Box>
            )}
          </Box>

          {estaBuscando ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : !busquedaRealizada ? (
            <Box textAlign="center" py={4}>
              <InsertDriveFile sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
              <Typography color="textSecondary" gutterBottom>
                Listar documentos del sistema
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Haga clic en "Buscar" para ver todos los documentos disponibles
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" size="small" startIcon={<Search />} onClick={() => handleBuscar(1)}>
                  Buscar sin filtros
                </Button>
              </Box>
            </Box>
          ) : resultados.length === 0 ? (
            <Box textAlign="center" py={4}>
              <InsertDriveFile sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
              <Typography color="textSecondary">No se encontraron documentos con los filtros ingresados</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ maxHeight: 400, overflow: "auto", mb: 2 }}>
                {resultados.map((documento) => (
                  <Paper
                    key={documento.documentouuid}
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 1,
                      bgcolor: seleccionados.has(documento.documentouuid) ? "action.selected" : "background.paper",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() => handleSeleccionarDocumento(documento.documentouuid)}
                  >
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <Checkbox
                        checked={seleccionados.has(documento.documentouuid)}
                        onChange={() => handleSeleccionarDocumento(documento.documentouuid)}
                        onClick={(e) => e.stopPropagation()}
                      />

                      <Box sx={{ flexGrow: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="subtitle2" fontWeight="medium">
                            {documento.docnombre || `Documento #${documento.docsecuen}`}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            .{documento.docextension?.toUpperCase()}
                          </Typography>
                        </Box>

                        {/* TODOS LOS TAGS CON NOMBRES ESPECÍFICOS */}
                        {documento.tagsFormateados && documento.tagsFormateados.length > 0 && (
                          <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                            <Tag sx={{ fontSize: 14, color: "text.secondary", mr: 0.5 }} />
                            {documento.tagsFormateados.map((tag, index) => (
                              <Chip
                                key={index}
                                label={
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <Typography variant="caption" fontWeight="bold">
                                      {tag.label}:
                                    </Typography>
                                    <Typography variant="caption">
                                      {tag.value.length > 30 ? `${tag.value.substring(0, 30)}...` : tag.value}
                                    </Typography>
                                  </Box>
                                }
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: "0.7rem",
                                  height: 24,
                                  maxWidth: 200,
                                  "& .MuiChip-label": {
                                    px: 1,
                                    py: 0.5,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  },
                                }}
                                title={`${tag.label}: ${tag.value}`}
                              />
                            ))}
                          </Box>
                        )}

                        {/* Información adicional */}
                        <Box sx={{ mt: 1, display: "flex", gap: 2, flexWrap: "wrap" }}>
                          <Typography variant="caption" color="textSecondary">
                            <Box component="span" fontWeight="bold">
                              Fecha de subida:
                            </Box>{" "}
                            {new Date(documento.docfechorisys).toLocaleDateString()}
                          </Typography>

                          {documento.docfecemi && (
                            <Typography variant="caption" color="textSecondary">
                              <Box component="span" fontWeight="bold">
                                Emisión:
                              </Box>{" "}
                              {new Date(documento.docfecemi).toLocaleDateString()}
                            </Typography>
                          )}

                          {documento.docfecven && (
                            <Typography variant="caption" color="textSecondary">
                              <Box component="span" fontWeight="bold">
                                Vence:
                              </Box>{" "}
                              {new Date(documento.docfecven).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>

              {/* PAGINACIÓN */}
              {paginacion.totalPaginas > 1 && (
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <TablePagination
                    component="div"
                    count={paginacion.total}
                    page={paginacion.pagina - 1}
                    onPageChange={(e, nuevaPagina) => handleCambiarPagina(e, nuevaPagina + 1)}
                    rowsPerPage={paginacion.porPagina}
                    onRowsPerPageChange={handleCambiarPorPagina}
                    rowsPerPageOptions={[5, 10, 20, 50]}
                    labelRowsPerPage="Documentos por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                  />

                  <Pagination
                    count={paginacion.totalPaginas}
                    page={paginacion.pagina}
                    onChange={handleCambiarPagina}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={estaImportando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleImportar}
          disabled={seleccionados.size === 0 || estaImportando}
          startIcon={estaImportando ? <CircularProgress size={16} /> : null}
        >
          {estaImportando ? "Importando..." : `Importar Seleccionados (${seleccionados.size})`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ModalImportarDocumento
