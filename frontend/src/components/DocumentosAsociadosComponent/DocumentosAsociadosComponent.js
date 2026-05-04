import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Box, Button, Typography, Divider, Alert, CircularProgress, Chip, IconButton, Tooltip } from "@mui/material"
import { Add, Refresh, AttachFile, Lock, Warning, ImportExport } from "@mui/icons-material"
import DocumentoItem from "./DocumentoItem"
import ModalDocumento from "./ModalDocumento"
import ModalImportarDocumento from "./ModalImportarDocumento"
import fetchwrapper from "../../services/interceptors/fetchwrapper"
import { saveAs } from "file-saver"

const DocumentosAsociadosComponent = ({ entidadId, tipoEntidad, readOnly = false }) => {
  if (!entidadId || !tipoEntidad) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="warning">
          <Typography variant="body2">
            Es obligatorio definir <strong>Entidad ID</strong> y <strong>Tipo de Entidad</strong> para poder gestionar
            documentos.
          </Typography>
        </Alert>
      </Box>
    )
  }

  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [documentoAEditar, setDocumentoAEditar] = useState(null)
  const [modalImportarOpen, setModalImportarOpen] = useState(false)

  // 1. Query para obtener tipos de documentos
  const {
    data: tiposDocumentos = [],
    isLoading: isLoadingTipos,
    error: errorTipos,
  } = useQuery({
    queryKey: ["tiposDocumentos"],
    queryFn: async () => {
      let response = await fetchwrapper("/DocumentosAsociadosComponent/getAllTiposDocumentos")
      response = await response.json()
      return response.data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  // 2. Query para obtener documentos asociados
  const {
    data: documentos = [],
    isLoading: isLoadingDocumentos,
    error: errorDocumentos,
    refetch: refetchDocumentos,
  } = useQuery({
    queryKey: ["documentosAsociados", entidadId, tipoEntidad],
    queryFn: async () => {
      let response = await fetchwrapper("/DocumentosAsociadosComponent/getAllDocumentosAsociados", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          docqgenero: entidadId,
          docprocqgenero: tipoEntidad,
        }),
      })
      response = await response.json()
      return response.data || []
    },
    enabled: !!entidadId && !!tipoEntidad,
  })

  // 3. Mutación para crear documento
  const createDocumentoMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await fetchwrapper("/DocumentosAsociadosComponent/createNewDocumento", {
        method: "POST",
        body: formData,
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["documentosAsociados", entidadId, tipoEntidad])
      setModalOpen(false)
      setDocumentoAEditar(null)
    },
  })

  // 4. Mutación para editar documento
  const editDocumentoMutation = useMutation({
    mutationFn: async (data) => {
      // Si es FormData, enviar como FormData
      if (data instanceof FormData) {
        const response = await fetchwrapper("/DocumentosAsociadosComponent/editSpecificDocumento", {
          method: "PUT",
          body: data, // FormData
        })
        return response
      } else {
        // Si es JSON, enviar como JSON
        const response = await fetchwrapper("/DocumentosAsociadosComponent/editSpecificDocumento", {
          headers: {
            "Content-Type": "application/json",
          },
          method: "PUT",
          body: JSON.stringify(data),
        })
        return response
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["documentosAsociados", entidadId, tipoEntidad])
      setModalOpen(false)
      setDocumentoAEditar(null)
    },
  })

  // 5. Mutación para eliminar documento
  const deleteDocumentoMutation = useMutation({
    mutationFn: async (documentouuid) => {
      try {
        const response = await fetchwrapper("/DocumentosAsociadosComponent/deleteSpecificDocumento", {
          headers: { "Content-Type": "application/json" },
          method: "DELETE",
          body: JSON.stringify({ documentouuid }),
        })
        return response
      } catch (e) {
        alert(e?.details?.message || e)
        console.error("Error en eliminar documento", e)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["documentosAsociados", entidadId, tipoEntidad])
    },
  })

  // 6. Función para descargar documento
  const handleDownloadDocumento = async (documentouuid) => {
    try {
      const response = await fetchwrapper("/DocumentosAsociadosComponent/downloadSpecificDocumento", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ documentouuid }),
      })

      const blob = await response.blob()

      // Obtener nombre desde la cabecera Content-Disposition
      const contentDisposition = response.headers.get("Content-Disposition") || ""
      let filename = "documento_descargado"
      console.log(contentDisposition)

      const match = contentDisposition.match(/filename\*=UTF-8''(.+)|filename="(.+)"/)
      if (match) filename = decodeURIComponent(match[1] || match[2])

      // Descargar usando FileSaver.js
      saveAs(blob, filename)
    } catch (error) {
      console.error("Error al descargar:", error)
    }
  }

  // Manejar editar documento
  const handleEditarDocumento = (documento) => {
    setDocumentoAEditar(documento)
    setModalOpen(true)
  }

  // Manejar nuevo documento
  const handleNuevoDocumento = () => {
    setDocumentoAEditar(null)
    setModalOpen(true)
  }

  // Estadísticas
  const totalDocumentos = documentos.length

  const documentosVencidos = documentos.filter((d) => {
    if (!d.docfecven) return false
    const hoy = new Date()
    const fechaVencimiento = new Date(d.docfecven)
    return fechaVencimiento < hoy
  }).length

  // Mostrar errores
  if (errorDocumentos) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {errorDocumentos.details?.error?.message || "Error al cargar documentos"}
        </Alert>
        <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetchDocumentos()}>
          Reintentar
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* Encabezado */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <AttachFile />
          <Typography variant="h6">Documentos</Typography>
          <Chip label={totalDocumentos} size="small" color="primary" variant="outlined" />
          {documentosVencidos > 0 && (
            <Chip
              label={`${documentosVencidos} vencido(s)`}
              size="small"
              color="error"
              variant="filled"
              icon={<Warning fontSize="small" />}
            />
          )}
        </Box>

        <Box display="flex" gap={1}>
          <Tooltip title="Recargar documentos">
            <IconButton size="small" onClick={() => refetchDocumentos()} disabled={isLoadingDocumentos}>
              {isLoadingDocumentos ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Tooltip>

          {!readOnly && (
            <>
              <Button
                variant="outlined"
                startIcon={<ImportExport />}
                onClick={() => setModalImportarOpen(true)}
                size="small"
              >
                Importar
              </Button>
              <Button variant="contained" startIcon={<Add />} onClick={handleNuevoDocumento} size="small">
                Agregar
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Info */}
      <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
        <Typography variant="body2">
          Entidad: {entidadId} • Tipo: {tipoEntidad}
          {documentosVencidos > 0 && (
            <span style={{ color: "#d32f2f", fontWeight: "bold" }}>• {documentosVencidos} documento(s) vencido(s)</span>
          )}
        </Typography>
      </Alert>

      <Divider sx={{ mb: 2 }} />

      {/* Contenido */}
      {isLoadingDocumentos ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress sx={{ mr: 2 }} />
          <Typography>Cargando documentos...</Typography>
        </Box>
      ) : totalDocumentos === 0 ? (
        <Box textAlign="center" py={4}>
          <AttachFile sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
          <Typography color="textSecondary" gutterBottom>
            No hay documentos asociados
          </Typography>
          {!readOnly && (
            <Button variant="outlined" startIcon={<Add />} onClick={handleNuevoDocumento} sx={{ mt: 1 }}>
              Agregar documento
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ maxHeight: 400, overflow: "auto", pr: 1 }}>
          {documentos.map((documento) => (
            <DocumentoItem
              key={documento.documentouuid}
              documento={documento}
              onEliminar={() => deleteDocumentoMutation.mutate(documento.documentouuid)}
              onEditar={() => handleEditarDocumento(documento)}
              onDownload={() => handleDownloadDocumento(documento.documentouuid)}
              readOnly={readOnly}
              isDeleting={
                deleteDocumentoMutation.isLoading && deleteDocumentoMutation.variables === documento.documentouuid
              }
              tiposDocumentos={tiposDocumentos}
            />
          ))}
        </Box>
      )}

      {/* Modal */}
      <ModalDocumento
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setDocumentoAEditar(null)
        }}
        entidadId={entidadId}
        tipoEntidad={tipoEntidad}
        documento={documentoAEditar}
        tiposDocumentos={tiposDocumentos}
        isLoadingTipos={isLoadingTipos}
        errorTipos={errorTipos}
        onCreate={createDocumentoMutation.mutateAsync}
        onEdit={editDocumentoMutation.mutateAsync}
        isCreating={createDocumentoMutation.isLoading}
        isEditing={editDocumentoMutation.isLoading}
      />

      {/* Modal Importar */}
      <ModalImportarDocumento
        open={modalImportarOpen}
        onClose={(recargar) => {
          setModalImportarOpen(false)
          if (recargar) {
            queryClient.invalidateQueries(["documentosAsociados", entidadId, tipoEntidad])
          }
        }}
        entidadId={entidadId}
        tipoEntidad={tipoEntidad} // Nombre de la tabla
        tiposDocumentos={tiposDocumentos}
        isLoadingTipos={isLoadingTipos}
      />
    </Box>
  )
}

export default DocumentosAsociadosComponent
